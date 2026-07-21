import { Module, NestModule, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './controllers/app.controller';
import { PatientsController } from './controllers/patients.controller';
import { AppService } from './services/app.service';
import { PatientsService } from './services/patients.service';
import { TrackingService } from './services/tracking.service';
import { DbService } from './db/db.service';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [AppController, PatientsController],
  providers: [
    AppService,
    PatientsService,
    DbService,
    TrackingService,
    {
      // registered in the module (not main.ts) so e2e tests get the same validation;
      // whitelist strips unknown fields; transform applies DTO @Type conversions + defaults
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
