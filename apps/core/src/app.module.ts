import { DbModule } from '@fin-folio/db/nestjs';
import type { LogLevel } from '@fin-folio/o11y';
import { O11yModule } from '@fin-folio/o11y/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';

console.log('NODE_ENV', process.env.NODE_ENV);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    DbModule.forRoot({
      databaseUrl: process.env.DATABASE_URL!,
    }),
    O11yModule.forRoot({
      serviceName: 'fin-folio-core',
      logging: {
        level: (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
      ignorePaths: ['/health', '/metrics'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
