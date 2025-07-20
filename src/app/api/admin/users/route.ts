import { getAllUsers } from '@/ai/flows/admin-flows';
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
  const authHeader = request.headers.get('Authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!authToken) {
    return NextResponse.json({ message: 'Authorization token is required' }, { status: 401 });
  }
  
  try {
    const decodedToken = await getAuth().verifyIdToken(authToken);
    const { uid } = decodedToken;

    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    const data = await getAllUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired') || errorMessage.includes('verifyIdToken')) {
        return NextResponse.json({ message: 'Firebase ID token is invalid or has expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch users', error: errorMessage }, { status: 500 });
  }
}
