// 像素字体数据 - 基于 5x7 标准像素字体
// 每个字母用二维数组表示，1 表示有像素，0 表示无像素

import { GRID_WIDTH, GRID_HEIGHT } from '@/lib/constants/game';

export type PixelFontChar = number[][];

// 基础 5x7 字体定义 (A-Z)
const BASE_FONT: Record<string, PixelFontChar> = {
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  B: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  C: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  D: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  F: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  G: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  H: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  I: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  J: [
    [0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  K: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  P: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  Q: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 1],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  S: [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  U: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  V: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  W: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  X: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  Z: [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  // 空格
  ' ': [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

// 基础字体尺寸
export const BASE_FONT_WIDTH = 5;
export const BASE_FONT_HEIGHT = 7;

// 预设尺寸
export const FONT_SIZES = {
  small: { width: 3, height: 5, scale: 0.6 },
  medium: { width: 5, height: 7, scale: 1 },
  large: { width: 7, height: 9, scale: 1.4 },
} as const;

export type FontSize = keyof typeof FONT_SIZES;

// 获取字符的像素数据
export function getCharPixels(char: string): PixelFontChar | null {
  const upperChar = char.toUpperCase();
  return BASE_FONT[upperChar] || null;
}

// 缩放字符到指定尺寸
export function scaleChar(char: PixelFontChar, targetWidth: number, targetHeight: number): PixelFontChar {
  const sourceHeight = char.length;
  const sourceWidth = char[0]?.length || 0;

  if (sourceWidth === 0 || sourceHeight === 0) return char;

  const result: PixelFontChar = [];

  for (let y = 0; y < targetHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < targetWidth; x++) {
      // 使用最近邻插值
      const srcX = Math.floor((x / targetWidth) * sourceWidth);
      const srcY = Math.floor((y / targetHeight) * sourceHeight);
      row.push(char[srcY]?.[srcX] || 0);
    }
    result.push(row);
  }

  return result;
}

// 文字渲染结果
export interface TextRenderResult {
  pixels: { x: number; y: number; isText: boolean }[];
  width: number;
  height: number;
  textPixelCount: number;
  totalPixelCount: number;
}

// 渲染文字到像素坐标
export function renderText(
  text: string,
  startX: number,
  startY: number,
  charWidth: number,
  charHeight: number,
  letterSpacing: number = 1,
  includeBackground: boolean = false
): TextRenderResult {
  const pixels: { x: number; y: number; isText: boolean }[] = [];
  let currentX = startX;
  let textPixelCount = 0;

  const chars = text.toUpperCase().split('');

  for (const char of chars) {
    const basePixels = getCharPixels(char);
    if (!basePixels) continue;

    const scaledPixels = scaleChar(basePixels, charWidth, charHeight);

    for (let y = 0; y < scaledPixels.length; y++) {
      for (let x = 0; x < scaledPixels[y].length; x++) {
        const pixelX = currentX + x;
        const pixelY = startY + y;

        // 检查是否在画布范围内
        if (pixelX >= 0 && pixelX < GRID_WIDTH && pixelY >= 0 && pixelY < GRID_HEIGHT) {
          const isText = scaledPixels[y][x] === 1;

          if (isText) {
            pixels.push({ x: pixelX, y: pixelY, isText: true });
            textPixelCount++;
          } else if (includeBackground) {
            pixels.push({ x: pixelX, y: pixelY, isText: false });
          }
        }
      }
    }

    currentX += charWidth + letterSpacing;
  }

  // 计算总宽度
  const totalWidth = chars.length > 0
    ? chars.length * charWidth + (chars.length - 1) * letterSpacing
    : 0;

  return {
    pixels,
    width: totalWidth,
    height: charHeight,
    textPixelCount,
    totalPixelCount: includeBackground ? totalWidth * charHeight : textPixelCount,
  };
}

// 计算文字渲染尺寸（不实际渲染）
export function calculateTextSize(
  text: string,
  charWidth: number,
  charHeight: number,
  letterSpacing: number = 1
): { width: number; height: number } {
  const validChars = text.toUpperCase().split('').filter(c => getCharPixels(c) !== null);
  const count = validChars.length;

  return {
    width: count > 0 ? count * charWidth + (count - 1) * letterSpacing : 0,
    height: charHeight,
  };
}

// 检查文字是否在画布范围内
export function isTextInBounds(
  startX: number,
  startY: number,
  textWidth: number,
  textHeight: number,
  canvasWidth: number = 100,
  canvasHeight: number = 56
): boolean {
  return (
    startX >= 0 &&
    startY >= 0 &&
    startX + textWidth <= canvasWidth &&
    startY + textHeight <= canvasHeight
  );
}

// 获取支持的字符列表
export function getSupportedChars(): string[] {
  return Object.keys(BASE_FONT);
}
