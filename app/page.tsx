'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem,
  TextField,
  Alert,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | ''>('');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [mount, setMount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'single' | 'installments'>('single');
  const [installmentsCount, setInstallmentsCount] = useState<string>('3');
  const [amountType, setAmountType] = useState<'total' | 'installment'>('total');
  const [name, setName] = useState<string>('');
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
      let endpoint = '/api/payments';
      let body: any = {
        card_id: selectedCard,
        mount: parseInt(mount.replace(/,/g, '')),

        date: date.toISOString(),
        name,
      };

      // If installments, use different endpoint and add extra fields
      if (paymentType === 'installments') {
        endpoint = '/api/payments_cuotas';
        body = {
          ...body,
          installments_count: parseInt(installmentsCount),
          amount_type: amountType,
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        const message = paymentType === 'installments' 
          ? `${data.count} cuotas registradas exitosamente`
          : 'Pago registrado exitosamente';
        setAlert({ type: 'success', message });
        // Reset form
        setName('');
        setSelectedCard('');
        setMount('');
        setDate(dayjs());
        setPaymentType('single');
        setInstallmentsCount('3');
        setAmountType('total');
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
          <TextField
            fullWidth
            type="text"
            label="Descripción"
            placeholder="Descripción"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 32 }}
            sx={{ mb: 2 }}
          />

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

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Tipo de Pago</FormLabel>
            <RadioGroup
              row
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'single' | 'installments')}
            >
              <FormControlLabel value="single" control={<Radio />} label="1 pago" />
              <FormControlLabel value="installments" control={<Radio />} label="Cuotas" />
            </RadioGroup>
          </FormControl>

          {paymentType === 'installments' && (
            <>
              <TextField
                fullWidth
                type="number"
                label="Número de cuotas"
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ min: 1 }}
              />

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Tipo de Monto</FormLabel>
                <RadioGroup
                  row
                  value={amountType}
                  onChange={(e) => setAmountType(e.target.value as 'total' | 'installment')}
                >
                  <FormControlLabel value="total" control={<Radio />} label="Monto total" />
                  <FormControlLabel value="installment" control={<Radio />} label="Monto de cuota" />
                </RadioGroup>
              </FormControl>
            </>
          )}

          <TextField
            fullWidth
            type="text"
            label={paymentType === 'installments' && amountType === 'installment' ? 'Monto de cuota' : 'Monto'}
            value={mount}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setMount(raw ? parseInt(raw).toLocaleString('en-US') : '');
            }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            loading={loading}
            size="large"
          >
            Registrar Pago
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
            onClick={() => router.push('/ingresos')}
          >
            Agregar Ingreso
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
            onClick={() => router.push('/pago_tarjeta')}
          >
            Pago Tarjeta
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
