export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-cyan-400 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="加载中"
    />
  );
}

export function LoadingScreen({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-cyber-white/70">{message}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = '处理中...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-cyber-white font-medium">{message}</p>
      </div>
    </div>
  );
}
