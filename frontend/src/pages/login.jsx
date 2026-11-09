import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Fade,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PoolIcon from "@mui/icons-material/Pool";
import PersonIcon from "@mui/icons-material/Person";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginPin, user } = useContext(AuthContext);

  const [tabIndex, setTabIndex] = useState(0); // 0: Staff & Tutores, 1: Alumnos
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Formulario Staff y Tutores
  const [staffForm, setStaffForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Formulario Alumnos
  const [alumnoForm, setAlumnoForm] = useState({ dni: "", pin: "" });
  const [showPin, setShowPin] = useState(false);

  const redirectTo =
    new URLSearchParams(location.search).get("redirectTo") || "/";

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!staffForm.email || !staffForm.password) {
      setErrorMessage("Por favor, ingresa tu email y contraseña");
      return;
    }

    setLoading(true);
    try {
      await login({
        email: staffForm.email.trim(),
        password: staffForm.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "No se pudo iniciar sesión. Verifique sus credenciales.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAlumnoSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!alumnoForm.dni || !alumnoForm.pin) {
      setErrorMessage("Por favor, ingresa tu DNI y PIN");
      return;
    }

    if (!/^\d{4,6}$/.test(alumnoForm.pin)) {
      setErrorMessage("El PIN debe ser numérico y contener entre 4 y 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      await loginPin({
        dni: alumnoForm.dni.trim(),
        pin: alumnoForm.pin.trim(),
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Credenciales inválidas o alumno sin acceso a la app.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, md: 8 },
        px: 2,
        background: "linear-gradient(135deg, #0e1e4a 0%, #173487 50%, #2A4DB8 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Logo y Encabezado */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#e8eef7",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                color: "#173487",
              }}
            >
              <PoolIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#173487">
              Club de Natación
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sistema de gestión, turnos y asistencias
            </Typography>
          </Box>

          {/* Selector de tipo de acceso */}
          <Tabs
            value={tabIndex}
            onChange={(_, val) => {
              setTabIndex(val);
              setErrorMessage("");
            }}
            variant="fullWidth"
            sx={{
              mb: 3,
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem",
              },
            }}
          >
            <Tab
              icon={<SupervisorAccountIcon fontSize="small" />}
              iconPosition="start"
              label="Staff / Tutores"
            />
            <Tab
              icon={<PersonIcon fontSize="small" />}
              iconPosition="start"
              label="Alumnos (PIN)"
            />
          </Tabs>

          {/* Mensaje de error si ocurre */}
          {errorMessage && (
            <Fade in>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {errorMessage}
              </Alert>
            </Fade>
          )}

          {/* TAB 0: Staff y Tutores */}
          {tabIndex === 0 && (
            <Fade in timeout={300}>
              <Box component="form" onSubmit={handleStaffSubmit} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    fullWidth
                    required
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Contraseña"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    required
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      backgroundColor: "#173487",
                      "&:hover": { backgroundColor: "#122a6b" },
                      borderRadius: 2.5,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </Stack>
              </Box>
            </Fade>
          )}

          {/* TAB 1: Alumnos */}
          {tabIndex === 1 && (
            <Fade in timeout={300}>
              <Box component="form" onSubmit={handleAlumnoSubmit} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    label="Número de DNI"
                    name="dni"
                    fullWidth
                    required
                    placeholder="Ej. 40555666"
                    value={alumnoForm.dni}
                    onChange={(e) =>
                      setAlumnoForm((prev) => ({
                        ...prev,
                        dni: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="PIN de Acceso"
                    name="pin"
                    type={showPin ? "text" : "password"}
                    fullWidth
                    required
                    placeholder="PIN numérico de 4 a 6 dígitos"
                    value={alumnoForm.pin}
                    onChange={(e) =>
                      setAlumnoForm((prev) => ({
                        ...prev,
                        pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPin(!showPin)}
                            edge="end"
                          >
                            {showPin ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      backgroundColor: "#173487",
                      "&:hover": { backgroundColor: "#122a6b" },
                      borderRadius: 2.5,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Ingresar con PIN"
                    )}
                  </Button>
                </Stack>
              </Box>
            </Fade>
          )}

          {/* Nota al pie */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              ¿Olvidaste tu contraseña o PIN? Consulta en administración o con tu entrenador.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
