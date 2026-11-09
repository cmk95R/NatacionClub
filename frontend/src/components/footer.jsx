import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Stack,
  IconButton,
} from '@mui/material';

import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import PoolIcon from '@mui/icons-material/Pool';

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#173487', color: 'white', mt: 8, pt: 4, pb: 2 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} display={'flex'} justifyContent={'space-between'}>
          {/* Identidad */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PoolIcon />
              <Typography variant="h6" fontWeight={700}>Club de Natación</Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Sistema integral de gestión de sedes, turnos, reservas y asistencias.
            </Typography>
          </Grid>

          {/* Columna contacto */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>Contacto</Typography>
            <Typography variant="body2">Av. Cabildo 1500, CABA</Typography>
            <Typography variant="body2">Tel: 11-4444-5555</Typography>
            <Typography variant="body2">Email: contacto@clubnatacion.com</Typography>
          </Grid>

          {/* Columna redes */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>Seguinos</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton color="inherit" href="#" aria-label="LinkedIn"><LinkedInIcon /></IconButton>
              <IconButton color="inherit" href="#" aria-label="Instagram"><InstagramIcon /></IconButton>
            </Stack>
          </Grid>
        </Grid>

        {/* Línea inferior */}
        <Box sx={{ textAlign: 'center', mt: 4, borderTop: '1px solid rgba(255,255,255,0.2)', pt: 2.5 }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            © {new Date().getFullYear()} Club de Natación. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
