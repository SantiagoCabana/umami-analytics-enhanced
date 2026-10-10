<p align="center">
  <img src="https://content.umami.is/website/images/umami-logo.png" alt="Logotipo de Umami" width="100">
</p>

<h1 align="center">Umami</h1>

<p align="center">
  <a href="../README.md">English</a> | <strong>Español</strong>
</p>

<p align="center">
  <i>Umami es una plataforma de analítica que prioriza la privacidad. Tráfico, campañas, comportamiento, conversiones e ingresos en un solo lugar, sin cookies ni vigilancia; autoalojada o en la nube.</i>
</p>

---

## Inicio rápido

La guía general de Umami está disponible en [umami.is/docs](https://umami.is/docs/).

## Instalación desde el código fuente

### Requisitos

- Un servidor con Node.js 18.18 o superior.
- Una base de datos PostgreSQL 12.14 o superior.

### Obtener el código e instalar dependencias

```bash
git clone https://github.com/umami-software/umami.git
cd umami
pnpm install
```

### Configurar Umami

Cree un archivo `.env` con al menos:

```bash
DATABASE_URL=connection-url
```

Opcionalmente, configure `API_URL` para cambiar la URL base utilizada por la interfaz para sus llamadas API internas. Las rutas relativas se sirven bajo `BASE_PATH`; las URL absolutas se envían mediante proxy a través de la ruta local `/api`.

Puede configurar `TWO_FACTOR_ENCRYPTION_KEY` con una cadena hexadecimal de 64 caracteres para habilitar la autenticación de dos factores. Genérela con `openssl rand -hex 32`.

MCP está deshabilitado por defecto. Use `MCP_ENABLED=1` para activar `/mcp` y autentique las solicitudes con una clave API creada en **Settings -> API keys**.

El formato de la URL de conexión es:

```bash
postgresql://username:mypassword@localhost:5432/mydb
```

### Dominios personalizados para enlaces cortos

<p align="center">
  <img src="../src/assets/network.svg" alt="Dominios personalizados para enlaces cortos" width="72">
</p>

Umami Enhanced puede publicar enlaces cortos en el host principal de la aplicación y en hosts personalizados verificados. Un host corto solo expone las rutas públicas de enlaces y recopilación; la administración permanece disponible únicamente en el dominio principal.

Defina `BASE_DOMAIN` con el hostname principal de la aplicación, sin protocolo ni ruta:

```bash
BASE_DOMAIN=url.example.com
```

Agregue hosts personalizados desde **Administración -> Dominios**. Cada host requiere una URL de redirección raíz. Las visitas a `/` se redirigen a esa URL y un `/q/<slug>` inexistente o sin asignar devuelve `404`.

Antes de guardar un host, Umami comprueba DNS público, certificado TLS y el enrutamiento del proxy inverso mediante un desafío HTTPS firmado y temporal. El mismo host puede servir `/script.js`, `/recorder.js`, píxeles y las rutas públicas de recopilación sin exponer `/admin`, `/login` u otras rutas de la aplicación.

Guías completas:

- [Custom short domains (English)](short-domains.en.md)
- [Dominios de enlaces cortos (Español)](short-domains.md)

### Compilar y ejecutar

```bash
pnpm run build
pnpm run start
```

Por defecto, la aplicación se inicia en `http://localhost:3000`. Use un proxy inverso o cambie el puerto para servirla directamente.

## Instalación con Docker

```bash
docker pull docker.umami.is/umami-software/umami:latest
docker compose up -d
```

## Actualizaciones

```bash
git pull
pnpm install
pnpm build
```

Para actualizar una instalación Docker:

```bash
docker compose pull
docker compose up --force-recreate -d
```
