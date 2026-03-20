'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import type { ApexOptions } from 'apexcharts';
import dayjs, { Dayjs } from 'dayjs';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

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
  cycle_id: number | null;
  start_date: string | null;
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
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((offset) =>
    dayjs().add(offset, 'month').format('YYYY-MM')
  );

  const [monthsData, setMonthsData] = useState<(MonthData | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);
  const [mostrarPagados, setMostrarPagados] = useState(false);

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

  // Edit modal (card cycle)
  const [editCycleTarget, setEditCycleTarget] = useState<CardData | null>(null);
  const [editCycleStartDate, setEditCycleStartDate] = useState<Dayjs | null>(null);
  const [editCycleEndDate, setEditCycleEndDate] = useState<Dayjs | null>(null);
  const [editCycleExpDate, setEditCycleExpDate] = useState<Dayjs | null>(null);
  const [editCycleLoading, setEditCycleLoading] = useState(false);
  const [editCycleResult, setEditCycleResult] = useState<'success' | 'error' | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [infoRes, ...monthResults] = await Promise.all([
        fetch(`/api/info?mostrarPagados=${mostrarPagados}`).then((r) => r.json()),
        ...months.map((m) => fetch(`/api/dashboard?month=${m}${mostrarPagados ? '&mostrarPagados=true' : ''}`).then((r) => r.json())),
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
  }, [mostrarPagados]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEditPayment = (pmt: Payment) => {
    setEditPaymentTarget(pmt);
    setEditPaymentName(pmt.name ?? '');
    setEditPaymentFecha(dayjs(pmt.created_at));
    setEditPaymentMonto(Number(pmt.mount).toLocaleString('en-US'));
  };

  const openEditCycle = (card: CardData) => {
    setEditCycleTarget(card);
    setEditCycleStartDate(card.start_date ? dayjs(card.start_date) : null);
    setEditCycleEndDate(card.end_date ? dayjs(card.end_date) : null);
    setEditCycleExpDate(card.expiration_date ? dayjs(card.expiration_date) : null);
    setEditCycleResult(null);
  };

  const handleEditCycle = async () => {
    if (!editCycleTarget || !editCycleStartDate || !editCycleEndDate || !editCycleExpDate) return;
    setEditCycleLoading(true);
    const res = await fetch('/api/update_cycle', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editCycleTarget.cycle_id,
        card_id: editCycleTarget.id,
        start_date: editCycleStartDate.toISOString(),
        end_date: editCycleEndDate.toISOString(),
        expiration_date: editCycleExpDate.toISOString(),
      }),
    });
    const data = await res.json();
    setEditCycleLoading(false);
    setEditCycleResult(data.success ? 'success' : 'error');
    if (data.success) {
      await fetchAll();
    }
    setTimeout(() => {
      setEditCycleTarget(null);
      setEditCycleResult(null);
    }, 1000);
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
    if(totalTarjetas === 0) return null;
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
                {/* Totals summary */}
        {!isLoading && cards.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {(() => {
              const pctTextColor = pct !== null ? (pct <= 10 ? 'success.main' : pct <= 30 ? 'warning.main' : 'error.main') : undefined;
              return (
                <>
                  <Typography variant="h6" component="p" sx={{ color: pctTextColor }}>
                    Total tarjetas: <strong>${totalTarjetas.toLocaleString('en-US')}</strong>
                  </Typography>
                  {salaryBase !== null && (
                    <Typography variant="h6" component="p" sx={{ color: pctTextColor }}>
                      Disponible: <strong>${(salaryBase - totalTarjetas).toLocaleString('en-US')}</strong>
                    </Typography>
                  )}
                </>
              );
            })()}
            {pct !== null && (() => {
              const pctColor = pct <= 10 ? 'success' : pct <= 30 ? 'warning' : 'error';
              const pctTextColor = pct <= 10 ? 'success.main' : pct <= 30 ? 'warning.main' : 'error.main';
              return (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                    <Typography variant="h6" component="p" sx={{ color: pctTextColor }}>
                      <strong>{pct}%</strong>{' '}tarjetas sobre sueldo
                    </Typography>
                    {totalIngresos === 0 && lastSueldo !== null && (
                      <Typography variant="caption" color="text.secondary">
                        Usando salario previo
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      color={pctColor as 'success' | 'warning' | 'error'}
                      value={Math.min((pct / 50) * 100, 100)}
                      sx={{ flex: 1, height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <PieChart
                      series={[{
                        data: cards.map((c) => ({
                          id: c.id,
                          value: Number(c.total_payments),
                          label: c.description,
                        })),
                        //innerRadius: 30,
                        outerRadius: 70,
                        paddingAngle: 2,
                        cornerRadius: 3,
                        highlightScope: { fade: 'global', highlight: 'item' },
                        valueFormatter: (item) => {
                          const pct = totalTarjetas > 0
                            ? Math.round((item.value / totalTarjetas) * 100)
                            : 0;
                          return `$${item.value.toLocaleString('en-US')} (${pct}%)`;
                        },
                      }]}
                      slotProps={{ legend: { } }}
                      height={160}
                    />
                  </Box>
                </>
              );
            })()}
          </Box>
        )}
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
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'stretch' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {card.end_date && dayjs(card.end_date).isBefore(dayjs(), 'day')
                              ? <s>Cierra: {formatClosing(card.end_date, monthKey)}</s>
                              : <>Cierra: {formatClosing(card.end_date, monthKey)}</>}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {card.expiration_date && dayjs(card.expiration_date).isBefore(dayjs(), 'day')
                              ? <s>Vence: {formatExpiration(card.expiration_date)}</s>
                              : <>Vence: {formatExpiration(card.expiration_date)}</>}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ borderRadius: 1 }}
                          onClick={() => openEditCycle(card)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
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
          <FormControlLabel
            control={
              <Checkbox
                checked={mostrarPagados}
                onChange={(e) => setMostrarPagados(e.target.checked)}
              />
            }
            label="Mostrar pagados"
            sx={{ mb: 2 }}
          />

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
                {!loading && (() => {
                  const availableMonths = monthsData.filter(
                    (month): month is MonthData =>
                      month !== null && month.cards.some((card) => Number(card.total_payments) > 0)
                  );
                  const cardMap: Record<number, string> = {};

                  availableMonths.forEach((month) => {
                    month.cards.forEach((card) => {
                      if (!(card.id in cardMap)) {
                        cardMap[card.id] = card.description;
                      }
                    });
                  });

                  const sortedCardIds = Object.keys(cardMap)
                    .map(Number)
                    .sort((a, b) => a - b);

                  if (availableMonths.length === 0 || sortedCardIds.length === 0) {
                    return null;
                  }

                  const dataset = availableMonths.map((month) => {
                    const total = month.cards.reduce(
                      (sum, card) => sum + Number(card.total_payments),
                      0
                    );
                    const entry: Record<string, number | string> = {
                      cycleName: month.cycleName ?? month.label,
                      total,
                    };

                    month.cards.forEach((card) => {
                      entry[`card_${card.id}`] = Number(card.total_payments);
                    });

                    sortedCardIds.forEach((cardId) => {
                      if (!("card_" + cardId in entry)) {
                        entry[`card_${cardId}`] = 0;
                      }
                    });

                    return entry;
                  });

                  const series = sortedCardIds.map((cardId) => ({
                    dataKey: `card_${cardId}`,
                    label: cardMap[cardId],
                    stack: 'total',
                    valueFormatter: (value: number | null) => `$${(value ?? 0).toLocaleString('en-US')}`,
                  }));


                  const funnelData = [...dataset]
                    .map((entry) => {
                      const total = Number(entry.total ?? 0);
                      const pct = deudaTotal != null && deudaTotal > 0 ? Math.round((total / deudaTotal) * 100) : 0;
                      return { label: String(entry.cycleName), pct };
                    })

                  const funnelColors = ['#1976d2', '#1565c0', '#0d47a1', '#1e88e5', '#42a5f5', '#90caf9'];
                  const apexFunnelOptions: ApexOptions = {
                    chart: {
                      type: 'bar',
                      background: 'transparent',
                      toolbar: { show: false },
                    },
                    colors: funnelColors,
                    stroke: {
                      colors: ['#1a1a1a'],
                      width: 2,
                    },
                    legend: {
                      show: false,
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: (value) => `${Number(value).toLocaleString('en-US')}%`,
                      },
                    },
                    xaxis: {
                      labels: {
                        formatter: (value) => `${Math.round(Number(value))}%`,
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#ffffff',
                        },
                      },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        distributed: true,
                        isFunnel: true,
                        barHeight: '85%',
                        dataLabels: {
                          position: 'center',
                        },
                      },
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: (value, opts) => {
                        const label = funnelData[opts?.dataPointIndex ?? 0]?.label ?? '';
                        return `${label}: ${Math.round(Number(value))}%`;
                      },
                      style: {
                        fontSize: '12px',
                        fontWeight: '700',
                        colors: ['#ffffff'],
                      },
                      dropShadow: { enabled: false },
                    },
                    grid: {
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      xaxis: { lines: { show: false } },
                    },
                    theme: {
                      mode: 'dark',
                    },
                  };

                  return (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                      <Box sx={{ mt: 2, minWidth: 500, overflowX: 'auto' }}>
                        <BarChart
                          dataset={dataset}
                          xAxis={[{
                            scaleType: 'band',
                            dataKey: 'cycleName',
                            valueFormatter: (value, context) => {
                              if (context.location !== 'tooltip') {
                                return String(value);
                              }

                              const item = dataset.find((entry) => entry.cycleName === value);
                              const total = Number(item?.total ?? 0);
                              const pct = deudaTotal != null && deudaTotal > 0 ? Math.round((total / deudaTotal) * 100) : 0;
                              return `${String(value)} : $${total.toLocaleString('en-US')} (${pct}%)`;
                            },
                          }]}
                          yAxis={[{ valueFormatter: (value: number) => `$${value.toLocaleString('en-US')}` }]}
                          series={series}
                          height={280}
                          
                          margin={{ top: 16, right: 16, bottom: 48, left: 0 }}
                        />
                      </Box>

                      <Box
                        sx={{
                          mt: 3,
                          minWidth: 500,
                          overflowX: 'auto',
                          mx: 'auto',
                          p: 2,

                        }}
                      >
                        <Typography variant="body1" sx={{ mt: 0.5, color: 'white' }}>
                          Distribución porcentual por ciclo
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <ReactApexChart
                            type="bar"
                            height={360}
                            options={apexFunnelOptions}
                            series={[
                              {
                                name: 'Porcentaje',
                                data: funnelData.map((d) => ({
                                  x: d.label,
                                  y: d.pct,
                                  fillColor: funnelColors[funnelData.indexOf(d) % funnelColors.length],
                                })),
                              },
                            ]}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </>
            )}
          </Box>

          {months.map((month, i) => i < 5 ? renderMonth(monthsData[i] ?? null, month) : null)}
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

      {/* Edit cycle modal */}
      <Dialog open={!!editCycleTarget} onClose={() => setEditCycleTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Editar ciclo</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Tarjeta"
            fullWidth
            value={editCycleTarget?.description ?? ''}
            slotProps={{ input: { readOnly: true } }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Fecha inicio"
              value={editCycleStartDate}
              onChange={(v) => setEditCycleStartDate(v)}
              format="DD/MM/YY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Fecha cierre"
              value={editCycleEndDate}
              onChange={(v) => setEditCycleEndDate(v)}
              format="DD/MM/YY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Fecha vencimiento"
              value={editCycleExpDate}
              onChange={(v) => setEditCycleExpDate(v)}
              format="DD/MM/YY"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCycleTarget(null)} disabled={editCycleLoading || !!editCycleResult}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            loading={editCycleLoading}
            onClick={!editCycleResult ? handleEditCycle : undefined}
            color={editCycleResult === 'success' ? 'success' : editCycleResult === 'error' ? 'error' : 'primary'}
          >
            {editCycleResult === 'success' ? <CheckIcon /> : editCycleResult === 'error' ? <CloseIcon /> : 'Guardar'}
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
