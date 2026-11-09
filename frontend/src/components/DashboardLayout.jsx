import React, { useContext, useState, useRef, useEffect } from "react";
import { styled, useTheme } from "@mui/material/styles";
import {
  Box,
  Drawer as MuiDrawer,
  AppBar as MuiAppBar,
  Toolbar,
  List,
  CssBaseline,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Button,
  useScrollTrigger,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { AuthContext } from "../context/AuthContext";
import { ColorModeContext } from "../context/ColorModeContext";

// Iconos MUI
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import PoolIcon from "@mui/icons-material/Pool";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import SportsIcon from "@mui/icons-material/Sports";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";

const drawerWidth = 270;
const DRAWER_PINNED_KEY = "natacion-drawer-pinned";
const API_URL = import.meta.env.VITE_API_URL || "";

// === MIXINS PARA ESCRITORIO ===
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: "#173487",
    color: theme.palette.common.white,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      [theme.breakpoints.up("md")]: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    }),
  })
);

const DesktopDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
      ...openedMixin(theme),
      "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      "& .MuiDrawer-paper": closedMixin(theme),
    }),
  })
);

// Map de colores por rol
const ROLE_CHIPS = {
  admin: { label: "ADMIN", color: "error" },
  coordinador: { label: "COORDINADOR", color: "info" },
  entrenador: { label: "ENTRENADOR", color: "secondary" },
  tutor: { label: "TUTOR", color: "success" },
  alumno: { label: "ALUMNO", color: "warning" },
};

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [drawerPinned, setDrawerPinned] = useState(() => {
    try {
      return localStorage.getItem(DRAWER_PINNED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const drawerPinnedRef = useRef(drawerPinned);
  useEffect(() => {
    drawerPinnedRef.current = drawerPinned;
  }, [drawerPinned]);

  const desktopDrawerExpanded = drawerPinned || hoverOpen;
  const drawerOpen = isMobile ? mobileOpen : desktopDrawerExpanded;

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setHoverOpen((prev) => !prev);
    }
  };

  const handleDrawerPinToggle = (e) => {
    e.stopPropagation();
    const next = !drawerPinned;
    setDrawerPinned(next);
    drawerPinnedRef.current = next;
    try {
      localStorage.setItem(DRAWER_PINNED_KEY, String(next));
    } catch {
      /* ignore */
    }
    if (!isMobile) {
      setHoverOpen(next);
    }
  };

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // === MENÚS FILTRADOS SEGÚN EL ROL ===
  const getNavItems = () => {
    if (!user) {
      return [{ text: "Iniciar Sesión", icon: <PersonIcon />, path: "/login" }];
    }

    const rol = user.rol;

    // 1. Staff Directivo (Admin y Coordinador)
    if (rol === "admin" || rol === "coordinador") {
      return [
        { text: "Inicio", icon: <HomeIcon />, path: "/" },
        { text: "Sedes y Piletas", icon: <LocationOnIcon />, path: "/admin/sedes" },
        { text: "Plantillas de Horarios", icon: <AccessTimeIcon />, path: "/admin/horarios" },
        { text: "Generar Turnos", icon: <CalendarMonthIcon />, path: "/admin/turnos" },
        { text: "Padrón de Alumnos", icon: <PeopleIcon />, path: "/admin/alumnos" },
        { text: "Gestión de Tutores", icon: <SupervisorAccountIcon />, path: "/admin/tutores" },
        { text: "Profesores y Staff", icon: <SportsIcon />, path: "/admin/staff" },
        { text: "Solicitudes Pendientes", icon: <AssignmentTurnedInIcon />, path: "/admin/reservas-pendientes" },
        { text: "Turnos a Cubrir", icon: <EventAvailableIcon />, path: "/turnos-disponibles" },
        { text: "Tomar Asistencia", icon: <HowToRegIcon />, path: "/asistencia" },
        { text: "Mi Perfil", icon: <PersonIcon />, path: "/profile" },
      ];
    }

    // 2. Entrenadores
    if (rol === "entrenador") {
      return [
        { text: "Inicio", icon: <HomeIcon />, path: "/" },
        { text: "Turnos Disponibles", icon: <EventAvailableIcon />, path: "/turnos-disponibles" },
        { text: "Tomar Asistencia", icon: <HowToRegIcon />, path: "/asistencia" },
        { text: "Padrón de Alumnos", icon: <PeopleIcon />, path: "/alumnos" },
        { text: "Mi Perfil", icon: <PersonIcon />, path: "/profile" },
      ];
    }

    // 3. Tutores
    if (rol === "tutor") {
      return [
        { text: "Inicio", icon: <HomeIcon />, path: "/" },
        { text: "Reservar Turno", icon: <EventAvailableIcon />, path: "/reservas/nueva" },
        { text: "Mis Reservas", icon: <BookmarkBorderIcon />, path: "/reservas" },
        { text: "Mis Hijos", icon: <FamilyRestroomIcon />, path: "/mis-hijos" },
        { text: "Mi Perfil", icon: <PersonIcon />, path: "/profile" },
      ];
    }

    // 4. Alumnos (con app)
    if (rol === "alumno") {
      return [
        { text: "Inicio", icon: <HomeIcon />, path: "/" },
        { text: "Reservar Turno", icon: <EventAvailableIcon />, path: "/reservas/nueva" },
        { text: "Mis Reservas", icon: <BookmarkBorderIcon />, path: "/reservas" },
        { text: "Mi Perfil", icon: <PersonIcon />, path: "/profile" },
      ];
    }

    return [{ text: "Inicio", icon: <HomeIcon />, path: "/" }];
  };

  const navItems = getNavItems();

  const handleItemClick = (item) => {
    if (item.action === "logout") {
      logout();
      navigate("/login");
    } else if (item.path) {
      navigate(item.path);
    }
    if (isMobile) setMobileOpen(false);
  };

  // Contenido interno del Drawer
  const drawerContent = (
    <>
      <DrawerHeader sx={{ px: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              backgroundColor: "#173487",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PoolIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} color="#173487">
            Natación
          </Typography>
        </Stack>

        {!isMobile ? (
          <Tooltip title={drawerPinned ? "Desfijar menú" : "Fijar menú"}>
            <IconButton onClick={handleDrawerPinToggle} size="small" sx={{ color: "#173487" }}>
              {drawerPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton onClick={() => setMobileOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </DrawerHeader>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item, index) => {
          const isSelected = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ display: "block", my: 0.5 }}>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                selected={isSelected}
                sx={{
                  minHeight: 46,
                  justifyContent: drawerOpen || isMobile ? "initial" : "center",
                  px: 2,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: "#173487",
                    color: "white",
                    "&:hover": { backgroundColor: "#122a6b" },
                    "& .MuiListItemIcon-root": { color: "white" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: drawerOpen || isMobile ? 2.5 : "auto",
                    justifyContent: "center",
                    color: isSelected ? "white" : "#173487",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: drawerOpen || isMobile ? 1 : 0,
                    display: drawerOpen || isMobile ? "block" : "none",
                    fontWeight: isSelected ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  const roleInfo = user?.rol ? ROLE_CHIPS[user.rol] : null;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* === APP BAR === */}
      <AppBar position="fixed" open={drawerOpen} elevation={trigger ? 4 : 0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              ...(drawerOpen && !isMobile && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo y Nombre */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
              flexGrow: 1,
            }}
          >
            <PoolIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
              Club de Natación
            </Typography>
          </Box>

          {/* Acciones y Perfil */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Toggle Tema */}
            <Tooltip title={mode === "dark" ? "Modo Claro" : "Modo Oscuro"}>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                {/* Chip de Rol */}
                {roleInfo && (
                  <Chip
                    label={roleInfo.label}
                    color={roleInfo.color}
                    size="small"
                    sx={{ fontWeight: 700, display: { xs: "none", sm: "inline-flex" } }}
                  />
                )}

                {/* Nombre de usuario */}
                <Typography
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}
                >
                  {user.nombre}
                </Typography>

                {/* Avatar */}
                <Tooltip title="Cuenta">
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      {user.nombre ? user.nombre[0].toUpperCase() : "U"}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Menú Dropdown */}
                <Menu
                  anchorEl={anchorEl}
                  open={menuOpen}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate("/profile");
                    }}
                  >
                    <PersonIcon fontSize="small" sx={{ mr: 1.5, color: "action.active" }} />
                    Mi Perfil
                  </MenuItem>

                  <Divider />

                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: "error.main" }} />
                    <Typography color="error">Cerrar Sesión</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" onClick={() => navigate("/login")}>
                Ingresar
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* === DRAWER MÓVIL === */}
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            background: "linear-gradient(180deg, #f0f4fa 0%, #e3e8f7 100%)",
          },
        }}
      >
        {drawerContent}
      </MuiDrawer>

      {/* === DRAWER ESCRITORIO === */}
      <DesktopDrawer
        variant="permanent"
        open={desktopDrawerExpanded}
        onMouseEnter={() => !drawerPinnedRef.current && setHoverOpen(true)}
        onMouseLeave={() => !drawerPinnedRef.current && setHoverOpen(false)}
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            background: "linear-gradient(180deg, #f0f4fa 0%, #e3e8f7 100%)",
            overflowX: "hidden",
          },
        }}
      >
        {drawerContent}
      </DesktopDrawer>

      {/* === CONTENIDO PRINCIPAL === */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: (t) =>
            t.palette.mode === "light" ? "#f8fafc" : t.palette.background.default,
        }}
      >
        <DrawerHeader />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
