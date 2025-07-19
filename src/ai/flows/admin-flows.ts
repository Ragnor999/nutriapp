
'use server';
/**
 * @fileOverview Admin flows for user management and data access.
 *
 * - getAllUsers - Fetches all users from Firebase Authentication.
 * - getUserNutrientHistory - Fetches nutrient history for a specific user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { NutrientData, MacroNutrients } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import adminSdkConfig from '../../../firebase-adminsdk.json';


// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(adminSdkConfig as ServiceAccount),
  });
}

const db = getFirestore();

// Schema for a single user
const UserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  creationTime: z.string(),
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
    const authUserRecords = await getAuth().listUsers();
    
    const usersWithFirestoreData = await Promise.all(
        authUserRecords.users.map(async (userRecord) => {
            const userDocRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userDocRef.get();
            const firestoreData = userDoc.data();

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                // Prefer Firestore name, fall back to Auth displayName
                displayName: firestoreData?.name || userRecord.displayName,
                creationTime: userRecord.metadata.creationTime,
            };
        })
    );
    
    // Sort users by creation time, newest first
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
  date: z.any(), // Accept Firestore Timestamp initially
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
    const historyRef = db.collection('users').doc(userId).collection('nutrientHistory');
    const querySnapshot = await historyRef.get();

    const history: NutrientData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        // Convert Firestore Timestamp to JS Date object for the client
        date: (data.date as Timestamp).toDate(),
        macros: data.macros,
        micros: data.micros,
        calories: data.calories,
      });
    });

    // Sort by date descending
    const sortedHistory = history.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return { history: sortedHistory };
  }
);


export async function getUserNutrientHistory(userId: string): Promise<UserNutrientHistoryOutput> {
    return getUserNutrientHistoryFlow({ userId });
}
