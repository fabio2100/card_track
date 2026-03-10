'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

function ValidarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const from = searchParams.get('from') ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    setLoading(false);

    if (res.ok) {
      router.replace(from);
    } else {
      router.replace('/no_validado');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}
    >
      <Typography variant="h5" component="h1">
        Ingrese el código
      </Typography>
      <TextField
        fullWidth
        type="password"
        label="Código"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
        autoFocus     
      />
      <Button type="submit" variant="contained" fullWidth loading={loading}>
        Ingresar
      </Button>
    </Box>
  );
}

export default function ValidarPage() {
  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Suspense>
          <ValidarForm />
        </Suspense>
      </Box>
    </Container>
  );
}
