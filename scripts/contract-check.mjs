#!/usr/bin/env node
// Spec 021-T010: prueba de contrato contra ../vaiven-backend/api/openapi.yaml (SOLO LECTURA).
//   node scripts/contract-check.mjs [--contrato ruta/openapi.yaml] [--base https://api] [--timeout 8000]
// Hace únicamente peticiones GET sin credenciales a las operaciones públicas sin parámetros y valida
// la respuesta contra el contrato. Falla con un mensaje claro si no encuentra el contrato o la API no
// responde. No envía datos, no usa tokens y no escribe nada.
// También exporta el validador para `src/__e2e__/contract.test.ts` (respuestas de fakeApi).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import lib from './contract-lib.cjs';

export const {
  RUTA_CONTRATO,
  leerYaml,
  cargarContrato,
  validar,
  buscarOperacion,
  validarRespuesta,
  operacionesGetPublicas,
  ejecutarEnVivo,
} = lib;

function baseConfigurada(raiz) {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  for (const n of ['.env.local', '.env']) {
    const f = resolve(raiz, n);
    if (!existsSync(f)) continue;
    const m = /^\s*EXPO_PUBLIC_API_URL\s*=\s*(\S+)\s*$/m.exec(readFileSync(f, 'utf8'));
    if (m) return m[1].replace(/^['"]|['"]$/g, '');
  }
  return null;
}

async function main() {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const arg = (n, d) => {
    const i = process.argv.indexOf(n);
    return i >= 0 ? process.argv[i + 1] : d;
  };
  try {
    const contrato = cargarContrato(resolve(raiz, arg('--contrato', RUTA_CONTRATO)));
    const base = (arg('--base', baseConfigurada(raiz)) ?? '').replace(/\/+$/, '');
    if (!base)
      throw new Error('No hay API configurada: define EXPO_PUBLIC_API_URL (o usa --base).');
    const { hechas, fallos } = await ejecutarEnVivo({
      contrato,
      base,
      timeoutMs: Number(arg('--timeout', '8000')),
    });
    hechas.forEach((h) => console.log(`✓ ${h}`));
    if (hechas.length === 0 && fallos.length === 0)
      fallos.push('El contrato no declara GET públicos que probar.');
    if (fallos.length > 0) {
      fallos.forEach((f) => console.error(`✗ ${f}`));
      process.exit(1);
    }
    console.log(`Contrato verificado: ${hechas.length} GET contra ${base}.`);
  } catch (e) {
    console.error(`✗ ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
