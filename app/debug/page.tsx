'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [profilesCount, setProfilesCount] = useState<number | null>(null);
  const [pixelsCount, setPixelsCount] = useState<number | null>(null);
  const [sampleProfile, setSampleProfile] = useState<any>(null);
  const [samplePixel, setSamplePixel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDatabase = async () => {
      const supabase = createClient();

      try {
        // 检查 profiles 表
        const { count: pCount, error: pError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (pError) {
          console.error('Profiles 表错误:', pError);
          setError(`Profiles: ${pError.message}`);
        } else {
          setProfilesCount(pCount);
        }

        // 获取一个 profile 样本
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();

        setSampleProfile(pData);

        // 检查 pixels 表
        const { count: pixCount, error: pixError } = await supabase
          .from('pixels')
          .select('*', { count: 'exact', head: true });

        if (pixError) {
          console.error('Pixels 表错误:', pixError);
          setError(`Pixels: ${pixError.message}`);
        } else {
          setPixelsCount(pixCount);
        }

        // 获取一个 pixel 样本
        const { data: pixData } = await supabase
          .from('pixels')
          .select('*')
          .eq('x', 0)
          .eq('y', 0)
          .single();

        setSamplePixel(pixData);
      } catch (err) {
        console.error('数据库检查异常:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      }
    };

    checkDatabase();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">数据库调试页面</h1>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded">
          <p className="text-red-400">错误: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-900 rounded border border-gray-800">
          <h2 className="text-lg font-semibold mb-2">Profiles 表</h2>
          <p>记录数: {profilesCount ?? '加载中...'}</p>
          {sampleProfile && (
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(sampleProfile, null, 2)}
            </pre>
          )}
        </div>

        <div className="p-4 bg-gray-900 rounded border border-gray-800">
          <h2 className="text-lg font-semibold mb-2">Pixels 表</h2>
          <p>记录数: {pixelsCount ?? '加载中...'}</p>
          {samplePixel && (
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(samplePixel, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
