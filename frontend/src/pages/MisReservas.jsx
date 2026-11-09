import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";

import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PoolIcon from "@mui/icons-material/Pool";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import SportsIcon from "@mui/icons-material/Sports";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddIcon from "@mui/icons-material/Add";

import { AuthContext } from "../context/AuthContext";
import { getMisReservas, cancelarReserva } from "../api/reservas";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingLogo from "../components/LoadingLogo";

dayjs.locale("es");

const ESTADOS_MAP = {
  sujeto_confirmacion: { label: "Sujeto a confirmación", color: "warning" },
  confirmada: { label: "Confirmada", color: "success" },
  pendiente: { label: "En Lista de Espera", color: "info" },
  asistio: { label: "Asistió", color: "primary" },
  ausente: { label: "Ausente", color: "error" },
  recupero: { label: "Recupero", color: "secondary" },
  cancelada: { label: "Cancelada", color: "default" },
};

export default function MisReservas() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState("todas");

  // Confirmar cancelación
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadReservas = async () => {
    setLoading(true);
    try {
      const res = await getMisReservas();
      setReservas(res.data?.reservas || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error al cargar las reservas",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservas();
  }, []);

  const handleOpenCancel = (reserva) => {
    setSelectedReserva(reserva);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReserva) return;
    try {
      await cancelarReserva(selectedReserva._id, {
        motivo: "Cancelado a pedido del usuario",
      });
      setSnack({
        open: true,
        msg: "Reserva cancelada con éxito. El cupo ha sido liberado.",
        severity: "success",
      });
      loadReservas();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "No se pudo cancelar la reserva",
        severity: "error",
      });
    } finally {
      setCancelModalOpen(false);
      setSelectedReserva(null);
    }
  };

  // Filtrado de pestañas
  const filteredReservas = reservas.filter((r) => {
    if (tabFilter === "pendientes") return r.estado === "sujeto_confirmacion";
    if (tabFilter === "confirmadas") return r.estado === "confirmada";
    if (tabFilter === "espera") return r.estado === "pendiente";
    if (tabFilter === "historial")
      return ["asistio", "ausente", "recupero", "cancelada"].includes(r.estado);
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Encabezado */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#173487">
            Mis Reservas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta el estado de tus clases programadas, profesores asignados y solicitudes
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/reservas/nueva")}
          sx={{
            backgroundColor: "#173487",
            "&:hover": { backgroundColor: "#122a6b" },
            fontWeight: 700,
            borderRadius: 2.5,
          }}
        >
          Nueva Reserva
        </Button>
      </Stack>

      {/* Pestañas de Filtro */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={tabFilter}
          onChange={(_, val) => setTabFilter(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { fontWeight: 600, textTransform: "none" },
          }}
        >
          <Tab value="todas" label={`Todas (${reservas.length})`} />
          <Tab
            value="pendientes"
            label={`Sujetas a Confirmación (${reservas.filter((r) => r.estado === "sujeto_confirmacion").length})`}
          />
          <Tab
            value="confirmadas"
            label={`Confirmadas (${reservas.filter((r) => r.estado === "confirmada").length})`}
          />
          <Tab
            value="espera"
            label={`En Espera (${reservas.filter((r) => r.estado === "pendiente").length})`}
          />
          <Tab
            value="historial"
            label={`Historial / Pasadas (${reservas.filter((r) =>
              ["asistio", "ausente", "recupero", "cancelada"].includes(r.estado)
            ).length
              })`}
          />
        </Tabs>
      </Box>

      {/* Listado */}
      {loading ? (
        <LoadingLogo text="Cargando tus reservas..." size={64} sx={{ py: 6 }} />
      ) : filteredReservas.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No tienes reservas en esta categoría. Puedes agendar una clase haciendo clic en
          "Nueva Reserva".
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredReservas.map((reserva) => {
            const estadoObj = ESTADOS_MAP[reserva.estado] || {
              label: reserva.estado,
              color: "default",
            };
            const turno = reserva.turno;
            const entrenador = reserva.entrenador;
            const fechaLegible = turno?.fecha
              ? dayjs(turno.fecha).format("dddd DD [de] MMMM [de] YYYY")
              : "Fecha no disponible";

            const puedeCancelar =
              ["confirmada", "pendiente", "sujeto_confirmacion"].includes(reserva.estado) &&
              turno &&
              dayjs(`${turno.fecha} ${turno.horaInicio}`).isAfter(dayjs());

            return (
              <Grid item xs={12} sm={6} md={4} key={reserva._id}>
                <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <CardContent>
                    {/* Alumno y Estado */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      sx={{ mb: 1.5 }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {reserva.alumno?.nombre} {reserva.alumno?.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          DNI: {reserva.alumno?.dni}
                        </Typography>
                      </Box>
                      <Chip
                        label={estadoObj.label}
                        color={estadoObj.color}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Fecha y Hora */}
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#173487"
                      sx={{ textTransform: "capitalize", mb: 0.5 }}
                    >
                      {fechaLegible}
                    </Typography>

                    <Typography variant="h6" fontWeight={800} color="#173487" sx={{ mb: 2 }}>
                      {turno?.horaInicio} hs
                    </Typography>

                    {/* Datos de Lugar y Profesor */}
                    <Stack spacing={0.8} sx={{ color: "text.secondary" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOnIcon fontSize="small" sx={{ color: "#173487" }} />
                        <Typography variant="body2" fontWeight={600}>
                          {turno?.horario?.sede?.nombre || "Sede Central"}
                        </Typography>
                      </Stack>

                      {/* Profesor asignado */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SportsIcon fontSize="small" sx={{ color: entrenador ? "primary.main" : "text.disabled" }} />
                        <Typography variant="body2" fontWeight={entrenador ? 700 : 400} color={entrenador ? "primary.main" : "text.secondary"}>
                          {entrenador
                            ? `Profesor: ${entrenador.nombre} ${entrenador.apellido}`
                            : reserva.estado === "sujeto_confirmacion"
                              ? "Profesor: A asignar"
                              : "Profesor: Por confirmar"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  {puedeCancelar && (
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => handleOpenCancel(reserva)}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        {reserva.estado === "sujeto_confirmacion" ? "Retirar Solicitud" : "Cancelar Reserva"}
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Confirmación Cancelación */}
      <ConfirmDialog
        open={cancelModalOpen}
        title="Cancelar Reserva"
        content={`¿Estás seguro de que deseas cancelar la reserva de ${selectedReserva?.alumno?.nombre} para el día ${selectedReserva?.turno?.fecha} a las ${selectedReserva?.turno?.horaInicio} hs?`}
        confirmText="Confirmar Cancelación"
        confirmColor="error"
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelModalOpen(false)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
