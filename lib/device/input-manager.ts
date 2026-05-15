import { Adb } from "@yume-chan/adb";

/**
 * 方案 A: ADB Keyboard 广播输入管理器
 * 移植自 Open-AutoGLM 的 input.py
 */

const ADB_KBD_PACKAGE = "com.android.adbkeyboard";
const ADB_KBD_IME = "com.android.adbkeyboard/.AdbIME";

// 浏览器端处理 Unicode 字符转 Base64 的标准黑魔法
function utf8_to_b64(str: string): string {
  return window.btoa(unescape(encodeURIComponent(str)));
}

// 简单的延时函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class InputManager {
  private device: Adb;

  constructor(device: Adb) {
    this.device = device;
  }

  private async exec(args: string[]): Promise<string> {
    try {
      return await this.device.subprocess.noneProtocol.spawnWaitText(args);
    } catch (e: any) {
      console.error(`Exec failed: ${args.join(' ')}`, e);
      throw e;
    }
  }

  /**
   * 核心方法：输入文本
   * @param text 要输入的文本 (支持中文)
   * @param autoSwitch 是否自动尝试切换输入法
   */
  async typeText(text: string, autoSwitch: boolean = true) {
    if (autoSwitch) {
      await this.ensureAdbKeyboard();
    }

    // 1. 转 Base64
    const base64Text = utf8_to_b64(text);

    // 2. 发送广播
    // 对应 Python: am broadcast -a ADB_INPUT_B64 --es msg <base64>
    const args = ['am', 'broadcast', '-a', 'ADB_INPUT_B64', '--es', 'msg', base64Text];
    
    // 执行命令
    const output = await this.exec(args);
    
    // 检查广播是否成功发送 (通常广播发送很快，且没有输出就是成功)
    // spawnWaitText 返回的是 stdout，如果有错误通常会 throw 或者在 stdout 里
    if (output && output.toLowerCase().includes("error")) {
       console.warn("广播发送可能有误:", output);
    }
  }

  /**
   * 清空当前输入框
   * 对应 Python: am broadcast -a ADB_CLEAR_TEXT
   */
  async clearText() {
    await this.exec(['am', 'broadcast', '-a', 'ADB_CLEAR_TEXT']);
  }

  /**
   * 检查并确保当前输入法是 ADB Keyboard
   * 如果没安装，抛出错误；如果安装了没启用，尝试启用。
   */
  async ensureAdbKeyboard() {
    // 1. 获取当前输入法
    const currentIme = (await this.exec(['settings', 'get', 'secure', 'default_input_method'])).trim();

    // 如果已经是了，直接返回
    if (currentIme === ADB_KBD_IME) {
      return;
    }

    console.log(`当前输入法为 ${currentIme}，正在切换至 ADB Keyboard...`);

    // 2. 检查是否安装了 ADB Keyboard
    // pm list packages com.android.adbkeyboard
    const pkgCheck = await this.exec(['pm', 'list', 'packages', ADB_KBD_PACKAGE]);

    if (!pkgCheck.includes(ADB_KBD_PACKAGE)) {
      throw new Error("ADB_KEYBOARD_NOT_INSTALLED");
    }

    // 3. 切换输入法
    await this.exec(['ime', 'set', ADB_KBD_IME]);
    
    // 切换输入法需要一点时间初始化
    await delay(500);

    // 4. (可选) 激活一下，防止第一次输入丢字
    // 发送一个空字符
    // await this.typeText("", false);
  }

  /**
   * 恢复系统默认输入法 (可选，在断开连接时调用)
   * 通常我们会尝试切回 Gboard 或华为/小米输入法
   */
  async restoreSystemIme() {
    // 这里简单粗暴地列出所有输入法，切到第一个非 ADB Keyboard 的
    // 实际生产中可能不需要这一步，用户自己切一下也不麻烦
    const output = await this.exec(['ime', 'list', '-s']);
    const imes = output.split("\n").map((s: string) => s.trim()).filter((s: string) => s);
    
    const originalIme = imes.find((ime: string) => ime !== ADB_KBD_IME);
    if (originalIme) {
      await this.exec(['ime', 'set', originalIme]);
    }
  }
}

/**
 * 辅助函数：安装 ADB Keyboard
 * 需要 WebADB 的 Adb 实例
 */
export async function installAdbKeyboard(device: Adb) {
  try {
    console.log("开始下载 ADBKeyboard.apk...");
    const res = await fetch('/assets/ADBKeyboard.apk');
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
    const blob = await res.blob();
    
    console.log("开始推送到手机 /data/local/tmp/ADBKeyboard.apk...");
    
    // 将 blob 转为 ArrayBuffer
    const buffer = await blob.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);
    
    // 使用 sync 服务推送文件
    const sync = await device.sync();
    
    // 推送文件
    // 注意：write 方法需要一个 ReadableStream<Consumable<Uint8Array>>
    // 我们需要构造这个流
    const { Consumable, ReadableStream } = await import("@yume-chan/stream-extra");
    
    const stream = new ReadableStream<any>({
      start(controller) {
        controller.enqueue(new Consumable(fileBytes));
        controller.close();
      }
    });
    
    await sync.write({
      filename: "/data/local/tmp/ADBKeyboard.apk",
      file: stream,
      mtime: Date.now() / 1000,
    });
    
    sync.dispose();
    console.log("推送完成，开始安装...");
    
    // 安装 APK
    // pm install -r /data/local/tmp/ADBKeyboard.apk
    const output = await device.subprocess.noneProtocol.spawnWaitText([
      'pm', 'install', '-r', '/data/local/tmp/ADBKeyboard.apk'
    ]);
    
    if (output.toLowerCase().includes("success")) {
      console.log("ADB Keyboard 安装成功！");
    } else {
      throw new Error(`安装失败: ${output}`);
    }
    
    // 启用输入法
    await device.subprocess.noneProtocol.spawnWaitText([
      'ime', 'enable', ADB_KBD_IME
    ]);
    
    console.log("ADB Keyboard 已启用");
    
  } catch (e) {
    console.error("安装失败:", e);
    throw e;
  }
}
