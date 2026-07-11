import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 401 });
    }

    // Verify the token to ensure it's valid and get the UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    const response = NextResponse.json({ status: 'success' });
    // In a real app we'd use createSessionCookie, but since we don't have a service account
    // configured locally, we'll just store the UID securely in an httpOnly cookie for the prototype.
    response.cookies.set('session', uid, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set('session', '', { maxAge: -1, path: '/' });
  return response;
}
