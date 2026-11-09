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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import PoolIcon from "@mui/icons-material/Pool";

import {
  getSedes,
  createSede,
  updateSede,
  deleteSede,
  getPiletas,
  createPileta,
  updatePileta,
  deletePileta,
} from "../../api/sedes";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

export default function AdminSedes() {
  const [sedes, setSedes] = useState([]);
  const [piletas, setPiletas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [sedeModalOpen, setSedeModalOpen] = useState(false);
  const [editingSede, setEditingSede] = useState(null);
  const [sedeForm, setSedeForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    activa: true,
  });

  const [piletaModalOpen, setPiletaModalOpen] = useState(false);
  const [editingPileta, setEditingPileta] = useState(null);
  const [piletaForm, setPiletaForm] = useState({
    sede: "",
    nombre: "",
    carriles: 1,
    activa: true,
  });

  // Confirmaciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({ title: "", msg: "", action: null });

  // Snackbars
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sedesRes, piletasRes] = await Promise.all([getSedes(), getPiletas()]);
      setSedes(sedesRes.data?.sedes || []);
      setPiletas(piletasRes.data?.piletas || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error cargando sedes y piletas",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para Sede
  const handleOpenSedeModal = (sede = null) => {
    if (sede) {
      setEditingSede(sede);
      setSedeForm({
        nombre: sede.nombre,
        direccion: sede.direccion || "",
        telefono: sede.telefono || "",
        activa: sede.activa,
      });
    } else {
      setEditingSede(null);
      setSedeForm({ nombre: "", direccion: "", telefono: "", activa: true });
    }
    setSedeModalOpen(true);
  };

  const handleSaveSede = async (e) => {
    e.preventDefault();
    try {
      if (editingSede) {
        await updateSede(editingSede._id, sedeForm);
        setSnack({ open: true, msg: "Sede actualizada con éxito", severity: "success" });
      } else {
        await createSede(sedeForm);
        setSnack({ open: true, msg: "Sede creada con éxito", severity: "success" });
      }
      setSedeModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al guardar sede",
        severity: "error",
      });
    }
  };

  const handleDeleteSede = (sede) => {
    setConfirmData({
      title: "Deshabilitar Sede",
      msg: `¿Seguro que deseas deshabilitar la sede "${sede.nombre}"?`,
      action: async () => {
        try {
          await deleteSede(sede._id);
          setSnack({ open: true, msg: "Sede deshabilitada con éxito", severity: "success" });
          loadData();
        } catch (err) {
          setSnack({
            open: true,
            msg: err.response?.data?.message || "Error al deshabilitar sede",
            severity: "error",
          });
        }
      },
    });
    setConfirmOpen(true);
  };

  // Handlers para Pileta
  const handleOpenPiletaModal = (sedeId, pileta = null) => {
    if (pileta) {
      setEditingPileta(pileta);
      setPiletaForm({
        sede: pileta.sede?._id || pileta.sede,
        nombre: pileta.nombre,
        carriles: pileta.carriles,
        activa: pileta.activa,
      });
    } else {
      setEditingPileta(null);
      setPiletaForm({
        sede: sedeId,
        nombre: "",
        carriles: 6,
        activa: true,
      });
    }
    setPiletaModalOpen(true);
  };

  const handleSavePileta = async (e) => {
    e.preventDefault();
    try {
      if (editingPileta) {
        await updatePileta(editingPileta._id, piletaForm);
        setSnack({ open: true, msg: "Pileta actualizada con éxito", severity: "success" });
      } else {
        await createPileta(piletaForm);
        setSnack({ open: true, msg: "Pileta creada con éxito", severity: "success" });
      }
      setPiletaModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al guardar pileta",
        severity: "error",
      });
    }
  };

  const handleDeletePileta = (pileta) => {
    setConfirmData({
      title: "Deshabilitar Pileta",
      msg: `¿Deseas deshabilitar la pileta "${pileta.nombre}"?`,
      action: async () => {
        try {
          await deletePileta(pileta._id);
          setSnack({ open: true, msg: "Pileta deshabilitada con éxito", severity: "success" });
          loadData();
        } catch (err) {
          setSnack({
            open: true,
            msg: err.response?.data?.message || "Error al deshabilitar pileta",
            severity: "error",
          });
        }
      },
    });
    setConfirmOpen(true);
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
            Sedes y Piletas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administración del catálogo de infraestructura y carriles disponibles
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenSedeModal()}
          sx={{
            backgroundColor: "#173487",
            "&:hover": { backgroundColor: "#122a6b" },
            fontWeight: 700,
            borderRadius: 2.5,
          }}
        >
          Nueva Sede
        </Button>
      </Stack>

      {/* Listado de Sedes */}
      {loading ? (
        <LoadingLogo text="Cargando sedes y piletas..." size={64} sx={{ py: 6 }} />
      ) : sedes.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No hay sedes registradas aún. Haz clic en "Nueva Sede" para comenzar.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {sedes.map((sede) => {
            const sedePiletas = piletas.filter(
              (p) => (p.sede?._id || p.sede) === sede._id
            );

            return (
              <Grid item xs={12} key={sede._id}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1}
                      sx={{ mb: 1.5 }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            backgroundColor: "#e8effe",
                            color: "#173487",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <LocationOnIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {sede.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sede.direccion || "Sin dirección especificada"}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={sede.activa ? "Activa" : "Inactiva"}
                          color={sede.activa ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleOpenSedeModal(sede)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSede(sede)}
                          color="error"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    {sede.telefono && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}
                      >
                        <PhoneIcon fontSize="small" /> {sede.telefono}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Piletas asociadas */}
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} color="#173487">
                        Piletas ({sedePiletas.length})
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenPiletaModal(sede._id)}
                        sx={{ fontWeight: 600 }}
                      >
                        Agregar Pileta
                      </Button>
                    </Stack>

                    {sedePiletas.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        No hay piletas cargadas en esta sede.
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: "#f8fafc" }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Carriles</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>
                                Acciones
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sedePiletas.map((pileta) => (
                              <TableRow key={pileta._id}>
                                <TableCell>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <PoolIcon fontSize="small" color="action" />
                                    <Typography variant="body2" fontWeight={600}>
                                      {pileta.nombre}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>{pileta.carriles} carriles</TableCell>
                                <TableCell>
                                  <Chip
                                    label={pileta.activa ? "Habilitada" : "Inactiva"}
                                    color={pileta.activa ? "success" : "default"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenPiletaModal(sede._id, pileta)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeletePileta(pileta)}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal Sede */}
      <Dialog
        open={sedeModalOpen}
        onClose={() => setSedeModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingSede ? "Editar Sede" : "Nueva Sede"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveSede}>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField
                label="Nombre de la Sede"
                required
                fullWidth
                value={sedeForm.nombre}
                onChange={(e) => setSedeForm({ ...sedeForm, nombre: e.target.value })}
              />
              <TextField
                label="Dirección"
                fullWidth
                value={sedeForm.direccion}
                onChange={(e) => setSedeForm({ ...sedeForm, direccion: e.target.value })}
              />
              <TextField
                label="Teléfono"
                fullWidth
                value={sedeForm.telefono}
                onChange={(e) => setSedeForm({ ...sedeForm, telefono: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={sedeForm.activa}
                    onChange={(e) => setSedeForm({ ...sedeForm, activa: e.target.checked })}
                  />
                }
                label="Sede Activa"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSedeModalOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#173487" }}>
              Guardar Sede
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Modal Pileta */}
      <Dialog
        open={piletaModalOpen}
        onClose={() => setPiletaModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPileta ? "Editar Pileta" : "Nueva Pileta"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSavePileta}>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField
                label="Nombre de la Pileta"
                required
                fullWidth
                placeholder="Ej. Pileta Olímpica 50m"
                value={piletaForm.nombre}
                onChange={(e) => setPiletaForm({ ...piletaForm, nombre: e.target.value })}
              />
              <TextField
                label="Cantidad de Carriles"
                type="number"
                required
                fullWidth
                inputProps={{ min: 1, max: 20 }}
                value={piletaForm.carriles}
                onChange={(e) =>
                  setPiletaForm({ ...piletaForm, carriles: Number(e.target.value) })
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={piletaForm.activa}
                    onChange={(e) => setPiletaForm({ ...piletaForm, activa: e.target.checked })}
                  />
                }
                label="Pileta Habilitada"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPiletaModalOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#173487" }}>
              Guardar Pileta
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmData.title}
        message={confirmData.msg}
        confirmColor="error"
        confirmText="Confirmar"
        onConfirm={async () => {
          if (confirmData.action) await confirmData.action();
          setConfirmOpen(false);
        }}
        onClose={() => setConfirmOpen(false)}
      />

      {/* Notificaciones */}
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

