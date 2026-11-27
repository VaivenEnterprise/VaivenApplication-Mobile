import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSbom} from './sbom.mjs';
const pkg = {name: 'vaiven-frontend', version: '1.1.2', dependencies: {'@tanstack/react-query': '^5', zod: '^4'}};
const component = (name, version = '1.0.0') => ({name, version, purl: 'pkg:npm/' + name + '@' + version});
const bom = (extra = {}) => ({bomFormat: 'CycloneDX', specVersion: '1.5', metadata: {component: {name: 'vaiven-frontend', version: '1.1.2'}}, components: [component('@tanstack/react-query'), component('zod')], ...extra});
test('acepta un SBOM CycloneDX de esta app con sus dependencias directas', () => {
  assert.deepEqual(validateSbom(bom(), pkg), {errors: [], components: 2});
});
test('falla si no es CycloneDX o no declara version de especificacion', () => {
  assert.equal(validateSbom(bom({bomFormat: 'SPDX'}), pkg).errors.length, 1);
  assert.equal(validateSbom(bom({specVersion: undefined}), pkg).errors.length, 1);
});
test('falla si describe otro proyecto u otra version', () => {
  assert.equal(validateSbom(bom({metadata: {component: {name: 'vaiven-frontend', version: '1.0.0'}}}), pkg).errors.length, 1);
});
test('falla si esta vacio, si un componente no tiene purl o si falta una dependencia directa', () => {
  assert.ok(validateSbom(bom({components: []}), pkg).errors.length >= 1);
  assert.equal(validateSbom(bom({components: [component('@tanstack/react-query'), {name: 'zod', version: '4'}]}), pkg).errors.length, 1);
  assert.match(validateSbom(bom({components: [component('zod')]}), pkg).errors.join(), /@tanstack\/react-query/);
});
