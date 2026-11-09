import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Paper,
  Avatar,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";

import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import LightModeIcon from "@mui/icons-material/LightMode";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

import { AuthContext } from "../context/AuthContext";
import { getDisponibilidad, createReserva } from "../api/reservas";
import { getSedes } from "../api/sedes";
import { getMisHijos } from "../api/alumnos";
import LoadingLogo from "../components/LoadingLogo";

dayjs.locale("es");

const NIVELES_LABEL = {
  iniciacion: "Iniciación",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  competitivo: "Competitivo",
};

const DIA_LABEL = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default function ReservarTurno() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialAlumnoId = queryParams.get("alumnoId") || "";

  const isTutor = user?.rol === "tutor";
  const isAlumno = user?.rol === "alumno";

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [hijos, setHijos] = useState([]);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState(initialAlumnoId);
  const [currentAlumno, setCurrentAlumno] = useState(null);

  const [sedes, setSedes] = useState([]);
  const [selectedSede, setSelectedSede] = useState("");

  const hoyStr = dayjs().format("YYYY-MM-DD");
  const en2SemanasStr = dayjs().add(14, "day").format("YYYY-MM-DD");
  const [fechaDesde, setFechaDesde] = useState(hoyStr);
  const [fechaHasta, setFechaHasta] = useState(en2SemanasStr);

  // Filtro de franja del día: todos | mañana | tarde | noche
  const [filtroFranja, setFiltroFranja] = useState("todos");

  const [franjas, setFranjas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState({ open: false, franja: null });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Modal de resultado
  const [resultModal, setResultModal] = useState({ open: false, estado: "", msg: "" });

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "error" });

  // ─── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [sedesRes, hijosRes] = await Promise.all([
          getSedes({ activa: true }),
          isTutor ? getMisHijos() : Promise.resolve({ data: { alumnos: [] } }),
        ]);

        const sedesData = sedesRes.data?.sedes || [];
        setSedes(sedesData);
        if (sedesData.length > 0) setSelectedSede(sedesData[0]._id);

        if (isTutor) {
          const listaHijos = hijosRes.data?.alumnos || [];
          setHijos(listaHijos);
          if (listaHijos.length > 0) {
            const targetId =
              initialAlumnoId && listaHijos.some((h) => h._id === initialAlumnoId)
                ? initialAlumnoId
                : listaHijos[0]._id;
            setSelectedAlumnoId(targetId);
            setCurrentAlumno(listaHijos.find((h) => h._id === targetId) || listaHijos[0]);
          }
        } else if (isAlumno) {
          setCurrentAlumno(user);
        }
      } catch (err) {
        console.error("Error inicializando:", err);
      }
    }
    init();
  }, []);

  // Sincronizar alumno seleccionado cuando cambia el id
  useEffect(() => {
    if (isTutor && selectedAlumnoId) {
      setCurrentAlumno(hijos.find((h) => h._id === selectedAlumnoId) || null);
    }
  }, [selectedAlumnoId, hijos]);

  // ─── Cargar franjas disponibles ─────────────────────────────────────────────
  const loadFranjas = async () => {
    if (!selectedSede) return;
    setLoading(true);
    try {
      const params = {
        sede: selectedSede,
        desde: fechaDesde,
        hasta: fechaHasta,
      };
      if (filtroFranja && filtroFranja !== "todos") {
        params.turno = filtroFranja;
      }
      if (currentAlumno?.nivel) params.nivel = currentAlumno.nivel;

      const res = await getDisponibilidad(params);
      setFranjas(res.data?.franjas || []);
    } catch (err) {
      setSnack({ open: true, msg: "Error al cargar la disponibilidad de horarios", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFranjas();
  }, [selectedSede, fechaDesde, fechaHasta, filtroFranja, currentAlumno?.nivel]);

  // ─── Reservar ───────────────────────────────────────────────────────────────
  const handleConfirmarReserva = async () => {
    if (!confirmModal.franja || !currentAlumno) return;

    const franja = confirmModal.franja;
    const turnoId = franja.turnosIds?.[0];
    if (!turnoId) return;

    setBookingLoading(true);
    try {
      const res = await createReserva({
        alumnoId: currentAlumno._id,
        turnoId,
      });

      setConfirmModal({ open: false, franja: null });
      setResultModal({
        open: true,
        estado: res.data?.estado,
        msg: res.data?.message,
      });
      loadFranjas();
    } catch (err) {
      setConfirmModal({ open: false, franja: null });
      setSnack({
        open: true,
        msg: err.response?.data?.message || "No se pudo registrar la solicitud",
        severity: "error",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Agrupar franjas por fecha para mostrar una sección por día
  const franjasPorFecha = franjas.reduce((acc, f) => {
    if (!acc[f.fecha]) acc[f.fecha] = [];
    acc[f.fecha].push(f);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <EventAvailableIcon sx={{ fontSize: 36, color: "primary.main" }} />
        <div>
          <Typography variant="h4" fontWeight={700}>
            Solicitar Clase
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seleccioná día y horario. Las solicitudes quedan <strong>sujetas a confirmación</strong> por los profesores o coordinación.
          </Typography>
        </div>
      </Stack>

      {/* Aviso de flujo */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <strong>¿Cómo funciona?</strong> Al seleccionar un horario, tu solicitud queda registrada como <strong>"Sujeta a confirmación"</strong>. Un profesor disponible tomará el turno o coordinación te asignará uno, y recibirás la confirmación de tu clase.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          {/* Selector de Alumno (solo tutores) */}
          {isTutor && hijos.length > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Alumno"
                value={selectedAlumnoId}
                onChange={(e) => setSelectedAlumnoId(e.target.value)}
              >
                {hijos.map((h) => (
                  <MenuItem key={h._id} value={h._id}>
                    {h.nombre} {h.apellido}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* Selector de Sede */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              size="small"
              label="Sede"
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
            >
              {sedes.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Rango de fechas */}
          <Grid item xs={6} sm={3} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: hoyStr }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: fechaDesde }}
            />
          </Grid>
        </Grid>

        {/* Filtro por Franja Horaria (Mañana / Tarde / Noche / Todos) */}
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 700 }}>
            FILTRAR POR MOMENTO DEL DÍA:
          </Typography>
          <ToggleButtonGroup
            value={filtroFranja}
            exclusive
            onChange={(_, val) => {
              if (val !== null) setFiltroFranja(val);
            }}
            size="small"
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            <ToggleButton value="todos" sx={{ borderRadius: "20px !important", px: 2, textTransform: "none", fontWeight: 600 }}>
              <AllInclusiveIcon fontSize="small" sx={{ mr: 0.8 }} /> Todos
            </ToggleButton>
            <ToggleButton value="mañana" sx={{ borderRadius: "20px !important", px: 2, textTransform: "none", fontWeight: 600 }}>
              <WbSunnyIcon fontSize="small" sx={{ mr: 0.8, color: "warning.main" }} /> Mañana (07 - 12 hs)
            </ToggleButton>
            <ToggleButton value="tarde" sx={{ borderRadius: "20px !important", px: 2, textTransform: "none", fontWeight: 600 }}>
              <LightModeIcon fontSize="small" sx={{ mr: 0.8, color: "info.main" }} /> Tarde (12 - 18 hs)
            </ToggleButton>
            <ToggleButton value="noche" sx={{ borderRadius: "20px !important", px: 2, textTransform: "none", fontWeight: 600 }}>
              <NightsStayIcon fontSize="small" sx={{ mr: 0.8, color: "secondary.main" }} /> Noche (18 - 22 hs)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Info alumno seleccionado */}
        {currentAlumno && currentAlumno.nivel && (
          <Box sx={{ mt: 2 }}>
            <Chip
              icon={<PersonIcon />}
              label={`${currentAlumno.nombre || "Alumno"} · Nivel: ${
                NIVELES_LABEL[currentAlumno.nivel] || currentAlumno.nivel
              }`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Contenido principal */}
      {loading ? (
        <LoadingLogo text="Buscando horarios disponibles..." size={64} sx={{ py: 6 }} />
      ) : Object.keys(franjasPorFecha).length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          No hay clases disponibles para los filtros seleccionados. Probá ampliar el rango de fechas o cambiar la franja del día.
        </Alert>
      ) : (
        <Stack spacing={4}>
          {Object.entries(franjasPorFecha).map(([fecha, franjasDia]) => {
            const fechaObj = dayjs(fecha);
            const diaNombre = DIA_LABEL[franjasDia[0]?.diaSemana] || fechaObj.format("dddd");

            return (
              <Box key={fecha}>
                {/* Encabezado del día */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 48,
                      height: 48,
                      fontSize: "0.9rem",
                      fontWeight: 700,
                    }}
                  >
                    {fechaObj.format("DD")}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                      {diaNombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fechaObj.format("DD [de] MMMM [de] YYYY")}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2}>
                  {franjasDia.map((franja) => {
                    const pct =
                      franja.cupoTotal > 0
                        ? Math.round((franja.cupoOcupado / franja.cupoTotal) * 100)
                        : 0;
                    const lleno = franja.lugaresLibres === 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={franja.key}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: lleno ? "text.disabled" : "primary.light",
                            opacity: lleno ? 0.65 : 1,
                            transition: "transform 0.15s, box-shadow 0.15s",
                            "&:hover": lleno
                              ? {}
                              : {
                                  boxShadow: "0 6px 20px rgba(23,52,135,0.15)",
                                  transform: "translateY(-2px)",
                                },
                          }}
                        >
                          <CardActionArea
                            disabled={lleno}
                            onClick={() => setConfirmModal({ open: true, franja })}
                            sx={{ p: 0 }}
                          >
                            <CardContent>
                              {/* Horario */}
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <AccessTimeIcon fontSize="small" color="primary" />
                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                  {franja.horaInicio} a {franja.horaFin} hs
                                </Typography>
                              </Stack>

                              {/* Sede */}
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                <LocationOnIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {franja.sedeNombre}
                                </Typography>
                              </Stack>

                              {/* Nivel */}
                              <Chip
                                label={NIVELES_LABEL[franja.nivel] || franja.nivel}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ mb: 2, fontWeight: 600 }}
                              />

                              {/* Ocupación visual */}
                              <Box sx={{ mb: 1 }}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Ocupación
                                  </Typography>
                                  <Typography variant="caption" fontWeight={700}>
                                    {franja.cupoOcupado} / {franja.cupoTotal}
                                  </Typography>
                                </Stack>
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  color={pct >= 100 ? "error" : pct >= 70 ? "warning" : "success"}
                                  sx={{ borderRadius: 4, height: 6 }}
                                />
                              </Box>

                              <Divider sx={{ my: 1.5 }} />

                              {/* Estado de disponibilidad */}
                              {lleno ? (
                                <Chip
                                  size="small"
                                  label="Sin lugares disponibles"
                                  color="default"
                                  sx={{ fontWeight: 600 }}
                                />
                              ) : (
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Chip
                                    size="small"
                                    icon={<WarningAmberIcon />}
                                    label="Sujeto a confirmación"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                                  />
                                  <ArrowForwardIcon fontSize="small" color="primary" />
                                </Stack>
                              )}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                <Divider sx={{ mt: 4 }} />
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Modal de confirmación de solicitud */}
      <Dialog
        open={confirmModal.open}
        onClose={() => !bookingLoading && setConfirmModal({ open: false, franja: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirmar Solicitud de Clase
        </DialogTitle>
        <DialogContent>
          {confirmModal.franja && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 2 }}>
                Esta solicitud quedará <strong>sujeta a confirmación</strong> por un profesor del club o por el equipo de coordinación.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Alumno:</strong>{" "}
                      {currentAlumno?.nombre} {currentAlumno?.apellido}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Sede:</strong> {confirmModal.franja.sedeNombre}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Horario:</strong> {confirmModal.franja.horaInicio} a{" "}
                      {confirmModal.franja.horaFin} hs
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventAvailableIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Fecha:</strong>{" "}
                      {dayjs(confirmModal.franja.fecha).format("dddd DD [de] MMMM [de] YYYY")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">
                      <strong>Nivel:</strong>{" "}
                      {NIVELES_LABEL[confirmModal.franja.nivel] || confirmModal.franja.nivel}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              <DialogContentText variant="body2" color="text.secondary">
                Al confirmar, se registrará tu solicitud. El estado inicial es{" "}
                <strong>"Sujeto a confirmación"</strong>. Podés hacer el seguimiento en la sección{" "}
                <em>Mis Reservas</em>.
              </DialogContentText>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmModal({ open: false, franja: null })}
            disabled={bookingLoading}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmarReserva}
            disabled={bookingLoading}
            sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
          >
            {bookingLoading ? "Enviando solicitud..." : "Enviar Solicitud"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de resultado */}
      <Dialog
        open={resultModal.open}
        onClose={() => setResultModal({ open: false, estado: "", msg: "" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, textAlign: "center", p: 2 } }}
      >
        <DialogContent>
          <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            ¡Solicitud enviada!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {resultModal.msg}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setResultModal({ open: false, estado: "", msg: "" });
              navigate("/reservas");
            }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Ver Mis Reservas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snack de error */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
