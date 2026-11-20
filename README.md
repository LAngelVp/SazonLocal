# 🍲 SazónLocal

**Catálogo y directorio de restaurantes y negocios de comida local.**
Angular + Express + Google Sheets, desplegado como sitio estático + Serverless Function en Vercel. **Costo de infraestructura: $0.**

![SazónLocal](frontend/public/assets/logo-horizontal.png)

---

## 1. Características

- **Catálogo público** de negocios aprobados, con búsqueda instantánea por nombre, platillo, descripción, menú o zona.
- **Filtros en cliente** por localidad, tipo de negocio, tipo de comida, rango de precios y servicios.
- **Diseño responsive**: sidebar de filtros en escritorio y drawer deslizable en móvil.
- **Autenticación JWT** (24 h) con contraseñas encriptadas con bcrypt (10 rondas).
- **Registro y edición de negocios** protegidos, con previsualización en vivo de la tarjeta.
- **Panel "Mis negocios"**: cupo usado (2/5), edición y eliminación con confirmación.
- **Límite de 5 negocios por usuario**, validado en cliente y servidor.
- **Menú / platillos** (hasta 1500 caracteres) visible en una tarjeta expandible del catálogo.
- **Google Sheets como base de datos**, con caché en memoria de 30 s para cuidar la cuota de lectura.
- **WhatsApp y Google Maps** directos desde cada tarjeta.
- **Subida opcional de imágenes a ImgBB** (si configuras la API key) o simplemente pegando una URL.
- **Sin Angular Material ni librerías de UI**: sistema de diseño propio con CSS variables.

---

## 2. Estructura del repositorio

```
sazonLocal/
├── api/
│   ├── index.js                 # Entry point de Vercel → exporta la app de Express
│   └── [...path].js             # Catch-all de respaldo para /api/*
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js               # App Express (CORS, JSON, rutas, errores)
│       ├── server.js            # Arranque local (no se usa en Vercel)
│       ├── config/
│       │   ├── env.js           # Variables de entorno y validación
│       │   ├── googleSheets.js  # Cliente autenticado de Sheets
│       │   └── businessOptions.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── business.controller.js
│       │   └── upload.controller.js
│       ├── middlewares/
│       │   ├── verifyToken.js
│       │   ├── notFoundHandler.js
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   ├── business.routes.js
│       │   └── upload.routes.js
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── business.service.js
│       │   ├── sheets.service.js
│       │   └── cache.service.js
│       └── utils/
├── frontend/
│   ├── angular.json
│   ├── package.json
│   ├── public/assets/           # Logotipo, favicon e imágenes
│   └── src/
│       ├── styles.scss          # Variables CSS y sistema de diseño
│       ├── environments/
│       └── app/
│           ├── app.config.ts
│           ├── app.routes.ts
│           ├── core/            # Modelos, servicios, guards, interceptor
│           ├── features/
│           │   ├── home/        # Navbar, sidebar, cards y catálogo
│           │   ├── auth/        # Modal login / registro
│           │   ├── business-form/ # Crear y editar negocio + preview
│           │   └── my-businesses/ # Panel, cupo, edición y borrado
│           └── shared/
├── vercel.json
├── package.json                 # Workspaces + script de build
├── .env.example
└── README.md
```

---

## 3. Identidad visual

Paleta extraída de `PaletaColores.ase` y aplicada en `frontend/src/styles.scss`:

| Rol | Hex | Uso |
| --- | --- | --- |
| Primario | `#F23E2E` | CTAs, acentos, badges |
| Primario hover | `#D92F21` | Estados hover |
| Secundario | `#F2A03D` | Chips de comida, detalles |
| Acento suave | `#F28379` | Superficies y decoración |
| Texto principal | `#1C2126` | Títulos y cuerpo |
| Fondo | `#F7F5F2` | Fondo general |
| Superficie | `#FFFFFF` | Cards, modales, paneles |
| Texto secundario | `#66707A` | Descripciones y ayudas |
| Borde | `#E8E3DC` | Bordes de 1 px |

