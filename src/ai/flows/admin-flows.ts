
'use server';
/**
 * @fileOverview Admin flows for user management and data access.
 *
 * - getAllUsers - Fetches all users from Firebase Authentication.
 * - getUserNutrientHistory - Fetches nutrient history for a specific user.
 * - setAdminClaim - Sets an admin custom claim on a user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { NutrientData } from '@/lib/types';
import adminSdkConfig from '../../../firebase-adminsdk.json';


// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

// Schema for a single user
const UserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  creationTime: z.string(),
  isAdmin: z.boolean(),
});

// Schema for the output of getAllUsers
const AllUsersOutputSchema = z.object({
  users: z.array(UserSchema),
});
export type AllUsersOutput = z.infer<typeof AllUsersOutputSchema>;

const getAllUsersFlow = ai.defineFlow(
  {
    name: 'getAllUsersFlow',
    outputSchema: AllUsersOutputSchema,
  },
  async () => {
    const authUserRecords = await auth.listUsers();
    
    const usersWithFirestoreData = await Promise.all(
        authUserRecords.users.map(async (userRecord) => {
            const userDocRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userDocRef.get();
            const firestoreData = userDoc.data();

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: firestoreData?.name || userRecord.displayName,
                creationTime: userRecord.metadata.creationTime,
                isAdmin: userRecord.customClaims?.admin === true,
            };
        })
    );
    
    const sortedUsers = usersWithFirestoreData.sort((a,b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime());

    return { users: sortedUsers };
  }
);

export async function getAllUsers(): Promise<AllUsersOutput> {
  return getAllUsersFlow();
}

// Schemas for fetching user nutrient history
const UserNutrientHistoryInputSchema = z.object({
  userId: z.string().describe('The UID of the user to fetch data for.'),
});

const MacroNutrientsSchema = z.object({
  protein: z.number(),
  carbohydrates: z.number(),
  fat: z.number(),
});

const NutrientDataSchema = z.object({
  date: z.date(),
  macros: MacroNutrientsSchema,
  micros: z.array(z.string()),
  calories: z.number(),
});

const UserNutrientHistoryOutputSchema = z.object({
  history: z.array(NutrientDataSchema),
});
export type UserNutrientHistoryOutput = z.infer<typeof UserNutrientHistoryOutputSchema>;


const getUserNutrientHistoryFlow = ai.defineFlow(
  {
    name: 'getUserNutrientHistoryFlow',
    inputSchema: UserNutrientHistoryInputSchema,
    outputSchema: UserNutrientHistoryOutputSchema,
  },
  async ({ userId }) => {
    const historyRef = db.collection('nutrientHistory');
    const querySnapshot = await historyRef.where('userId', '==', userId).get();

    const history: NutrientData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        date: (data.date as Timestamp).toDate(),
        macros: data.macros,
        micros: data.micros,
        calories: data.calories,
      });
    });

    const sortedHistory = history.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return { history: sortedHistory };
  }
);

export async function getUserNutrientHistory(userId: string): Promise<UserNutrientHistoryOutput> {
    return getUserNutrientHistoryFlow({ userId });
}

// Schema for setting an admin claim
const SetAdminClaimInputSchema = z.object({
  email: z.string().email().describe("The email of the user to make an admin."),
});

const setAdminClaimFlow = ai.defineFlow(
  {
    name: 'setAdminClaimFlow',
    inputSchema: SetAdminClaimInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ email }) => {
    try {
      const user = await auth.getUserByEmail(email);
      if (user.customClaims?.admin === true) {
        return { success: false, message: 'User is already an admin.' };
      }
      await auth.setCustomUserClaims(user.uid, { admin: true });
      return { success: true, message: `Successfully made ${email} an admin.` };
    } catch (error: any) {
      console.error('Error setting admin claim:', error);
      return { success: false, message: error.message || 'Failed to set admin claim.' };
    }
  }
);

export async function setAdminClaim(email: string) {
    return setAdminClaimFlow({ email });
}
