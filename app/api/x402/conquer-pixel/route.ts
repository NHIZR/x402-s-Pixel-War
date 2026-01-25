/**
 * X402 Payment API - Conquer Pixel
 *
 * 这个 API 实现了 x402 协议的服务端:
 * 1. 首次请求 → 返回 402 Payment Required
 * 2. 带支付签名的请求 → 验证并处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { X402PaymentHandler } from 'x402-solana/server';
import { FEATURES } from '@/lib/config/features';

// 初始化 X402 Payment Handler
const x402 = new X402PaymentHandler({
  network: 'solana-devnet',
  treasuryAddress: process.env.NEXT_PUBLIC_GAME_TREASURY_WALLET!,
  facilitatorUrl: FEATURES.x402Config.facilitatorUrl,
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  defaultDescription: 'Pixel Conquest Payment',
  defaultTimeoutSeconds: 300,
});

/**
 * POST /api/x402/conquer-pixel
 *
 * X402 协议支付 API
 */
export async function POST(req: NextRequest) {
  try {
    // 构建资源 URL
    const resourceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/x402/conquer-pixel`;

    // 解析请求体
    const body = await req.json();
    const { amount, recipient } = body;

    // 验证参数
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    console.log('📝 X402 API Request:', {
      amount,
      recipient: recipient || process.env.NEXT_PUBLIC_GAME_TREASURY_WALLET,
      resourceUrl,
    });

    // 步骤 1: 提取支付 header (PAYMENT-SIGNATURE)
    const paymentHeader = x402.extractPayment(req.headers);

    // 步骤 2: 创建支付要求 (v2 格式)
    const paymentRequirements = await x402.createPaymentRequirements(
      {
        amount: String(Math.floor(amount * 1_000_000)), // 转换为最小单位
        asset: {
          address: FEATURES.x402Config.usdcMint, // Circle DevNet USDC
          decimals: 6,
        },
        description: `Pixel Conquest - ${amount} USDC`,
      },
      resourceUrl
    );

    // 步骤 3: 如果没有支付 header,返回 402 Payment Required
    if (!paymentHeader) {
      console.log('💳 No payment header, sending 402 Payment Required');

      const response = x402.create402Response(paymentRequirements, resourceUrl);

      return NextResponse.json(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    // 步骤 4: 验证支付
    console.log('🔍 Verifying payment with facilitator...');

    const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);

    if (!verified.isValid) {
      console.error('❌ Payment verification failed:', verified.invalidReason);

      return NextResponse.json(
        {
          error: 'Invalid payment',
          reason: verified.invalidReason,
        },
        { status: 402 }
      );
    }

    console.log('✅ Payment verified successfully');

    // 步骤 5: 执行业务逻辑 (这里简化处理)
    // 在实际应用中,你应该:
    // - 调用 Supabase RPC 更新像素
    // - 记录交易
    // - 等等...

    const result = {
      success: true,
      message: 'Payment received and verified',
      amount,
      txHash: paymentHeader, // 简化处理,实际应该从验证结果中提取
    };

    // 步骤 6: 结算支付 (可选,但推荐)
    console.log('💰 Settling payment with facilitator...');

    const settlement = await x402.settlePayment(paymentHeader, paymentRequirements);

    if (!settlement.success) {
      console.error('⚠️ Settlement failed:', settlement.errorReason);
      // 注意: 即使结算失败,我们仍然返回成功
      // 因为支付已经验证通过了
    } else {
      console.log('✅ Payment settled successfully');
    }

    // 步骤 7: 返回成功响应
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('💥 X402 API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/x402/conquer-pixel
 *
 * 返回 API 信息 (用于调试)
 */
export async function GET() {
  return NextResponse.json({
    name: 'X402 Pixel Conquest API',
    version: '2.0',
    protocol: 'x402-v2',
    network: x402.getNetwork(),
    treasury: x402.getTreasuryAddress(),
    status: 'ready',
    description: 'This endpoint requires payment via X402 protocol',
  });
}