Tipografía: **Plus Jakarta Sans** (Google Fonts), con `Inter` como fallback.

Logotipo: `SazonLocalLogo.jpg` original en la raíz. Se generaron dos recortes optimizados para la UI:

- `frontend/public/assets/logo-horizontal.png` — navbar y footer.
- `frontend/public/assets/logo-icon.png` — icono, hero y favicon visual.

Los colores se controlan desde un único bloque `:root`; cámbialos ahí y toda la app se actualiza.

---

## 4. Configurar Google Sheets (base de datos)

### 4.1 Crear el spreadsheet

1. Crea un Google Sheets nuevo (por ejemplo **SazónLocal DB**).
2. Renombra la primera pestaña a **`Usuarios`**.
3. Crea una segunda pestaña llamada **`Negocios`**.
4. En la **fila 1** de cada pestaña pega exactamente estos encabezados, uno por celda (sin espacios extra):

**Usuarios**

| A | B | C | D | E | F | G |
| --- | --- | --- | --- | --- | --- | --- |
| `id_usuario` | `nombre_completo` | `email` | `password_hash` | `telefono` | `fecha_registro` | `activo` |

**Negocios** (17 columnas)

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `id_negocio` | `id_usuario` | `nombre_negocio` | `localidad` | `colonia_direccion` | `tipo_negocio` | `tipo_comida` | `descripcion` | `rango_precios` | `horario` | `whatsapp_telefono` | `url_imagen` | `enlace_maps` | `servicios` | `estado_publicacion` | `fecha_creacion` | `menu` |

> El backend valida los encabezados al leer. Si falta alguno, responde con un error indicando cuál.
> Deja las filas siguientes vacías: la app agrega registros automáticamente.

#### Migración de un Sheet existente (agregar `menu`)

Si ya tenías la pestaña `Negocios` con 16 columnas (A–P), **no reordenes nada**. Solo agrega una columna al final:

1. Escribe `menu` exactamente en la celda **Q1**.
2. Deja **Q2 en adelante vacío**; las filas existentes seguirán funcionando con menú vacío.
3. Si tu hoja tiene datos más allá de la columna P, inserta la columna Q antes de esos datos para no desplazarlos.

`id_usuario` (columna B) **es el ownerId** del negocio: no hace falta una columna nueva. Es el campo que el backend compara con el `id_usuario` del JWT para permitir editar o eliminar.

### 4.2 Crear la Service Account

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto (o usa uno existente).
3. Habilita la **Google Sheets API**: *APIs y servicios → Biblioteca → Google Sheets API → Habilitar*.
4. Ve a *APIs y servicios → Credenciales → Crear credenciales → Cuenta de servicio*.
5. Asígnale un nombre (ej. `sazon-local-sheets`) y crea la cuenta sin roles adicionales.
6. Abre la cuenta de servicio → pestaña **Claves** → *Agregar clave → Crear clave nueva → JSON*.
7. Descarga el JSON. De ahí salen:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`
   - `project_id` (informativo)
8. Copia el `client_email` y **comparte el spreadsheet** con ese correo como **Editor** (botón *Compartir* del Sheet).

### 4.3 Obtener el ID del spreadsheet

En la URL del Sheet:

```
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit#gid=0
```

`GOOGLE_SHEET_ID` es el valor entre `/d/` y `/edit`.

---

## 5. Desarrollo local

### Requisitos

- Node.js **20+** (recomendado 20 LTS).
- npm 10+.
- Una cuenta de Google con acceso al Sheet.

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/sazonLocal.git
cd sazonLocal

# 2. Instala todas las dependencias (workspaces: frontend + backend)
npm install

# 3. Crea tu .env a partir del ejemplo
cp .env.example .env
# En Windows PowerShell: Copy-Item .env.example .env

# 4. Completa .env con tus credenciales reales
```

`.env` (raíz del proyecto):

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200

GOOGLE_SHEET_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"

