# How to reproduce

Requires Node 20 and pnpm.

```bash
nvm use 20
pnpm bootstrap
pnpm dev:react # or dev:solid
```

`window.__appSettled` flips to `true` after each visible update batch so the harness can wait for stability.
