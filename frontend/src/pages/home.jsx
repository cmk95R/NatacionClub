import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Chip,
  Alert,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import dayjs from "dayjs";

import { AuthContext } from "../context/AuthContext";
import { getTurnos } from "../api/turnos";
import { getAlumnos, getMisHijos } from "../api/alumnos";
import { getSedes } from "../api/sedes";
import { getMisReservas } from "../api/reservas";

// Iconos MUI
import PoolIcon from "@mui/icons-material/Pool";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    turnosHoy: 0,
    alumnosTotal: 0,
    sedesTotal: 0,
    misReservasActivas: 0,
    proximoTurno: null,
    hijos: [],
  });

  const rol = user?.rol || "alumno";
  const hoyStr = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);

        if (rol === "admin" || rol === "coordinador") {
          const [turnosRes, alumnosRes, sedesRes] = await Promise.allSettled([
            getTurnos({ desde: hoyStr, hasta: hoyStr }),
            getAlumnos({ activo: true }),
            getSedes({ activa: true }),
          ]);

          if (isMounted) {
            setStats({
              turnosHoy: turnosRes.value?.data?.turnos?.length || 0,
              alumnosTotal: alumnosRes.value?.data?.alumnos?.length || 0,
              sedesTotal: sedesRes.value?.data?.sedes?.length || 0,
              misReservasActivas: 0,
              proximoTurno: null,
              hijos: [],
            });
          }
        } else if (rol === "entrenador") {
          const turnosRes = await getTurnos({
            desde: hoyStr,
            hasta: hoyStr,
            entrenador: user._id,
          });

          if (isMounted) {
            setStats((prev) => ({
              ...prev,
              turnosHoy: turnosRes.data?.turnos?.length || 0,
            }));
          }
        } else if (rol === "tutor") {
          const [reservasRes, hijosRes] = await Promise.allSettled([
            getMisReservas({ estado: "confirmada" }),
            getMisHijos(),
          ]);

          const reservas = reservasRes.value?.data?.reservas || [];
          const hijos = hijosRes.value?.data?.alumnos || [];

          if (isMounted) {
            setStats((prev) => ({
              ...prev,
              misReservasActivas: reservas.length,
              proximoTurno: reservas[0]?.turno || null,
              hijos,
            }));
          }
        } else if (rol === "alumno") {
          const reservasRes = await getMisReservas({ estado: "confirmada" });
          const reservas = reservasRes.data?.reservas || [];

          if (isMounted) {
            setStats((prev) => ({
              ...prev,
              misReservasActivas: reservas.length,
              proximoTurno: reservas[0]?.turno || null,
            }));
          }
        }
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [rol, user, hoyStr]);

  // Tarjetas de módulos según el rol
  const getActionCards = () => {
    if (rol === "admin" || rol === "coordinador") {
      return [
        {
          title: "Sedes y Piletas",
          desc: "Administra las sedes, piletas y asignación de carriles deportivos.",
          icon: <LocationOnIcon sx={{ fontSize: 32, color: "#173487" }} />,
          path: "/admin/sedes",
          color: "#e8effe",
        },
        {
          title: "Plantillas de Horarios",
          desc: "Crea y modifica las grillas semanales por sede, nivel y cupos.",
          icon: <AccessTimeIcon sx={{ fontSize: 32, color: "#00796b" }} />,
          path: "/admin/horarios",
          color: "#e0f2f1",
        },
        {
          title: "Generador de Turnos",
          desc: "Genera instancias de turnos por rango de fechas de forma automática.",
          icon: <CalendarMonthIcon sx={{ fontSize: 32, color: "#c2185b" }} />,
          path: "/admin/turnos",
          color: "#fce4ec",
        },
        {
          title: "Padrón de Alumnos",
          desc: "Gestión de alumnos, niveles y control de vigencia de aptos médicos.",
          icon: <PeopleIcon sx={{ fontSize: 32, color: "#e65100" }} />,
          path: "/admin/alumnos",
          color: "#fff3e0",
        },
        {
          title: "Gestión de Tutores",
          desc: "Padrón de padres y tutores responsables con sus alumnos a cargo.",
          icon: <SupervisorAccountIcon sx={{ fontSize: 32, color: "#512da8" }} />,
          path: "/admin/tutores",
          color: "#ede7f6",
        },
      ];
    }

    if (rol === "entrenador") {
      return [
        {
          title: "Tomar Asistencia",
          desc: "Pasa lista en los turnos asignados a tu cargo para el día de hoy.",
          icon: <HowToRegIcon sx={{ fontSize: 32, color: "#173487" }} />,
          path: "/asistencia",
          color: "#e8effe",
        },
        {
          title: "Padrón de Alumnos",
          desc: "Consulta la ficha de alumnos, niveles y notas de entrenamiento.",
          icon: <PeopleIcon sx={{ fontSize: 32, color: "#e65100" }} />,
          path: "/alumnos",
          color: "#fff3e0",
        },
      ];
    }

    if (rol === "tutor") {
      return [
        {
          title: "Reservar Turno",
          desc: "Reserva vacantes en clases disponibles para tus hijos.",
          icon: <EventAvailableIcon sx={{ fontSize: 32, color: "#2e7d32" }} />,
          path: "/reservas/nueva",
          color: "#e8f5e9",
        },
        {
          title: "Mis Reservas",
          desc: "Consulta turnos confirmados, cancelaciones y lista de espera.",
          icon: <BookmarkBorderIcon sx={{ fontSize: 32, color: "#173487" }} />,
          path: "/reservas",
          color: "#e8effe",
        },
        {
          title: "Mis Hijos",
          desc: "Consulta la ficha deportiva y el estado de sus aptos médicos.",
          icon: <FamilyRestroomIcon sx={{ fontSize: 32, color: "#00796b" }} />,
          path: "/mis-hijos",
          color: "#e0f2f1",
        },
      ];
    }

    // Alumno
    return [
      {
        title: "Reservar Turno",
        desc: "Elige día y horario disponible para tu nivel de entrenamiento.",
        icon: <EventAvailableIcon sx={{ fontSize: 32, color: "#2e7d32" }} />,
        path: "/reservas/nueva",
        color: "#e8f5e9",
      },
      {
        title: "Mis Reservas",
        desc: "Revisa tus clases programadas y estado de tus reservas.",
        icon: <BookmarkBorderIcon sx={{ fontSize: 32, color: "#173487" }} />,
        path: "/reservas",
        color: "#e8effe",
      },
    ];
  };

  const actionCards = getActionCards();

  // Comprobar si hay algún hijo con apto médico vencido o próximo a vencer
  const aptosAlert = stats.hijos?.some((h) => {
    if (!h.aptoMedico?.vence) return true;
    return dayjs(h.aptoMedico.vence).diff(dayjs(), "day") < 15;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Banner Hero */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: "linear-gradient(135deg, #173487 0%, #2A4DB8 100%)",
          color: "white",
          mb: 4,
          boxShadow: "0 10px 25px rgba(23, 52, 135, 0.25)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              ¡Hola, {user?.nombre || "Bienvenido"}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {rol === "admin" && "Panel de control general y gestión operativa del club."}
              {rol === "coordinador" && "Coordinación deportiva, sedes y plantillas de turnos."}
              {rol === "entrenador" && "Control de entrenamientos y asistencia en pileta."}
              {rol === "tutor" && "Administración de turnos y actividades para tus hijos."}
              {rol === "alumno" && "Tus turnos de natación y actividades programadas."}
            </Typography>
          </Box>

          <Chip
            icon={<PoolIcon sx={{ color: "white !important" }} />}
            label={`Rol: ${rol.toUpperCase()}`}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 1,
              py: 2,
            }}
          />
        </Stack>
      </Box>

      {/* Alerta de Apto Médico para Tutores */}
      {rol === "tutor" && aptosAlert && (
        <Alert
          severity="warning"
          icon={<MedicalServicesIcon />}
          sx={{ mb: 4, borderRadius: 3 }}
        >
          Uno o más de tus hijos tienen el <strong>apto médico vencido o próximo a vencer</strong>. Recuerda renovarlo para poder continuar reservando turnos.
        </Alert>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(rol === "admin" || rol === "coordinador") && (
          <>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    TURNOS DE HOY
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#173487" sx={{ my: 1 }}>
                    {loading ? <Skeleton width={60} /> : stats.turnosHoy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Fecha: {dayjs().format("DD/MM/YYYY")}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    ALUMNOS ACTIVOS
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#00796b" sx={{ my: 1 }}>
                    {loading ? <Skeleton width={60} /> : stats.alumnosTotal}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Padrón general del club
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    SEDES EN OPERACIÓN
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#e65100" sx={{ my: 1 }}>
                    {loading ? <Skeleton width={60} /> : stats.sedesTotal}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Con piletas habilitadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {rol === "entrenador" && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: "#e8effe" }}>
              <CardContent>
                <Typography variant="body2" color="primary" fontWeight={700}>
                  TUS CLASES DE HOY
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#173487" sx={{ my: 1 }}>
                  {loading ? <Skeleton width={60} /> : `${stats.turnosHoy} turnos asignados`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ingresa a "Tomar Asistencia" para pasar lista en la pileta.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {(rol === "tutor" || rol === "alumno") && (
          <>
            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    RESERVAS ACTIVAS
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#173487" sx={{ my: 1 }}>
                    {loading ? <Skeleton width={60} /> : stats.misReservasActivas}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Clases confirmadas programadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    PRÓXIMO TURNO
                  </Typography>
                  {loading ? (
                    <Skeleton height={50} />
                  ) : stats.proximoTurno ? (
                    <Box sx={{ my: 1 }}>
                      <Typography variant="h6" fontWeight={700} color="#2e7d32">
                        {dayjs(stats.proximoTurno.fecha).format("DD/MM/YYYY")} - {stats.proximoTurno.horaInicio} hs
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estado: Confirmado
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                      No tienes turnos próximos reservados.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Título de Sección de Módulos */}
      <Typography variant="h6" fontWeight={700} color="#173487" sx={{ mb: 2 }}>
        Accesos Rápidos
      </Typography>

      {/* Grilla de Tarjetas de Acción */}
      <Grid container spacing={3}>
        {actionCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              sx={{
                borderRadius: 4,
                boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(card.path)}
                sx={{
                  p: 3,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 3,
                      backgroundColor: card.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    {card.icon}
                  </Box>

                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {card.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {card.desc}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mt: 3, color: "#173487", fontWeight: 700 }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    Ingresar
                  </Typography>
                  <ArrowForwardIcon fontSize="small" />
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
