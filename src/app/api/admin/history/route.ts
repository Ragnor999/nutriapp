
import { getUserNutrientHistory } from '@/ai/flows/admin-flows';
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
    // Verify the token to get the caller's UID
    const decodedToken = await getAuth().verifyIdToken(authToken);
    const callerUid = decodedToken.uid;

    // A regular user can only access their own history.
    // An admin can access anyone's history.
    if (callerUid !== userId) {
        // If the caller is not the user whose data is requested, check if the caller is an admin.
        const callerDocRef = db.collection('users').doc(callerUid);
        const callerDoc = await callerDocRef.get();

        if (!callerDoc.exists() || callerDoc.data()?.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: You do not have permission to view this data.' }, { status: 403 });
        }
    }

    // If the checks pass, fetch the history.
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
