import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  InputAdornment,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LockIcon from "@mui/icons-material/Lock";

import {
  getTutores,
  createTutor,
  updateTutor,
  deleteTutor,
} from "../../api/tutores";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

export default function AdminTutores() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Modal Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    estado: "activo",
  });

  // Confirmaciones y Notificaciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterEstado) params.estado = filterEstado;

      const res = await getTutores(params);
      setTutores(res.data?.tutores || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error cargando tutores",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filterEstado]);

  const handleOpenModal = (tutor = null) => {
    if (tutor) {
      setEditingTutor(tutor);
      setForm({
        nombre: tutor.nombre,
        apellido: tutor.apellido,
        email: tutor.email,
        password: "",
        telefono: tutor.telefono || "",
        estado: tutor.estado || "activo",
      });
    } else {
      setEditingTutor(null);
      setForm({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        telefono: "",
        estado: "activo",
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!editingTutor && !form.password) {
      setSnack({ open: true, msg: "La contraseña es requerida para nuevos tutores", severity: "warning" });
      return;
    }

    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        estado: form.estado,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingTutor) {
        await updateTutor(editingTutor._id, payload);
        setSnack({ open: true, msg: "Tutor actualizado con éxito", severity: "success" });
      } else {
        await createTutor(payload);
        setSnack({ open: true, msg: "Tutor creado con éxito", severity: "success" });
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error guardando tutor",
        severity: "error",
      });
    }
  };

  const handleDelete = (tutor) => {
    setSelectedTutor(tutor);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTutor) return;
    try {
      await deleteTutor(selectedTutor._id);
      setSnack({ open: true, msg: "Tutor deshabilitado correctamente", severity: "success" });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al deshabilitar tutor",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setSelectedTutor(null);
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
            Gestión de Tutores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administración de padres y tutores con acceso al sistema de reservas
          </Typography>
        </Box>

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
          Nuevo Tutor
        </Button>
      </Stack>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 4, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar por Nombre, Apellido, Email o Teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
            }}
          />

          <TextField
            select
            size="small"
            label="Estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </TextField>
        </Stack>
      </Card>

      {/* Tabla de Tutores */}
      {loading ? (
        <LoadingLogo text="Cargando tutores..." size={64} sx={{ py: 6 }} />
      ) : tutores.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No se encontraron tutores registrados con los criterios seleccionados.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Tutor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contacto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Alumnos a Cargo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tutores.map((t) => (
                <TableRow key={t._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {t.apellido}, {t.nombre}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <EmailIcon fontSize="inherit" color="action" /> {t.email}
                      </Typography>
                      {t.telefono && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <PhoneIcon fontSize="inherit" color="action" /> {t.telefono}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {t.alumnos && t.alumnos.length > 0 ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {t.alumnos.map((alum) => (
                          <Chip
                            key={alum._id || alum}
                            icon={<FamilyRestroomIcon fontSize="small" />}
                            label={`${alum.nombre} ${alum.apellido}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        Sin alumnos asignados
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={t.estado === "activo" ? "Activo" : "Inactivo"}
                      color={t.estado === "activo" ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenModal(t)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(t)} color="error">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Tutor */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTutor ? "Editar Tutor" : "Nuevo Tutor Responsable"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  required
                  fullWidth
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  required
                  fullWidth
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Correo Electrónico"
                  type="email"
                  required
                  fullWidth
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contraseña"
                  type="password"
                  required={!editingTutor}
                  fullWidth
                  placeholder={editingTutor ? "Dejar en blanco para no cambiar" : "Contraseña inicial"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.estado === "activo"}
                      onChange={(e) =>
                        setForm({ ...form, estado: e.target.checked ? "activo" : "inactivo" })
                      }
                    />
                  }
                  label="Cuenta de Tutor Activa"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#173487" }}>
              Guardar Tutor
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirmación */}
      <ConfirmDialog
        open={confirmOpen}
        title="Deshabilitar Tutor"
        message={`¿Seguro que deseas deshabilitar la cuenta del tutor ${selectedTutor?.nombre} ${selectedTutor?.apellido}?`}
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

