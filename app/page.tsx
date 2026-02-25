'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

interface Card {
  id: number;
  description: string;
  last_four: string;
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | ''>('');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [mount, setMount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch cards on component mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/cards');
        const data = await response.json();
        if (data.success) {
          setCards(data.data);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };
    fetchCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCard || !mount || !date) {
      setAlert({ type: 'error', message: 'Por favor complete todos los campos' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: selectedCard,
          mount: parseInt(mount),
          date: date.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: 'Pago registrado exitosamente' });
        // Reset form
        setSelectedCard('');
        setMount('');
        setDate(dayjs());
      } else {
        setAlert({ type: 'error', message: data.error || 'Error al registrar el pago' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrar Pago
        </Typography>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="card-label">Tarjeta</InputLabel>
            <Select
              labelId="card-label"
              id="card-select"
              value={selectedCard}
              label="Tarjeta"
              onChange={(e) => setSelectedCard(e.target.value as number)}
            >
              {cards.map((card) => (
                <MenuItem key={card.id} value={card.id}>
                  {card.description} - {card.last_four}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              format="DD/MM/YY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 2 }
                }
              }}
            />
          </LocalizationProvider>

          <TextField
            fullWidth
            type="number"
            label="Monto"
            value={mount}
            onChange={(e) => setMount(e.target.value)}
            sx={{ mb: 3 }}
            inputProps={{ min: 0 }}
          />

          <LoadingButton
            type="submit"
            variant="contained"
            fullWidth
            loading={loading}
            size="large"
          >
            Registrar Pago
          </LoadingButton>
        </Box>
      </Box>
    </Container>
  );
}
