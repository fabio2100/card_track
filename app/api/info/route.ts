import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mostrarPagados = searchParams.get('mostrarPagados') === 'true';
    const mostrarConsumosPropios = searchParams.get('mostrarConsumosPropios') !== 'false';
    const [deudaResult, sueldoResult, ultimoAnoResult, ultimosTresMesesResult] = await Promise.all([
      query(`
        SELECT COALESCE(SUM(p.mount), 0) AS deuda_total
        FROM payments p
        JOIN card_cycles cc
          ON cc.card_id = p.card_id
          AND DATE_TRUNC('month', cc.expiration_date) >= DATE_TRUNC('month', CURRENT_DATE)
          AND p.created_at >= cc.start_date
          AND p.created_at < cc.end_date
        WHERE 1=1
        ${!mostrarPagados ? 'AND p.pagado = false' : ''}
        ${!mostrarConsumosPropios ? 'AND p.consumo_propio = true' : ''}
      `),
      query(`
        SELECT monto
        FROM ingresos
        WHERE LOWER(name) = 'sueldo'
        ORDER BY created_at DESC
        LIMIT 1
      `),
      query(`
        SELECT COALESCE(SUM(mount), 0) AS total_gastado_ultimo_ano
        FROM payments
        WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
          AND created_at < CURRENT_DATE + INTERVAL '1 day'
      `),
      query(`
        SELECT COALESCE(SUM(mount), 0) AS total_gastado_ultimos_tres_meses
        FROM payments
        WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
          AND created_at < CURRENT_DATE + INTERVAL '1 day'
      `),
    ]);

    const deudaTotal = Number(deudaResult.rows[0]?.deuda_total ?? 0);
    const lastSueldo = sueldoResult.rows[0] ? Number(sueldoResult.rows[0].monto) : null;
    const totalGastadoUltimoAno = Number(ultimoAnoResult.rows[0]?.total_gastado_ultimo_ano ?? 0);
    const totalGastadoUltimosTresMeses = Number(ultimosTresMesesResult.rows[0]?.total_gastado_ultimos_tres_meses ?? 0);
    const deudaEnSueldos =
      lastSueldo && lastSueldo > 0
        ? Math.round((deudaTotal / lastSueldo) * 100) / 100
        : null;

    return NextResponse.json({
      success: true,
      deudaTotal,
      lastSueldo,
      deudaEnSueldos,
      totalGastadoUltimoAno,
      totalGastadoUltimosTresMeses,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch info' },
      { status: 500 }
    );
  }
}
