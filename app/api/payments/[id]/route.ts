import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, created_at, mount, card_id } = body;

    if (!mount || !created_at) {
      return NextResponse.json(
        { success: false, error: 'Mount and created_at are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE payments SET name = $1, created_at = $2, mount = $3, card_id = COALESCE($5, card_id) WHERE id = $4 RETURNING *',
      [name ?? null, created_at, mount, id, card_id ?? null]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const result = await query('DELETE FROM payments WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete payment' }, { status: 500 });
  }
}
