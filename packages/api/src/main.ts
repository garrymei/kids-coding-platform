import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger);
  app.useLogger(logger);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log({ msg: 'api_listening', port, service: 'kids-api' });
}
bootstrap();
