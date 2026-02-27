'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  IconButton,
  TextField,
  Alert,
  Typography,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

export default function Ingresos() {
  const router = useRouter();
  const [nombre, setNombre] = useState<string>('');
  const [fecha, setFecha] = useState<Dayjs | null>(dayjs());
  const [monto, setMonto] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !fecha || !monto) {
      setAlert({ type: 'error', message: 'Por favor complete todos los campos' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nombre,
          created_at: fecha.toISOString(),
          monto: parseInt(monto),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: 'Ingreso registrado exitosamente' });
        setNombre('');
        setFecha(dayjs());
        setMonto('');
      } else {
        setAlert({ type: 'error', message: data.error || 'Error al registrar el ingreso' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Ingresos
          </Typography>
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            type="text"
            label="Nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            sx={{ mb: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={(newValue) => setFecha(newValue)}
              format="DD/MM/YY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 2 },
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            fullWidth
            type="number"
            label="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            sx={{ mb: 3 }}
            inputProps={{ min: 0 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            loading={loading}
            size="large"
          >
            Registrar Ingreso
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
