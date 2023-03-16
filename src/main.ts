import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule.js';
import { config } from './config.js';
import { NestServices } from './NestServices.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  NestServices.init(app);

  await app.listen(config.port);
}
bootstrap();
