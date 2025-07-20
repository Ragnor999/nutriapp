
import { getUserNutrientHistory } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import adminSdkConfig from '../../../../../firebase-adminsdk.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(JSON.stringify(adminSdkConfig)) as ServiceAccount),
  });
}
const db = getFirestore();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const authHeader = request.headers.get('Authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!authToken) {
    return NextResponse.json({ message: 'Authorization token is required' }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(authToken);
    const callerUid = decodedToken.uid;
    const callerDocRef = db.collection('users').doc(callerUid);
    const callerDoc = await callerDocRef.get();
    const isCallerAdmin = callerDoc.exists && callerDoc.data()?.role === 'admin';

    // Simplified Authorization Check:
    // Allow if the caller is an admin OR if the caller is requesting their own data.
    if (isCallerAdmin || callerUid === userId) {
        const data = await getUserNutrientHistory(userId);
        return NextResponse.json(data);
    }

    // If neither of the above conditions are met, deny access.
    return NextResponse.json({ message: 'Forbidden: You do not have permission to view this data.' }, { status: 403 });

  } catch (error) {
    console.error(`Error in /api/admin/history for userId ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired') || errorMessage.includes('verifyIdToken')) {
      return NextResponse.json({ message: 'Firebase ID token is invalid or has expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch user history', error: errorMessage }, { status: 500 });
  }
}
