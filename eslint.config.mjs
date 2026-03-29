import base from '@fin-folio/eslint-config/base';

export default [
  ...base,
  {
    ignores: ['apps/**', 'packages/**', 'services/**', 'scripts/**'],
  },
];
