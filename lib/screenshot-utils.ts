import { Adb } from "@yume-chan/adb";

/**
 * Screenshot utilities for Web-AutoGLM.
 * 对应原 Python 项目中的 phone_agent/adb/screenshot.py
 */

export interface Screenshot {
  base64Data: string; // Data URL格式: "data:image/jpeg;base64,..."
  width: number;
  height: number;
  isSensitive: boolean;
}

/**
 * 方案 A (推荐): 从 Scrcpy 渲染的 Canvas 截取
 * 速度极快 (毫秒级)，直接利用显存数据，无 ADB 通信开销。
 * * @param canvasElement - 你的 Scrcpy 播放器绑定的 <canvas> DOM 元素
 * @param quality - 图片质量 0-1 (推荐 0.7 以平衡清晰度和 Token 消耗)
 */
export function getScreenshotFromCanvas(
  canvasElement: HTMLCanvasElement | null,
  quality: number = 0.5
): Screenshot {
  try {
    if (!canvasElement) {
      throw new Error("Canvas element not found");
    }

    // 1. 获取宽高
    const width = canvasElement.width;
    const height = canvasElement.height;

    // 2. 导出为 Base64 (使用 JPEG 压缩以减小体积)
    // 注意：toDataURL 返回的是完整的 "data:image/jpeg;base64,..." 字符串
    // 大模型 API 通常可以直接吃这个格式，或者需要去掉前缀
    const base64Data = canvasElement.toDataURL('image/jpeg', quality);

    return {
      base64Data,
      width,
      height,
      isSensitive: false
    };

  } catch (e) {
    console.error("Canvas screenshot failed:", e);
    return createFallbackScreenshot(1080, 2400, true);
  }
}

/**
 * 方案 B (备用): 通过 WebADB 直接抓取 Framebuffer
 * 适用于：没有渲染画面(Headless模式)，或者 Canvas 黑屏时。
 * 速度较慢，需要 USB 传输数据。
 */
export async function getScreenshotViaWebADB(device: Adb): Promise<Screenshot> {
  try {
    // WebADB 提供了直接获取 Framebuffer 的高级 API
    // 这比 Python 里的 `adb shell screencap` 更快，因为它不走文件系统
    const framebuffer = await device.framebuffer();
    
    // 注意：这里拿到的 framebuffer 是原始二进制数据
    // 需要手动转换成 Canvas 或 Base64，比较繁琐
    // 在 Web 场景下，通常不需要用这个方法，除非方案 A 失败。
    // 这里仅做示意，通常直接用 Scheme A 即可。
    
    throw new Error("Not implemented: Raw framebuffer handling is complex in pure JS without canvas");
    
  } catch (e) {
    console.error("ADB screenshot failed:", e);
    return createFallbackScreenshot(1080, 2400, false); // 假设是非敏感原因失败
  }
}

/**
 * 创建黑色兜底图
 * 对应 Python 中的 _create_fallback_screenshot
 */
function createFallbackScreenshot(
  width: number,
  height: number,
  isSensitive: boolean
): Screenshot {
  // 创建一个临时的 Canvas 来生成黑色图片
  if (typeof document === 'undefined') {
      // Server-side or non-browser env fallback
       return {
        base64Data: '',
        width,
        height,
        isSensitive
      };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  
  return {
    base64Data: canvas.toDataURL('image/jpeg', 0.1),
    width,
    height,
    isSensitive
  };
}

/**
 * 辅助工具：清洗 Base64
 *有些 API (如 OpenAI/智谱) 可能需要去掉 "data:image/xxx;base64," 前缀
 */
export function stripBase64Prefix(dataUrl: string): string {
  return dataUrl.split(',')[1] || dataUrl;
}

export async function compressBase64Image(
  dataUrl: string,
  options?: { quality?: number; maxSize?: number }
): Promise<string> {
  if (!dataUrl) return dataUrl;
  if (typeof document === 'undefined') return dataUrl;

  const quality = options?.quality ?? 0.6;
  const maxSize = options?.maxSize ?? 1280;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const maxDim = Math.max(width, height);
      if (maxDim > maxSize) {
        const scale = maxSize / maxDim;
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
