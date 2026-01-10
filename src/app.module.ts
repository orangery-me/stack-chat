import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';

import { DatabaseModule } from '@app/config/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { KeepAliveModule } from './modules/keep-alive/keep-alive.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: path.join(__dirname, '../src/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        { use: HeaderResolver, options: ['x-lang'] },
        AcceptLanguageResolver,
      ],
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        // Application
        APP_PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),

        // Database
        MONGODB_URI: Joi.string().required(),

        // Features
        ENABLE_SWAGGER: Joi.boolean().default(true),
        ENABLE_CORS: Joi.boolean().default(true),
        ENABLE_RATE_LIMITING: Joi.boolean().default(false),

        // Keep-alive
        KEEP_ALIVE_ENABLED: Joi.boolean().default(true),
        KEEP_ALIVE_INTERVAL: Joi.number().default(30),

        // Optional
        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        TZ: Joi.string().default('Asia/Ho_Chi_Minh'),
      }),
    }),
    DatabaseModule,
    KeepAliveModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
