# Mis gastos

App para seguir tus gastos del mes, detectar gastos hormiga y controlar la compra del súper con un carrito que se llena a medida que te acercás al monto que querés gastar.

```
mis-gastos-app/
├── frontend/        → la app (HTML, CSS y JS, sin build). Se publica en GitHub Pages.
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── config.js   → URL del backend (lo único que tenés que cambiar)
│       ├── app.js      → toda la lógica de la app
│       └── sync.js     → cuenta de usuario y sincronización con el backend
├── backend/         → API en Node.js + Express + PostgreSQL. Se publica en Render.
│   ├── src/server.js   → rutas de la API
│   ├── src/db.js       → conexión y creación de tablas
│   ├── src/auth.js     → tokens de sesión (JWT)
│   └── .env.example
└── .github/workflows/pages.yml → publica el frontend solo cada vez que subís cambios
```

La app sigue funcionando sin internet: guarda todo en el celular. Si creás una cuenta, además sube una copia al servidor y la podés abrir en otro dispositivo.

## Cómo funciona el backend

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/health` | Responde `{ok:true}` para saber si el servidor está vivo |
| POST | `/api/auth/register` | Crea una cuenta (`email`, `password`) y devuelve un token |
| POST | `/api/auth/login` | Inicia sesión y devuelve un token |
| GET | `/api/me` | Devuelve el email del usuario logueado |
| GET | `/api/data` | Devuelve los datos guardados del usuario |
| PUT | `/api/data` | Guarda los datos del usuario (reemplaza los anteriores) |

Las rutas `/api/me` y `/api/data` necesitan el header `Authorization: Bearer <token>`. Las contraseñas se guardan encriptadas con bcrypt. Las tablas se crean solas la primera vez que arranca el servidor.

---

## Paso 1 — Subir el código a GitHub

1. En github.com tocá **New repository**, ponele `mis-gastos`, dejalo **público** (GitHub Pages gratis lo necesita) y crealo vacío.
2. En la página del repo vacío tocá **uploading an existing file** y arrastrá todo el contenido de esta carpeta (incluida la carpeta `.github`; si no la ves, activá "mostrar archivos ocultos").
   - O desde la terminal, dentro de esta carpeta:
     ```bash
     git init
     git add .
     git commit -m "Primera versión"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/mis-gastos.git
     git push -u origin main
     ```

## Paso 2 — Crear la base de datos (Neon, gratis)

1. Entrá a https://neon.tech y creá una cuenta (podés usar la de GitHub).
2. Creá un proyecto (región: la más cercana, por ejemplo São Paulo).
3. Copiá el **connection string**; empieza con `postgres://...`. Lo vas a usar en el paso 3.

## Paso 3 — Publicar el backend (Render, gratis)

1. Entrá a https://render.com, creá una cuenta con GitHub y tocá **New → Web Service**.
2. Elegí tu repo `mis-gastos` y completá:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. En **Environment Variables** agregá:
   - `DATABASE_URL` → el connection string de Neon
   - `JWT_SECRET` → una frase larga e inventada (por ejemplo, 40 letras al azar)
   - `FRONTEND_ORIGIN` → `https://TU_USUARIO.github.io`
4. Creá el servicio. Cuando termine vas a tener una URL tipo `https://mis-gastos-xxxx.onrender.com`. Probala agregando `/health` al final: tiene que responder `{"ok":true}`.

> El plan gratis de Render "duerme" el servidor después de 15 minutos sin uso. La primera vez que lo llamás tarda unos 50 segundos en despertar. La app no se traba: funciona igual con los datos del celular y sincroniza cuando el servidor responde.

## Paso 4 — Conectar el frontend y publicarlo (GitHub Pages)

1. En tu repo abrí `frontend/js/config.js`, tocá el lápiz para editarlo y cambiá la URL por la de Render:
   ```js
   window.API_URL = 'https://mis-gastos-xxxx.onrender.com';
   ```
   Guardá con **Commit changes**.
2. En el repo andá a **Settings → Pages** y en **Source** elegí **GitHub Actions**.
3. Andá a la pestaña **Actions**: vas a ver "Publicar frontend" corriendo. Si no arrancó solo, entrá y tocá **Run workflow**.
4. Al terminar, tu app queda en `https://TU_USUARIO.github.io/mis-gastos/`.
5. En el iPhone abrila en Safari → Compartir → **Agregar a inicio**.

Cada vez que cambies algo en `frontend/`, se vuelve a publicar solo. Render también se actualiza solo cuando cambiás algo en `backend/`.

## Pasar tus datos actuales

Tus datos están guardados en la app vieja. En la app vieja: **Gastos → Guardar copia**. En la app nueva: **Gastos → Cargar copia**. Después creá tu cuenta en **Gastos → Mi cuenta** y se suben solos.

## Probar en tu computadora (opcional)

Necesitás Node.js 18 o más nuevo.

```bash
cd backend
cp .env.example .env      # y completá DATABASE_URL y JWT_SECRET
npm install
npm run dev               # API en http://localhost:3000
```

Para el frontend abrí `frontend/` con cualquier servidor estático, por ejemplo `npx serve frontend` o la extensión Live Server de VS Code (puerto 5500, que ya está permitido en `.env.example`).
