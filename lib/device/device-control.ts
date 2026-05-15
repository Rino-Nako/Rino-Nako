import { Adb } from "@yume-chan/adb";
import { findPackageName } from "@/config/app-list";

export class DeviceController {
  private device: Adb;

  constructor(device: Adb) {
    this.device = device;
  }

  /**
   * 启动 App (移植自 AutoGLM launch_app)
   */
  async launchApp(appName: string): Promise<boolean> {
    const packageName = findPackageName(appName);
    
    if (!packageName) {
      console.error(`未找到应用 "${appName}" 的包名配置`);
      // 尝试动态查找（简单的 fallback，如果 appName 本身就是包名）
      if (appName.includes('.')) {
          console.log(`尝试直接使用包名启动: ${appName}`);
          await this.executeMonkey(appName);
          return true;
      }
      return false; 
    }

    console.log(`正在启动 ${appName} (${packageName})...`);
    await this.executeMonkey(packageName);
    return true;
  }

  private async executeMonkey(packageName: string) {
    // 使用 monkey 命令启动
    // -p: 包名
    // -c android.intent.category.LAUNCHER: 指定启动类别
    // 1: 事件数量 (这就够触发启动了)
    const command = `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
    
    // 执行命令
    // 注意：subprocess.spawnAndWait 在 @yume-chan/adb 的不同版本中 API 可能不同
    // 这里使用 noneProtocol.spawnWaitText 类似 input-manager.ts 中的用法
    await this.device.subprocess.noneProtocol.spawnWaitText(command);
    
    // 等待 App 启动动画完成 (非常重要，否则 AI 截图会截到半截动画)
    await new Promise(r => setTimeout(r, 3000));
  }

  /**
   * 杀掉 App (可选功能，不仅是 Launch，有时需要重启)
   * 命令: am force-stop <package>
   */
  async stopApp(appName: string) {
    const packageName = findPackageName(appName) || appName;
    if (!packageName) return;

    await this.device.subprocess.noneProtocol.spawnWaitText(`am force-stop ${packageName}`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  /**
   * 回到桌面 (这也是一种特殊的 Launch)
   */
  async home() {
      await this.device.subprocess.noneProtocol.spawnWaitText('input keyevent 3');
      await new Promise(r => setTimeout(r, 1000));
  }

  /**
   * 获取当前前台应用的包名
   */
  async getCurrentPackage(): Promise<string | null> {
    try {
      const output = await this.device.subprocess.noneProtocol.spawnWaitText("dumpsys window windows");
      const lines = output.split('\n');
      const focusLine = lines.find(line => line.includes('mCurrentFocus'));
      if (focusLine) {
        const parts = focusLine.split('/');
        if (parts.length >= 2) {
          const beforeSlash = parts[0];
          const packageName = beforeSlash.trim().split(' ').pop();
          if (packageName && packageName.includes('.')) {
            return packageName;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('获取当前包名失败:', error);
      return null;
    }
  }

  /**
   * 获取手机上所有已安装的应用 (包括系统应用，以便匹配 Settings 等)
   */
  async getInstalledApps(): Promise<string[]> {
    // pm list packages (列出所有应用)
    const output = await this.device.subprocess.noneProtocol.spawnWaitText("pm list packages");
    
    // output 格式: package:com.tencent.mm\npackage:com.taobao.taobao...
    const packages = output
      .split("\n")
      .map(line => line.replace("package:", "").trim())
      .filter(p => p.length > 0);
      
    return packages;
  }
}
