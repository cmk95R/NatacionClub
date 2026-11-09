# Base de proyecto — Gestión de Club de Natación

Documento de arranque para el nuevo proyecto. Sirve como punto de partida para agentes IA y desarrolladores. Deriva del proyecto Portal RRHH (React + Express + MongoDB), reutilizando su arquitectura y descartando el dominio de RRHH.

---

## 1. Contexto y objetivo

Sistema de gestión para un club / equipo de natación.

Objetivo: administrar alumnos, grupos, sedes, horarios y turnos, permitir reservas con control de cupo y registrar asistencia, con ficha médica y apto físico controlados.

Usuarios del sistema:

- Administración del club (rol `admin`)
- Coordinación deportiva (rol `coordinador`)
- Entrenadores (rol `entrenador`)
- Tutores / responsables de alumnos (rol `tutor`)
- Alumnos mayores con acceso propio (rol `alumno`, opcional)

---

## 2. Alcance

### Fase 1 (MVP)

- Alta, edición y baja lógica de alumnos y tutores
- Gestión de entrenadores
- Gestión de sedes, piletas y carriles
- Horarios (plantillas semanales) y generación de turnos por rango de fechas
- Reserva y cancelación de turnos con control de cupo
- Lista de espera cuando el turno está completo
- Registro de asistencia por turno
- Ficha del alumno y apto médico con fecha de vencimiento
- Feature flags de configuración (reservas abiertas, inscripciones abiertas, ventana de reserva)
- Autenticación mixta (email + password para staff y tutores; PIN para alumnos mayores)

### Fuera de alcance (Fase 1)

- Cuotas, pagos y estado de deuda
- PWA / app móvil nativa
- Notificaciones push
- Integraciones contables o de facturación
- Reportes avanzados y estadísticas históricas

---

## 3. Stack y convenciones

### Frontend

| Dependencia | Versión de referencia |
|---|---|
| react / react-dom | 19.x |
| vite | 7.x |
| @mui/material + icons | 7.x |
| emotion | 11.x |
| framer-motion | 12.x |
| axios | 1.x |
| react-router-dom | 7.x |
| dayjs | 1.x |

### Backend

| Dependencia | Versión de referencia |
|---|---|
| express | 4.x |
| mongoose | 8.x |
| jsonwebtoken | 9.x |
| bcryptjs | 2.x |
| express-validator | 7.x |
| multer | 2.x |
| helmet | última estable |
| express-rate-limit | última estable |
| express-mongo-sanitize | última estable |
| resend | 6.x |
| dotenv | 16.x |

### Convenciones

- Código e identificadores en inglés; textos de UI y mensajes de error de negocio en español.
- Componentes React en PascalCase; archivos de página en PascalCase; utilidades en camelCase.
- Modelos Mongoose en singular y PascalCase (`Alumno`, `Turno`).
- Rutas REST en plural y minúsculas (`/api/alumnos`, `/api/turnos`).
- Sin comentarios en el código salvo que aporten contexto no obvio.
- Fechas de calendario como `YYYY-MM-DD` en String cuando se usen como clave de negocio (turnos y asistencia); `Date` para timestamps.

---

## 4. Arquitectura de carpetas

```
backend/
  src/
    app.js
    db/db.js
    middleware/
      auth.middleware.js
      role.middleware.js
      upload.middleware.js
      validate.middleware.js
    models/
      User.js
      Tutor.js
      Alumno.js
      Sede.js
      Pileta.js
      Horario.js
      Turno.js
      Reserva.js
      Asistencia.js
      Config.js
    controllers/
    routes/
    services/
      email.service.js
      storage.service.js
      turnos.service.js
      cupo.service.js
    utils/
  uploads/            # archivos locales (aptos médicos, fotos)
  scripts/
    seed.js

frontend/
  public/
  src/
    api/
      client.js
      auth.js
      alumnos.js
      horarios.js
      turnos.js
      reservas.js
      asistencia.js
      config.js
    components/
      ProtectedRoute.jsx
      DashboardLayout.jsx
      SpinnerAsytec.jsx
      ConfirmDialog.jsx
    context/
      AuthContext.jsx
      AuthProvider.jsx
      ColorModeContext.jsx
      ColorModeProvider.jsx
    pages/
    theme.js
```

---

## 5. Modelo de datos

### User (staff)

