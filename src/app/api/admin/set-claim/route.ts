
import { setAdminClaim } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import adminSdkConfig from '../../../../../firebase-adminsdk.json';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
  });
}

export async function POST(request: NextRequest) {
  const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  const body = await request.json();
  const { email } = body;

  if (!authToken) {
    return NextResponse.json({ success: false, message: 'Authorization token is required' }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
  }
  
  try {
    // Verify the token and check for admin custom claim
    const decodedToken = await getAuth().verifyIdToken(authToken);
    if (decodedToken.admin !== true) {
        return NextResponse.json({ success: false, message: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    // If admin, proceed to set claim on another user
    const result = await setAdminClaim(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/admin/set-claim:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
