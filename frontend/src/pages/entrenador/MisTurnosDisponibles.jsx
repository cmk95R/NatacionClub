import React, { useState, useEffect } from "react";
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
  TextField,
  MenuItem,
  Divider,
  Avatar,
  Badge,
  Paper,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";

import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LightModeIcon from "@mui/icons-material/LightMode";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getSedes } from "../../api/sedes";
import { getDisponiblesParaEntrenador, tomarReserva } from "../../api/reservas";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

dayjs.locale("es");

const NIVELES_LABEL = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  competitivo: "Competitivo",
};

const FRANJA_CONFIG = {
  mañana: { icon: <WbSunnyIcon fontSize="small" />, color: "warning", label: "Mañana (07–12 hs)" },
  tarde:  { icon: <LightModeIcon fontSize="small" />, color: "info",    label: "Tarde (12–18 hs)" },
  noche:  { icon: <NightsStayIcon fontSize="small" />, color: "secondary", label: "Noche (18–22 hs)" },
};

export default function MisTurnosDisponibles() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState([]);

  // Filtros
  const [filterSede, setFilterSede] = useState("");
  const [filterFecha, setFilterFecha] = useState("");

  // Modal tomar turno
  const [confirmModal, setConfirmModal] = useState({ open: false, reserva: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSede) params.sede = filterSede;
      if (filterFecha) params.fecha = filterFecha;

      const [reservasRes, sedesRes] = await Promise.all([
        getDisponiblesParaEntrenador(params),
        getSedes({ activa: true }),
      ]);

      setReservas(reservasRes.data?.reservas || []);
      setSedes(sedesRes.data?.sedes || []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: "Error al cargar los turnos disponibles", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSede, filterFecha]);

  const handleTomar = async () => {
    if (!confirmModal.reserva) return;
    setConfirmLoading(true);
    try {
      const res = await tomarReserva(confirmModal.reserva._id);
      setSnack({
        open: true,
        msg: res.data?.message || "Turno tomado exitosamente",
        severity: "success",
      });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al tomar el turno",
        severity: "error",
      });
    } finally {
      setConfirmLoading(false);
      setConfirmModal({ open: false, reserva: null });
    }
  };

  // Agrupar por franja del día para mostrar secciones
  const groupByFranja = (reservas) => {
    const groups = { mañana: [], tarde: [], noche: [] };
    for (const r of reservas) {
      const h = r.turno?.horaInicio;
      if (!h) continue;
      const hora = parseInt(h.split(":")[0], 10);
      if (hora < 12) groups.mañana.push(r);
      else if (hora < 18) groups.tarde.push(r);
      else groups.noche.push(r);
    }
    return groups;
  };

  const grupos = groupByFranja(reservas);

  const renderCard = (r) => {
    const alumno = r.alumno;
    const turno = r.turno;
    const h = turno?.horario;
    const fechaStr = turno?.fecha ? dayjs(turno.fecha).format("dddd DD [de] MMMM") : "Fecha?";

    return (
      <Grid item xs={12} sm={6} xl={4} key={r._id}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: "primary.light",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.15s, box-shadow 0.15s",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(23,52,135,0.15)",
              transform: "translateY(-2px)",
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            {/* Fecha y hora */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <AccessTimeIcon fontSize="small" color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  {turno?.horaInicio} hs
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                  {fechaStr}
                </Typography>
              </Box>
            </Stack>

            {/* Sede */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="body2">{h?.sede?.nombre || "Sede"}</Typography>
            </Stack>

            {/* Nivel */}
            <Chip
              label={NIVELES_LABEL[h?.nivel] || h?.nivel || "Sin nivel"}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ mb: 2, fontWeight: 600 }}
            />

            <Divider sx={{ mb: 1.5 }} />

            {/* Alumno */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: "0.9rem" }}>
                {alumno?.nombre?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {alumno?.nombre} {alumno?.apellido}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  DNI {alumno?.dni} · {NIVELES_LABEL[alumno?.nivel] || alumno?.nivel}
                </Typography>
                {alumno?.tutorPrincipal && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Tutor: {alumno.tutorPrincipal.nombre} {alumno.tutorPrincipal.apellido}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Tiempo desde solicitud */}
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1.5 }}>
              Solicitud: {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
            </Typography>
          </CardContent>

          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={() => setConfirmModal({ open: true, reserva: r })}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Tomar este turno
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Badge badgeContent={reservas.length} color="primary" max={99}>
          <AssignmentIcon sx={{ fontSize: 36, color: "primary.main" }} />
        </Badge>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Turnos Disponibles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Solicitudes de clase sin profesor asignado. Podés tomar turnos para cubrirlos.
          </Typography>
        </Box>
      </Stack>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Al <strong>tomar un turno</strong>, quedás asignado como profesor del alumno y la reserva pasa a
        estar <strong>confirmada</strong> automáticamente.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
          <TextField
            select
            size="small"
            label="Filtrar por Sede"
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todas las sedes</MenuItem>
            {sedes.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            type="date"
            label="Filtrar por Fecha"
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            Actualizar
          </Button>
        </Stack>
      </Paper>

      {/* Contenido */}
      {loading ? (
        <LoadingLogo text="Buscando turnos disponibles..." size={64} sx={{ py: 6 }} />
      ) : reservas.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          No hay turnos disponibles para tomar en este momento.
        </Alert>
      ) : (
        <Stack spacing={5}>
          {Object.entries(grupos).map(([franja, lista]) => {
            if (lista.length === 0) return null;
            const cfg = FRANJA_CONFIG[franja];
            return (
              <Box key={franja}>
                {/* Encabezado de franja */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Chip
                    icon={cfg.icon}
                    label={cfg.label}
                    color={cfg.color}
                    sx={{ fontWeight: 700, fontSize: "0.9rem", py: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {lista.length} solicitud{lista.length !== 1 ? "es" : ""}
                  </Typography>
                </Stack>

                <Grid container spacing={2.5}>
                  {lista.map(renderCard)}
                </Grid>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmModal.open}
        loading={confirmLoading}
        title="¿Tomar este turno?"
        content={
          confirmModal.reserva
            ? `Vas a quedar asignado como profesor de ${confirmModal.reserva.alumno?.nombre} ${confirmModal.reserva.alumno?.apellido} el día ${dayjs(confirmModal.reserva.turno?.fecha).format("DD/MM/YYYY")} a las ${confirmModal.reserva.turno?.horaInicio} hs. La reserva quedará confirmada para el alumno.`
            : ""
        }
        confirmText="Sí, tomar turno"
        confirmColor="primary"
        onConfirm={handleTomar}
        onClose={() => setConfirmModal({ open: false, reserva: null })}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
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

