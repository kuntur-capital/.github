<!--
Título del PR: "CRP-NNN: qué cambia". La rama también lleva la clave en mayúsculas (feat/CRP-NNN-…).
Lo que no aplique, se borra. Guía completa: kuntur-docs/proceso/flujo-de-trabajo.md.
-->

## Historia

- CRP: https://kunturcapital.atlassian.net/browse/CRP-NNN
- Spec: <!-- enlace a kuntur-docs/<plataforma>/specs/CRP-NNN-….md -->

## Qué cambia

<!-- 2-4 líneas: qué hace ahora el sistema que antes no hacía, o qué arregla. -->

## Criterios de aceptación

<!--
Un criterio por fila, copiado de la spec. "Cómo se verifica": el test (unitario, API o E2E),
"manual" con el motivo, o "n/a" con el enlace al PR del otro repo que lo cubre.
Si la historia toca varios repos, la tabla completa va en el PR principal y los demás ponen "n/a" con el enlace.
-->

| Criterio | Cubierto | Cómo se verifica |
|---|---|---|
| CA-1: … | [ ] | |

## Cómo probarlo

<!-- Pasos, rol o usuario y datos de prueba (seed) para probarlo en local o en dev. -->

## Despliegue

<!-- Borra lo que no aplique. -->

- [ ] No necesita nada especial: se despliega solo con el merge.
- [ ] Orden entre repos: <!-- p. ej. primero la lambda, después el Admin -->
- [ ] Ruta nueva: está en el router, en el stack CDK (`infra/`) y en el authorizer.
- [ ] Cambio de base de datos: la migración está en el repo de migraciones y se despliega antes.
- [ ] Variables de entorno nuevas en los workflows de dev, STG y PRD.

## Evidencia

<!-- Capturas con datos de prueba (escritorio y móvil si cambia una pantalla) o la salida de los tests. Nunca datos de clientes. -->

## Checks

- [ ] Checks del repo en verde (formato, lint, typecheck, tests y build).
- [ ] Si cambió el lockfile: `npm ci` con la versión de npm de la CI.
- [ ] Revisado por un agente sin el contexto de quien implementó.
