
import { getUserNutrientHistory } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import adminSdkConfig from '../../../../../firebase-adminsdk.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
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

    if (isCallerAdmin) {
      const data = await getUserNutrientHistory(userId);
      return NextResponse.json(data);
    }
    
    if (callerUid !== userId) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view this data.' }, { status: 403 });
    }
    
    const data = await getUserNutrientHistory(userId);
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in /api/admin/history for userId ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired')) {
      return NextResponse.json({ message: 'Firebase ID token has expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch user history', error: errorMessage }, { status: 500 });
  }
}
