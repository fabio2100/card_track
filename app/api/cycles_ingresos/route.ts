import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT
        c.name,
        c.start_date,
        c.end_date,
        COALESCE(SUM(i.monto), 0) AS total_ingresos
      FROM cycles c
      LEFT JOIN ingresos i
        ON i.created_at >= c.start_date
       AND i.created_at <  c.end_date
      WHERE c.end_date > NOW()
      GROUP BY c.name, c.start_date, c.end_date
      ORDER BY c.end_date
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
      { success: false, error: 'Failed to fetch ingresos per month' },
      { status: 500 }
    );
  }
}
