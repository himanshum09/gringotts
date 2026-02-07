import nodeConfig from '@fin-folio/eslint-config/node';

export default [
  ...nodeConfig,
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
];
