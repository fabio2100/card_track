import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, created_at, monto, ingreso_propio } = body;

    if (!name || !created_at || !monto) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE ingresos SET name = $1, created_at = $2, monto = $3, ingreso_propio = COALESCE($5, ingreso_propio) WHERE id = $4 RETURNING *',
      [name, created_at, monto, id, ingreso_propio ?? null]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Ingreso not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update ingreso' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await query('DELETE FROM ingresos WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Ingreso not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete ingreso' }, { status: 500 });
  }
}
