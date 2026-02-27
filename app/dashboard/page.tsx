'use client';

import { useEffect, useState } from 'react';
import { Box, Container, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface Cycle {
  name: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const response = await fetch('/api/cycles');
        const data = await response.json();
        if (data.success) {
          setCycles(data.data);
        }
      } catch (error) {
        console.error('Error fetching cycles:', error);
      }
    };
    fetchCycles();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.push('/')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
        </Box>

        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
          Ciclos
        </Typography>
        <List dense>
          {cycles.map((cycle, index) => (
            <ListItem key={index} disableGutters>
              <ListItemText primary={cycle.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
}
