import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Avatar,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/es";

import HowToRegIcon from "@mui/icons-material/HowToReg";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RestoreIcon from "@mui/icons-material/Restore";
import SaveIcon from "@mui/icons-material/Save";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import LockIcon from "@mui/icons-material/Lock";
import PoolIcon from "@mui/icons-material/Pool";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { AuthContext } from "../context/AuthContext";
import { getTurnos } from "../api/turnos";
import LoadingLogo from "../components/LoadingLogo";
import { getAsistenciaTurno, registrarAsistencia } from "../api/asistencia";
import ConfirmDialog from "../components/ConfirmDialog";

dayjs.locale("es");

function getAptoStatus(apto) {
  if (!apto || !apto.vence) {
    return {
      status: "sin_apto",
      label: "Sin Apto",
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
      label: `Vencido (${vence.format("DD/MM")})`,
      color: "error",
      icon: <ErrorOutlineIcon fontSize="small" />,
    };
  } else if (diffDays <= 30) {
    return {
      status: "por_vencer",
      label: `Vence pronto (${vence.format("DD/MM")})`,
      color: "warning",
      icon: <WarningAmberIcon fontSize="small" />,
    };
  }
  return {
    status: "vigente",
    label: `Apto OK`,
    color: "success",
    icon: <CheckCircleOutlineIcon fontSize="small" />,
  };
}

