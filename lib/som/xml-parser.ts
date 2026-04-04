import { Adb } from '@yume-chan/adb';

export interface UIElement {
  id: number;
  bounds: { x: number; y: number; w: number; h: number };
  center: { x: number; y: number };
  text: string;
  description: string;
  resourceId: string;
}

export interface SoMDebugInfo {
  xmlChars: number;
  maxX: number;
  maxY: number;
  candidateCount: number;
  elementCount: number;
  sourceWidth: number;
  sourceHeight: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  insets: { left: number; top: number; right: number; bottom: number } | null;
}

function parseBounds(boundsStr: string) {
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;

  const x1 = Number.parseInt(match[1]!, 10);
  const y1 = Number.parseInt(match[2]!, 10);
  const x2 = Number.parseInt(match[3]!, 10);
  const y2 = Number.parseInt(match[4]!, 10);

  return {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    center: { x: Math.floor((x1 + x2) / 2), y: Math.floor((y1 + y2) / 2) },
  };
}

export async function getInteractableElements(
  device: Adb,
  targetSize?: { width: number; height: number },
  sourceSize?: { width: number; height: number } | null,
  targetInsets?: { left: number; top: number; right: number; bottom: number } | null
): Promise<UIElement[]> {
  const { elements } = await getInteractableElementsWithDebug(device, targetSize, sourceSize, targetInsets);
  return elements;
}

export async function getInteractableElementsWithDebug(
  device: Adb,
  targetSize?: { width: number; height: number },
  sourceSize?: { width: number; height: number } | null,
  targetInsets?: { left: number; top: number; right: number; bottom: number } | null
): Promise<{ elements: UIElement[]; debug: SoMDebugInfo; xmlHead: string }> {
  const cmd =
    'OUT1="/data/local/tmp/window_dump.xml"; ' +
    'OUT2="/sdcard/window_dump.xml"; ' +
    'echo "---ENV---"; ' +
    'id 2>&1; ' +
    'command -v uiautomator 2>&1; ' +
    'ls -ld /data/local/tmp /sdcard 2>&1; ' +
    'echo "\\n---DUMP1---"; ' +
    'uiautomator dump --compressed "$OUT1" 2>&1; ' +
    'echo "\\n---LS1---"; ' +
    'ls -l "$OUT1" 2>&1; ' +
    'echo "\\n---DUMP2---"; ' +
    'uiautomator dump --compressed "$OUT2" 2>&1; ' +
    'echo "\\n---LS2---"; ' +
    'ls -l "$OUT2" 2>&1; ' +
    'echo "\\n---CAT1---"; ' +
    'cat "$OUT1" 2>&1; ' +
    'echo "\\n---CAT2---"; ' +
    'cat "$OUT2" 2>&1';
  const rawOutput = await device.subprocess.noneProtocol.spawnWaitText(['sh', '-c', cmd]);
  const xmlStart = rawOutput.indexOf('<?xml') !== -1 ? rawOutput.indexOf('<?xml') : rawOutput.indexOf('<hierarchy');
  if (xmlStart === -1) {
    const head = rawOutput.slice(0, 4000);
    throw new Error(`uiautomator output does not contain XML\n--- Output Head ---\n${head}`);
  }

  let xmlString = rawOutput.slice(xmlStart).trim();
  const xmlEnd = xmlString.lastIndexOf('</hierarchy>');
  if (xmlEnd !== -1) {
    xmlString = xmlString.slice(0, xmlEnd + '</hierarchy>'.length);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Failed to parse uiautomator XML');
  }
  const nodes = xmlDoc.getElementsByTagName('node');

  const candidates: Array<{
    bounds: { x: number; y: number; w: number; h: number };
    center: { x: number; y: number };
    text: string;
    description: string;
    resourceId: string;
    clickable: boolean;
    longClickable: boolean;
    focusable: boolean;
    checkable: boolean;
  }> = [];

  let maxX = 0;
  let maxY = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const boundsStr = node.getAttribute('bounds') || '';
    const clickable = node.getAttribute('clickable') === 'true';
    const longClickable = node.getAttribute('long-clickable') === 'true';
    const focusable = node.getAttribute('focusable') === 'true';
    const checkable = node.getAttribute('checkable') === 'true';
    const text = node.getAttribute('text') || '';
    const desc = node.getAttribute('content-desc') || '';
    const resourceId = node.getAttribute('resource-id') || '';

    const boundsData = parseBounds(boundsStr);
    if (!boundsData || boundsData.w <= 0 || boundsData.h <= 0) continue;

    maxX = Math.max(maxX, boundsData.x + boundsData.w);
    maxY = Math.max(maxY, boundsData.y + boundsData.h);

    candidates.push({
      bounds: { x: boundsData.x, y: boundsData.y, w: boundsData.w, h: boundsData.h },
      center: boundsData.center,
      text,
      description: desc,
      resourceId,
      clickable,
      longClickable,
      focusable,
      checkable,
    });
  }

  const inferredSourceWidth = Math.max(maxX, 1);
  const inferredSourceHeight = Math.max(maxY, 1);
  const sourceWidth = sourceSize?.width && sourceSize.width > 0 ? sourceSize.width : inferredSourceWidth;
  const sourceHeight = sourceSize?.height && sourceSize.height > 0 ? sourceSize.height : inferredSourceHeight;

  const targetWidth = targetSize?.width ?? sourceWidth;
  const targetHeight = targetSize?.height ?? sourceHeight;

  const insets = targetInsets ?? null;

  const offsetX = insets ? insets.left : 0;
  const offsetY = insets ? insets.top : 0;
  const scaleX = insets
    ? (targetWidth - insets.left - insets.right) / sourceWidth
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const scaleY = insets
    ? (targetHeight - insets.top - insets.bottom) / sourceHeight
    : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

  const elements: UIElement[] = [];
  let counter = 1;

  for (const c of candidates) {
    if (
      c.clickable ||
      c.longClickable ||
      c.focusable ||
      c.checkable ||
      c.text.length > 0 ||
      c.description.length > 0 ||
      c.resourceId.length > 0
    ) {
      const x = Math.round(c.bounds.x * scaleX + offsetX);
      const y = Math.round(c.bounds.y * scaleY + offsetY);
      const w = Math.round(c.bounds.w * scaleX);
      const h = Math.round(c.bounds.h * scaleY);
      if (w <= 0 || h <= 0) continue;

      elements.push({
        id: counter++,
        bounds: { x, y, w, h },
        center: { x: Math.round(c.center.x * scaleX + offsetX), y: Math.round(c.center.y * scaleY + offsetY) },
        text: c.text,
        description: c.description,
        resourceId: c.resourceId,
      });
    }
  }

  const debug: SoMDebugInfo = {
    xmlChars: xmlString.length,
    maxX,
    maxY,
    candidateCount: candidates.length,
    elementCount: elements.length,
    sourceWidth,
    sourceHeight,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    insets,
  };

  return { elements, debug, xmlHead: xmlString.slice(0, 4000) };
}
