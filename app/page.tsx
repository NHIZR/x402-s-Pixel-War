'use client';

import { useState } from 'react';
import { Grid } from '@/components/game/Grid';
import { TransactionPanel } from '@/components/game/TransactionPanel';
import { useMobile } from '@/lib/hooks/useMobile';
import { Menu, X } from 'lucide-react';

export default function Home() {
  const isMobile = useMobile();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <main className="min-h-screen flex">
      {/* Main Game Area */}
      <div className="flex-1">
        <Grid />
      </div>

      {/* Desktop: Fixed sidebar */}
      {!isMobile && <TransactionPanel />}

      {/* Mobile: Drawer overlay */}
      {isMobile && (
        <>
          {/* Floating button to open panel */}
          <button
            onClick={() => setIsPanelOpen(true)}
            className="fixed bottom-4 right-4 z-40 p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg transition-all hover:scale-105"
            aria-label="Open Dashboard"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Backdrop */}
          {isPanelOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 transition-opacity"
              onClick={() => setIsPanelOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${
              isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setIsPanelOpen(false)}
              className="absolute top-4 left-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
              aria-label="Close Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
            <TransactionPanel />
          </div>
        </>
      )}
    </main>
  );
}
