# Custom short domains

<p align="right">
  <strong>English</strong> | <a href="short-domains.md">Español</a>
</p>

Custom short domains publish the same shortened links from additional hosts without exposing the Umami administration interface on those hosts.

## Data model

- `short_domain` stores a unique hostname, its required root redirect URL, and timestamps.
- `link_domain` lets an exceptional link be published only on specific short domains.
- A `slug` is globally unique.
- `link.is_default_domain_enabled` publishes the link on the primary domain and on **every** registered short domain.

A link resolves only when it is published on the requested host:

| State | Result |
| --- | --- |
| Default domain enabled | `https://<BASE_DOMAIN>/q/<slug>` and `https://<registered-short-domain>/q/<slug>` work. |
| Assigned short domain | A link with the default domain disabled works only on its assigned short domain. |
| Unassigned host, unknown slug, or deleted link | `404` response. |
| Neither primary nor short domain assigned | The link is inactive and returns `404`. |

## Primary domain and root redirect

Set `BASE_DOMAIN` to the primary interface hostname, without a protocol or path:

```env
BASE_DOMAIN=url.example.com
```

The primary domain continues serving the application. It is not registered as a short domain and its root route is never redirected.

Every short domain requires a **root redirect URL**. Visiting `https://<short-domain>/` redirects to that URL. Other application routes, such as `/admin` and `/login`, return `404` on a short domain.

## Allowed public routes

A registered short domain exposes only the routes needed by links and collection. This lets the same host serve analytics scripts without publishing the interface.

| Route | Purpose |
| --- | --- |
| `/q/<slug>` | Short-link redirects. |
| `/p/<slug>` | Tracking pixels. |
| `/script.js` and configured aliases | Classic tracker. |
| `/recorder.js` | Session recording and heatmaps. |
| `/api/send`, `/api/batch` | Event collection. |
| `/api/record` | Recording upload. |
| `/api/websites/<websiteId>/recorder` | Public recorder configuration. |

All other paths return `404` on a registered short domain.

## Adding and validating a domain

Before a domain is saved, Umami validates its HTTPS routing:

1. The administrator enters a hostname without protocol, path, or port, and an `http(s)` root redirect URL.
2. The server creates a signed challenge valid for five minutes.
3. It resolves DNS and attempts only public addresses, never private, loopback, or link-local addresses.
4. It connects over HTTPS directly to the resolved IP, using SNI and the requested hostname in the `Host` header. It follows no redirects and limits the response to 1 KiB.
5. The domain proxy must route `/q/_umami-domain-verification` to this Umami instance. The challenge responds only when its signature and hostname match.
6. The domain is created or updated only after a valid response.

Validation does not persist a health status. It validates DNS, TLS, and proxy routing when a domain is added or edited. The manual check button uses the same process and returns the current result in the UI.

## Deployment checklist

1. Point the short-domain DNS record at the Umami reverse proxy.
2. Issue a valid TLS certificate for the hostname.
3. Configure the proxy to preserve `Host` and `X-Forwarded-Host` and forward traffic to Umami.
4. Choose the root redirect URL for direct visits to the short domain.
5. Add the domain under **Administration -> Domains**. If validation fails, correct DNS, TLS, or proxy configuration before retrying.

Do not use `localhost` or private-network addresses for a domain that must be validated. They are intentionally rejected to prevent SSRF.
