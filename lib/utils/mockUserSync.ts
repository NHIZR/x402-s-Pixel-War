import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types/game.types';

/**
 * 将模拟用户同步到 Supabase 数据库
 * 这样用户就能在数据库中进行交易
 */
export async function syncMockUserToDatabase(user: UserProfile): Promise<boolean> {
  const supabase = createClient();

  try {
    console.log('🔄 开始同步用户到数据库:', user.id, user.username);

    // 检查用户是否已存在
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 是 "not found" 错误，这是正常的
      console.error('❌ 检查用户是否存在时出错:', checkError);
    }

    if (existing) {
      // 用户已存在，无需创建
      console.log('✅ 用户已存在，跳过创建:', user.id);
      return true;
    }

    console.log('📝 插入新用户到 profiles 表...');

    // 插入新用户到 profiles 表
    const { data: insertData, error } = await supabase.from('profiles').insert({
      id: user.id,
      username: user.username,
      display_name: user.displayName,
      wallet_address: user.walletAddress,
      x402_balance: user.x402Balance,
      total_pixels_owned: user.totalPixelsOwned,
      total_spent: user.totalSpent,
      total_earned: user.totalEarned,
      preferred_color: user.preferredColor,
    }).select();

    if (error) {
      console.error('❌ 同步用户失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ 用户同步成功:', insertData);
    return true;
  } catch (err) {
    console.error('❌ 同步用户异常:', err);
    return false;
  }
}

/**
 * 从数据库获取最新的用户余额
 */
export async function fetchUserBalance(userId: string): Promise<number | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('x402_balance')
      .eq('id', userId)
      .maybeSingle();  // 使用 maybeSingle() 而不是 single()

    if (error) {
      console.error('获取余额失败:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data.x402_balance;
  } catch (err) {
    console.error('获取余额异常:', err);
    return null;
  }
}
