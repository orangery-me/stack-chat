import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessageEntity, ChatMessageSchema } from '@app/entities/chat/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatGrpcController } from './chat-grpc.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ChatMessageEntity.name, schema: ChatMessageSchema }])],
  controllers: [ChatGrpcController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
