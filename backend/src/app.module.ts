import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { DbService } from './db/db.service';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DbService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
