import { NextResponse } from 'next/server';
import { verifyAdminPassphrase, createSessionToken, ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passphrase } = body;

    if (!verifyAdminPassphrase(passphrase)) {
      return NextResponse.json(
        { success: false, error: 'Invalid security passphrase. Access denied.' },
        { status: 401 }
      );
    }

    const token = await createSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
