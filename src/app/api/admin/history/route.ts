
import { getUserNutrientHistory } from '@/ai/flows/admin-flows';
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!authToken) {
    return NextResponse.json({ message: 'Authorization token is required' }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }
  
  try {
    // Verify the token and check for admin custom claim
    const decodedToken = await getAuth().verifyIdToken(authToken);

    // Regular user can only access their own history
    if (decodedToken.uid !== userId && !decodedToken.admin) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await getUserNutrientHistory(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in /api/admin/history for userId ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired')) {
        return NextResponse.json({ message: 'Authentication token expired.', error: errorMessage }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch user history', error: errorMessage }, { status: 500 });
  }
}
