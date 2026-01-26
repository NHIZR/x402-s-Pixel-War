import { create } from 'zustand';
import type { Pixel } from '@/lib/types/game.types';

// 游戏状态接口
interface GameStore {
  // 状态
  pixels: Pixel[][];
  selectedPixel: Pixel | null; // 当前查看的像素（用于弹窗）
  selectedPixels: Pixel[]; // 多选像素（用于批量操作）
  isSelecting: boolean; // 是否正在选择
  isConquering: boolean;
  loading: boolean;
  error: string | null;

  // 操作方法
  setPixels: (pixels: Pixel[][]) => void;
  updatePixel: (x: number, y: number, updates: Partial<Pixel>) => void;
  updatePixelsBatch: (updates: Array<{ x: number; y: number; data: Partial<Pixel> }>) => void;
  selectPixel: (pixel: Pixel | null) => void; // 选择单个像素查看详情
  togglePixelSelection: (pixel: Pixel) => void; // 切换像素选中状态
  clearSelection: () => void; // 清空选择
  setSelecting: (isSelecting: boolean) => void;
  setConquering: (isConquering: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 选择器：用于避免不必要的重渲染
export const selectPixels = (state: GameStore) => state.pixels;
export const selectSelectedPixel = (state: GameStore) => state.selectedPixel;
export const selectSelectedPixels = (state: GameStore) => state.selectedPixels;
export const selectIsSelecting = (state: GameStore) => state.isSelecting;
export const selectIsConquering = (state: GameStore) => state.isConquering;
export const selectLoading = (state: GameStore) => state.loading;
export const selectError = (state: GameStore) => state.error;

// 初始状态
const initialState = {
  pixels: [],
  selectedPixel: null,
  selectedPixels: [],
  isSelecting: false,
  isConquering: false,
  loading: true,
  error: null,
};

// 创建 Zustand store
export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  // 设置整个网格
  setPixels: (pixels) => set({ pixels, loading: false, error: null }),

  // 更新单个像素（用于实时更新）- O(1) 复杂度
  updatePixel: (x, y, updates) => set((state) => {
    if (!state.pixels[y]?.[x]) return state;

    // 只复制受影响的行，避免 O(n²) 操作
    const newPixels = [...state.pixels];
    newPixels[y] = [...newPixels[y]];
    newPixels[y][x] = { ...newPixels[y][x], ...updates };

    return { pixels: newPixels };
  }),

  // 批量更新像素（用于批量操作）- 一次性更新多个像素
  updatePixelsBatch: (updates) => set((state) => {
    if (updates.length === 0) return state;

    const newPixels = [...state.pixels];
    const modifiedRows = new Set<number>();

    for (const { x, y, data } of updates) {
      if (!state.pixels[y]?.[x]) continue;

      if (!modifiedRows.has(y)) {
        newPixels[y] = [...newPixels[y]];
        modifiedRows.add(y);
      }
      newPixels[y][x] = { ...newPixels[y][x], ...data };
    }

    return { pixels: newPixels };
  }),

  // 选择单个像素查看详情（打开弹窗）
  selectPixel: (pixel) => set({ selectedPixel: pixel }),

  // 切换像素选中状态（多选）
  togglePixelSelection: (pixel) => set((state) => {
    const isSelected = state.selectedPixels.some(p => p.x === pixel.x && p.y === pixel.y);

    if (isSelected) {
      // 取消选中
      return {
        selectedPixels: state.selectedPixels.filter(p => !(p.x === pixel.x && p.y === pixel.y))
      };
    } else {
      // 添加到选中列表
      return {
        selectedPixels: [...state.selectedPixels, pixel]
      };
    }
  }),

  // 清空选择
  clearSelection: () => set({ selectedPixels: [], isSelecting: false }),

  // 设置选择模式
  setSelecting: (isSelecting) => set({ isSelecting }),

  // 设置占领中状态
  setConquering: (isConquering) => set({ isConquering }),

  // 设置加载状态
  setLoading: (loading) => set({ loading }),

  // 设置错误信息
  setError: (error) => set({ error, loading: false }),

  // 重置状态
  reset: () => set(initialState),
}));
