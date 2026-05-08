import { NextRequest, NextResponse } from 'next/server';

import { verifySupabaseBearerToken } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : '';
  const session = await verifySupabaseBearerToken(token);

  return NextResponse.json(session, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
