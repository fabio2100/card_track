import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // 'YYYY-MM'
    // Use the 15th of the target month as reference to find the active cycle
    const monthDate = monthParam ? `${monthParam}-15` : new Date().toISOString().slice(0, 10);
    const mostrarPagados = searchParams.get('mostrarPagados') === 'true';
    const mostrarConsumosPropios = searchParams.get('mostrarConsumosPropios') !== 'false';

    const [cycleResult, cardsResult, ingresosResult, lastSueldoResult, paymentsResult] = await Promise.all([
      query(`
        SELECT name
        FROM cycles
        WHERE start_date <= $1::date AND end_date > $1::date
        ORDER BY start_date DESC
        LIMIT 1
      `, [monthDate]),
      query(`
        SELECT
          c.id,
          c.description,
          c.last_four,
          cc.id AS cycle_id,
          cc.start_date,
          cc.expiration_date,
          cc.end_date,
          COALESCE(SUM(p.mount), 0) AS total_payments
        FROM cards c
        LEFT JOIN card_cycles cc
          ON cc.card_id = c.id
          AND DATE_TRUNC('month', cc.expiration_date) = DATE_TRUNC('month', $1::date)
        LEFT JOIN payments p
          ON p.card_id = c.id
          AND cc.start_date IS NOT NULL
          AND p.created_at >= cc.start_date
          AND p.created_at < cc.end_date
          ${!mostrarPagados ? 'AND p.pagado = false' : ''}
          ${!mostrarConsumosPropios ? 'AND p.consumo_propio = true' : ''}
        GROUP BY c.id, c.description, c.last_four, cc.id, cc.start_date, cc.expiration_date, cc.end_date
        ORDER BY c.description
      `, [monthDate]),
      query(`
        SELECT id, created_at, name, monto, ingreso_propio
        FROM ingresos
        WHERE ($1::date IS NULL OR DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $1::date))
        ORDER BY created_at DESC
      `, [mostrarPagados ? null : monthDate]),
      query(`
        SELECT monto
        FROM ingresos
        WHERE LOWER(name) = 'sueldo'
        ORDER BY created_at DESC
        LIMIT 1
      `),
      query(`
        SELECT
          p.id,
          p.card_id,
          p.created_at,
          p.name,
          p.installment,
          p.mount,
          p.consumo_propio
        FROM payments p
        JOIN card_cycles cc
          ON cc.card_id = p.card_id
          AND ($1::date IS NULL OR DATE_TRUNC('month', cc.expiration_date) = DATE_TRUNC('month', $1::date))
          AND p.created_at >= cc.start_date
          AND p.created_at < cc.end_date
          ${!mostrarPagados ? 'AND p.pagado = false' : ''}
          ${!mostrarConsumosPropios ? 'AND p.consumo_propio = true' : ''}
        ORDER BY p.card_id, p.created_at DESC
      `, [mostrarPagados ? null : monthDate]),
    ]);

    const totalIngresos = ingresosResult.rows.reduce(
      (sum: number, r: { monto: number }) => sum + Number(r.monto),
      0
    );

    const lastSueldo = lastSueldoResult.rows[0] ?? null;

    // Group payments by card_id
    const paymentsByCard: Record<number, object[]> = {};
    for (const row of paymentsResult.rows) {
      if (!paymentsByCard[row.card_id]) paymentsByCard[row.card_id] = [];
      paymentsByCard[row.card_id].push(row);
    }

    // Attach payments array to each card
    const cardsWithPayments = cardsResult.rows.map((card: { id: number }) => ({
      ...card,
      payments: paymentsByCard[card.id] ?? [],
    }));

    return NextResponse.json({
      success: true,
      cycle: cycleResult.rows[0] ?? null,
      cards: cardsWithPayments,
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
