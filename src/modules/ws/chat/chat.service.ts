import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessageEntity, MessageType } from '@app/entities/chat/chat-message.entity';
import { ApiClientService } from '@app/modules/api-client/api-client.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessageEntity.name)
    private readonly chatMessageModel: Model<ChatMessageEntity>,
    private readonly apiClientService: ApiClientService
  ) {}

  async saveMessage(
    senderId: string,
    workspaceId: string,
    conversationId: string,
    content: string,
    type: MessageType = MessageType.TEXT
  ): Promise<ChatMessageEntity> {
    // Verify user membership via gRPC (stack-api)
    await this.apiClientService.verifyWorkspaceMembership(senderId, workspaceId);

    const message = await this.chatMessageModel.create({
      senderId,
      workspaceId,
      conversationId,
      content,
      type,
    });

    return message;
  }
}
