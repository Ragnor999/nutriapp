import { setAdminRole } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import adminSdkConfig from '../../../../../firebase-adminsdk.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!authToken) {
    return NextResponse.json({ success: false, message: 'Authorization token is required' }, { status: 401 });
  }
  
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
  }
  
  try {
    const decodedToken = await getAuth().verifyIdToken(authToken);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const result = await setAdminRole(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/admin/set-role:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired')) {
      return NextResponse.json({ success: false, message: 'Firebase ID token has expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
