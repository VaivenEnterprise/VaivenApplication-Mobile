import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkRelease} from './release.mjs';
const flow = fs.readFileSync(new URL('../workflows/release.yml', import.meta.url), 'utf8');
test('el CD versionado cumple: manual, con revisor, token solo de secretos, acciones por SHA, sin subir a Play', () => {
  assert.deepEqual(checkRelease(flow), []);
});
test('falla si arranca solo (push, schedule o pull_request)', () => {
  assert.match(checkRelease(flow.replace('on:\n  workflow_dispatch:', 'on:\n  push:\n    branches: [main]\n  workflow_dispatch:')).join(), /workflow_dispatch/);
  assert.match(checkRelease(flow.replace(/on:\r?\n {2}workflow_dispatch:/, 'on:\n  schedule:\n    - cron: "0 0 * * *"\n  workflow_dispatch:')).join(), /workflow_dispatch/);
});
test('falla si el job con EXPO_TOKEN no tiene el entorno con revisor o no espera a verify', () => {
  assert.match(checkRelease(flow.replace(/^ {4}environment: eas-build\r?$/m, '')).join(), /entorno eas-build/);
  assert.match(checkRelease(flow.replace(/^ {4}needs: verify\r?$/m, '')).join(), /verify/);
});
test('falla si EXPO_TOKEN no viene de secretos o si el flujo pide permisos de escritura', () => {
  assert.match(checkRelease(flow.replace('${{ secrets.EXPO_TOKEN }}', 'abc123')).join(), /secrets\.EXPO_TOKEN/);
  assert.match(checkRelease(flow.replace(/contents: read/, 'contents: write')).join(), /contents: read/);
});
test('falla con una accion sin SHA, con eas submit, con eas-cli sin version exacta o con una entrada dentro de run', () => {
  assert.match(checkRelease(flow.replace(/actions\/checkout@[0-9a-f]{40}/, 'actions/checkout@v7')).join(), /SHA/);
  assert.match(checkRelease(flow + '\n      - run: npx eas-cli@27.11.0 submit -p android\n').join(), /submit/);
  assert.match(checkRelease(flow.replace('eas-cli@27.11.0', 'eas-cli@latest')).join(), /version exacta/);
  assert.match(checkRelease(flow + '\n      - run: echo ${{ inputs.profile }}\n').join(), /variables de entorno/);
});
test('una entrada en un run de varias lineas tambien falla', () => {
  const injected = flow.replace('set -euo pipefail\n          test -n', 'set -euo pipefail\n          echo "${{ inputs.profile }}"\n          test -n').replace('set -euo pipefail\r\n          test -n', 'set -euo pipefail\r\n          echo "${{ inputs.profile }}"\r\n          test -n');
  assert.notEqual(injected, flow);
  assert.match(checkRelease(injected).join(), /variables de entorno/);
});
