import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
     origin: [
      
      'http://localhost:3001', 
      ,
      'http://127.0.0.1:3001',
      
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
   credentials: true,
  
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(process.env.PORT ?? 3000);

    console.log(`🚀 Application running on: http://localhost:3000`);
  console.log(`🔌 Socket.IO available at: http://localhost:3000/socket.io/`);
}
bootstrap();