export default function TomarAsistencia() {
  const { user } = useContext(AuthContext);

  const hoyStr = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(hoyStr);

  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [selectedTurnoId, setSelectedTurnoId] = useState("");

  const [turnoData, setTurnoData] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmFinalizarOpen, setConfirmFinalizarOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const isStaff = ["admin", "coordinador"].includes(user?.rol);

  // 1. Cargar turnos para la fecha seleccionada
  useEffect(() => {
    async function loadTurnos() {
      setLoadingTurnos(true);
      try {
        const res = await getTurnos({ desde: selectedDate, hasta: selectedDate });
        let turnosList = res.data?.turnos || [];

        // Si es entrenador, filtramos los que le corresponden
        if (user?.rol === "entrenador") {
          turnosList = turnosList.filter(
            (t) => t.horario?.entrenador?._id?.toString() === user._id?.toString()
          );
        }

        setTurnos(turnosList);
        if (turnosList.length > 0) {
          // Si el turno actual sigue existiendo en el nuevo día, mantenerlo, sino elegir el primero
          if (!turnosList.some((t) => t._id === selectedTurnoId)) {
            setSelectedTurnoId(turnosList[0]._id);
          }
        } else {
          setSelectedTurnoId("");
          setTurnoData(null);
          setAttendanceList([]);
        }
      } catch (err) {
        console.error(err);
        setSnack({
          open: true,
          msg: "Error al cargar la lista de turnos para esta fecha.",
          severity: "error",
        });
      } finally {
        setLoadingTurnos(false);
      }
    }

    loadTurnos();
  }, [selectedDate, user]);

  // 2. Cargar datos del turno y asistencias cuando cambia selectedTurnoId
  useEffect(() => {
    if (!selectedTurnoId) return;

    async function loadAttendanceData() {
      setLoadingAttendance(true);
      try {
        const res = await getAsistenciaTurno(selectedTurnoId);
        const { turno, asistencias = [], reservas = [] } = res.data;

        setTurnoData(turno);

        // Mapear reservas y asistencias existentes
        // Cada alumno con reserva confirmada debe figurar
        const asisMap = new Map();
        asistencias.forEach((a) => {
          const aId = a.alumno?._id || a.alumno;
          asisMap.set(String(aId), a);
        });

        const list = reservas.map((r) => {
          const alumno = r.alumno;
          const aId = String(alumno._id);
          const existingAsis = asisMap.get(aId);

          let initialEstado = "presente";
          let initialNota = "";

          if (existingAsis) {
            initialEstado = existingAsis.estado;
            initialNota = existingAsis.nota || "";
          } else if (r.estado === "ausente") {
            initialEstado = "ausente";
          } else if (r.estado === "recupero") {
            initialEstado = "recupero";
          }

          return {
            alumno,
            reservaId: r._id,
            estado: initialEstado,
            nota: initialNota,
          };
        });

        setAttendanceList(list);
      } catch (err) {
        console.error(err);
        setSnack({
          open: true,
          msg: "Error al cargar los datos del turno y los alumnos.",
          severity: "error",
        });
      } finally {
        setLoadingAttendance(false);
      }
    }

    loadAttendanceData();
  }, [selectedTurnoId]);

  // Cambiar estado de un alumno
  const handleStatusChange = (alumnoId, newStatus) => {
    if (!newStatus) return;
    setAttendanceList((prev) =>
      prev.map((item) =>
        item.alumno._id === alumnoId ? { ...item, estado: newStatus } : item
      )
    );
  };

  // Cambiar nota de un alumno
  const handleNotaChange = (alumnoId, nota) => {
    setAttendanceList((prev) =>
      prev.map((item) =>
        item.alumno._id === alumnoId ? { ...item, nota } : item
      )
    );
  };

  // Marcar todos con un estado
  const handleBulkSetStatus = (status) => {
    setAttendanceList((prev) =>
      prev.map((item) => ({ ...item, estado: status }))
    );
  };

  // Guardar asistencia
  const handleSaveAttendance = async (finalizarTurno = false) => {
    if (!selectedTurnoId) return;

    const payload = {
      asistencias: attendanceList.map((item) => ({
        alumnoId: item.alumno._id,
        estado: item.estado,
        nota: item.nota,
      })),
      finalizarTurno,
    };

    setSaving(true);
    try {
      await registrarAsistencia(selectedTurnoId, payload);
      setSnack({
        open: true,
        msg: finalizarTurno
          ? "Asistencia guardada y turno finalizado correctamente."
          : "Asistencia guardada exitosamente.",
        severity: "success",
      });

      // Recargar datos para ver el estado actualizado
      const res = await getAsistenciaTurno(selectedTurnoId);
      setTurnoData(res.data.turno);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al guardar la asistencia.",
        severity: "error",
      });
    } finally {
      setSaving(false);
      setConfirmFinalizarOpen(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <HowToRegIcon sx={{ fontSize: 36, color: "primary.main" }} />
          <div>
            <Typography variant="h4" fontWeight={700}>
              Toma de Asistencia
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control de concurrencia y registro de presentes en pileta.
            </Typography>
          </div>
        </Stack>
      </Box>

      {/* Selectores de Fecha y Turno */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              select
              label="Seleccionar Turno"
              value={selectedTurnoId}
              onChange={(e) => setSelectedTurnoId(e.target.value)}
              disabled={loadingTurnos || turnos.length === 0}
              helperText={
                turnos.length === 0
                  ? "No hay turnos disponibles para la fecha seleccionada."
                  : `Se encontraron ${turnos.length} turno(s).`
              }
            >
              {turnos.map((t) => {
                const h = t.horario || {};
                const sedeNom = h.sede?.nombre || "Sede";
                const piletaNom = h.pileta?.nombre || "Pileta";
                const coachNom = h.entrenador
                  ? `${h.entrenador.nombre} ${h.entrenador.apellido}`
                  : "Sin entrenador";

                return (
                  <MenuItem key={t._id} value={t._id}>
                    <strong>
                      {t.horaInicio} - {t.horaFin}
                    </strong>{" "}
                    | {sedeNom} ({piletaNom}) | Nivel: {t.nivel?.toUpperCase()} |{" "}
                    {coachNom} | ({t.cupoOcupado}/{t.capacidadMaxima})
                    {t.estado === "finalizado" && " [FINALIZADO]"}
                  </MenuItem>
                );
              })}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Detalle del Turno y Lista de Asistencia */}
      {loadingAttendance ? (
        <LoadingLogo text="Cargando nómina de alumnos del turno..." size={64} sx={{ py: 6 }} />
      ) : !selectedTurnoId || !turnoData ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Selecciona un turno para visualizar la nómina de alumnos y tomar asistencia.
        </Alert>
      ) : (
        <Stack spacing={3}>
          {/* Card Resumen del Turno */}
          <Card variant="outlined" sx={{ borderRadius: 3, p: 1 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {turnoData.horario?.sede?.nombre || "Sede"} -{" "}
                      {turnoData.horario?.pileta?.nombre || "Pileta"}
                    </Typography>
                    <Chip
                      label={turnoData.estado.toUpperCase()}
                      size="small"
                      color={
                        turnoData.estado === "finalizado"
                          ? "default"
                          : turnoData.estado === "suspendido"
                          ? "error"
                          : "success"
                      }
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 1, sm: 3 }}
                    color="text.secondary"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">
                        {turnoData.fecha} ({turnoData.horaInicio} a {turnoData.horaFin})
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PoolIcon fontSize="small" />
                      <Typography variant="body2">
                        Nivel: <strong>{turnoData.nivel?.toUpperCase()}</strong>
                      </Typography>
                    </Stack>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        Ocupación
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {turnoData.cupoOcupado} / {turnoData.capacidadMaxima}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        En Espera
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="warning.main">
                        {turnoData.listaEspera?.length || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabla de Alumnos */}
          {attendanceList.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No hay reservas confirmadas para este turno.
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
              {/* Acciones Rápidas */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: (t) =>
                    t.palette.mode === "dark" ? "background.paper" : "grey.50",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Alumnos Reservados ({attendanceList.length})
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<DoneAllIcon />}
                    onClick={() => handleBulkSetStatus("presente")}
                    sx={{ textTransform: "none" }}
                  >
                    Todos Presentes
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleBulkSetStatus("ausente")}
                    sx={{ textTransform: "none" }}
                  >
                    Todos Ausentes
                  </Button>
                </Stack>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Alumno</TableCell>
                      <TableCell>Apto Médico</TableCell>
                      <TableCell align="center">Asistencia</TableCell>
                      <TableCell>Observaciones / Nota</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceList.map((item) => {
                      const al = item.alumno;
                      const aptoInfo = getAptoStatus(al.aptoMedico);

                      return (
                        <TableRow key={al._id} hover>
                          {/* Alumno Info */}
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                                {al.nombre?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {al.nombre} {al.apellido}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  DNI: {al.dni} • Nivel: {al.nivel}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          {/* Apto Médico */}
                          <TableCell>
                            <Tooltip title={aptoInfo.label}>
                              <Chip
                                size="small"
                                icon={aptoInfo.icon}
                                label={aptoInfo.label}
                                color={aptoInfo.color}
                                variant="outlined"
                              />
                            </Tooltip>
                          </TableCell>

                          {/* Selector de Estado */}
                          <TableCell align="center">
                            <ToggleButtonGroup
                              size="small"
                              value={item.estado}
                              exclusive
                              onChange={(_, val) => handleStatusChange(al._id, val)}
                              aria-label="estado de asistencia"
                            >
                              <ToggleButton
                                value="presente"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&.Mui-selected": {
                                    bgcolor: "success.main",
                                    color: "common.white",
                                    "&:hover": { bgcolor: "success.dark" },
                                  },
                                }}
                              >
                                Presente
                              </ToggleButton>
                              <ToggleButton
                                value="ausente"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&.Mui-selected": {
                                    bgcolor: "error.main",
                                    color: "common.white",
                                    "&:hover": { bgcolor: "error.dark" },
                                  },
                                }}
                              >
                                Ausente
                              </ToggleButton>
                              <ToggleButton
                                value="justificada"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&.Mui-selected": {
                                    bgcolor: "warning.main",
                                    color: "common.white",
                                    "&:hover": { bgcolor: "warning.dark" },
                                  },
                                }}
                              >
                                Justificada
                              </ToggleButton>
                              <ToggleButton
                                value="recupero"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  "&.Mui-selected": {
                                    bgcolor: "info.main",
                                    color: "common.white",
                                    "&:hover": { bgcolor: "info.dark" },
                                  },
                                }}
                              >
                                Recupero
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>

                          {/* Campo de Nota */}
                          <TableCell sx={{ minWidth: 200 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Ej: Llegó tarde, dolor muscular..."
                              value={item.nota}
                              onChange={(e) => handleNotaChange(al._id, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Botones de Guardado al pie de la tabla */}
              <Box
                sx={{
                  p: 2.5,
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  onClick={() => handleSaveAttendance(false)}
                  sx={{ textTransform: "none", px: 3, fontWeight: 600 }}
                >
                  Guardar Progreso
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LockIcon />}
                  disabled={saving || turnoData.estado === "finalizado"}
                  onClick={() => setConfirmFinalizarOpen(true)}
                  sx={{ textTransform: "none", px: 3, fontWeight: 600 }}
                >
                  {turnoData.estado === "finalizado"
                    ? "Turno Ya Finalizado"
                    : "Guardar y Finalizar Turno"}
                </Button>
              </Box>
            </Paper>
          )}
        </Stack>
      )}

      {/* Modal Confirmar Cierre / Finalización */}
      <ConfirmDialog
        open={confirmFinalizarOpen}
        title="¿Finalizar el Turno?"
        content="Al finalizar el turno, todos los alumnos con reserva confirmada que no hayan sido registrados quedarán marcados como ausentes de forma automática, y el turno quedará cerrado."
        confirmText="Finalizar Turno"
        cancelText="Volver"
        confirmColor="primary"
        loading={saving}
        onConfirm={() => handleSaveAttendance(true)}
        onClose={() => setConfirmFinalizarOpen(false)}
      />

      {/* Feedback Snack */}
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

