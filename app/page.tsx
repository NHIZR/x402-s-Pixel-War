import { Grid } from '@/components/game/Grid';
import { TransactionPanel } from '@/components/game/TransactionPanel';

export default function Home() {
  return (
    <main className="min-h-screen flex">
      {/* Main Game Area */}
      <div className="flex-1">
        <Grid />
      </div>

      {/* Right Side Transaction Panel */}
      <TransactionPanel />
    </main>
  );
}
