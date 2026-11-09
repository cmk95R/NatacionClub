import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";

import PersonIcon from "@mui/icons-material/Person";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CakeIcon from "@mui/icons-material/Cake";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { getMisHijos } from "../api/alumnos";
import { getFileDownloadUrl } from "../api/files";
import LoadingLogo from "../components/LoadingLogo";

dayjs.locale("es");

function getAptoStatus(apto) {
  if (!apto || !apto.vence) {
    return {
      status: "sin_apto",
      label: "Sin Apto Médico",
      color: "error",
      icon: <ErrorOutlineIcon fontSize="small" />,
    };
  }
  const hoy = dayjs();
  const vence = dayjs(apto.vence);
  const diffDays = vence.diff(hoy, "day");

  if (diffDays < 0) {
    return {
      status: "vencido",
      label: `Vencido (${vence.format("DD/MM/YYYY")})`,
      color: "error",
      icon: <ErrorOutlineIcon fontSize="small" />,
    };
  } else if (diffDays <= 30) {
    return {
      status: "por_vencer",
      label: `Vence pronto (${vence.format("DD/MM/YYYY")})`,
      color: "warning",
      icon: <WarningAmberIcon fontSize="small" />,
    };
  }
  return {
    status: "vigente",
    label: `Vigente hasta ${vence.format("DD/MM/YYYY")}`,
    color: "success",
    icon: <CheckCircleOutlineIcon fontSize="small" />,
  };
}

export default function MisHijos() {
  const navigate = useNavigate();
  const [hijos, setHijos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHijos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMisHijos();
      setHijos(res.data?.alumnos || res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los alumnos vinculados a tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHijos();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mis Alumnos a Cargo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona las reservas, consulta el estado del apto médico y la información de los alumnos a tu cargo.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingLogo text="Cargando representados e hijos..." size={64} sx={{ py: 6 }} />
      ) : hijos.length === 0 ? (
        <Card sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
          <PersonIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tienes alumnos o hijos vinculados a tu cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Si eres tutor de algún alumno, ponte en contacto con la administración del club para que vinculen tu cuenta.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {hijos.map((hijo) => {
            const aptoStatus = getAptoStatus(hijo.aptoMedico);
            const edad = hijo.fechaNacimiento
              ? dayjs().diff(dayjs(hijo.fechaNacimiento), "year")
              : null;

            return (
              <Grid item xs={12} md={6} key={hijo._id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent>
                    {/* Header Alumno */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: "primary.main",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                        }}
                      >
                        {hijo.nombre?.[0]}
                        {hijo.apellido?.[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {hijo.nombre} {hijo.apellido}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          DNI: {hijo.dni} {edad !== null && `• ${edad} años`}
                        </Typography>
                      </Box>
                      <Chip
                        label={hijo.nivel ? hijo.nivel.toUpperCase() : "INICIACIÓN"}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Datos Detallados */}
                    <Stack spacing={1.5}>
                      {hijo.fechaNacimiento && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CakeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Fecha de Nacimiento:{" "}
                            <strong>{dayjs(hijo.fechaNacimiento).format("DD/MM/YYYY")}</strong>
                          </Typography>
                        </Stack>
                      )}

                      {hijo.sede && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Sede Habitual:{" "}
                            <strong>{hijo.sede.nombre || "Sede Asignada"}</strong>
                          </Typography>
                        </Stack>
                      )}

                      {/* Estado Apto Médico */}
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor:
                            aptoStatus.status === "vigente"
                              ? "success.50"
                              : aptoStatus.status === "por_vencer"
                              ? "warning.50"
                              : "error.50",
                          border: "1px solid",
                          borderColor:
                            aptoStatus.status === "vigente"
                              ? "success.200"
                              : aptoStatus.status === "por_vencer"
                              ? "warning.200"
                              : "error.200",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MedicalServicesIcon
                            fontSize="small"
                            color={aptoStatus.color}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={`${aptoStatus.color}.main`}
                          >
                            {aptoStatus.label}
                          </Typography>
                        </Stack>

                        {hijo.aptoMedico?.archivoId && (
                          <Tooltip title="Descargar Certificado">
                            <Button
                              size="small"
                              startIcon={<FileDownloadIcon />}
                              component="a"
                              href={getFileDownloadUrl(hijo.aptoMedico.archivoId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textTransform: "none", py: 0.2 }}
                            >
                              Ver
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<EventAvailableIcon />}
                          onClick={() =>
                            navigate(`/reservar/nueva?alumnoId=${hijo._id}`)
                          }
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Reservar
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<HistoryIcon />}
                          onClick={() =>
                            navigate(`/reservas?alumnoId=${hijo._id}`)
                          }
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Reservas
                        </Button>
                      </Grid>
                    </Grid>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