```js
{
  nombre, apellido,
  email: { unique, lowercase },
  password: { select: false },       // hash bcrypt
  rol: ['admin','coordinador','entrenador'],
  telefono, foto,
  estado: ['activo','inactivo'],
  sedes: [ObjectId<Sede>],           // opcional, para entrenadores
  timestamps
}
```

### Tutor

```js
{
  nombre, apellido, email: { unique },
  password: { select: false },
  telefono,
  alumnos: [ObjectId<Alumno>],
  estado: ['activo','inactivo'],
  timestamps
}
```

### Alumno

```js
{
  nombre, apellido,
  dni: { unique, required },
  fechaNacimiento,
  telefono,
  tutorPrincipal: ObjectId<Tutor>,
  tutoresSecundarios: [ObjectId<Tutor>],
  sede: ObjectId<Sede>,
  nivel: ['iniciacion','intermedio','avanzado','competitivo'],
  aptoMedico: { vence: Date, archivoId: String },
  accesoApp: Boolean,                // default false
  pin: { select: false },            // hash, solo si accesoApp
  notas,
  activo: Boolean,
  timestamps
}
```

### Sede / Pileta

```js
// Sede
{ nombre, direccion, telefono, activa }

// Pileta
{ sede: ObjectId<Sede>, nombre, carriles: Number, activa }
```

### Horario (plantilla)

```js
{
  sede: ObjectId<Sede>,
  pileta: ObjectId<Pileta>,
  carril: Number,
  entrenador: ObjectId<User>,
  diaSemana: ['lunes',...,'domingo'],
  horaInicio: 'HH:mm',
  duracionMin: Number,
  cupoMax: Number,
  nivel,
  activo: Boolean,
  timestamps
}
```

### Turno (instancia fechada)

```js
{
  horario: ObjectId<Horario>,
  fecha: String,          // YYYY-MM-DD
  horaInicio: String,     // copia desnormalizada
  cupoMax: Number,
  cupoOcupado: Number,    // recalculado, no incrementado a ciegas
  estado: ['programado','suspendido','finalizado'],
  timestamps
}
// índice único: (horario, fecha)
```

### Reserva

```js
{
  alumno: ObjectId<Alumno>,
  turno: ObjectId<Turno>,
  estado: ['pendiente','confirmada','cancelada','asistio','ausente','recupero'],
  creadaPor: { tipo: ['tutor','alumno','staff'], ref: ObjectId },
  motivoCancelacion: String,
  timestamps
}
// índice único: (alumno, turno)
```

### Asistencia

```js
{
  turno: ObjectId<Turno>,
  alumno: ObjectId<Alumno>,
  estado: ['presente','ausente','justificada','recupero'],
  nota: String,
  registradoPor: ObjectId<User>,
  timestamps
}
// índice único: (turno, alumno)
```

### Config (feature flags)

```js
{
  key: { unique },      // 'reservas_abiertas' | 'inscripciones_abiertas' | 'ventana_reserva_dias'
  value: Mixed,
  timestamps
}
```

---

## 6. Roles y permisos

| Recurso | admin | coordinador | entrenador | tutor | alumno |
|---|---|---|---|---|---|
| Alumnos | CRUD | CRUD | leer | leer sus hijos | leer propio |
| Tutores | CRUD | CRUD | — | leer propio | — |
| Entrenadores | CRUD | leer | leer propio | — | — |
| Sedes / Piletas | CRUD | CRUD | leer | leer | leer |
| Horarios | CRUD | CRUD | leer | leer | leer |
| Turnos | CRUD | CRUD | leer sus turnos | leer | leer |
| Reservas | CRUD | CRUD | leer sus turnos | crear/cancelar sus hijos | crear/cancelar propias |
| Asistencia | CRUD | CRUD | CRUD sus turnos | leer sus hijos | leer propia |
| Config | CRUD | CRUD | — | — | — |

Reglas de autorización:

- Todo endpoint de escritura valida rol en el backend, no solo en el frontend.
- Todo endpoint que recibe un ID de alumno valida que el solicitante tenga relación con ese alumno (tutor, propio alumno, staff).
- Descarga de archivos valida ownership antes de servir el archivo.

---

## 7. Flujos clave

### 7.1 Alta de alumno

1. Staff o tutor crea el alumno con datos personales y tutor responsable.
2. Se asigna sede y nivel.
3. Opcionalmente se carga apto médico con fecha de vencimiento.
4. Si el alumno es mayor de edad puede habilitarse `accesoApp` con PIN.

