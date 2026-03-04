import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    const expected = process.env.UNB;

    if (String(code) !== String(expected)) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('logged', 'logged', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      // No maxAge = session cookie; set maxAge if you want persistence:
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
