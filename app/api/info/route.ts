import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [deudaResult, sueldoResult] = await Promise.all([
      query(`
        SELECT COALESCE(SUM(mount), 0) AS deuda_total
        FROM payments
        WHERE pagado = false
      `),
      query(`
        SELECT monto
        FROM ingresos
        WHERE LOWER(name) = 'sueldo'
        ORDER BY created_at DESC
        LIMIT 1
      `),
    ]);

    const deudaTotal = Number(deudaResult.rows[0]?.deuda_total ?? 0);
    const lastSueldo = sueldoResult.rows[0] ? Number(sueldoResult.rows[0].monto) : null;
    const deudaEnSueldos =
      lastSueldo && lastSueldo > 0
        ? Math.round((deudaTotal / lastSueldo) * 100) / 100
        : null;

    return NextResponse.json({
      success: true,
      deudaTotal,
      lastSueldo,
      deudaEnSueldos,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch info' },
      { status: 500 }
    );
  }
}
