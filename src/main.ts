import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from '@app/app.module';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT || 50052;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'chat',
      protoPath: join(process.cwd(), 'proto', 'chat.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.listen();
  console.log(`🚀 Chat gRPC service running on ${grpcPort}`);
}

bootstrap();
