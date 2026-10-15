#!/usr/bin/env node
// Lista las ramas remotas de un repo de kuntur-capital y marca cuáles ya están integradas en la rama
// principal. Por defecto solo informa; con --borrar elimina las integradas.
//
// Una rama cuenta como integrada si:
//   - no tiene commits que no estén en la rama principal (merge normal o rama sin cambios), o
//   - su PR se integró (squash) en la rama principal y la rama no tiene commits posteriores a ese PR.
// Nunca se borra la rama principal, una rama protegida, una rama con un PR abierto (desde ella o hacia
// ella) ni una rama con trabajo sin integrar. Antes de borrar, se comprueba que nadie hizo push desde el informe.
//
// Requiere `gh` con sesión iniciada y permiso de escritura en el repo (solo para --borrar).
// Uso:
//   node scripts/limpiar-ramas.mjs kuntur-lmda-clients            # informe (TSV por stdout)
//   node scripts/limpiar-ramas.mjs kuntur-lmda-clients --borrar   # borra las integradas
import { execFileSync } from 'node:child_process';

const ORG = 'kuntur-capital';
const [repo, ...flags] = process.argv.slice(2);
const borrar = flags.includes('--borrar');
if (!repo) {
  console.error('Uso: node scripts/limpiar-ramas.mjs <repo> [--borrar]');
  process.exit(1);
}

const gh = (path, ...args) =>
  JSON.parse(execFileSync('gh', ['api', path, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 }));
const ghPaginated = (path) =>
  // --slurp junta las páginas en un array de arrays.
  gh(path, '--paginate', '--slurp').flat();

const principal = gh(`repos/${ORG}/${repo}`).default_branch;
const ramas = ghPaginated(`repos/${ORG}/${repo}/branches?per_page=100`).filter(
  (r) => r.name !== principal
);
const prs = ghPaginated(`repos/${ORG}/${repo}/pulls?state=all&per_page=100`);

const filas = [];
for (const rama of ramas) {
  const sha = rama.commit.sha;
  const suyos = prs.filter((pr) => pr.head.ref === rama.name && pr.head.repo?.full_name === `${ORG}/${repo}`);
  const abierto = suyos.find((pr) => pr.state === 'open');
  // Un PR abierto que apunta a esta rama se cerraría al borrarla (PRs apilados).
  const baseDeAbierto = prs.find((pr) => pr.state === 'open' && pr.base.ref === rama.name);
  // Solo cuenta un PR integrado en la rama principal: integrado en otra rama, su trabajo puede no estar en main.
  const enPrincipal = suyos.filter((pr) => pr.merged_at && pr.base.ref === principal);
  const integradoEnSha = enPrincipal.find((pr) => pr.head.sha === sha);

  let estado;
  let motivo;
  if (rama.protected) {
    [estado, motivo] = ['conservar', 'rama protegida'];
  } else if (abierto) {
    [estado, motivo] = ['conservar', `PR abierto #${abierto.number}`];
  } else if (baseDeAbierto) {
    [estado, motivo] = ['conservar', `base del PR abierto #${baseDeAbierto.number}`];
  } else if (integradoEnSha) {
    [estado, motivo] = ['integrada', `PR #${integradoEnSha.number} integrado`];
  } else {
    const { ahead_by: adelante } = gh(
      `repos/${ORG}/${repo}/compare/${encodeURIComponent(principal)}...${sha}`
    );
    if (adelante === 0) [estado, motivo] = ['integrada', `sin commits fuera de ${principal}`];
    else {
      const integrado = enPrincipal[0];
      const cerrado = suyos.find((pr) => pr.state === 'closed' && !pr.merged_at);
      motivo = integrado
        ? `${adelante} commits después de integrar el PR #${integrado.number}`
        : cerrado
          ? `PR #${cerrado.number} cerrado sin integrar, ${adelante} commits`
          : `sin PR, ${adelante} commits`;
      estado = 'conservar';
    }
  }
  filas.push({ rama: rama.name, sha, estado, motivo });
}

console.log(['rama', 'estado', 'motivo'].join('\t'));
for (const f of filas) console.log([f.rama, f.estado, f.motivo].join('\t'));

const integradas = filas.filter((f) => f.estado === 'integrada');
console.error(
  `\n${repo}: ${filas.length} ramas además de ${principal}; ${integradas.length} integradas, ` +
    `${filas.length - integradas.length} a conservar.`
);

if (borrar) {
  let borradas = 0;
  for (const f of integradas) {
    const ref = f.rama.split('/').map(encodeURIComponent).join('/');
    try {
      // Si alguien hizo push desde el informe, la rama tiene trabajo nuevo: no se toca.
      if (gh(`repos/${ORG}/${repo}/git/ref/heads/${ref}`).object.sha !== f.sha) {
        console.error(`conservada (cambió desde el informe): ${f.rama}`);
        continue;
      }
      execFileSync('gh', ['api', '-X', 'DELETE', `repos/${ORG}/${repo}/git/refs/heads/${ref}`], {
        stdio: 'ignore',
      });
      borradas++;
      console.error(`borrada: ${f.rama}`);
    } catch (err) {
      console.error(`error con ${f.rama}: ${err.message.split('\n')[0]}`);
    }
  }
  console.error(`${borradas} de ${integradas.length} ramas integradas borradas.`);
} else if (integradas.length) {
  console.error('Solo informe. Para borrar las integradas: añade --borrar.');
}
