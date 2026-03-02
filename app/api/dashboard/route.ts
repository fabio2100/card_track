import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [cycleResult, cardsResult, ingresosResult] = await Promise.all([
      query(`
        SELECT name
        FROM cycles
        WHERE start_date <= NOW() AND end_date > NOW()
        ORDER BY start_date DESC
        LIMIT 1
      `),
      query(`
        SELECT
          c.id,
          c.description,
          c.last_four,
          cc.expiration_date
        FROM cards c
        LEFT JOIN card_cycles cc
          ON cc.card_id = c.id
          AND DATE_TRUNC('month', cc.expiration_date) = DATE_TRUNC('month', NOW())
        ORDER BY c.description
      `),
      query(`
        SELECT id, created_at, name, monto
        FROM ingresos
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        ORDER BY created_at DESC
      `),
    ]);

    const totalIngresos = ingresosResult.rows.reduce(
      (sum: number, r: { monto: number }) => sum + Number(r.monto),
      0
    );

    return NextResponse.json({
      success: true,
      cycle: cycleResult.rows[0] ?? null,
      cards: cardsResult.rows,
      ingresos: ingresosResult.rows,
      totalIngresos,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
