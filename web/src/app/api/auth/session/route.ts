import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET() {
  const authenticated = await isAuthorizedAdmin();
  return NextResponse.json({
    authenticated,
  });
}
