<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/logo-white.svg">
    <img src="src/assets/logo.svg" width="100" alt="Umami">
  </picture>
</p>

<h1 align="center">Umami Analytics Enhanced</h1>

<p align="center">
  <i>Analítica de Umami con dominios personalizados y variables para enlaces cortos.</i>
</p>

<p align="center">
  <sub>Fork independiente de <a href="https://github.com/umami-software/umami">Umami</a>.</sub>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="Licencia MIT"></a>
  <a href="https://github.com/umami-software/umami"><img src="https://img.shields.io/badge/based%20on-Umami-black" alt="Basado en Umami"></a>
</p>

<p align="center">
  <a href="#qué-añade-enhanced">Novedades</a> ·
  <a href="#inicio-rápido">Instalación</a> ·
  <a href="#soporte-y-licencia">Soporte</a> ·
  <a href="#english">English</a>
</p>

---

## Qué añade Enhanced

Umami reúne analítica de tráfico, campañas, eventos y conversiones. Esta fork conserva esa base
y añade herramientas para administrar la publicación y los destinos de enlaces cortos.
Las funciones generales de analítica proceden del proyecto original; las siguientes son las
extensiones de Enhanced.

### Dominios personalizados

Publica un mismo enlace desde el dominio principal y desde dominios adicionales registrados.
Con la publicación predeterminada activada, el enlace funciona en todos ellos. Para una publicación
exclusiva, desactívala y asigna los dominios concretos. El slug sigue siendo globalmente único.

<p align="center"><img src="docs/assets/link-flow-es.svg" width="760" alt="El host principal y un dominio registrado comparten un enlace predeterminado que redirige al destino."></p>

Añade hosts desde **Administración → Dominios** después de configurar DNS, HTTPS y el proxy hacia
esta instancia. Antes de guardar, la aplicación verifica DNS público, certificado TLS y enrutamiento
con un desafío HTTPS firmado. Esta comprobación es puntual, no monitorización continua.

### Redirección de raíz y rutas públicas

Cada dominio corto tiene una URL de redirección raíz: al visitar `/`, el usuario llega a esa URL.
El dominio principal mantiene el panel; los dominios cortos registrados sirven las rutas públicas
de enlaces y recopilación, mientras que `/login`, `/admin` y las APIs privadas devuelven `404`.

| Ruta pública | Función |
| --- | --- |
| `/q/<slug>` | Redirección del enlace corto. |
| `/p/<slug>` | Píxel de seguimiento. |
| `/script.js`, `/recorder.js` | Tracker y recorder. |
| `/api/send`, `/api/batch`, `/api/record` | Recopilación de eventos y grabaciones. |
| `/api/websites/<websiteId>/recorder` | Configuración pública del recorder. |

Un enlace inexistente, eliminado o no publicado en el host solicitado devuelve `404`.

### Variables de destino

Define valores reutilizables en **Enlaces → Variables** y referencia sus nombres con `${nombre}`.
Se resuelven en cada clic: cambiar el valor actualiza los destinos que lo utilizan sin editar cada
enlace. Los destinos admiten hasta 2.000 caracteres.

Ejemplo de un destino reutilizable:

```text
destino = https://example.com/contacto

${destino}?utm_campaign=verano
→ https://example.com/contacto?utm_campaign=verano
```

<p align="center"><img src="docs/assets/variable-flow-es.svg" width="760" alt="Define una variable, úsala en varios enlaces y actualiza su valor desde un único lugar."></p>

Una variable inicial puede contener una URL completa; las variables posteriores se codifican
para su uso dentro de la URL. Usa `?` para iniciar parámetros y `&` si la base ya tiene una consulta.
Los nombres se normalizan a minúsculas. Una referencia no definida permanece literal y el destino
resuelto debe ser HTTP o HTTPS.

Estas funciones no implican atribución automática de una visita web a un enlace corto concreto.
Para distinguir campañas, añade parámetros de campaña y configura la atribución que necesites.

---

## Inicio rápido

