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
  Avatar,
  OutlinedInput,
  InputLabel,
  FormControl,
  Select,
  Checkbox,
  ListItemText,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SportsIcon from "@mui/icons-material/Sports";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

import { getStaff, createStaff, updateStaff, deleteStaff } from "../../api/staff";
import { getSedes } from "../../api/sedes";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

const ROLES = [
  { value: "entrenador", label: "Entrenador / Profesor", color: "secondary" },
  { value: "coordinador", label: "Coordinador", color: "info" },
  { value: "admin", label: "Administrador", color: "error" },
];

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterRol, setFilterRol] = useState("todos");
  const [filterSede, setFilterSede] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "entrenador",
    telefono: "",
    sedes: [],
    estado: "activo",
  });

  // Modal Confirmar Desactivación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRol !== "todos") params.rol = filterRol;
      if (filterSede !== "todas") params.sede = filterSede;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [staffRes, sedesRes] = await Promise.all([
        getStaff(params),
        getSedes({ activa: true }),
      ]);

      setStaffList(staffRes.data?.staff || []);
      setSedes(sedesRes.data?.sedes || []);
    } catch (err) {
      console.error(err);
      setSnack({
        open: true,
        msg: "Error cargando la lista del equipo y profesores",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterRol, filterSede]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
        password: "",
        rol: user.rol || "entrenador",
        telefono: user.telefono || "",
        sedes: user.sedes ? user.sedes.map((s) => s._id || s) : [],
        estado: user.estado || "activo",
      });
    } else {
      setEditingUser(null);
      setForm({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        rol: "entrenador",
        telefono: "",
        sedes: sedes.length > 0 ? [sedes[0]._id] : [],
        estado: "activo",
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateStaff(editingUser._id, form);
        setSnack({ open: true, msg: "Usuario actualizado con éxito", severity: "success" });
      } else {
        await createStaff(form);
        setSnack({ open: true, msg: "Usuario creado con éxito", severity: "success" });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al guardar el usuario",
        severity: "error",
      });
    }
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteStaff(selectedUser._id);
      setSnack({ open: true, msg: "Usuario desactivado correctamente", severity: "success" });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al desactivar el usuario",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSedesChange = (event) => {
    const {
      target: { value },
    } = event;
    setForm({
      ...form,
      sedes: typeof value === "string" ? value.split(",") : value,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SportsIcon sx={{ fontSize: 36, color: "primary.main" }} />
            <div>
              <Typography variant="h4" fontWeight={700}>
                Gestión de Entrenadores y Staff
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Administra profesores, coordinadores y su asignación a sedes del club.
              </Typography>
            </div>
          </Stack>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ textTransform: "none", fontWeight: 600, px: 3, py: 1 }}
        >
          Nuevo Integrante
        </Button>
      </Stack>

      {/* Barra de Filtros */}
      <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre, apellido o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Filtrar por Rol"
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
              >
                <MenuItem value="todos">Todos los roles</MenuItem>
                <MenuItem value="entrenador">Solo Entrenadores</MenuItem>
                <MenuItem value="coordinador">Solo Coordinadores</MenuItem>
                <MenuItem value="admin">Solo Administradores</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3} md={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Filtrar por Sede"
                value={filterSede}
                onChange={(e) => setFilterSede(e.target.value)}
              >
                <MenuItem value="todas">Todas las sedes</MenuItem>
                {sedes.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2} md={2}>
              <Button
                fullWidth
                variant="outlined"
                type="submit"
                startIcon={<FilterListIcon />}
                sx={{ textTransform: "none", height: 40 }}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Tabla de Usuarios */}
      {loading ? (
        <LoadingLogo text="Cargando profesores y staff..." size={64} sx={{ py: 6 }} />
      ) : staffList.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No se encontraron integrantes del equipo con los filtros aplicados.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre / Integrante</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Sedes Asignadas</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffList.map((user) => {
                const rolInfo = ROLES.find((r) => r.value === user.rol) || {
                  label: user.rol,
                  color: "default",
                };

                return (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: `${rolInfo.color}.main`, width: 40, height: 40 }}>
                          {user.nombre?.[0]}
                          {user.apellido?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {user.nombre} {user.apellido}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-6)}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      {user.telefono && (
                        <Typography variant="caption" color="text.secondary">
                          Tel: {user.telefono}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={rolInfo.label}
                        size="small"
                        color={rolInfo.color}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {user.sedes && user.sedes.length > 0 ? (
                          user.sedes.map((s) => (
                            <Chip
                              key={s._id || s}
                              icon={<LocationOnIcon fontSize="small" />}
                              label={s.nombre || "Sede"}
                              size="small"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Sin sedes asignadas
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.estado === "activo" ? "Activo" : "Inactivo"}
                        size="small"
                        color={user.estado === "activo" ? "success" : "default"}
                        variant={user.estado === "activo" ? "filled" : "outlined"}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenModal(user)}
                        title="Editar"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(user)}
                        title="Desactivar"
                      >
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

      {/* Modal Crear / Editar */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? "Editar Integrante del Staff" : "Nuevo Integrante del Staff"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Apellido"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Correo Electrónico"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required={!editingUser}
                  type="password"
                  label="Contraseña"
                  placeholder={editingUser ? "Dejar en blanco para no cambiar" : ""}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  helperText={editingUser ? "Solo completa si deseas cambiar la contraseña" : ""}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Rol"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono de Contacto"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </Grid>

              {/* Selector Múltiple de Sedes Asignadas */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="sedes-multiple-label">Sedes Asignadas</InputLabel>
                  <Select
                    labelId="sedes-multiple-label"
                    multiple
                    value={form.sedes}
                    onChange={handleSedesChange}
                    input={<OutlinedInput label="Sedes Asignadas" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((val) => {
                          const sedeDoc = sedes.find((s) => s._id === val);
                          return (
                            <Chip
                              key={val}
                              label={sedeDoc ? sedeDoc.nombre : val}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {sedes.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        <Checkbox checked={form.sedes.indexOf(s._id) > -1} />
                        <ListItemText primary={s.nombre} secondary={s.direccion} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.estado === "activo"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          estado: e.target.checked ? "activo" : "inactivo",
                        })
                      }
                      color="primary"
                    />
                  }
                  label="Usuario Activo"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar Desactivación */}
      <ConfirmDialog
        open={confirmOpen}
        title="¿Desactivar Usuario?"
        content={`¿Estás seguro de que deseas desactivar a ${selectedUser?.nombre} ${selectedUser?.apellido}? Ya no podrá ingresar al sistema ni tener nuevos turnos asignados.`}
        confirmText="Desactivar"
        cancelText="Volver"
        confirmColor="error"
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
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
