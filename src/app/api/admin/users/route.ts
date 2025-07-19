
import { getAllUsers } from '@/ai/flows/admin-flows';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getAllUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch users', error: errorMessage }, { status: 500 });
  }
}
