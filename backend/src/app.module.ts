import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './controllers/app.controller';
import { PatientsController } from './controllers/patients.controller';
import { AppService } from './services/app.service';
import { TrackingService } from './services/tracking.service';
import { DbService } from './db/db.service';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [AppController, PatientsController],
  providers: [AppService, DbService, TrackingService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
