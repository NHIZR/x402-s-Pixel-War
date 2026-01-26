import { create } from 'zustand';

// 交易记录类型
export interface Transaction {
  id: string;
  type: 'conquer' | 'batch_conquer' | 'faucet';
  pixelX?: number;
  pixelY?: number;
  pixelCount?: number;
  amount: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

interface TransactionStore {
  // 状态
  transactions: Transaction[];

  // 操作方法
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  clearTransactions: () => void;
}

// 生成唯一 ID
const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],

  addTransaction: (tx) => set((state) => ({
    transactions: [
      {
        ...tx,
        id: generateId(),
        timestamp: new Date(),
      },
      ...state.transactions,
    ].slice(0, 50), // 只保留最近 50 条
  })),

  updateTransactionStatus: (id, status) => set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.id === id ? { ...tx, status } : tx
    ),
  })),

  clearTransactions: () => set({ transactions: [] }),
}));
