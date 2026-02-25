# PostgreSQL Database Setup

## Configuration

The database connection is configured to use a connection pool (default configuration) and can be connected using just the `DATABASE_URL`.

### Environment Variables

Update the `.env.local` file with your PostgreSQL connection URL:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
```

**Local example:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/card_track
```

**Production example (using a hosted service):**
```env
DATABASE_URL=postgresql://user:pass@your-db-host.com:5432/dbname
```

## Usage

### Simple Query

```typescript
import { query } from '@/lib/db';

const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];
```

### Transactions

```typescript
import { getClient } from '@/lib/db';

const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO...');
  await client.query('UPDATE...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### In API Routes

```typescript
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const result = await query('SELECT * FROM items');
  return NextResponse.json({ data: result.rows });
}
```

### In Server Components

```typescript
import { query } from '@/lib/db';

export default async function Page() {
  const result = await query('SELECT * FROM items');
  return <div>{/* render data */}</div>;
}
```

## Setup PostgreSQL Locally

1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE card_track;
   ```
3. Update `.env.local` with your credentials
4. Create your tables as needed

## Connection Pool Settings

The pool is configured with:
- **max**: 20 connections
- **idleTimeoutMillis**: 30000ms (30 seconds)
- **connectionTimeoutMillis**: 2000ms (2 seconds)

You can adjust these settings in `lib/db.ts` if needed.
