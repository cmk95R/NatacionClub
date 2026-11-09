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
  FormControlLabel,
  Switch,
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
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterListIcon from "@mui/icons-material/FilterList";

import {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
} from "../../api/horarios";
import { getSedes, getPiletas } from "../../api/sedes";
import { getStaff } from "../../api/staff";
import { poblarGrillaHorarios } from "../../api/turnos";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

const DIAS_SEMANA = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

const NIVELES = [
  { value: "iniciacion", label: "Iniciación", color: "info" },
  { value: "intermedio", label: "Intermedio", color: "success" },
  { value: "avanzado", label: "Avanzado", color: "warning" },
  { value: "competitivo", label: "Competitivo", color: "error" },
];

export default function AdminHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [piletas, setPiletas] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterSede, setFilterSede] = useState("");
  const [filterDia, setFilterDia] = useState("");
  const [filterNivel, setFilterNivel] = useState("");

  // Modal Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [form, setForm] = useState({
    sede: "",
    pileta: "",
    carril: 1,
    entrenador: "",
    diaSemana: "lunes",
    horaInicio: "18:00",
    duracionMin: 60,
    cupoMax: 6,
    nivel: "iniciacion",
    activo: true,
  });

  // Confirmaciones y Notificaciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSede) params.sede = filterSede;
      if (filterDia) params.diaSemana = filterDia;
      if (filterNivel) params.nivel = filterNivel;

      const [horariosRes, sedesRes, piletasRes, staffRes] = await Promise.all([
        getHorarios(params),
        getSedes({ activa: true }),
        getPiletas({ activa: true }),
        getStaff({ rol: "entrenador", estado: "activo" }),
      ]);

      setHorarios(horariosRes.data?.horarios || []);
      setSedes(sedesRes.data?.sedes || []);
      setPiletas(piletasRes.data?.piletas || []);
      setEntrenadores(staffRes.data?.staff || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error cargando horarios",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSede, filterDia, filterNivel]);

  const piletasFiltradas = piletas.filter(
    (p) => (p.sede?._id || p.sede) === form.sede
  );

  const entrenadoresDeSede = entrenadores.filter((coach) => {
    if (!form.sede) return true;
    if (!coach.sedes || coach.sedes.length === 0) return true;
    return coach.sedes.some((s) => (s._id || s) === form.sede);
  });

  const selectedPiletaDoc = piletas.find((p) => p._id === form.pileta);
  const maxCarriles = selectedPiletaDoc?.carriles || 1;

  const handleOpenModal = (horario = null) => {
    if (horario) {
      setEditingHorario(horario);
      setForm({
        sede: horario.sede?._id || horario.sede,
        pileta: horario.pileta?._id || horario.pileta,
        carril: horario.carril,
        entrenador: horario.entrenador?._id || horario.entrenador || "",
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio,
        duracionMin: horario.duracionMin,
        cupoMax: horario.cupoMax,
        nivel: horario.nivel,
        activo: horario.activo,
      });
    } else {
      setEditingHorario(null);
      const defaultSede = sedes[0]?._id || "";
      const defaultPiletas = piletas.filter((p) => (p.sede?._id || p.sede) === defaultSede);
      setForm({
        sede: defaultSede,
        pileta: defaultPiletas[0]?._id || "",
        carril: 1,
        entrenador: "",
        diaSemana: "lunes",
        horaInicio: "18:00",
        duracionMin: 60,
        cupoMax: 6,
        nivel: "iniciacion",
        activo: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingHorario) {
        await updateHorario(editingHorario._id, form);
        setSnack({ open: true, msg: "Horario actualizado con éxito", severity: "success" });
      } else {
        await createHorario(form);
        setSnack({ open: true, msg: "Horario creado con éxito", severity: "success" });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error guardando horario",
        severity: "error",
      });
    }
  };

  const handleDelete = (horario) => {
    setSelectedHorario(horario);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedHorario) return;
    try {
      await deleteHorario(selectedHorario._id);
      setSnack({ open: true, msg: "Horario deshabilitado con éxito", severity: "success" });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al deshabilitar horario",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setSelectedHorario(null);
    }
  };

  const [poblandoGrilla, setPoblandoGrilla] = useState(false);

  const handlePoblarGrilla = async () => {
    setPoblandoGrilla(true);
    try {
      const res = await poblarGrillaHorarios({ sedeId: filterSede || undefined });
      setSnack({
        open: true,
        msg: res.data?.message || "Grilla 07:00 a 22:00 L a D generada exitosamente",
        severity: "success",
      });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al poblar la grilla de horarios",
        severity: "error",
      });
    } finally {
      setPoblandoGrilla(false);
    }
  };

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
            Plantillas de Horarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Definición semanal recurrente por sede, pileta, carril y nivel
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handlePoblarGrilla}
            disabled={poblandoGrilla}
            sx={{
              fontWeight: 700,
              borderRadius: 2.5,
              textTransform: "none",
            }}
          >
            {poblandoGrilla ? "Creando Grilla..." : "⚡ Grilla Completa (07:00 a 22:00 L a D)"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              backgroundColor: "#173487",
              "&:hover": { backgroundColor: "#122a6b" },
              fontWeight: 700,
              borderRadius: 2.5,
            }}
          >
            Nuevo Horario
          </Button>
        </Stack>
      </Stack>

      {/* Barra de Filtros */}
      <Card sx={{ p: 2, mb: 4, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="body2" fontWeight={700}>
              Filtros:
            </Typography>
          </Box>

          <TextField
            select
            size="small"
            label="Sede"
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas las sedes</MenuItem>
            {sedes.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.nombre}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Día"
            value={filterDia}
            onChange={(e) => setFilterDia(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos los días</MenuItem>
            {DIAS_SEMANA.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Nivel"
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos los niveles</MenuItem>
            {NIVELES.map((n) => (
              <MenuItem key={n.value} value={n.value}>
                {n.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Card>

      {/* Grilla / Tabla de Horarios */}
      {loading ? (
        <LoadingLogo text="Cargando plantillas de horarios..." size={64} sx={{ py: 6 }} />
      ) : horarios.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No se encontraron horarios que coincidan con los filtros aplicados.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Día y Hora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sede / Pileta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Carril</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entrenador</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cupo Máx</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {horarios.map((h) => {
                const diaObj = DIAS_SEMANA.find((d) => d.value === h.diaSemana);
                const nivelObj = NIVELES.find((n) => n.value === h.nivel);

                return (
                  <TableRow key={h._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: "capitalize" }}>
                        {diaObj?.label || h.diaSemana}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                        <AccessTimeIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">{h.horaInicio} hs ({h.duracionMin} min)</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {h.sede?.nombre || "Sede"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {h.pileta?.nombre || "Pileta"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip label={`Carril #${h.carril}`} size="small" variant="outlined" />
                    </TableCell>

                    <TableCell>
                      {h.entrenador ? (
                        <Typography variant="body2" fontWeight={600}>
                          {h.entrenador.nombre} {h.entrenador.apellido}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin asignar
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={nivelObj?.label || h.nivel}
                        color={nivelObj?.color || "default"}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: "capitalize" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {h.cupoMax} alumnos
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={h.activo ? "Activo" : "Inactivo"}
                        color={h.activo ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenModal(h)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(h)} color="error">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Horario */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingHorario ? "Editar Plantilla de Horario" : "Nueva Plantilla de Horario"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Sede"
                  value={form.sede}
                  onChange={(e) => {
                    const newSede = e.target.value;
                    const newPiletas = piletas.filter(
                      (p) => (p.sede?._id || p.sede) === newSede
                    );
                    setForm({
                      ...form,
                      sede: newSede,
                      pileta: newPiletas[0]?._id || "",
                      carril: 1,
                    });
                  }}
                >
                  {sedes.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Pileta"
                  value={form.pileta}
                  onChange={(e) => setForm({ ...form, pileta: e.target.value, carril: 1 })}
                  disabled={!form.sede || piletasFiltradas.length === 0}
                >
                  {piletasFiltradas.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.nombre} ({p.carriles} carriles)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Día de la semana"
                  value={form.diaSemana}
                  onChange={(e) => setForm({ ...form, diaSemana: e.target.value })}
                >
                  {DIAS_SEMANA.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora de Inicio"
                  type="time"
                  required
                  fullWidth
                  value={form.horaInicio}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Carril"
                  type="number"
                  required
                  fullWidth
                  inputProps={{ min: 1, max: maxCarriles }}
                  helperText={`Máximo: ${maxCarriles}`}
                  value={form.carril}
                  onChange={(e) => setForm({ ...form, carril: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Duración (min)"
                  type="number"
                  required
                  fullWidth
                  inputProps={{ min: 15, step: 15 }}
                  value={form.duracionMin}
                  onChange={(e) => setForm({ ...form, duracionMin: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cupo Máximo"
                  type="number"
                  required
                  fullWidth
                  inputProps={{ min: 1 }}
                  value={form.cupoMax}
                  onChange={(e) => setForm({ ...form, cupoMax: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Nivel de Alumnos"
                  value={form.nivel}
                  onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                >
                  {NIVELES.map((n) => (
                    <MenuItem key={n.value} value={n.value}>
                      {n.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Entrenador / Profesor"
                  value={form.entrenador}
                  onChange={(e) => setForm({ ...form, entrenador: e.target.value })}
                  helperText={
                    entrenadoresDeSede.length === 0
                      ? "No hay entrenadores habilitados para esta sede"
                      : "Profesor que dictará la clase"
                  }
                >
                  <MenuItem value="">
                    <em>Sin asignar</em>
                  </MenuItem>
                  {entrenadoresDeSede.map((e) => (
                    <MenuItem key={e._id} value={e._id}>
                      {e.nombre} {e.apellido}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                  }
                  label="Horario Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#173487" }}>
              Guardar Horario
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirmación */}
      <ConfirmDialog
        open={confirmOpen}
        title="Deshabilitar Horario"
        message="¿Seguro que deseas deshabilitar esta plantilla de horario?"
        confirmColor="error"
        confirmText="Deshabilitar"
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
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

