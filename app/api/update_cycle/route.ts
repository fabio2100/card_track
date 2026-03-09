import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { id, card_id, start_date, end_date, expiration_date } = await request.json();

    // Fetch current cycle values
    const currentRes = await query(
      'SELECT card_id, start_date, end_date FROM card_cycles WHERE id = $1',
      [id]
    );
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Cycle not found' }, { status: 404 });
    }
    const current = currentRes.rows[0];
    const resolvedCardId = card_id ?? current.card_id;

    const oldStartStr = new Date(current.start_date).toISOString().slice(0, 10);
    const oldEndStr = new Date(current.end_date).toISOString().slice(0, 10);
    const newStartStr = new Date(start_date).toISOString().slice(0, 10);
    const newEndStr = new Date(end_date).toISOString().slice(0, 10);

    // Update the target cycle
    await query(
      `UPDATE card_cycles
       SET start_date = $1::date, end_date = $2::date, expiration_date = $3::date
       WHERE id = $4`,
      [start_date, end_date, expiration_date, id]
    );

    // If start_date changed → update previous cycle's end_date so there is no gap
    if (newStartStr !== oldStartStr) {
      await query(
        `UPDATE card_cycles
         SET end_date = $1::date
         WHERE card_id = $2 AND end_date::date = $3::date AND id != $4`,
        [start_date, resolvedCardId, current.start_date, id]
      );
    }

    // If end_date changed → update next cycle's start_date so there is no gap
    if (newEndStr !== oldEndStr) {
      await query(
        `UPDATE card_cycles
         SET start_date = $1::date
         WHERE card_id = $2 AND start_date::date = $3::date AND id != $4`,
        [end_date, resolvedCardId, current.end_date, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update cycle' }, { status: 500 });
  }
}
