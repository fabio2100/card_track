'use client';

import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';

interface Ingreso {
  id: number;
  created_at: string;
  name: string;
  monto: number;
}

interface CardData {
  id: number;
  description: string;
  last_four: string;
  expiration_date: string | null;
  total_payments: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [cycleName, setCycleName] = useState<string | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [lastSueldo, setLastSueldo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Ingreso | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<Ingreso | null>(null);
  const [editName, setEditName] = useState('');
  const [editFecha, setEditFecha] = useState<Dayjs | null>(null);
  const [editMonto, setEditMonto] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        console.log('Dashboard data:', data);
        if (data.success) {
          setCycleName(data.cycle?.name ?? null);
          setCards(data.cards);
          setIngresos(data.ingresos);
          setTotalIngresos(data.totalIngresos);
          setLastSueldo(data.lastSueldo ? Number(data.lastSueldo.monto) : null);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const refreshIngresos = async () => {
    const response = await fetch('/api/dashboard');
    const data = await response.json();
    if (data.success) {
      setIngresos(data.ingresos);
      setTotalIngresos(data.totalIngresos);
    }
  };

  const openEdit = (ing: Ingreso) => {
    setEditTarget(ing);
    setEditName(ing.name);
    setEditFecha(dayjs(ing.created_at));
    setEditMonto(Number(ing.monto).toLocaleString('en-US'));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/ingresos/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    setDeleteLoading(false);
    await refreshIngresos();
  };

  const handleEdit = async () => {
    if (!editTarget || !editFecha) return;
    setEditLoading(true);
    await fetch(`/api/ingresos/${editTarget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        created_at: editFecha.toISOString(),
        monto: parseInt(editMonto.replace(/,/g, '')),
      }),
    });
    setEditTarget(null);
    setEditLoading(false);
    await refreshIngresos();
  };

  const formatExpiration = (value: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dayName = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const dayNum = d.getDate();
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;
  };

  return (
    <>
      <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          {loading ? (
            <Skeleton width={220} height={48} />
          ) : (
            <Typography variant="h4" component="h1">
              {cycleName ?? 'Dashboard'}
            </Typography>
          )}
        </Box>

        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Skeleton variant="rounded" height={140} />
                </Grid>
              ))
            : cards.map((card) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CreditCardIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="h6" component="div" noWrap>
                          {card.description}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        •••• {card.last_four}
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                        ${Number(card.total_payments).toLocaleString('en-US')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vence: {formatExpiration(card.expiration_date)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {!loading && cards.length > 0 && (() => {
          const totalTarjetas = cards.reduce((sum, c) => sum + Number(c.total_payments), 0);
          const salaryBase = totalIngresos > 0 ? totalIngresos : lastSueldo;
          const pct = salaryBase && salaryBase > 0
            ? Math.round((totalTarjetas * 100) / salaryBase)
            : null;
          return (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" component="p">
                Total tarjetas:{' '}
                <strong>${totalTarjetas.toLocaleString('en-US')}</strong>
              </Typography>
              {pct !== null && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h6" component="p">
                    <strong>{pct}%</strong>{' '}tarjetas sobre sueldo
                  </Typography>
                  {totalIngresos === 0 && lastSueldo !== null && (
                    <Typography variant="caption" color="text.secondary">
                      Usando salario previo
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })()}

        {/* Ingresos section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
            Ingresos
          </Typography>
          {loading ? (
            <Skeleton width={180} height={72} />
          ) : (
            <Typography variant="h3" component="p" sx={{ mb: 2, fontWeight: 700 }}>
              ${totalIngresos.toLocaleString('en-US')}
            </Typography>
          )}

          <Accordion variant="outlined" disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                Ver detalle ({ingresos.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ingresos.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell>
                        {new Date(ing.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{ing.name}</TableCell>
                      <TableCell align="right">
                        ${Number(ing.monto).toLocaleString('en-US')}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', p: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(ing)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(ing)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </Container>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Eliminar ingreso</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Eliminar <strong>{deleteTarget?.name}</strong> por{' '}
            <strong>${Number(deleteTarget?.monto ?? 0).toLocaleString('en-US')}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" loading={deleteLoading} onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar ingreso</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Nombre"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha"
              value={editFecha}
              onChange={(v) => setEditFecha(v)}
              format="DD/MM/YY"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
          <TextField
            label="Monto"
            fullWidth
            value={editMonto}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setEditMonto(raw ? parseInt(raw).toLocaleString('en-US') : '');
            }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={editLoading}>
            Cancelar
          </Button>
          <Button variant="contained" loading={editLoading} onClick={handleEdit}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
