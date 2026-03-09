import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        cc.id,
        cc.card_id,
        cc.start_date,
        cc.end_date,
        cc.expiration_date,
        c.description AS card_name,
        c.last_four
      FROM card_cycles cc
      JOIN cards c ON c.id = cc.card_id
      WHERE cc.expiration_date >= NOW() - interval '2 days'
      ORDER BY cc.expiration_date
      LIMIT 12
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card cycles' },
      { status: 500 }
    );
  }
}