### 7.2 Generación de turnos

1. Administración define Horarios (plantillas semanales).
2. Se genera un rango de fechas (`desde`, `hasta`).
3. Por cada Horario activo y cada fecha que coincida con su `diaSemana` se crea un Turno.
4. La operación es idempotente: no duplica turnos existentes para el mismo `(horario, fecha)`.

### 7.3 Reserva de turno

1. Tutor o alumno elige turno disponible.
2. Backend valida:
   - turno existe y está `programado`
   - reservas abiertas (`Config.reservas_abiertas`)
   - fecha dentro de la ventana permitida (`Config.ventana_reserva_dias`)
   - alumno activo y con relación válida con el solicitante
   - apto médico vigente (si la regla está activa)
   - nivel del alumno compatible con el turno
   - `cupoOcupado < cupoMax` (validación atómica)
3. Se crea la Reserva en estado `confirmada` y se recalcula `cupoOcupado`.

### 7.4 Cancelación

1. Tutor o alumno cancela dentro del plazo permitido.
2. Se marca Reserva como `cancelada` con motivo.
3. Se recalcula `cupoOcupado`.
4. Si hay lista de espera, se promueve el primer candidato.

### 7.5 Lista de espera

1. Si `cupoOcupado === cupoMax`, la reserva se guarda como `pendiente` con posición.
2. Al liberarse un cupo se promueve el primero a `confirmada`.

### 7.6 Asistencia

1. Entrenador abre el turno del día.
2. Marca presente / ausente / justificada por alumno.
3. Se guarda un documento de Asistencia por `(turno, alumno)`.
4. Al finalizar el turno se marca `finalizado` y las reservas sin asistencia pasan a `ausente`.

---

## 8. Reglas de negocio

- El cupo de un turno nunca se supera. Validación y actualización atómicas en backend.
- `cupoOcupado` se recalcula a partir de las reservas vigentes, no se incrementa a ciegas.
- Sin apto médico vigente no se permite reservar (configurable por flag).
- Alumno menor de 18 requiere tutor responsable.
- Cancelación permitida hasta N horas antes del turno (configurable).
- Un alumno no puede tener dos reservas activas para el mismo turno.
- Un alumno no puede tener dos reservas activas superpuestas en horario.
- Los turnos suspendidos no aceptan reservas nuevas y notifican a los reservantes.
- El nivel del alumno debe coincidir con el nivel del horario, salvo excepción autorizada por coordinación.

---

## 9. API REST

### Autenticación

```
POST   /api/auth/login              # email + password (staff/tutor)
POST   /api/auth/login-pin          # dni + pin (alumno)
POST   /api/auth/logout
GET    /api/auth/me
```

### Alumnos

```
GET    /api/alumnos                 # staff
GET    /api/alumnos/mis-hijos       # tutor
GET    /api/alumnos/:id
POST   /api/admin/alumnos
PUT    /api/admin/alumnos/:id
DELETE /api/admin/alumnos/:id       # baja lógica
```

### Catálogo

```
GET|POST|PUT|DELETE /api/admin/sedes
GET|POST|PUT|DELETE /api/admin/piletas
GET|POST|PUT|DELETE /api/admin/horarios
GET    /api/horarios                # lectura para tutores/alumnos
```

### Turnos

```
GET    /api/turnos?desde&hasta&sede&nivel
GET    /api/turnos/:id
POST   /api/admin/turnos/generar    # { horarioIds|sede, desde, hasta }
PATCH  /api/admin/turnos/:id/suspender
```

### Reservas

```
GET    /api/reservas/mias           # tutor o alumno
GET    /api/reservas/turno/:id      # staff / entrenador
POST   /api/reservas
DELETE /api/reservas/:id
```

### Asistencia

```
GET    /api/asistencia/turno/:turnoId        # entrenador / staff
POST   /api/asistencia/turno/:turnoId        # registro masivo
PATCH  /api/asistencia/:id
GET    /api/asistencia/alumno/:alumnoId      # tutor / staff
```

### Config

```
GET    /api/config/:key
PATCH  /api/admin/config/:key
```

### Archivos

```
POST   /api/files                  # multipart, devuelve { id }
GET    /api/files/:id              # protegido por ownership
DELETE /api/files/:id
```

---

## 10. Seguridad baseline

Obligatorio desde el primer commit.

