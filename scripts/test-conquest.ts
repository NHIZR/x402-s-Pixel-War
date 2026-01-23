/**
 * Test Conquest Flow
 *
 * This script tests the conquest functionality without requiring a browser.
 * Useful for debugging the backend logic.
 */

import { Connection, clusterApiUrl } from '@solana/web3.js';
import { mockX402Payment } from '../lib/solana/mockPayment';

async function testPayment() {
  console.log('🧪 Testing Mock Payment System\n');

  const connection = new Connection(clusterApiUrl('devnet'));
  const testWallet = 'AhwkAv13KmHWtsxdfNiaFyoJ4h4kMCA5TtSJLPjFNXqp';

  // Test 1: Single payment
  console.log('Test 1: Single pixel payment (0.001 USDC)');
  const result1 = await mockX402Payment(connection, testWallet, 0.001);
  console.log(result1.success ? '✅ Success' : '❌ Failed');
  if (result1.success) {
    console.log(`   TX Hash: ${result1.txHash?.substring(0, 12)}...`);
  } else {
    console.log(`   Error: ${result1.error}`);
  }

  console.log('');

  // Test 2: Larger payment
  console.log('Test 2: Larger payment (1.5 USDC)');
  const result2 = await mockX402Payment(connection, testWallet, 1.5);
  console.log(result2.success ? '✅ Success' : '❌ Failed');
  if (result2.success) {
    console.log(`   TX Hash: ${result2.txHash?.substring(0, 12)}...`);
  } else {
    console.log(`   Error: ${result2.error}`);
  }

  console.log('');

  // Test 3: Invalid payment (should fail validation)
  console.log('Test 3: Invalid payment (0 USDC - should fail)');
  const result3 = await mockX402Payment(connection, testWallet, 0);
  console.log(!result3.success ? '✅ Correctly rejected' : '❌ Should have failed');
  if (!result3.success) {
    console.log(`   Error: ${result3.error}`);
  }

  console.log('');

  // Test 4: Run multiple payments to test random failure
  console.log('Test 4: Multiple payments (testing 5% random failure rate)');
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < 20; i++) {
    const result = await mockX402Payment(connection, testWallet, 0.001);
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(`   Successes: ${successCount}/20`);
  console.log(`   Failures: ${failureCount}/20`);
  console.log(`   Expected failures: ~1 (5% of 20)`);

  console.log('\n✨ Payment tests complete!\n');
}

async function main() {
  console.log('════════════════════════════════════════════════');
  console.log('   x402 Pixel War - Conquest Flow Test');
  console.log('════════════════════════════════════════════════\n');

  try {
    await testPayment();

    console.log('📋 Next Steps:');
    console.log('   1. Run database migration (see docs/SETUP_DATABASE.md)');
    console.log('   2. Start dev server: npm run dev');
    console.log('   3. Connect wallet and test in browser');
    console.log('   4. Try conquering a pixel!');
    console.log('');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