La [documentación de Umami](https://umami.is/docs/) explica la analítica general.
Para disponer de las extensiones descritas aquí, instala el código de **esta fork**.

### Requisitos

Necesitas **Node.js 22**, **pnpm 12.3.4** y **PostgreSQL**.

### 1. Obtener el proyecto

```bash
git clone https://github.com/SantiagoCabana/umami-analytics-enhanced.git
cd umami-analytics-enhanced
pnpm install --frozen-lockfile
```

### 2. Configurar el entorno

Crea un `.env` local con tus valores:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/umami
APP_SECRET=replace-with-a-persistent-random-secret
BASE_DOMAIN=analytics.example.com
```

Genera `APP_SECRET` con `openssl rand -hex 32` y consérvalo entre reinicios.
`BASE_DOMAIN` es el hostname del panel, sin protocolo ni ruta.

Opciones disponibles:

| Variable | Uso |
| --- | --- |
| `TWO_FACTOR_ENCRYPTION_KEY` | Clave hexadecimal de 64 caracteres para habilitar 2FA. Genera otra clave con `openssl rand -hex 32` y consérvala entre despliegues. |
| `API_URL` | Base de las llamadas API internas de la interfaz; admite una ruta relativa o una URL absoluta. |
| `MCP_ENABLED=1` | Habilita `/mcp`, desactivado por defecto. Se autentica con una clave API creada en Configuración → API keys. |

### 3. Compilar e iniciar

```bash
pnpm build
pnpm start
```

La compilación aplica migraciones: respalda una base existente antes de actualizar. La aplicación
escucha en el puerto `3000`. En una instalación nueva, entra con `admin` / `umami` y cambia la contraseña.

Para exponer la aplicación, configura un proxy inverso con HTTPS hacia el puerto `3000`.
Conserva `Host` y `X-Forwarded-Host` al servir dominios adicionales y rechaza hosts desconocidos
en el proxy. La validación de dominios requiere direcciones públicas; no acepta redes privadas.

---

## 🐳 Instalación con Docker

Construye la imagen desde este repositorio para incluir Enhanced. El `docker-compose.yml` heredado
descarga una imagen del upstream y no incorpora estas extensiones.

```bash
docker build -t umami-analytics-enhanced:local .
docker run -d --name umami-enhanced --restart unless-stopped \
  --env-file .env -p 3000:3000 umami-analytics-enhanced:local
```

Usa las mismas variables del apartado anterior. La base debe ser accesible desde el contenedor:
su `localhost` no es el servidor de PostgreSQL. El arranque aplica las migraciones pendientes.

---

## 🔄 Actualizaciones

Respalda la base antes de actualizar y revisa las migraciones incluidas en la nueva revisión.
Para instalaciones desde código fuente:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build
```

Reinicia el servicio con la nueva compilación. En Docker, reconstruye la imagen y recrea el
contenedor conservando la base y las variables, especialmente `APP_SECRET` y la clave de 2FA.

---

## Soporte y licencia

<p align="center">
  <a href="https://github.com/SantiagoCabana/umami-analytics-enhanced/issues">Incidencias de Enhanced</a> ·
  <a href="https://umami.is/docs/">Documentación de Umami</a> ·
  <a href="LICENSE">Licencia MIT</a>
</p>

<p align="center">
  <sub>Basado en Umami, de Umami Software, Inc. Se conservan el logo y los avisos originales.<br>
  Esta fork es independiente y no es una distribución oficial.</sub>
</p>

Los iconos y diagramas de esta presentación son ilustraciones originales bajo la licencia del
repositorio; no son capturas ni representan datos reales. El logo de Umami conserva su atribución
al proyecto original.

<a id="english"></a>
<details>
<summary><strong>English</strong></summary>

## Umami Analytics Enhanced

An independent [Umami](https://github.com/umami-software/umami) fork with three additions:

Umami provides the underlying traffic, campaign, event, and conversion analytics. Enhanced adds
tools for publishing short links and maintaining their destinations.

- **Custom domains:** default-enabled links work on the primary host and every registered short
  domain; exclusive assignments are also available.
- **Root redirects:** choose where a short domain's root leads. Registered short hosts serve
  links and collection endpoints without exposing the panel or login.
- **Destination variables:** update shared values without editing each link. Manage them under
  **Links → Variables**; they resolve on every click.

<p align="center"><img src="docs/assets/link-flow-en.svg" width="760" alt="The primary and registered hosts share a default-enabled link that redirects to its destination."></p>

Slugs are globally unique. To publish on selected hosts only, disable default publishing and assign
those hosts. Unknown, deleted, or unpublished links return `404`. Add domains under
**Administration → Domains** after configuring public DNS, TLS, and proxy routing. A signed HTTPS
challenge verifies them before saving; it is a point-in-time check, not continuous monitoring.

Registered short hosts allow `/`, `/q/<slug>`, `/p/<slug>`, `/script.js`, `/recorder.js`,
`/api/send`, `/api/batch`, `/api/record`, and `/api/websites/<websiteId>/recorder`.
The root redirects to its configured URL; private APIs, login, and admin routes return `404`.

```text
destination = https://example.com/contact

${destination}?utm_campaign=summer
→ https://example.com/contact?utm_campaign=summer
```

<p align="center"><img src="docs/assets/variable-flow-en.svg" width="760" alt="Define a variable, use it in multiple links, and update its value in one place."></p>

A leading variable can supply a complete URL; subsequent variables are URL-encoded. Choose `?`
or `&` according to the base URL. Names are normalized to lowercase, undefined references stay
literal, and resolved destinations must use HTTP or HTTPS. Destinations support 2,000 characters.
Website visits are not automatically attributed to a specific short link; use campaign parameters
and an appropriate attribution setup.

## Quick start

Requires **Node.js 22**, **pnpm 12.3.4**, and **PostgreSQL**.

### 1. Get the project

```bash
git clone https://github.com/SantiagoCabana/umami-analytics-enhanced.git
cd umami-analytics-enhanced
pnpm install --frozen-lockfile
```

### 2. Configure the environment

Create a local `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/umami
APP_SECRET=replace-with-a-persistent-random-secret
BASE_DOMAIN=analytics.example.com
```

Generate `APP_SECRET` with `openssl rand -hex 32` and retain it across restarts. `BASE_DOMAIN`
is the panel hostname, without a protocol or path.

Optional configuration:

- `TWO_FACTOR_ENCRYPTION_KEY`: a separate, persistent 64-character hex key enables 2FA.
- `API_URL`: overrides the interface's internal API base with a relative path or absolute URL.
- `MCP_ENABLED=1`: enables `/mcp`, disabled by default; authenticate with an API key from Settings.

### 3. Build and start

```bash
pnpm build
pnpm start
```

The build applies migrations; back up an existing database before upgrading. The default port is
`3000`. New installations start with `admin` / `umami`; change the password after signing in.

Add domains under **Administration → Domains**, with DNS and HTTPS pointing to this instance.
Preserve `Host` and `X-Forwarded-Host` and reject unknown hosts at the proxy. Domain verification
requires public addresses and does not accept private networks.

## 🐳 Docker installation

Build this fork's Dockerfile; the inherited Compose file uses the upstream image.

```bash
docker build -t umami-analytics-enhanced:local .
docker run -d --name umami-enhanced --restart unless-stopped \
  --env-file .env -p 3000:3000 umami-analytics-enhanced:local
```

The database must be reachable from the container, whose `localhost` is not your database server.
Startup applies pending migrations.

## 🔄 Updates

Back up the database and review migrations before upgrading. For source installations:

```bash
git pull --ff-only
pnpm install --frozen-lockfile
pnpm build
```

Restart the service after building. For Docker, rebuild the image and recreate the container while
retaining the database and environment, particularly `APP_SECRET` and the 2FA encryption key.

## Support and license

<p align="center">
  <a href="https://github.com/SantiagoCabana/umami-analytics-enhanced/issues">Enhanced issues</a> ·
  <a href="https://umami.is/docs/">Umami documentation</a> ·
  <a href="LICENSE">MIT license</a>
</p>

<p align="center"><sub>Based on Umami by Umami Software, Inc. Original logo and notices are retained.<br>
This is an independent fork, not an official distribution.</sub></p>

Presentation icons and diagrams are original illustrations under the repository license, not
screenshots or real metrics. The Umami logo retains its upstream attribution.

</details>
