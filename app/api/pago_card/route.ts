import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { card_cycle_id } = body;

    if (!card_cycle_id) {
      return NextResponse.json(
        { success: false, error: 'card_cycle_id is required' },
        { status: 400 }
      );
    }

    // Fetch the card_cycle to get card_id, start_date, end_date
    const cycleResult = await query(
      'SELECT card_id, start_date, end_date FROM card_cycles WHERE id = $1',
      [card_cycle_id]
    );

    if (cycleResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'card_cycle not found' },
        { status: 404 }
      );
    }

    const { card_id, start_date, end_date } = cycleResult.rows[0];

    // Mark all matching payments as pagado = true
    const updateResult = await query(
      `UPDATE payments
       SET pagado = true
       WHERE card_id = $1
         AND created_at >= $2
         AND created_at < $3`,
      [card_id, start_date, end_date]
    );

    return NextResponse.json({
      success: true,
      updated: updateResult.rowCount,
      card_id,
      card_cycle_id,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payments' },
      { status: 500 }
    );
  }
}
