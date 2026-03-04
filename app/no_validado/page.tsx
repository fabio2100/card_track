'use client';

import { Box, Container, Typography } from '@mui/material';

export default function NoValidadoPage() {
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" component="h1">
          no validado
        </Typography>
      </Box>
    </Container>
  );
}
