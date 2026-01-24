import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/lib/stores/gameStore';
import type { ConquestResult } from '@/lib/types/game.types';
import { toast } from 'sonner';

export function usePixelConquest() {
  const [isConquering, setIsConquering] = useState(false);
  const setConqueringGlobal = useGameStore((state) => state.setConquering);
  const supabase = createClient();

  const conquerPixel = async (
    x: number,
    y: number,
    userId: string,
    color: string
  ): Promise<ConquestResult> => {
    console.log('🎯 开始占领像素:', { x, y, userId, color });
    setIsConquering(true);
    setConqueringGlobal(true);

    try {
      // 调用 Supabase RPC 函数
      console.log('📡 调用 conquer_pixel RPC...');
      const { data, error } = await supabase.rpc('conquer_pixel', {
        p_pixel_x: x,
        p_pixel_y: y,
        p_buyer_id: userId,
        p_new_color: color,
      });

      if (error) {
        console.error('❌ 占领 RPC 错误:', error);
        console.error('错误详情:', JSON.stringify(error, null, 2));
        toast.error('占领失败', {
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      console.log('📦 RPC 返回数据:', data);

      if (!data) {
        toast.error('占领失败', {
          description: '未收到服务器响应',
        });
        return { success: false, error: '未收到服务器响应' };
      }

      // 检查返回的结果
      if (!data.success) {
        const errorMsg = data.error || '未知错误';

        if (errorMsg.includes('Insufficient balance')) {
          toast.error('余额不足', {
            description: `需要 ${data.required?.toFixed(4)} USDC，当前余额 ${data.available?.toFixed(4)} USDC`,
          });
        } else if (errorMsg.includes('already own')) {
          toast.warning('你已经拥有这个像素了');
        } else {
          toast.error('占领失败', {
            description: errorMsg,
          });
        }

        return data;
      }

      // 成功！
      toast.success('占领成功！🎉', {
        description: `花费 ${data.transaction.pricePaid.toFixed(4)} USDC，像素现在是你的了！`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      console.error('占领异常:', err);
      toast.error('占领失败', {
        description: message,
      });
      return { success: false, error: message };
    } finally {
      setIsConquering(false);
      setConqueringGlobal(false);
    }
  };

  return { conquerPixel, isConquering };
}
