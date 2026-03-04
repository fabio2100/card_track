'use client';

import { useCallback, useEffect, useState } from 'react';
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
  Divider,
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

interface Payment {
  id: number;
  card_id: number;
  created_at: string;
  name: string | null;
  installment: string | null;
  mount: number;
}

interface CardData {
  id: number;
  description: string;
  last_four: string;
  expiration_date: string | null;
  end_date: string | null;
  total_payments: number;
  payments: Payment[];
}

interface MonthData {
  month: string; // 'YYYY-MM'
  label: string;
  cycleName: string | null;
  cards: CardData[];
  ingresos: Ingreso[];
  totalIngresos: number;
  lastSueldo: number | null;
}

function buildMonthLabel(month: string): string {
  const d = new Date(`${month}-15T12:00:00`);
  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Dashboard() {
  const router = useRouter();
  const months = [0, 1, 2].map((offset) =>
    dayjs().add(offset, 'month').format('YYYY-MM')
  );

  const [monthsData, setMonthsData] = useState<(MonthData | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  // Global info
  const [deudaTotal, setDeudaTotal] = useState<number | null>(null);
  const [deudaEnSueldos, setDeudaEnSueldos] = useState<number | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  // Delete dialog (ingreso)
  const [deleteTarget, setDeleteTarget] = useState<Ingreso | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal (ingreso)
  const [editTarget, setEditTarget] = useState<Ingreso | null>(null);
  const [editName, setEditName] = useState('');
  const [editFecha, setEditFecha] = useState<Dayjs | null>(null);
  const [editMonto, setEditMonto] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog (payment)
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null);
  const [deletePaymentLoading, setDeletePaymentLoading] = useState(false);

  // Edit modal (payment)
  const [editPaymentTarget, setEditPaymentTarget] = useState<Payment | null>(null);
  const [editPaymentName, setEditPaymentName] = useState('');
  const [editPaymentFecha, setEditPaymentFecha] = useState<Dayjs | null>(null);
  const [editPaymentMonto, setEditPaymentMonto] = useState('');
  const [editPaymentLoading, setEditPaymentLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [infoRes, ...monthResults] = await Promise.all([
        fetch('/api/info').then((r) => r.json()),
        ...months.map((m) => fetch(`/api/dashboard?month=${m}`).then((r) => r.json())),
      ]);

      if (infoRes.success) {
        setDeudaTotal(infoRes.deudaTotal);
        setDeudaEnSueldos(infoRes.deudaEnSueldos);
      }
      setInfoLoading(false);

      setMonthsData(
        monthResults.map((data, i) =>
          data.success
            ? {
                month: months[i],
                label: buildMonthLabel(months[i]),
                cycleName: data.cycle?.name ?? null,
                cards: data.cards,
                ingresos: data.ingresos,
                totalIngresos: data.totalIngresos,
                lastSueldo: data.lastSueldo ? Number(data.lastSueldo.monto) : null,
              }
            : null
        )
      );
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEditPayment = (pmt: Payment) => {
    setEditPaymentTarget(pmt);
    setEditPaymentName(pmt.name ?? '');
    setEditPaymentFecha(dayjs(pmt.created_at));
    setEditPaymentMonto(Number(pmt.mount).toLocaleString('en-US'));
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentTarget) return;
    setDeletePaymentLoading(true);
    await fetch(`/api/payments/${deletePaymentTarget.id}`, { method: 'DELETE' });
    setDeletePaymentTarget(null);
    setDeletePaymentLoading(false);
    await fetchAll();
  };

  const handleEditPayment = async () => {
    if (!editPaymentTarget || !editPaymentFecha) return;
    setEditPaymentLoading(true);
    await fetch(`/api/payments/${editPaymentTarget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editPaymentName || null,
        created_at: editPaymentFecha.toISOString(),
        mount: parseInt(editPaymentMonto.replace(/,/g, '')),
      }),
    });
    setEditPaymentTarget(null);
    setEditPaymentLoading(false);
    await fetchAll();
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
    await fetchAll();
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
    await fetchAll();
  };

  const formatExpiration = (value: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dayName = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const dayNum = d.getDate();
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;
  };

  const formatClosing = (value: string | null, monthKey: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dayName = d.toLocaleDateString('es-AR', { weekday: 'long' });
    const dayNum = d.getDate();
    const valueMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const base = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum}`;
    if (valueMonth === monthKey) return base;
    const monthName = d.toLocaleDateString('es-AR', { month: 'long' });
    return `${base} de ${monthName}`;
  };

  const renderMonth = (data: MonthData | null, monthKey: string) => {
    const isLoading = loading || data === null;
    const cards = data?.cards ?? [];
    const ingresos = data?.ingresos ?? [];
    const totalIngresos = data?.totalIngresos ?? 0;
    const lastSueldo = data?.lastSueldo ?? null;
    const totalTarjetas = cards.reduce((sum, c) => sum + Number(c.total_payments), 0);
    const salaryBase = totalIngresos > 0 ? totalIngresos : lastSueldo;
    const pct =
      salaryBase && salaryBase > 0
        ? Math.round((totalTarjetas * 100) / salaryBase)
        : null;

    return (
      <Box
        key={monthKey}
        sx={{
          mt: 4,
          p: 3,
          border: '1px solid',
          borderColor: 'grey.400',
          borderRadius: 2,
        }}
      >
        {/* Month header */}
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          {isLoading ? <Skeleton width={200} /> : (data?.cycleName ?? data?.label ?? buildMonthLabel(monthKey))}
        </Typography>

        {/* Cards grid */}
        <Grid container spacing={2}>
          {isLoading
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
                        Cierra: {formatClosing(card.end_date, monthKey)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vence: {formatExpiration(card.expiration_date)}
                      </Typography>
                      {card.payments.length > 0 && (
                        <Accordion
                          disableGutters
                          elevation={0}
                          sx={{ mt: 1, '&:before': { display: 'none' }, border: 'none' }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 32 }}>
                            <Typography variant="caption" color="text.secondary">
                              Ver detalle ({card.payments.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ py: 0.5 }}>Fecha</TableCell>
                                  <TableCell sx={{ py: 0.5 }}>Nombre</TableCell>
                                  <TableCell align="right" sx={{ py: 0.5 }}>Monto</TableCell>
                                  <TableCell />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {card.payments.map((pmt, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ py: 0.5 }}>
                                      {new Date(pmt.created_at).toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                      })}
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                      {[pmt.name, pmt.installment].filter(Boolean).join(' ')  || '—'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 0.5 }}>
                                      ${Number(pmt.mount).toLocaleString('en-US')}
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', p: 0.25 }}>
                                      <IconButton size="small" onClick={() => openEditPayment(pmt)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => setDeletePaymentTarget(pmt)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {/* Totals summary */}
        {!isLoading && cards.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" component="p">
              Total tarjetas: <strong>${totalTarjetas.toLocaleString('en-US')}</strong>
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
        )}

        {/* Ingresos section */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
            Ingresos
          </Typography>
          {isLoading ? (
            <Skeleton width={180} height={56} />
          ) : (
            <Typography variant="h4" component="p" sx={{ mb: 2, fontWeight: 700 }}>
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
              <Box sx={{ overflowX: 'auto' }}>
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
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(ing)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          {/* Page header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => router.push('/')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
          </Box>

          {/* Info section */}
          <Box
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'grey.400',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Info
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            {infoLoading ? (
              <>
                <Skeleton width={240} height={28} />
                <Skeleton width={300} height={28} sx={{ mt: 0.5 }} />
              </>
            ) : (
              <>
                <Typography variant="body1">
                  Deuda total:{' '}
                  <strong>
                    ${(deudaTotal ?? 0).toLocaleString('en-US')}
                  </strong>
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  Deuda como cantidad de sueldos:{' '}
                  <strong>
                    {deudaEnSueldos !== null ? deudaEnSueldos.toLocaleString('en-US') : '—'}
                  </strong>
                </Typography>
              </>
            )}
          </Box>

          {months.map((month, i) => renderMonth(monthsData[i] ?? null, month))}
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

      {/* Delete payment confirmation dialog */}
      <Dialog open={!!deletePaymentTarget} onClose={() => setDeletePaymentTarget(null)}>
        <DialogTitle>Eliminar pago</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Eliminar <strong>{deletePaymentTarget?.name || 'este pago'}</strong> por{' '}
            <strong>${Number(deletePaymentTarget?.mount ?? 0).toLocaleString('en-US')}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePaymentTarget(null)} disabled={deletePaymentLoading}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" loading={deletePaymentLoading} onClick={handleDeletePayment}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit payment modal */}
      <Dialog open={!!editPaymentTarget} onClose={() => setEditPaymentTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar pago</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Nombre"
            fullWidth
            value={editPaymentName}
            onChange={(e) => setEditPaymentName(e.target.value)}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha"
              value={editPaymentFecha}
              onChange={(v) => setEditPaymentFecha(v)}
              format="DD/MM/YY"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
          <TextField
            label="Monto"
            fullWidth
            value={editPaymentMonto}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setEditPaymentMonto(raw ? parseInt(raw).toLocaleString('en-US') : '');
            }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPaymentTarget(null)} disabled={editPaymentLoading}>
            Cancelar
          </Button>
          <Button variant="contained" loading={editPaymentLoading} onClick={handleEditPayment}>
            Guardar
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