- JWT en cookie `httpOnly; Secure; SameSite=Lax`. No usar `localStorage`.
- `helmet` con CSP configurada.
- `express-rate-limit` en `/api/auth/*` (5 intentos / 15 min por IP) y límite general por IP.
- `express-mongo-sanitize` activo globalmente.
- `express-validator` en todas las rutas de escritura.
- Validación de ownership en toda descarga de archivo y toda lectura de alumno/reserva.
- Secretos solo en `.env` del servidor. Nunca en el repo ni en el frontend.
- `JWT_SECRET` y `SESSION_SECRET` generados con `crypto.randomBytes(32).toString('hex')`.
- Sin fallbacks hardcodeados de secretos: si falta una variable crítica, el proceso no arranca.
- CORS con whitelist explícita por entorno. Rechazar origen nulo en producción.
- Subida de archivos: validar mimetype y extensión, límite de tamaño, nombre generado por el servidor.
- Guardar en base de datos antes de borrar cualquier archivo del storage.
- Logs de auditoría para login fallido, cambios de rol, cancelaciones y bajas.
- No exponer `err.message` interno en respuestas de producción.
- Backups diarios de base de datos y de `uploads/`.

---

## 11. UI/UX

- Tema MUI basado en el actual: primario `#173487`, tipografía Poppins/Raleway.
- `DashboardLayout` con sidebar filtrado por rol.
- Home con tarjetas de módulos, mismo estilo que el proyecto base.
- Grillas administrativas con `DataGrid` de MUI X.
- Confirmaciones destructivas con `Dialog`.
- Estado de carga con `SpinnerAsytec`.
- Mobile first: sidebar colapsable, tablas con scroll horizontal.
- Accesibilidad: contraste AA, foco visible, `aria-label` en acciones de icono.

---

## 12. Entornos y deploy

- `.env` separado por entorno (`development`, `production`).
- Variables requeridas: `MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`, `PORT`, `FRONTEND_URL`, `RESEND_API_KEY`, `UPLOAD_DIR`.
- Backend bajo PM2: `pm2 start src/app.js --name natacion-api`.
- Nginx como reverse proxy y servidor del build de Vite.
- MongoDB Atlas con IP allowlist.
- `uploads/` fuera del árbol servido estáticamente; acceso solo por endpoint protegido.
- Backup diario de `uploads/` y de la base.

---

## 13. Checklist de arranque

- [ ] Crear repositorio y estructura de carpetas backend / frontend
- [ ] Configurar `package.json` con dependencias fijadas
- [ ] Crear `.env.example` con todas las variables requeridas
- [ ] Implementar `theme.js`, `client.js`, `AuthProvider`, `ProtectedRoute`, `DashboardLayout`, `SpinnerAsytec`
- [ ] Implementar modelos con índices (`User`, `Tutor`, `Alumno`, `Sede`, `Pileta`, `Horario`, `Turno`, `Reserva`, `Asistencia`, `Config`)
- [ ] Implementar autenticación mixta (email+password, PIN para alumnos)
- [ ] Implementar middleware `requireAuth`, `requireRole`, validación y rate limit
- [ ] Implementar CRUD de sedes, piletas y horarios
- [ ] Implementar generador idempotente de turnos
- [ ] Implementar reservas con control de cupo atómico
- [ ] Implementar lista de espera y cancelación
- [ ] Implementar registro de asistencia por turno
- [ ] Implementar storage local y endpoint de archivos con ownership
- [ ] Implementar feature flags con `Config`
- [ ] Implementar ficha de alumno con vencimiento de apto médico
- [ ] Crear seed de datos de prueba (sedes, horarios, alumnos, tutores)
- [ ] Configurar PM2, Nginx y backups
- [ ] Smoke test de extremo a extremo en producción

---

## 14. Decisiones abiertas

- Recuperación de clases (make-up): ¿Fase 1 o Fase 2? Definir si consume cupo y cómo se contabiliza.
- Niveles: ¿catálogo fijo (`iniciacion`, `intermedio`, `avanzado`, `competitivo`) o configurable desde base?
- ¿Un alumno puede estar inscripto en más de un horario simultáneamente? Definir regla de exclusividad.
- ¿Notificaciones por email de reserva y cancelación en Fase 1? Hoy hay servicio de email disponible.
- ¿Se permite reserva desde el portal público sin login, o solo con cuenta?
- ¿Turnos se generan con anticipación fija (ej. 30 días) por cron, o manualmente desde administración?
