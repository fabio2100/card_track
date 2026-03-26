import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, created_at, monto, ingreso_propio } = body;

    if (!name || !created_at || !monto) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO ingresos (name, created_at, monto, ingreso_propio) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, created_at, monto, ingreso_propio ?? true]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ingreso' },
      { status: 500 }
    );
  }
}
