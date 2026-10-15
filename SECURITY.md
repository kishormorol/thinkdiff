# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, report them privately via [GitHub Security Advisories](https://github.com/kishormorol/thinkdiff/security/advisories/new). You should receive a response within a few days.

## Deployment notes

ThinkDiff calls paid LLM APIs using keys from server-side environment variables. The API routes (`/api/execute`, `/api/parse`) have **no authentication or rate limiting** — if you deploy a public instance with your keys configured, anyone can spend your API credits. For public deployments, put the app behind authentication or add rate limiting (e.g. a firewall rule on your host).

API keys are only read on the server and are never sent to the browser.
