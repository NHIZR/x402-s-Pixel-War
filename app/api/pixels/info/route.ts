/**
 * Pixel Info API Route
 *
 * Get information about pixels including current prices and ownership.
 *
 * GET /api/pixels/info?x=0&y=0           - Get single pixel info
 * GET /api/pixels/info?pixels=0,0;1,1    - Get multiple pixels info
 * GET /api/pixels/info?all=true          - Get all pixels (use with caution)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for API route
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = getSupabaseClient();

    // Check for single pixel query
    const x = searchParams.get('x');
    const y = searchParams.get('y');

    if (x !== null && y !== null) {
      const xNum = parseInt(x, 10);
      const yNum = parseInt(y, 10);

      if (isNaN(xNum) || isNaN(yNum) || xNum < 0 || xNum >= 100 || yNum < 0 || yNum >= 100) {
        return NextResponse.json(
          { success: false, error: 'Invalid coordinates. Must be 0-99.' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('pixels')
        .select('x, y, color, current_price, wallet_owner, conquest_count, last_conquered_at')
        .eq('x', xNum)
        .eq('y', yNum)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Pixel not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        pixel: {
          x: data.x,
          y: data.y,
          color: data.color,
          price: data.current_price,
          owner: data.wallet_owner,
          conquestCount: data.conquest_count,
          lastConqueredAt: data.last_conquered_at,
        },
      });
    }

    // Check for multiple pixels query
    const pixelsParam = searchParams.get('pixels');
    if (pixelsParam) {
      const coordinates = pixelsParam.split(';').map(coord => {
        const [px, py] = coord.split(',').map(n => parseInt(n, 10));
        return { x: px, y: py };
      });

      // Validate coordinates
      for (const coord of coordinates) {
        if (isNaN(coord.x) || isNaN(coord.y) || coord.x < 0 || coord.x >= 100 || coord.y < 0 || coord.y >= 100) {
          return NextResponse.json(
            { success: false, error: `Invalid coordinate: (${coord.x}, ${coord.y})` },
            { status: 400 }
          );
        }
      }

      if (coordinates.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 pixels per request' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('pixels')
        .select('x, y, color, current_price, wallet_owner, conquest_count')
        .or(coordinates.map(c => `and(x.eq.${c.x},y.eq.${c.y})`).join(','));

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch pixels' },
          { status: 500 }
        );
      }

      const totalPrice = data.reduce((sum, p) => sum + p.current_price, 0);

      return NextResponse.json({
        success: true,
        pixelCount: data.length,
        totalPrice,
        pixels: data.map(p => ({
          x: p.x,
          y: p.y,
          color: p.color,
          price: p.current_price,
          owner: p.wallet_owner,
          conquestCount: p.conquest_count,
        })),
      });
    }

    // Check for all pixels query
    const all = searchParams.get('all');
    if (all === 'true') {
      const { data, error } = await supabase
        .from('pixels')
        .select('x, y, color, current_price, wallet_owner')
        .order('y')
        .order('x');

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch pixels' },
          { status: 500 }
        );
      }

      // Calculate statistics
      const totalPixels = data.length;
      const ownedPixels = data.filter(p => p.wallet_owner !== null).length;
      const totalValue = data.reduce((sum, p) => sum + p.current_price, 0);

      return NextResponse.json({
        success: true,
        statistics: {
          totalPixels,
          ownedPixels,
          unownedPixels: totalPixels - ownedPixels,
          totalValue,
          averagePrice: totalValue / totalPixels,
        },
        pixels: data.map(p => ({
          x: p.x,
          y: p.y,
          color: p.color,
          price: p.current_price,
          owner: p.wallet_owner,
        })),
      });
    }

    // Check for wallet query
    const wallet = searchParams.get('wallet');
    if (wallet) {
      const { data, error } = await supabase
        .from('pixels')
        .select('x, y, color, current_price, conquest_count')
        .eq('wallet_owner', wallet);

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch wallet pixels' },
          { status: 500 }
        );
      }

      const totalValue = data.reduce((sum, p) => sum + p.current_price, 0);

      return NextResponse.json({
        success: true,
        wallet,
        pixelCount: data.length,
        totalValue,
        pixels: data.map(p => ({
          x: p.x,
          y: p.y,
          color: p.color,
          price: p.current_price,
          conquestCount: p.conquest_count,
        })),
      });
    }

    // Default: return API usage info
    return NextResponse.json({
      endpoint: 'Pixel Info API',
      usage: {
        singlePixel: '/api/pixels/info?x=0&y=0',
        multiplePixels: '/api/pixels/info?pixels=0,0;1,1;2,2',
        allPixels: '/api/pixels/info?all=true',
        walletPixels: '/api/pixels/info?wallet=YOUR_WALLET_ADDRESS',
      },
      gridSize: '100x100 (10,000 pixels total)',
      coordinateRange: '0-99 for both x and y',
    });

  } catch (error) {
    console.error('Pixel Info API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
