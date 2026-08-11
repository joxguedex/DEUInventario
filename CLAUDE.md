# Instrucciones para Claude Code en este repo

## Versionado

`js/version.js` (`APP_VERSION`) es un contador simple de despliegues, no
semver. **Cada vez que se haga un commit & push a `main`, incrementar
`APP_VERSION` en +0.01** (ej. `v0.01` → `v0.02`) como parte de ese mismo
commit — no esperar a que lo pida el usuario.
