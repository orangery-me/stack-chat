import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { WorkspaceClientService } from './workspace-client.service';
import { UserClientService } from './user-client.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'WORKSPACE_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'workspace',
            protoPath: join(process.cwd(), 'proto', 'workspace.proto'),
            url: configService.get<string>('STACK_API_GRPC_URL', 'localhost:50051'),
          },
        }),
      },
      {
        name: 'USER_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: join(process.cwd(), 'proto', 'user.proto'),
            url: configService.get<string>('STACK_API_GRPC_URL', 'localhost:50051'),
          },
        }),
      },
    ]),
  ],
  providers: [WorkspaceClientService, UserClientService],
  exports: [WorkspaceClientService, UserClientService],
})
export class ApiClientModule {}
