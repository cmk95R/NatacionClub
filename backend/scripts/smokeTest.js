import axios from "axios";

const BASE_URL = "http://localhost:3000/api";

async function runSmokeTest() {
  console.log("🧪 Iniciando Smoke Test de la API...");

  try {
    // 1. Health check
    const health = await axios.get("http://localhost:3000/health");
    console.log("✅ Health check:", health.data);

    // 2. Login de Admin (email + password)
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@clubnatacion.com",
      password: "admin123",
    });
    console.log("✅ Login Admin:", adminLogin.data.ok, "- Rol:", adminLogin.data.user.rol);
    const token = adminLogin.data.token;

    // 3. Login de Alumno con PIN
    const pinLogin = await axios.post(`${BASE_URL}/auth/login-pin`, {
      dni: "40555666",
      pin: "1234",
    });
    console.log("✅ Login PIN Alumno:", pinLogin.data.ok, "- Alumno:", pinLogin.data.user.nombre);

    // 4. Consultar /auth/me con el token
    const me = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ GET /auth/me:", me.data.user.nombre, me.data.user.apellido, `(${me.data.user.rol})`);

    // 5. Consultar sedes
    const sedes = await axios.get(`${BASE_URL}/sedes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ GET /sedes:", sedes.data.sedes.length, "sedes encontradas");

    // 6. Consultar turnos
    const turnos = await axios.get(`${BASE_URL}/turnos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ GET /turnos:", turnos.data.turnos.length, "turnos encontrados");

    // 7. Consultar configs
    const configs = await axios.get(`${BASE_URL}/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ GET /config:", configs.data.configs);

    // 8. Consultar staff y entrenadores
    const staff = await axios.get(`${BASE_URL}/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ GET /admin/staff:", staff.data.staff.length, "integrantes del staff encontrados");

    console.log("\n🚀 ¡TODOS LOS SMOKE TESTS PASARON EXITOSAMENTE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en Smoke Test:", err.response?.data || err.message);
    process.exit(1);
  }
}

runSmokeTest();

