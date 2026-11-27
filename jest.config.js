/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Solo pruebas de la app; .github/scripts usa node:test y no corre aquí.
  roots: ['<rootDir>/src'],
  // Art. IX: cobertura mínima del 80 % en src/lib y en los hooks de cada feature.
  // Spec 021-T007: los hooks viven en `features/*/hooks.ts` y en `use*.ts(x)`; antes no se medían.
  // Los umbrales no bajan y no se excluye nada para llegar a ellos.
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/features/*/hooks/**/*.{ts,tsx}',
    'src/features/*/hooks.{ts,tsx}',
    'src/features/**/use*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
