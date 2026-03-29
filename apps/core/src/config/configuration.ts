import { envSchema } from './env.schema';

export default () => {
  const env = envSchema.parse(process.env);

  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
    },
  };
};
