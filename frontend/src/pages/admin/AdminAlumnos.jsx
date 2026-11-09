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
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import FilePresentIcon from "@mui/icons-material/FilePresent";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

import {
  getAlumnos,
  createAlumno,
  updateAlumno,
  deleteAlumno,
} from "../../api/alumnos";
import { getTutores } from "../../api/tutores";
import { getSedes } from "../../api/sedes";
import { uploadFile, getFileDownloadUrl } from "../../api/files";
import ConfirmDialog from "../../components/ConfirmDialog";
import LoadingLogo from "../../components/LoadingLogo";

const NIVELES = [
  { value: "iniciacion", label: "Iniciación", color: "info" },
  { value: "intermedio", label: "Intermedio", color: "success" },
  { value: "avanzado", label: "Avanzado", color: "warning" },
  { value: "competitivo", label: "Competitivo", color: "error" },
];

export default function AdminAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterSede, setFilterSede] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterActivo, setFilterActivo] = useState("true");

  // Modal Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    fechaNacimiento: "",
    telefono: "",
    tutorPrincipal: "",
    sede: "",
    nivel: "iniciacion",
    aptoVence: "",
    aptoArchivoId: "",
    accesoApp: false,
    pin: "",
    notas: "",
    activo: true,
  });

  // Confirmaciones y Notificaciones
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterSede) params.sede = filterSede;
      if (filterNivel) params.nivel = filterNivel;
      if (filterActivo) params.activo = filterActivo;

      const [alumnosRes, tutoresRes, sedesRes] = await Promise.all([
        getAlumnos(params),
        getTutores({ estado: "activo" }),
        getSedes({ activa: true }),
      ]);

      setAlumnos(alumnosRes.data?.alumnos || []);
      setTutores(tutoresRes.data?.tutores || []);
      setSedes(sedesRes.data?.sedes || []);
    } catch (err) {
      setSnack({
        open: true,
        msg: "Error cargando lista de alumnos",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filterSede, filterNivel, filterActivo]);

  // Cálculo de edad
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return null;
    return dayjs().diff(dayjs(fechaNac), "year");
  };

  const edadActual = calcularEdad(form.fechaNacimiento);
  const esMenor = edadActual !== null && edadActual < 18;

  // Estado del Apto Médico
  const getAptoInfo = (apto) => {
    if (!apto?.vence) {
      return { label: "Sin presentar", color: "error", icon: "🔴" };
    }
    const dias = dayjs(apto.vence).diff(dayjs(), "day");
    if (dias < 0) {
      return { label: `Vencido (${dayjs(apto.vence).format("DD/MM/YY")})`, color: "error", icon: "🔴" };
    }
    if (dias <= 30) {
      return { label: `Vence en ${dias} d`, color: "warning", icon: "🟡" };
    }
    return { label: `Vigente (${dayjs(apto.vence).format("DD/MM/YY")})`, color: "success", icon: "🟢" };
  };

  const handleOpenModal = (alumno = null) => {
    if (alumno) {
      setEditingAlumno(alumno);
      setForm({
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        dni: alumno.dni,
        fechaNacimiento: alumno.fechaNacimiento
          ? dayjs(alumno.fechaNacimiento).format("YYYY-MM-DD")
          : "",
        telefono: alumno.telefono || "",
        tutorPrincipal: alumno.tutorPrincipal?._id || alumno.tutorPrincipal || "",
        sede: alumno.sede?._id || alumno.sede || "",
        nivel: alumno.nivel || "iniciacion",
        aptoVence: alumno.aptoMedico?.vence
          ? dayjs(alumno.aptoMedico.vence).format("YYYY-MM-DD")
          : "",
        aptoArchivoId: alumno.aptoMedico?.archivoId || "",
        accesoApp: Boolean(alumno.accesoApp),
        pin: "",
        notas: alumno.notas || "",
        activo: alumno.activo,
      });
    } else {
      setEditingAlumno(null);
      setForm({
        nombre: "",
        apellido: "",
        dni: "",
        fechaNacimiento: "",
        telefono: "",
        tutorPrincipal: tutores[0]?._id || "",
        sede: sedes[0]?._id || "",
        nivel: "iniciacion",
        aptoVence: "",
        aptoArchivoId: "",
        accesoApp: false,
        pin: "",
        notas: "",
        activo: true,
      });
    }
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await uploadFile(file);
      setForm((prev) => ({
        ...prev,
        aptoArchivoId: res.data?.id,
      }));
      setSnack({ open: true, msg: "Apto médico subido correctamente", severity: "success" });
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al subir certificado médico",
        severity: "error",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (esMenor && !form.tutorPrincipal) {
      setSnack({
        open: true,
        msg: "Los alumnos menores de 18 años requieren obligatoriamente un tutor responsable",
        severity: "warning",
      });
      return;
    }

    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        dni: form.dni,
        fechaNacimiento: form.fechaNacimiento || null,
        telefono: form.telefono,
        tutorPrincipal: form.tutorPrincipal || null,
        sede: form.sede || null,
        nivel: form.nivel,
        aptoMedico: {
          vence: form.aptoVence || null,
          archivoId: form.aptoArchivoId || "",
        },
        accesoApp: form.accesoApp,
        notas: form.notas,
        activo: form.activo,
      };

      if (form.pin) {
        payload.pin = form.pin;
      }

      if (editingAlumno) {
        await updateAlumno(editingAlumno._id, payload);
        setSnack({ open: true, msg: "Alumno actualizado correctamente", severity: "success" });
      } else {
        await createAlumno(payload);
        setSnack({ open: true, msg: "Alumno dado de alta exitosamente", severity: "success" });
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al guardar alumno",
        severity: "error",
      });
    }
  };

  const handleDelete = (alumno) => {
    setSelectedAlumno(alumno);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAlumno) return;
    try {
      await deleteAlumno(selectedAlumno._id);
      setSnack({ open: true, msg: "Alumno dado de baja correctamente", severity: "success" });
      loadData();
    } catch (err) {
      setSnack({
        open: true,
        msg: err.response?.data?.message || "Error al dar de baja alumno",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setSelectedAlumno(null);
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
            Padrón de Alumnos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administración de alumnos, tutores responsables y control de aptos médicos
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
          Nuevo Alumno
        </Button>
      </Stack>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por Nombre, Apellido o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              select
              size="small"
              fullWidth
              label="Sede"
              value={filterSede}
              onChange={(e) => setFilterSede(e.target.value)}
            >
              <MenuItem value="">Todas las sedes</MenuItem>
              {sedes.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={3}>
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

          <Grid item xs={12} sm={2}>
            <TextField
              select
              size="small"
              fullWidth
              label="Estado"
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Activos</MenuItem>
              <MenuItem value="false">Inactivos</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla de Alumnos */}
      {loading ? (
        <LoadingLogo text="Cargando padrón de alumnos..." size={64} sx={{ py: 6 }} />
      ) : alumnos.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No se encontraron alumnos registrados con los criterios seleccionados.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Alumno</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DNI</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sede / Nivel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tutor Responsable</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apto Médico</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acceso App</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alumnos.map((a) => {
                const apto = getAptoInfo(a.aptoMedico);
                const nivelObj = NIVELES.find((n) => n.value === a.nivel);
                const edad = calcularEdad(a.fechaNacimiento);

                return (
                  <TableRow key={a._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {a.apellido}, {a.nombre}
                      </Typography>
                      {edad !== null && (
                        <Typography variant="caption" color="text.secondary">
                          {edad} años ({dayjs(a.fechaNacimiento).format("DD/MM/YYYY")})
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>{a.dni}</TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {a.sede?.nombre || "Sin sede"}
                      </Typography>
                      <Chip
                        label={nivelObj?.label || a.nivel}
                        color={nivelObj?.color || "default"}
                        size="small"
                        sx={{ mt: 0.5, fontWeight: 600 }}
                      />
                    </TableCell>

                    <TableCell>
                      {a.tutorPrincipal ? (
                        <>
                          <Typography variant="body2" fontWeight={600}>
                            {a.tutorPrincipal.nombre} {a.tutorPrincipal.apellido}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.tutorPrincipal.telefono || a.tutorPrincipal.email}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Mayor de edad (propio)
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={apto.label}
                          color={apto.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {a.aptoMedico?.archivoId && (
                          <Tooltip title="Descargar Certificado">
                            <IconButton
                              size="small"
                              component="a"
                              href={getFileDownloadUrl(a.aptoMedico.archivoId)}
                              target="_blank"
                              rel="noreferrer"
                              color="primary"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {a.accesoApp ? (
                        <Chip
                          icon={<VpnKeyIcon sx={{ fontSize: "14px !important" }} />}
                          label="PIN Activo"
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin acceso
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenModal(a)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(a)} color="error">
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

      {/* Modal Alta / Edición Alumno */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAlumno ? `Editar Alumno: ${editingAlumno.nombre} ${editingAlumno.apellido}` : "Nuevo Alumno"}
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Datos Personales */}
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

              <Grid item xs={12} sm={4}>
                <TextField
                  label="DNI"
                  required
                  fullWidth
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.fechaNacimiento}
                  onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </Grid>

              {/* Tutor Responsable */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required={esMenor}
                  label={`Tutor Principal ${esMenor ? "(Obligatorio por ser menor de 18)" : "(Opcional)"}`}
                  value={form.tutorPrincipal}
                  onChange={(e) => setForm({ ...form, tutorPrincipal: e.target.value })}
                  helperText={esMenor ? "Los menores de edad requieren tutor responsable" : ""}
                >
                  <MenuItem value="">Sin tutor asignado</MenuItem>
                  {tutores.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.apellido}, {t.nombre} ({t.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Sede y Nivel */}
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Sede Asignada"
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                >
                  {sedes.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Nivel"
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

              {/* Sección Apto Médico */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#173487" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <MedicalServicesIcon fontSize="small" /> Control de Apto Médico
                  </Typography>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Fecha de Vencimiento de Apto"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={form.aptoVence}
                        onChange={(e) => setForm({ ...form, aptoVence: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={7}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          startIcon={<UploadFileIcon />}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? "Subiendo..." : "Cargar Certificado (PDF/JPG)"}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,image/jpeg,image/png"
                            onChange={handleFileUpload}
                          />
                        </Button>

                        {form.aptoArchivoId && (
                          <Chip
                            icon={<FilePresentIcon />}
                            label="Certificado Adjunto"
                            color="success"
                            size="small"
                            onDelete={() => setForm({ ...form, aptoArchivoId: "" })}
                          />
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Acceso a la App */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.accesoApp}
                      onChange={(e) => setForm({ ...form, accesoApp: e.target.checked })}
                    />
                  }
                  label="Habilitar acceso directo a la app (alumnos mayores)"
                />
              </Grid>

              {form.accesoApp && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nuevo PIN Numérico (4 a 6 dígitos)"
                    size="small"
                    fullWidth
                    required={!editingAlumno}
                    placeholder="Ej. 1234"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    helperText={editingAlumno ? "Dejar en blanco para conservar el PIN actual" : "Requerido para el primer ingreso"}
                  />
                </Grid>
              )}

              {/* Notas */}
              <Grid item xs={12}>
                <TextField
                  label="Notas / Antecedentes médicos u observaciones"
                  multiline
                  rows={2}
                  fullWidth
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </Grid>

              {/* Estado */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                  }
                  label="Alumno Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#173487" }}>
              Guardar Alumno
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirmación */}
      <ConfirmDialog
        open={confirmOpen}
        title="Dar de baja Alumno"
        message={`¿Seguro que deseas dar de baja a ${selectedAlumno?.nombre} ${selectedAlumno?.apellido}?`}
        confirmColor="error"
        confirmText="Dar de baja"
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

