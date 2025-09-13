import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let server: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để API có thể được gọi từ FE
  app.enableCors();

  // Nếu bạn muốn route có prefix /api
  // app.setGlobalPrefix('api');

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
}
