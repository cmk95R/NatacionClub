import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import AutoModeIcon from "@mui/icons-material/AutoMode";

import { getTurnos, generarTurnos, suspenderTurno, deleteTurno } from "../../api/turnos";
import { getSedes } from "../../api/sedes";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

const NIVELES = [
  { value: "iniciacion", label: "Iniciación", color: "info" },
  { value: "intermedio", label: "Intermedio", color: "success" },
  { value: "avanzado", label: "Avanzado", color: "warning" },
  { value: "competitivo", label: "Competitivo", color: "error" },
];

export default function AdminTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generador Form
  const hoyStr = dayjs().format("YYYY-MM-DD");
  const en2SemanasStr = dayjs().add(21, "day").format("YYYY-MM-DD");

  const [genDesde, setGenDesde] = useState(hoyStr);
  const [genHasta, setGenHasta] = useState(en2SemanasStr);
  const [genSede, setGenSede] = useState("");
  const [grillaCompleta, setGrillaCompleta] = useState(true);

  // Filtros de Listado
  const [filterDesde, setFilterDesde] = useState(hoyStr);
  const [filterHasta, setFilterHasta] = useState(en2SemanasStr);
  const [filterSede, setFilterSede] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Modal Suspender
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [suspendMotivo, setSuspendMotivo] = useState("");

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [turnoToDelete, setTurnoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notificaciones
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDesde) params.desde = filterDesde;
      if (filterHasta) params.hasta = filterHasta;
      if (filterSede) params.sede = filterSede;
      if (filterNivel) params.nivel = filterNivel;
      if (filterEstado) params.estado = filterEstado;

      const [turnosRes, sedesRes] = await Promise.all([
        getTurnos(params),
        getSedes({ activa: true }),
      ]);

      setTurnos(turnosRes.data?.turnos || []);
      setSedes(sedesRes.data?.sedes || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error cargando turnos",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDesde, filterHasta, filterSede, filterNivel, filterEstado]);

  const handleGenerar = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const payload = {
        desde: genDesde,
        hasta: genHasta,
        grillaCompleta,
      };
      if (genSede) payload.sede = genSede;

      const res = await generarTurnos(payload);
      setSnack({
        open: true,
        msg: res.data?.message || "Turnos generados exitosamente",
        severity: "success",
      });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al generar turnos",
        severity: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenSuspendModal = (turno) => {
    setSelectedTurno(turno);
    setSuspendMotivo("Mantenimiento o causas de fuerza mayor");
    setSuspendModalOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedTurno) return;
    try {
      await suspenderTurno(selectedTurno._id, { motivo: suspendMotivo });
      setSnack({
        open: true,
        msg: "Turno suspendido y alumnos notificados correctamente",
        severity: "success",
      });
      setSuspendModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al suspender turno",
        severity: "error",
      });
    }
  };

  const handleOpenDelete = (turno) => {
    setTurnoToDelete(turno);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!turnoToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteTurno(turnoToDelete._id);
      setSnack({
        open: true,
        msg: res.data?.message || "Turno eliminado exitosamente",
        severity: "success",
      });
      setDeleteModalOpen(false);
      setTurnoToDelete(null);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al eliminar el turno",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#173487">
          Generador y Gestión de Turnos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generá turnos de 07:00 a 22:00 hs de lunes a domingo y gestioná o eliminá turnos existentes
        </Typography>
      </Box>

      {/* Card: Generador Automático */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          p: 2,
          background: "linear-gradient(135deg, #f0f4fa 0%, #e3e8f7 100%)",
          border: "1px solid #c8d4ee",
        }}
      >
        <Typography variant="h6" fontWeight={700} color="#173487" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <AutoModeIcon /> Generación Automática de Turnos (07:00 a 22:00 hs)
        </Typography>

        <Box component="form" onSubmit={handleGenerar}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Desde"
                type="date"
                size="small"
                fullWidth
                required
                value={genDesde}
                onChange={(e) => setGenDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Hasta"
                type="date"
                size="small"
                fullWidth
                required
                value={genHasta}
                onChange={(e) => setGenHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Sede (Opcional)"
                value={genSede}
                onChange={(e) => setGenSede(e.target.value)}
              >
                <MenuItem value="">Todas las Sedes</MenuItem>
                {sedes.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={generating}
                startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <CalendarMonthIcon />}
                sx={{
                  backgroundColor: "#173487",
                  "&:hover": { backgroundColor: "#122a6b" },
                  height: 40,
                  fontWeight: 700,
                }}
              >
                {generating ? "Generando..." : "Generar Turnos"}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={grillaCompleta}
                    onChange={(e) => setGrillaCompleta(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    <strong>Grilla completa de 07:00 a 22:00 hs:</strong> Asegura turnos cada hora de lunes a domingo.
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Filtros de Listado */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <TextField
              label="Desde"
              type="date"
              size="small"
              fullWidth
              value={filterDesde}
              onChange={(e) => setFilterDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Hasta"
              type="date"
              size="small"
              fullWidth
              value={filterHasta}
              onChange={(e) => setFilterHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              size="small"
              fullWidth
              label="Filtrar por Sede"
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {sedes.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <TextField
              select
              size="small"
              fullWidth
              label="Nivel"
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
            >
              <MenuItem value="">Todos los niveles</MenuItem>
              {NIVELES.map((n) => (
                <MenuItem key={n.value} value={n.value}>
                  {n.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <MenuItem value="">Todos los estados</MenuItem>
              <MenuItem value="programado">Programado</MenuItem>
              <MenuItem value="suspendido">Suspendido</MenuItem>
              <MenuItem value="finalizado">Finalizado</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Turnos */}
      {loading ? (
        <LoadingLogo text="Cargando turnos..." size={64} sx={{ py: 6 }} />
      ) : turnos.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No se encontraron turnos con los filtros aplicados. Podés utilizar el generador automático de arriba para crearlos.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f0f4fa" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#173487" }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#173487" }}>Sede / Pileta</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#173487" }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#173487" }}>Cupo Ocupado</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#173487" }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#173487" }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turnos.map((t) => {
                const cupoPerc = Math.min(100, Math.round((t.cupoOcupado / t.cupoMax) * 100));
                const nivelObj = NIVELES.find((n) => n.value === t.horario?.nivel);

                return (
                  <TableRow key={t._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {dayjs(t.fecha).format("DD/MM/YYYY")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.horaInicio} hs
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {t.horario?.sede?.nombre || "Sede"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.horario?.pileta?.nombre || "Pileta"} (Carril #{t.horario?.carril || 1})
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={nivelObj?.label || t.horario?.nivel || "Nivel"}
                        color={nivelObj?.color || "default"}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: "capitalize" }}
                      />
                    </TableCell>

                    <TableCell sx={{ minWidth: 140 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700}>
                          {t.cupoOcupado} / {t.cupoMax}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cupoPerc}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={cupoPerc}
                        color={cupoPerc >= 100 ? "error" : cupoPerc > 70 ? "warning" : "primary"}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={t.estado.toUpperCase()}
                        color={
                          t.estado === "programado"
                            ? "primary"
                            : t.estado === "suspendido"
                            ? "error"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {t.estado === "programado" && (
                          <Button
                            size="small"
                            color="warning"
                            startIcon={<BlockIcon />}
                            onClick={() => handleOpenSuspendModal(t)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                          >
                            Suspender
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => handleOpenDelete(t)}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Suspender Turno */}
      <Dialog
        open={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "warning.main" }}>
          Suspender Turno
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Esta acción suspenderá el turno del día <strong>{selectedTurno?.fecha}</strong> a las <strong>{selectedTurno?.horaInicio} hs</strong> y notificará por correo a los alumnos con reserva.
          </Typography>
          <TextField
            label="Motivo de Suspensión"
            multiline
            rows={3}
            fullWidth
            required
            value={suspendMotivo}
            onChange={(e) => setSuspendMotivo(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSuspendModalOpen(false)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmSuspend}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Confirmar Suspensión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Eliminar Turno */}
      <ConfirmDialog
        open={deleteModalOpen}
        loading={deleting}
        title="¿Eliminar Turno Definitivamente?"
        content={
          turnoToDelete
            ? `Vas a eliminar el turno del día ${dayjs(turnoToDelete.fecha).format("DD/MM/YYYY")} a las ${turnoToDelete.horaInicio} hs (${turnoToDelete.horario?.sede?.nombre || "Sede"}). Si hay alumnos con reservas o solicitudes para este turno, serán canceladas y notificadas.`
            : ""
        }
        confirmText="Eliminar Turno"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Snackbar */}
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
