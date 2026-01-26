'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'warning' | 'info' | 'success' | 'error';

interface AlertCardProps {
  id: string;
  type: AlertType;
  title: string;
  description?: React.ReactNode;
  dismissible?: boolean;
  persistent?: boolean; // Always show, can't be dismissed
  onDismiss?: () => void;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500/50',
    text: 'text-yellow-300',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500/50',
    text: 'text-blue-300',
    icon: Info,
  },
  success: {
    bg: 'bg-green-900/30',
    border: 'border-green-500/50',
    text: 'text-green-300',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    text: 'text-red-300',
    icon: AlertCircle,
  },
};

const DISMISSED_ALERTS_KEY = 'pixelwar_dismissed_alerts';

function getDismissedAlerts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDismissedAlert(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedAlerts();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
    }
  } catch (error) {
    console.error('Failed to save dismissed alert:', error);
  }
}

export function AlertCard({
  id,
  type,
  title,
  description,
  dismissible = true,
  persistent = false,
  onDismiss,
  className,
  action,
}: AlertCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const style = alertStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    setMounted(true);
    // Check if already dismissed (only if dismissible and not persistent)
    if (dismissible && !persistent) {
      const dismissed = getDismissedAlerts();
      if (dismissed.includes(id)) {
        setIsDismissed(true);
      }
    }
  }, [id, dismissible, persistent]);

  const handleDismiss = () => {
    if (persistent) return;

    setIsDismissed(true);
    saveDismissedAlert(id);
    onDismiss?.();
  };

  // Don't render on server
  if (!mounted) return null;

  // Don't render if dismissed
  if (isDismissed) return null;

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 p-3 animate-fade-in',
        style.bg,
        style.border,
        className
      )}
    >
      {/* Close button */}
      {dismissible && !persistent && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
        </button>
      )}

      <div className="flex gap-2.5 pr-6">
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', style.text)} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', style.text)}>{title}</p>
          {description && (
            <div className="mt-1 text-xs text-gray-300/80 leading-relaxed">
              {description}
            </div>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'mt-2 px-3 py-1 text-xs font-medium rounded transition-colors',
                type === 'warning' && 'bg-yellow-600 hover:bg-yellow-500 text-white',
                type === 'info' && 'bg-blue-600 hover:bg-blue-500 text-white',
                type === 'success' && 'bg-green-600 hover:bg-green-500 text-white',
                type === 'error' && 'bg-red-600 hover:bg-red-500 text-white'
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to clear dismissed alerts (for testing)
export function clearDismissedAlerts() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DISMISSED_ALERTS_KEY);
  } catch {
    // Ignore
  }
}

// Helper to check if an alert is dismissed
export function isAlertDismissed(id: string): boolean {
  return getDismissedAlerts().includes(id);
}
