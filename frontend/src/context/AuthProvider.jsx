import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { meApi, loginApi, loginPinApi, logoutApi } from "../api/auth.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Comprobar sesión al cargar la app
  useEffect(() => {
    meApi()
      .then(({ data }) => {
        if (data?.ok && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Login Email + Password (Staff y Tutores)
  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
    return data;
  };

  // Login PIN (Alumnos)
  const loginPin = async (credentials) => {
    const { data } = await loginPinApi(credentials);
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }
    setUser(data.user);
    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // Ignorar error de red al salir
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    loginPin,
    logout,
    isAuthenticated: Boolean(user),
    isAdmin: user?.rol === "admin",
    isCoordinador: user?.rol === "coordinador",
    isEntrenador: user?.rol === "entrenador",
    isTutor: user?.rol === "tutor",
    isAlumno: user?.rol === "alumno",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
