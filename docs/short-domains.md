# Dominios de enlaces cortos

<p align="right">
  <a href="short-domains.en.md">English</a> | <strong>Español</strong>
</p>

Los dominios cortos permiten publicar los mismos enlaces desde hosts adicionales sin exponer la interfaz administrativa de Umami en ellos.

## Modelo

- `short_domain` almacena un hostname único, su URL de redirección raíz y sus marcas de tiempo.
- `link_domain` relaciona cada enlace con los dominios cortos donde puede resolverse.
- Un `slug` es globalmente único. El mismo slug puede publicarse en el dominio principal y en varios dominios cortos asignados.
- `link.is_default_domain_enabled` controla si el enlace también está publicado en el dominio principal.

Un enlace se resuelve únicamente si está publicado en el host solicitado:

| Estado | Resultado |
| --- | --- |
| Dominio principal activado | `https://<BASE_DOMAIN>/q/<slug>` funciona. |
| Dominio corto asignado | `https://<dominio-corto>/q/<slug>` funciona. |
| Host no asignado, slug inexistente o enlace eliminado | Respuesta `404`. |
| Sin dominio principal ni dominio corto asignado | El enlace está inactivo y responde `404`. |

## Dominio principal y redirección raíz

Defina `BASE_DOMAIN` con el hostname de la interfaz principal, sin protocolo ni ruta:

```env
BASE_DOMAIN=url.practis.pe
```

El dominio principal continúa sirviendo la aplicación. No se registra como un dominio corto ni se redirige su ruta raíz.

Cada dominio corto requiere una **URL de redirección raíz**. Al visitar `https://<dominio-corto>/`, Umami redirige a esa URL. El resto de rutas de aplicación, como `/admin` o `/login`, se bloquean con `404` en un dominio corto.

## Rutas públicas permitidas

Un dominio corto registrado solo expone las rutas necesarias para enlaces y recopilación. Esto permite usar el mismo host para scripts de analítica sin publicar la interfaz.

| Ruta | Uso |
| --- | --- |
| `/q/<slug>` | Redirecciones de enlaces cortos. |
| `/p/<slug>` | Píxeles de seguimiento. |
| `/script.js` y alias configurados | Tracker clásico. |
| `/recorder.js` | Grabación y mapas de calor. |
| `/api/send`, `/api/batch` | Recopilación de eventos. |
| `/api/record` | Envío de grabaciones. |
| `/api/websites/<websiteId>/recorder` | Configuración pública del recorder. |

Las rutas que no están en esta lista devuelven `404` para un dominio corto registrado.

## Alta y validación

Antes de guardar un dominio, Umami realiza una validación HTTPS de su enrutamiento:

1. El administrador escribe el hostname sin protocolo, ruta ni puerto, y una URL de redirección raíz `http(s)`.
2. El servidor genera un desafío firmado, válido durante cinco minutos.
3. Resuelve DNS y solo intenta direcciones públicas; nunca usa direcciones privadas, loopback ni link-local.
4. Conecta por HTTPS directamente a la IP resuelta, usando SNI y el encabezado `Host` del hostname solicitado. No sigue redirecciones y limita la respuesta a 1 KiB.
5. El proxy del dominio debe dirigir `/q/_umami-domain-verification` a esta instancia. El desafío solo responde si la firma y el hostname coinciden.
6. Solo tras una respuesta válida se guarda o actualiza el dominio.

La validación no persiste un estado de salud: comprueba que DNS, TLS y el proxy funcionan en el instante de alta o edición. El botón de comprobación manual usa el mismo procedimiento y devuelve el estado actual en pantalla.

## Despliegue

1. Cree el DNS del dominio corto hacia el proxy de Umami.
2. Emita un certificado TLS válido para ese hostname.
3. Configure el proxy para conservar `Host` y `X-Forwarded-Host`, y enviar el tráfico a Umami.
4. Configure la URL de redirección raíz que recibirá las visitas directas al dominio corto.
5. Añada el dominio desde **Administración > Dominios**. Si la verificación falla, corrija DNS, TLS o proxy antes de reintentarlo.

No use `localhost` ni redes privadas para un dominio que deba validarse: la comprobación las rechaza intencionalmente para evitar SSRF.
