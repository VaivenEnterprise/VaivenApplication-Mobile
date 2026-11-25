# Tareas 017

- [x] Preparar politica de PRs y nombres de ramas con pruebas.
- [x] Preparar CI condicional segun el estado real del proyecto.
- [x] Preparar escaneo de secretos, CodeQL y actualizaciones de dependencias.
- [x] Documentar revisores, flujo de entrega y ruleset importable.
- [x] Verificar ejecucion de GitHub Actions en el PR: primera ejecucion de CI completada correctamente.
- [x] Revision humana y fusion a develop; promocion por PR a main.
- [x] Administrador: habilitar escritura del segundo revisor si corresponde y actualizar CODEOWNERS.
- [x] Administrador: activar ruleset y ajustes de seguridad; verificar que un PR con controles fallidos no pueda fusionarse.

- ~~T009: exigir tipo/SCRUM-NN-SPEC-NN-TNNN en ramas de trabajo, actualizar guia y probar nombres validos e invalidos.~~ **Reemplazada (2026-11-25, decision de la persona responsable):** el segmento SCRUM es **opcional** desde el commit `02fdbbb` (2026-11-06); ya esta en `.github/scripts/policy.mjs` (20 pruebas de `policy.test.mjs` y `audit.test.mjs` en verde), en AGENTS.md (Art. XV) y en `docs/devsecops.md`. Se conserva la numeracion y aqui no cuenta como pendiente. Rama provisional original: chore/SCRUM-01-SPEC-01-T001 (los numeros eran ejemplos, no identificadores de Jira).

