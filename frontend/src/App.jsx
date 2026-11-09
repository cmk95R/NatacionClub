import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ColorModeProvider from "./context/ColorModeProvider";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/home";
import Login from "./pages/login";
import Profile from "./pages/profile";

// Vistas Administrativas
import AdminSedes from "./pages/admin/AdminSedes";
import AdminHorarios from "./pages/admin/AdminHorarios";
import AdminTurnos from "./pages/admin/AdminTurnos";
import AdminAlumnos from "./pages/admin/AdminAlumnos";
import AdminTutores from "./pages/admin/AdminTutores";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminReservasPendientes from "./pages/admin/AdminReservasPendientes";

// Vistas de Operación, Reservas y Asistencia
import ReservarTurno from "./pages/ReservarTurno";
import MisReservas from "./pages/MisReservas";
import MisHijos from "./pages/MisHijos";
import TomarAsistencia from "./pages/TomarAsistencia";
import MisTurnosDisponibles from "./pages/entrenador/MisTurnosDisponibles";

function App() {
  return (
    <ColorModeProvider>
      <Routes>
        {/* Rutas protegidas dentro del DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />

            {/* Portal de Reservas (Tutores, Alumnos y Staff) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "coordinador", "tutor", "alumno"]}
                />
              }
            >
              <Route path="/reservas/nueva" element={<ReservarTurno />} />
              <Route path="/reservas" element={<MisReservas />} />
            </Route>

            {/* Gestión de Representados / Hijos (Tutores y Staff) */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin", "coordinador", "tutor"]} />
              }
            >
              <Route path="/mis-hijos" element={<MisHijos />} />
            </Route>

            {/* Panel de Profesores y Entrenadores */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "coordinador", "entrenador"]}
                />
              }
            >
              <Route path="/turnos-disponibles" element={<MisTurnosDisponibles />} />
              <Route path="/asistencia" element={<TomarAsistencia />} />
              <Route path="/alumnos" element={<AdminAlumnos />} />
            </Route>

            {/* Rutas de Configuración y Catálogo (Staff: admin y coordinador) */}
            <Route
              element={<ProtectedRoute allowedRoles={["admin", "coordinador"]} />}
            >
              <Route path="/admin/sedes" element={<AdminSedes />} />
              <Route path="/admin/horarios" element={<AdminHorarios />} />
              <Route path="/admin/turnos" element={<AdminTurnos />} />
              <Route path="/admin/alumnos" element={<AdminAlumnos />} />
              <Route path="/admin/tutores" element={<AdminTutores />} />
              <Route path="/admin/staff" element={<AdminStaff />} />
              <Route path="/admin/reservas-pendientes" element={<AdminReservasPendientes />} />
            </Route>
          </Route>
        </Route>

        {/* Ruta pública de acceso */}
        <Route path="/login" element={<Login />} />

        {/* Catchall */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ColorModeProvider>
  );
}

export default App;
