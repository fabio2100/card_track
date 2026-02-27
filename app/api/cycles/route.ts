import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT name
      FROM cycles
      WHERE end_date > NOW()
      ORDER BY end_date
      LIMIT 24
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cycles' },
      { status: 500 }
    );
  }
}
