'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import { useRouter } from 'next/navigation';

interface CardCycle {
  id: number;
  card_id: number;
  card_name: string;
  last_four: string;
  start_date: string;
  end_date: string;
  expiration_date: string;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function PagoTarjeta() {
  const router = useRouter();
  const [cycles, setCycles] = useState<CardCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmTarget, setConfirmTarget] = useState<CardCycle | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch('/api/card_cycles');
      const data = await res.json();
      if (data.success) setCycles(data.data);
    } catch (error) {
      console.error('Error fetching card cycles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const handleConfirmPago = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      const res = await fetch('/api/pago_card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_cycle_id: confirmTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          `${confirmTarget.card_name} marcado como pagado (${data.updated} pago${data.updated !== 1 ? 's' : ''} actualizado${data.updated !== 1 ? 's' : ''})`
        );
      }
    } catch (error) {
      console.error('Error paying card:', error);
    } finally {
      setConfirmTarget(null);
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => router.push('/')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Pago Tarjeta
            </Typography>
          </Box>

          {successMessage && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: 'success.light',
                color: 'success.contrastText',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">{successMessage}</Typography>
            </Box>
          )}

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarjeta</TableCell>
                <TableCell>Desde</TableCell>
                <TableCell>Hasta</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell align="center">Pagar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : cycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {cycle.card_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •••• {cycle.last_four}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(cycle.start_date)}</TableCell>
                      <TableCell>{formatDate(cycle.end_date)}</TableCell>
                      <TableCell>{formatDate(cycle.expiration_date)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => {
                            setSuccessMessage(null);
                            setConfirmTarget(cycle);
                          }}
                        >
                          Pagar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Box>
      </Container>

      {/* Confirm dialog */}
      <Dialog open={!!confirmTarget} onClose={() => setConfirmTarget(null)}>
        <DialogTitle>Confirmar pago</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Marcar como pagados todos los gastos de{' '}
            <strong>{confirmTarget?.card_name} (•••• {confirmTarget?.last_four})</strong> del ciclo{' '}
            {confirmTarget && (
              <>
                <strong>{formatDate(confirmTarget.start_date)}</strong>
                {' al '}
                <strong>{formatDate(confirmTarget.end_date)}</strong>
              </>
            )}
            ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button variant="contained" loading={confirmLoading} onClick={handleConfirmPago}>
            Confirmar pago
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
