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
  Snackbar,
  Avatar,
  Divider,
  Badge,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";

import HowToRegIcon from "@mui/icons-material/HowToReg";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import SportsIcon from "@mui/icons-material/Sports";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FilterListIcon from "@mui/icons-material/FilterList";

import {
  getReservasPendientesConfirmacion,
  confirmarReserva,
  asignarEntrenadorReserva,
} from "../../api/reservas";
import { getSedes } from "../../api/sedes";
import { getStaff } from "../../api/staff";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

dayjs.locale("es");

const NIVELES_LABEL = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  competitivo: "Competitivo",
};

export default function AdminReservasPendientes() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [filterSede, setFilterSede] = useState("");

  // Modal para asignar profesor
  const [asignarModal, setAsignarModal] = useState({
    open: false,
    reserva: null,
    entrenadorId: "",
  });
  const [asignarLoading, setAsignarLoading] = useState(false);

  // Acción directa: aprobar / rechazar
  const [actionModal, setActionModal] = useState({
    open: false,
    reserva: null,
    accion: "aprobar",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSede) params.sede = filterSede;

      const [reservasRes, sedesRes, staffRes] = await Promise.all([
        getReservasPendientesConfirmacion(params),
        getSedes({ activa: true }),
        getStaff({ rol: "entrenador" }),
      ]);

      setReservas(reservasRes.data?.reservas || []);
      setSedes(sedesRes.data?.sedes || []);
      setProfesores(staffRes.data?.staff || staffRes.data?.users || []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: "Error al cargar las solicitudes pendientes", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSede]);

  // Manejador de asignación manual de profesor
  const handleAsignarProfesor = async () => {
    if (!asignarModal.reserva || !asignarModal.entrenadorId) return;
    setAsignarLoading(true);
    try {
      const res = await asignarEntrenadorReserva(asignarModal.reserva._id, {
        entrenadorId: asignarModal.entrenadorId,
      });
      setSnack({
        open: true,
        msg: res.data?.message || "Profesor asignado con éxito",
        severity: "success",
      });
      setAsignarModal({ open: false, reserva: null, entrenadorId: "" });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al asignar profesor",
        severity: "error",
      });
    } finally {
      setAsignarLoading(false);
    }
  };

  // Manejador de aprobación/rechazo general
  const handleAction = async () => {
    if (!actionModal.reserva) return;
    setActionLoading(true);
    try {
      const res = await confirmarReserva(actionModal.reserva._id, {
        accion: actionModal.accion,
        motivo: actionModal.accion === "rechazar" ? "Rechazada por coordinación" : undefined,
      });
      setSnack({
        open: true,
        msg: res.data?.message || "Acción realizada",
        severity: actionModal.accion === "aprobar" ? "success" : "info",
      });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al procesar la acción",
        severity: "error",
      });
    } finally {
      setActionLoading(false);
      setActionModal({ open: false, reserva: null, accion: "aprobar" });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Badge badgeContent={reservas.length} color="warning" max={99}>
          <HowToRegIcon sx={{ fontSize: 36, color: "primary.main" }} />
        </Badge>
        <div>
          <Typography variant="h4" fontWeight={700}>
            Solicitudes Pendientes de Confirmación
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Revisá solicitudes, asigná profesores a los alumnos o confirmá turnos directamente.
          </Typography>
        </div>
      </Stack>

      {/* Aviso */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Los alumnos solicitan turnos sujetos a confirmación. Podés <strong>asignarle un profesor directamente</strong> (lo cual confirma la reserva) o dejar que los profesores tomen los turnos desde su panel.
      </Alert>

      {/* Filtro de sede */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <FilterListIcon color="action" />
        <TextField
          select
          size="small"
          label="Filtrar por Sede"
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas las sedes</MenuItem>
          {sedes.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {s.nombre}
            </MenuItem>
          ))}
        </TextField>
        <Button size="small" onClick={loadData} variant="outlined" sx={{ textTransform: "none" }}>
          Actualizar
        </Button>
      </Stack>

      {/* Listado */}
      {loading ? (
        <LoadingLogo text="Cargando solicitudes pendientes..." size={64} sx={{ py: 6 }} />
      ) : reservas.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          ¡Todo al día! No hay solicitudes pendientes de confirmación en este momento.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {reservas.map((r) => {
            const alumno = r.alumno;
            const turno = r.turno;
            const h = turno?.horario;
            const tutor = alumno?.tutorPrincipal;

            return (
              <Grid item xs={12} md={6} xl={4} key={r._id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: "warning.light",
                    borderWidth: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Badge de estado */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Chip
                        icon={<WarningAmberIcon fontSize="small" />}
                        label="Sujeto a confirmación"
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Alumno */}
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                        {alumno?.nombre?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {alumno?.nombre} {alumno?.apellido}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          DNI: {alumno?.dni} · Nivel:{" "}
                          {NIVELES_LABEL[alumno?.nivel] || alumno?.nivel}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Tutor */}
                    {tutor && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Tutor: <strong>{tutor.nombre} {tutor.apellido}</strong>{" "}
                          ({tutor.email})
                        </Typography>
                      </Stack>
                    )}

                    {/* Turno */}
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>
                            {turno?.fecha
                              ? dayjs(turno.fecha).format("dddd DD/MM/YYYY")
                              : "Fecha?"}{" "}
                            — {turno?.horaInicio} hs
                          </strong>
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {h?.sede?.nombre || "Sede"}{" "}
                          <Typography component="span" variant="caption" color="text.secondary">
                            · Nivel: {NIVELES_LABEL[h?.nivel] || h?.nivel}
                          </Typography>
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Cupo disponible */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1,
                        bgcolor: "grey.50",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Cupo actual del turno
                      </Typography>
                      <Chip
                        label={`${turno?.cupoOcupado || 0} / ${turno?.cupoMax || "?"}`}
                        size="small"
                        color={
                          turno?.cupoOcupado >= turno?.cupoMax ? "error" : "success"
                        }
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, flexDirection: "column", gap: 1 }}>
                    {/* Botón principal: Asignar Profesor */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<SportsIcon />}
                      onClick={() =>
                        setAsignarModal({ open: true, reserva: r, entrenadorId: "" })
                      }
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Asignar Profesor
                    </Button>

                    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() =>
                          setActionModal({ open: true, reserva: r, accion: "aprobar" })
                        }
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Aprobar
                      </Button>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() =>
                          setActionModal({ open: true, reserva: r, accion: "rechazar" })
                        }
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal Asignar Profesor */}
      <Dialog
        open={asignarModal.open}
        onClose={() => setAsignarModal({ open: false, reserva: null, entrenadorId: "" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Asignar Profesor al Turno
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccioná el profesor que dictará la clase para{" "}
            <strong>{asignarModal.reserva?.alumno?.nombre} {asignarModal.reserva?.alumno?.apellido}</strong> el{" "}
            {asignarModal.reserva?.turno?.fecha} a las {asignarModal.reserva?.turno?.horaInicio} hs.
          </Typography>

          <TextField
            fullWidth
            select
            size="small"
            label="Profesor / Entrenador"
            value={asignarModal.entrenadorId}
            onChange={(e) =>
              setAsignarModal((prev) => ({ ...prev, entrenadorId: e.target.value }))
            }
          >
            {profesores.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.nombre} {p.apellido} {p.email ? `(${p.email})` : ""}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAsignarModal({ open: false, reserva: null, entrenadorId: "" })}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAsignarProfesor}
            disabled={!asignarModal.entrenadorId || asignarLoading}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {asignarLoading ? "Asignando..." : "Asignar y Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialog para aprobar / rechazar general */}
      <ConfirmDialog
        open={actionModal.open}
        loading={actionLoading}
        title={
          actionModal.accion === "aprobar"
            ? "¿Confirmar Solicitud?"
            : "¿Rechazar Solicitud?"
        }
        content={
          actionModal.accion === "aprobar"
            ? `¿Estás seguro de que deseas aprobar la solicitud de ${actionModal.reserva?.alumno?.nombre}? El turno quedará confirmado (o en espera si no hay cupo). Luego podrás asignarle profesor.`
            : `¿Estás seguro de que deseas rechazar la solicitud de ${actionModal.reserva?.alumno?.nombre}? La solicitud quedará cancelada.`
        }
        confirmText={actionModal.accion === "aprobar" ? "Aprobar" : "Rechazar"}
        confirmColor={actionModal.accion === "aprobar" ? "success" : "error"}
        onConfirm={handleAction}
        onClose={() => setActionModal({ open: false, reserva: null, accion: "aprobar" })}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
