import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [cycleResult, cardsResult, ingresosResult, lastSueldoResult] = await Promise.all([
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
          cc.expiration_date,
          COALESCE(SUM(p.mount), 0) AS total_payments
        FROM cards c
        LEFT JOIN card_cycles cc
          ON cc.card_id = c.id
          AND DATE_TRUNC('month', cc.expiration_date) = DATE_TRUNC('month', NOW())
        LEFT JOIN payments p
          ON p.card_id = c.id
          AND cc.start_date IS NOT NULL
          AND p.created_at >= cc.start_date
          AND p.created_at < cc.end_date
        GROUP BY c.id, c.description, c.last_four, cc.expiration_date
        ORDER BY c.description
      `),
      query(`
        SELECT id, created_at, name, monto
        FROM ingresos
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        ORDER BY created_at DESC
      `),
      query(`
        SELECT monto
        FROM ingresos
        WHERE LOWER(name) = 'sueldo'
        ORDER BY created_at DESC
        LIMIT 1
      `),
    ]);

    const totalIngresos = ingresosResult.rows.reduce(
      (sum: number, r: { monto: number }) => sum + Number(r.monto),
      0
    );

    const lastSueldo = lastSueldoResult.rows[0] ?? null;

    return NextResponse.json({
      success: true,
      cycle: cycleResult.rows[0] ?? null,
      cards: cardsResult.rows,
      ingresos: ingresosResult.rows,
      totalIngresos,
      lastSueldo,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
