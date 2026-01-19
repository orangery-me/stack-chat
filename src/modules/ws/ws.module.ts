import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat/chat.gateway';
import { ChatService } from './chat/chat.service';
import { ApiClientModule } from '../api-client/api-client.module';
import { ChatMessageEntity, ChatMessageSchema } from '@app/entities/chat/chat-message.entity';
import { JwtService } from '../jwt/jwt.service';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [
    ConfigModule,
    ApiClientModule,
    MongooseModule.forFeature([{ name: ChatMessageEntity.name, schema: ChatMessageSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRETKEY'),
      }),
    }),
  ],
  providers: [ChatGateway, ChatService, JwtService],
  exports: [ChatGateway],
  controllers: [ChatController],
})
export class WsModule {}
