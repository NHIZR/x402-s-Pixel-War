import { create } from 'zustand';

// 用户状态接口
interface UserStore {
  // 状态
  walletAddress: string | null;
  balance: number; // USDC 余额 (通过 x402 协议支付)
  isLoading: boolean;

  // 操作方法
  setWalletAddress: (address: string | null) => void;
  setBalance: (balance: number) => void;
  setLoading: (loading: boolean) => void;
  disconnect: () => void;
}

// 初始状态
const initialState = {
  walletAddress: null,
  balance: 0,
  isLoading: false,
};

// 创建 Zustand store
export const useUserStore = create<UserStore>((set) => ({
  ...initialState,

  // 设置钱包地址
  setWalletAddress: (address) => set({ walletAddress: address }),

  // 设置余额
  setBalance: (balance) => set({ balance }),

  // 设置加载状态
  setLoading: (loading) => set({ isLoading: loading }),

  // 断开连接
  disconnect: () => set(initialState),
}));