JWT_SECRET=una-cadena-larga-aleatoria-de-minimo-32-caracteres
JWT_EXPIRES_IN=24h
AUTO_APPROVE_BUSINESS=APROBADO
BUSINESSES_CACHE_TTL_MS=30000

# Opcional: subida directa de imágenes
IMGBB_API_KEY=
```

> **Nota sobre `GOOGLE_PRIVATE_KEY`:** el valor debe ir entre comillas dobles y conservar los `\n` literales. El backend los convierte en saltos de línea reales al arrancar.
> Puedes generar un secreto con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### Arrancar frontend y backend

En dos terminales:

```bash
# Terminal 1 — API en http://localhost:3000
npm run dev:backend

# Terminal 2 — Angular en http://localhost:4200
npm run dev:frontend
```

Angular usa `src/environments/environment.development.ts` → `http://localhost:3000/api`.
El build de producción usa `environment.ts` → `/api` (mismo dominio en Vercel).

### Verificar la API

```bash
curl http://localhost:3000/api/health
# {"status":"ok","service":"sazon-local-api","timestamp":"..."}

curl http://localhost:3000/api/businesses
# [] o la lista de negocios APROBADOS
```

---

## 6. Scripts disponibles

Desde la raíz:

| Comando | Descripción |
| --- | --- |
| `npm install` | Instala backend + frontend (npm workspaces). |
| `npm run build` | Compila Angular en `frontend/dist/sazon-local/browser`. |
| `npm run dev:backend` | API Express con nodemon. |
| `npm run dev:frontend` | Angular dev server en `:4200`. |
| `npm run start:backend` | API sin nodemon (producción local). |

---

## 7. API

Base: `/api`

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Estado del servicio. |
| `POST` | `/auth/register` | — | Crea usuario, encripta contraseña y devuelve JWT. |
| `POST` | `/auth/login` | — | Login; valida `activo = TRUE` y devuelve JWT (24 h). |
| `GET` | `/auth/me` | Bearer | Devuelve el usuario del token. |
| `GET` | `/businesses` | — | Negocios `APROBADO` con caché de 30 s. |
| `GET` | `/businesses/mine` | Bearer | Negocios del usuario (incluye pendientes). |
| `POST` | `/businesses` | Bearer | Crea un negocio (máximo 5 por usuario). |
| `PUT` | `/businesses/:id` | Bearer | Edita un negocio propio. |
| `DELETE` | `/businesses/:id` | Bearer | Elimina un negocio propio y borra su fila del Sheet. |
| `POST` | `/uploads/image` | Bearer | Sube imagen a ImgBB (opcional). |

### Reglas de validación del negocio

**Campos obligatorios** (backend y formulario):

| Campo | Regla |
| --- | --- |
| `nombre_negocio` | Obligatorio, 3–120 caracteres. |
| `tipo_negocio` | Obligatorio, catálogo permitido. |
| `tipo_comida` | Obligatorio, catálogo permitido. |
| `localidad` | Obligatoria, hasta 80 caracteres. |
| `colonia_direccion` | Obligatoria (dirección/ubicación), hasta 200 caracteres. |
| `descripcion` | Obligatoria, 20–700 caracteres. |
| `horario` | Obligatorio, hasta 160 caracteres. |
| `whatsapp_telefono` | Obligatorio, 10–15 dígitos con lada del país. |
| `menu` | Opcional, máximo 1500 caracteres. |

Otros errores de negocio:

| Código | HTTP | Cuándo ocurre |
| --- | --- | --- |
| `BUSINESS_LIMIT_REACHED` | 400 | El usuario ya tiene 5 negocios: *"Has alcanzado el límite máximo de 5 negocios registrados por usuario."* |
| `FORBIDDEN` | 403 | Intenta editar o eliminar un negocio de otro usuario. |
| `BUSINESS_NOT_FOUND` | 404 | El `id_negocio` no existe. |
| `MENU_TOO_LONG` | 400 | El menú supera 1500 caracteres. |

### Flujo de eliminación

