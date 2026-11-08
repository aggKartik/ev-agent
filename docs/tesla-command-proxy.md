# Tesla command proxy

Send to Tesla uses a vehicle-command proxy because supported vehicle commands
must be signed with this app's enrolled virtual key before the car will execute
them. The current official `tesla/vehicle-command` proxy does not implement
`navigation_waypoints_request`, so Send to Tesla is disabled by default. Only set
`TESLA_SEND_ITINERARY_ENABLED=true` after your deployed proxy or SDK path has
been verified to support:

```txt
POST /api/1/vehicles/{vin}/command/navigation_waypoints_request
```

The proxy is not hosted by Tesla for us; run it locally or deploy it behind your
own HTTPS URL, then point `TESLA_COMMAND_PROXY_URL` at that base URL.

The repo includes a Docker Compose file for Tesla's official image:

```bash
docker compose -f docker-compose.tesla-proxy.yml up -d
```

It expects local proxy material in `tesla-proxy-config/`:

```txt
tesla-proxy-config/
├── fleet-key.pem
├── tls-cert.pem
└── tls-key.pem
```

`fleet-key.pem` is the command private key whose public key is registered with
Tesla for this app's developer domain. The TLS files are the certificate and key
served by the proxy. For local development, the proxy listens on
`https://localhost:4443`, so set:

```bash
TESLA_COMMAND_PROXY_URL=https://localhost:4443
```

Node's `fetch()` does not trust a self-signed local proxy certificate by
default. For local app runs or checks that call the proxy, either trust
`tesla-proxy-config/tls-cert.pem` in your OS trust store or pass it to Node:

```bash
NODE_EXTRA_CA_CERTS=tesla-proxy-config/tls-cert.pem bun dev
```

Keep `TESLA_SEND_ITINERARY_ENABLED=false` unless this local proxy image has been
patched or replaced with one that supports `navigation_waypoints_request`.

Stop the local proxy with:

```bash
docker compose -f docker-compose.tesla-proxy.yml down
```
