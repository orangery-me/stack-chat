import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessageEntity, MessageType } from '@app/entities/chat/chat-message.entity';
import { SendMessageDto } from './dto/send-message.dto';

export interface MessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  content: string;
  createdAt: Date;
  channelId: string;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
  hasMore: boolean;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessageEntity.name)
    private readonly chatMessageModel: Model<ChatMessageEntity>
  ) {}

  /**
   * Send a channel message - NO verification, trusts data from stack-api
   */
  async sendChannelMessage(data: SendMessageDto): Promise<MessageResponse> {
    const message = await this.chatMessageModel.create({
      senderId: data.userId,
      workspaceId: data.workspaceId,
      channelId: data.channelId,
      content: data.content,
      type: data.messageType || MessageType.TEXT,
    });

    return {
      id: message.id,
      senderId: data.userId,
      senderName: data.userName,
      senderEmail: data.userEmail,
      senderAvatar: data.userAvatar,
      content: message.content,
      createdAt: message.createdAt,
      channelId: message.channelId,
    };
  }

  /**
   * Get messages by channel ID - NO verification, trusts request from stack-api
   */
  async getMessagesByChannelId(channelId: string, size = 20, page = 1): Promise<GetMessagesResponse> {
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
        senderName: '', // Will be populated by stack-api if needed
        senderEmail: '',
        senderAvatar: '',
        content: m.content,
        createdAt: m.createdAt,
        channelId: m.channelId,
      })),
      hasMore,
    };
  }
}