1. El usuario entra a **Mis negocios** (`/mi-panel`) desde el menú de su cuenta.
2. Pulsa **Eliminar** en una ficha propia y confirma en el diálogo.
3. El frontend envía `DELETE /api/businesses/:id` con el JWT.
4. El backend compara `id_usuario` del negocio contra el `id` del token: si no coincide, responde `403`.
5. Si coincide, usa `spreadsheets.batchUpdate` + `deleteDimension` para **eliminar físicamente la fila** (sin dejar huecos).
6. Se invalida el caché del catálogo y la tarjeta desaparece del panel.

### Límite de negocios

- Se cuentan **todos** los negocios del usuario, sin importar su estado (`APROBADO`, `PENDIENTE` o `RECHAZADO`).
- El servidor rechaza la creación número 6 con `400 BUSINESS_LIMIT_REACHED`.
- El frontend muestra el cupo (`2 / 5 negocios registrados`), deshabilita el CTA y bloquea el formulario al llegar a 5.
- Al eliminar un negocio se libera un espacio de inmediato.

### Rutas del frontend

| Ruta | Descripción |
| --- | --- |
| `/` | Catálogo público, filtros y tarjetas expandibles con menú. |
| `/registrar-negocio` | Formulario de creación (protegido; bloqueado si el cupo está lleno). |
| `/mi-panel` | Panel de negocios del usuario, cupo y acciones. |
| `/mi-panel/editar/:id` | Edición de un negocio propio (protegido). |

### Ejemplos

```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre_completo":"María Hernández","email":"maria@ejemplo.com","password":"secreto123","telefono":"3312345678"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@ejemplo.com","password":"secreto123"}'

# Crear negocio
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "nombre_negocio":"Taquería El Buen Sazón",
    "localidad":"Zapopan",
    "colonia_direccion":"Col. Americana, Av. Hidalgo 123",
    "tipo_negocio":"Restaurante",
    "tipo_comida":"Mexicana",
    "descripcion":"Tacos al pastor, quesadillas y salsas de la casa.",
    "menu":"Menú del día\n- Tacos al pastor · $45\n- Quesadillas · $35\n- Agua fresca · $20",
    "rango_precios":"$",
    "horario":"Lun a Sáb, 9:00 – 21:00",
    "whatsapp_telefono":"5213312345678",
    "url_imagen":"https://i.ibb.co/ejemplo/foto.jpg",
    "enlace_maps":"https://maps.app.goo.gl/ejemplo",
    "servicios":"Comedor, Para llevar"
  }'

# Editar negocio propio
curl -X PUT http://localhost:3000/api/businesses/NEG-XXXX \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"menu":"Nuevo menú del día\n- Tostadas · $40"}'

# Eliminar negocio propio (borra la fila del Sheet)
curl -X DELETE http://localhost:3000/api/businesses/NEG-XXXX \
  -H "Authorization: Bearer TU_TOKEN"
```

Todas las respuestas de error siguen el formato:

```json
{ "error": { "message": "Mensaje legible", "code": "CODIGO_INTERNO" } }
```

---

## 8. Despliegue en Vercel

