import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mount, card_id, date } = body;

    // Validate required fields
    if (!mount || !card_id) {
      return NextResponse.json(
        { success: false, error: 'Mount and card_id are required' },
        { status: 400 }
      );
    }

    // Use provided date or current date
    const created_at = date || new Date().toISOString();

    const result = await query(
      'INSERT INTO payments (mount, card_id, created_at) VALUES ($1, $2, $3) RETURNING *',
      [mount, card_id, created_at]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
