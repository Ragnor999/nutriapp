
import { getUserNutrientHistory } from '@/ai/flows/admin-flows';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const data = await getUserNutrientHistory(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in /api/admin/history for userId ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch user history', error: errorMessage }, { status: 500 });
  }
}
