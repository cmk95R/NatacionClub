import React from "react";
import { Box, Typography, keyframes } from "@mui/material";
import PoolIcon from "@mui/icons-material/Pool";

// Animación de pulso acuático / ondas
const wavePulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(23, 52, 135, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 16px rgba(23, 52, 135, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(23, 52, 135, 0);
  }
`;

// Animación de balanceo suave para el ícono de natación
const swimBob = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(-3deg);
  }
`;

const shimmer = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

export default function LoadingLogo({
  text = "Cargando...",
  showTitle = true,
  fullScreen = false,
  size = 64,
  sx = {},
}) {
  const iconSize = Math.round(size * 0.56);

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 3,
        ...sx,
      }}
    >
      {/* Logo idéntico al Login con animación de onda */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#e8eef7",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#173487",
          border: "2px solid rgba(23, 52, 135, 0.15)",
          animation: `${wavePulse} 2s infinite ease-in-out`,
          mb: 1.5,
        }}
      >
        <PoolIcon
          sx={{
            fontSize: iconSize,
            animation: `${swimBob} 2s infinite ease-in-out`,
          }}
        />
      </Box>

      {/* Nombre del Club (igual que en Login) */}
      {showTitle && (
        <Typography
          variant="subtitle1"
          fontWeight={800}
          color="#173487"
          sx={{ letterSpacing: 0.5, mb: 0.2 }}
        >
          Club de Natación
        </Typography>
      )}

      {/* Texto de carga animado */}
      {text && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            animation: `${shimmer} 1.5s infinite ease-in-out`,
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100%",
          backgroundColor: (t) =>
            t.palette.mode === "light" ? "#f8fafc" : t.palette.background.default,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
}

