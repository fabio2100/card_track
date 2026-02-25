import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        cc.start_date,cc.end_date, cc.expiration_date,cc.cycle_name,
        json_build_object(
          'description', c.description,
          'last_four', c.last_four
        ) as card
      FROM card_cycles_with_cycle cc
      LEFT JOIN cards c ON cc.card_id = c.id
      ORDER BY cc.expiration_date
      LIMIT 36
    `);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch card cycles' },
      { status: 500 }
    );
  }
}
