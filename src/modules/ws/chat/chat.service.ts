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

  async sendChannelMessage(senderId, workspaceId, channelId, content) {
    // Check permission
    await this.apiClientService.verifyWorkspaceMembership(senderId, workspaceId);

    return this.chatMessageModel.create({
      senderId,
      workspaceId,
      channelId,
      content,
      type: MessageType.TEXT,
    });
  }

  async getMessagesByChannelId(channelId: string, size = 20, page = 1): Promise<{ messages: any[]; hasMore: boolean }> {
    const messages = await this.chatMessageModel
      .find({ channelId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(size);

    const hasMore = messages.length === size;

    // Return in chronological order
    return {
      messages: messages.reverse().map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: 'User', // TODO: lookup user name
        content: m.content,
        createdAt: m.createdAt,
        channelId: m.channelId,
      })),
      hasMore,
    };
  }
}
