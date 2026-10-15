# kuntur-capital/.github

Configuración común a todos los repos de la organización. Cómo trabajamos: `kuntur-docs/proceso/flujo-de-trabajo.md`.

## Plantilla de PR

`pull_request_template.md` es la plantilla por defecto de los PRs de **todos los repos que no tengan una propia**. Hoy ninguno la tiene. Si un repo necesita algo distinto, crea su propio `.github/pull_request_template.md` y deja de usar esta.

GitHub solo aplica la plantilla de la organización si **este repo es público**. Su contenido no tiene nada privado: solo la plantilla, este README y el script de ramas. **Pendiente:** que un admin de la organización lo haga público (Settings → General → Danger Zone → Change visibility). Mientras sea privado, la plantilla se copia a mano de este archivo.

Al abrir un PR desde la terminal (`gh pr create`), GitHub no aplica la plantilla si se pasa `--body`. Para usarla: `gh pr create --body-file <copia rellenada de la plantilla>`.

Posible mejora: una GitHub Action que avise si quedan casillas sin marcar en el PR. En repos privados con el plan gratuito no se puede hacer obligatoria; sería un aviso, no un bloqueo.

## Ramas: borrado al integrar y limpieza

Cada repo tiene que tener activado **Settings → General → Pull Requests → Automatically delete head branches**, para que GitHub borre la rama al integrar su PR. Lo puede activar alguien con permisos de admin en el repo:

```bash
gh api -X PATCH repos/kuntur-capital/<repo> -F delete_branch_on_merge=true
```

Para ver qué repos lo tienen activado:

```bash
gh repo list kuntur-capital --limit 50 --json name,deleteBranchOnMerge --jq '.[] | "\(.name)\t\(.deleteBranchOnMerge)"'
```

El 2026-10-15 lo tenían desactivado `kuntur-lmda-clients`, `kuntur-lmda-worker`, `kuntur-spa-core-platform`, `kuntur-spa-client-portal`, `kuntur-lambda-risk-auth`, `kuntur-iac`, `.docs` y este repo. El ajuste solo afecta a los PRs que se integren a partir de ahí. Las ramas antiguas se limpian con `scripts/limpiar-ramas.mjs`:

```bash
node scripts/limpiar-ramas.mjs <repo>            # informe: qué ramas están integradas y cuáles se conservan
node scripts/limpiar-ramas.mjs <repo> --borrar   # borra solo las integradas
```

Una rama cuenta como integrada si no tiene commits fuera de la rama principal, o si su PR se integró en la rama principal y la rama no tiene commits posteriores. Nunca borra una rama protegida, una rama con un PR abierto (desde ella o hacia ella) ni una rama con trabajo sin integrar, y antes de borrar comprueba que nadie hizo push desde el informe. Revisa siempre el informe antes de usar `--borrar`.
