
import { getAllUsers } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import adminSdkConfig from '../../../../../firebase-adminsdk.json';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
  });
}
const db = getFirestore();

export async function GET(request: NextRequest) {
  const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!authToken) {
    return NextResponse.json({ message: 'Authorization token is required' }, { status: 401 });
  }
  
  try {
    // Verify the token to get the user's UID
    const decodedToken = await getAuth().verifyIdToken(authToken);
    const { uid } = decodedToken;

    // Check the user's role in Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    // Only allow admins to access this route
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: User is not an admin' }, { status: 403 });
    }

    // If admin, proceed to fetch all users
    const data = await getAllUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes('ID token has expired') || errorMessage.includes('token expired')) {
        return NextResponse.json({ message: 'Authentication token expired.', error: errorMessage }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to fetch users', error: errorMessage }, { status: 500 });
  }
}
