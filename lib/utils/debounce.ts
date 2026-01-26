/**
 * 防抖批量更新工具
 * 用于优化 Supabase 实时更新，避免频繁的状态更新
 */

interface PendingUpdate<T> {
  key: string;
  data: T;
  timestamp: number;
}

export class BatchUpdateQueue<T> {
  private pendingUpdates: Map<string, PendingUpdate<T>> = new Map();
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly flushDelay: number;
  private readonly onFlush: (updates: Array<{ key: string; data: T }>) => void;

  constructor(
    onFlush: (updates: Array<{ key: string; data: T }>) => void,
    flushDelay: number = 100
  ) {
    this.onFlush = onFlush;
    this.flushDelay = flushDelay;
  }

  /**
   * 添加更新到队列
   */
  add(key: string, data: T): void {
    this.pendingUpdates.set(key, {
      key,
      data,
      timestamp: Date.now(),
    });

    this.scheduleFlush();
  }

  /**
   * 调度批量刷新
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      return; // 已经有一个定时器在等待
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }

  /**
   * 立即执行批量更新
   */
  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingUpdates.size === 0) {
      return;
    }

    const updates = Array.from(this.pendingUpdates.values()).map(({ key, data }) => ({
      key,
      data,
    }));

    this.pendingUpdates.clear();
    this.onFlush(updates);
  }

  /**
   * 清空队列
   */
  clear(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.pendingUpdates.clear();
  }

  /**
   * 获取待处理更新数量
   */
  get size(): number {
    return this.pendingUpdates.size;
  }
}

/**
 * 简单的防抖函数
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}
