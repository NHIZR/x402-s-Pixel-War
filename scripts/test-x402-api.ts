/**
 * Test X402 API
 *
 * 测试 X402 后端 API 是否正常工作
 */

async function testX402API() {
  const apiUrl = 'http://localhost:3000/api/x402/conquer-pixel';

  console.log('🧪 Testing X402 API...\n');

  // 测试 1: GET request (获取 API 信息)
  console.log('📝 Test 1: GET /api/x402/conquer-pixel');
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 测试 2: POST request without payment (应该返回 402)
  console.log('📝 Test 2: POST without payment (expect 402)');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1.0,
      }),
    });

    console.log('Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 402) {
      console.log('✅ Correctly returned 402 Payment Required');
      console.log('💡 Payment Requirements:');
      console.log('   - Protocol Version:', data.x402Version);
      console.log('   - Network:', data.accepts?.[0]?.network);
      console.log('   - Amount:', data.accepts?.[0]?.amount);
      console.log('   - PayTo:', data.accepts?.[0]?.payTo);
    } else {
      console.log('⚠️  Expected 402, got', response.status);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  console.log('📚 Next Steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Run this test: npx tsx scripts/test-x402-api.ts');
  console.log('3. If you see 402 Payment Required → API is working! ✅');
  console.log('4. To test full flow, use the frontend with X402 enabled');
  console.log('\n💡 Enable X402 in frontend:');
  console.log('   NEXT_PUBLIC_ENABLE_X402=true npm run dev');
}

// 运行测试
testX402API().catch(console.error);
