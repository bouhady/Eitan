import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  async ping(): Promise<string> {
    await new Promise((r) => setTimeout(r, 2000)); // mock 2s delay
    return 'ok';
  }
}
