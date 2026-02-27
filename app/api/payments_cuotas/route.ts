import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { card_id, date, installments_count, amount_type, mount, name } = body;

    // Validate required fields
    if (!card_id || !date || !installments_count || !mount || !amount_type) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get the day of month (max 28 to avoid issues with February and 30-day months)
    const startDate = new Date(date);
    let dayOfMonth = startDate.getDate();
    if (dayOfMonth > 28) {
      dayOfMonth = 28;
    }

    // Calculate mount per installment
    let mountPerInstallment: number;
    if (amount_type === 'total') {
      // Total amount divided by number of installments
      mountPerInstallment = Math.round(mount / installments_count);
    } else {
      // amount_type === 'installment'
      // Use the mount as the amount per installment
      mountPerInstallment = mount;
    }

    // Generate all installment payments
    const payments = [];
    for (let i = 0; i < installments_count; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);
      installmentDate.setDate(dayOfMonth);

      payments.push({
        mount: mountPerInstallment,
        card_id,
        created_at: installmentDate.toISOString(),
        installment: `${i + 1}/${installments_count}`,
        name: name || null
      });
    }

    // Insert all payments in a single transaction
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const insertedPayments = [];
      for (const payment of payments) {
        const result = await client.query(
          'INSERT INTO payments (mount, card_id, created_at, installment, name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [payment.mount, payment.card_id, payment.created_at, payment.installment, payment.name]
        );
        insertedPayments.push(result.rows[0]);
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        data: insertedPayments,
        count: insertedPayments.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create installment payments' },
      { status: 500 }
    );
  }
}