### 8.1 Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "feat: SazónLocal catálogo con Angular + Express + Google Sheets"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sazonLocal.git
git push -u origin main
```

> `.env` está en `.gitignore`: **nunca** subas credenciales.

### 8.2 Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new) e importa el repositorio.
2. **Framework Preset:** `Other`.
3. **Root Directory:** `./` (la raíz del repo).
4. Vercel leerá `vercel.json`:
   - **Build Command:** `npm run build`
   - **Output Directory:** `frontend/dist/sazon-local/browser`
   - **Install Command:** `npm install`
5. No cambies esos valores.
6. Agrega las **Environment Variables** (sección 8.3) antes de desplegar.
7. Pulsa **Deploy**.

`vercel.json` también define:

- `/api/(.*)` → función `/api/index.js` conservando la subruta mediante el parámetro interno `__vercel_path` (el backend reconstruye la URL antes de enrutar).
- Cualquier otra ruta → `/index.html` (SPA de Angular).
- Los archivos estáticos del build se sirven antes que los rewrites.
- `api/[...path].js` actúa como catch-all de respaldo para `/api/*`.

### 8.3 Variables de entorno en Vercel

*Project → Settings → Environment Variables* (marca **Production**, **Preview** y **Development**):

| Variable | Valor | Obligatoria |
| --- | --- | --- |
| `GOOGLE_SHEET_ID` | ID del spreadsheet | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` del JSON | ✅ |
| `GOOGLE_PRIVATE_KEY` | `private_key` completa (con `\n`) | ✅ |
| `JWT_SECRET` | Cadena aleatoria ≥ 32 caracteres | ✅ |
| `JWT_EXPIRES_IN` | `24h` | Recomendada |
| `AUTO_APPROVE_BUSINESS` | `APROBADO` o `PENDIENTE` | Recomendada |
| `BUSINESSES_CACHE_TTL_MS` | `30000` | Opcional |
| `CORS_ORIGIN` | `https://tu-dominio.vercel.app` | Opcional |
| `IMGBB_API_KEY` | API key de ImgBB | Opcional |
| `NODE_ENV` | `production` | Recomendada |

**Cómo pegar la clave privada en Vercel:**

1. Abre el JSON descargado y copia el valor completo de `private_key`.
2. En Vercel, pega el texto incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`.
3. Conserva los `\n` (barra invertida + n) tal como aparecen en el JSON; **no** presiones Enter dentro del valor. El backend los transforma en saltos reales.
4. Alternativa recomendada si tu CLI lo permite: `vercel env add GOOGLE_PRIVATE_KEY production` y pega el valor.

### 8.4 Verificar el despliegue

```bash
curl https://tu-dominio.vercel.app/api/health
curl https://tu-dominio.vercel.app/api/businesses
```

Abre la URL principal: debe cargar el catálogo. Prueba crear una cuenta y registrar un negocio.

### 8.5 Redeploy tras cambios de variables

Las variables de entorno se aplican en un **nuevo deployment**. Cambia una variable → *Deployments → ⋯ → Redeploy*.

---

## 9. Cómo funcionan los datos

### Estado de publicación

`AUTO_APPROVE_BUSINESS` controla el estado con el que se guardan los negocios nuevos:

- `APROBADO` (por defecto): aparece de inmediato en el catálogo.
- `PENDIENTE`: se guarda, pero el `GET /api/businesses` público no lo devuelve. Puedes aprobarlo manualmente cambiando `estado_publicacion` en el Sheet.

### Caché

- El listado público se cachea **en memoria 30 s** (`BUSINESSES_CACHE_TTL_MS`).
- Cada instancia tibia de la función conserva su caché.
- Crear, editar o eliminar un negocio invalida el caché de esa instancia.
- Diagnóstico: `GET /api/businesses/cache-status`.
- Para forzar lectura fresca (sin caché): `GET /api/businesses?refresh=true`.

### Menú / platillos

- Se guarda en la columna `menu` (Q) como texto plano.
- Acepta saltos de línea y un máximo de 1500 caracteres.
- En el catálogo, la tarjeta muestra un botón **"Ver menú y platillos"** que expande el contenido con `white-space: pre-line`.
- En el panel también puede consultarse dentro de cada ficha.

### Límites de Google Sheets API

- Lectura/escritura: 300 solicitudes por minuto por proyecto y 60 por minuto por usuario.
- Con caché de 30 s, un catálogo con tráfico normal queda muy por debajo del límite.
- Si necesitas más tráfico, aumenta `BUSINESSES_CACHE_TTL_MS` (ej. 60000).

---

## 10. Seguridad

- Contraseñas con **bcrypt**, 10 salt rounds. Nunca se devuelven al cliente.
- JWT firmado con `JWT_SECRET`, expiración 24 h, issuer `sazon-local`.
- Rutas de escritura protegidas por `verifyToken`.
- Un usuario solo puede editar o **eliminar** sus propios negocios (validación de `id_usuario` = ownerId del JWT).
- Límite de **5 negocios por usuario** aplicado en el servidor; el frontend solo refleja el cupo.
- Al eliminar se usa `batchUpdate` + `deleteDimension`, sin dejar filas vacías.
- CORS restringido por `CORS_ORIGIN`; en desarrollo se permiten `localhost`.
- Validación y normalización de todos los campos en servidor (tipos, precios, URLs, teléfono, menú).
- El listado público **no** expone `id_usuario` ni datos de contacto de la cuenta.
- Límite de body JSON de 8 MB (suficiente para imágenes base64 y acotado).
- Errores internos no filtran stack traces en producción.

> Esta implementación no incluye recuperación de contraseña ni roles de administrador. Para producción a mayor escala, considera migrar a una base de datos transaccional (Postgres, Firestore) manteniendo esta misma API.

---

## 11. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `No se pudo leer la pestaña "Usuarios"` | El Sheet no está compartido con la Service Account | Compártelo como **Editor** con el `client_email`. |
| `La pestaña "Negocios" no tiene los encabezados esperados` | Encabezado mal escrito o con espacios | Copia exactamente la fila 1 de la sección 4.1. |
| `error:0909006C:PEM routines...` | `GOOGLE_PRIVATE_KEY` mal escapada | Vuelve a pegar el valor completo con `\n`. |
| `JWT_SECRET no está configurado` | Falta la variable o está vacía | Configúrala en Vercel y redespliega. |
| El frontend recibe HTML en lugar de JSON en `/api` | Rewrite mal configurado | Revisa que `vercel.json` conserve el orden: `/api/(.*)` antes de `/(.*)`. |
| `403 The caller does not have permission` | La API key no tiene acceso al Sheet | Comparte el Sheet y verifica el ID. |
| Las imágenes subidas fallan | `IMGBB_API_KEY` vacía | Pega la URL de la imagen manualmente o configura la key. |
| No aparecen negocios recién creados | Estado `PENDIENTE` o caché | Revisa `estado_publicacion` en el Sheet o espera 30 s. |
| `Has alcanzado el límite máximo de 5 negocios...` | El usuario ya tiene 5 filas en `Negocios` | Elimina uno desde `/mi-panel` para liberar cupo. |
| `Faltan campos obligatorios: menu` o error de encabezados | Falta la columna Q1 `menu` | Agrega `menu` en Q1 (ver sección 4.1). |
| Al eliminar responde 403 | El negocio pertenece a otro usuario | Solo el propietario (`id_usuario`) puede borrarlo. |
| La fila desaparece pero la tarjeta sigue | Caché de 30 s en una instancia tibia | Recarga en unos segundos o usa `?refresh=true`. |
| Angular dev no conecta a la API | Backend apagado / CORS | Arranca `npm run dev:backend` y revisa `CORS_ORIGIN`. |

---

## 12. Checklist de despliegue

- [ ] Spreadsheet creado con pestañas `Usuarios` y `Negocios`.
- [ ] Encabezados exactos en la fila 1, incluida la columna Q `menu`.
- [ ] Service Account con Google Sheets API habilitada.
- [ ] Sheet compartido con el `client_email` como Editor.
- [ ] `.env` local completo y probado.
- [ ] Repositorio en GitHub sin `.env`.
- [ ] Proyecto importado en Vercel con Root Directory `./` y Framework `Other`.
- [ ] Variables de entorno cargadas en Production/Preview/Development.
- [ ] `/api/health` responde `200`.
- [ ] Catálogo carga, los filtros funcionan y el menú se expande.
- [ ] Registro y login devuelven JWT.
- [ ] Registro de negocio crea fila en `Negocios` (con `menu`).
- [ ] El panel muestra el cupo `X / 5` y bloquea la creación al llegar a 5.
- [ ] Editar un negocio actualiza su fila y su tarjeta.
- [ ] Eliminar un negocio propio borra físicamente la fila y responde 403 en negocios ajenos.

---

© SazónLocal · Directorio gastronómico local. Hecho con sazón 🍲
