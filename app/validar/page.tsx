'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

export default function ValidarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const from = searchParams.get('from') ?? '/';

  // If already logged (cookie present) the middleware never sends them here,
  // but just in case of a stale client-side navigation skip the form.
  useEffect(() => {
    // nothing to do on client side – middleware handles it
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

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
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          Ingrese el código
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            Código incorrecto
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            inputProps={{ inputMode: 'numeric' }}
          />
          <Button type="submit" variant="contained" fullWidth loading={loading}>
            Ingresar
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
