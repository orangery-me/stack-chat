import { Injectable, NotFoundException } from '@nestjs/common';
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
  messageType: string;
  createdAt: Date;
  channelId: string;
  metadata?: Record<string, any>;
  isPinned?: boolean;
  pinnedAt?: Date | null;
  pinnedBy?: string | null;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
  hasMore: boolean;
}

export interface DeleteMessageResponse {
  id: string;
  channelId: string;
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
    const metadata = this.normalizeMetadata(data.metadata);
    const message = await this.chatMessageModel.create({
      senderId: data.userId,
      workspaceId: data.workspaceId,
      channelId: data.channelId,
      content: data.content,
      type: data.messageType || MessageType.TEXT,
      metadata,
    });

    return {
      id: message.id,
      senderId: data.userId,
      senderName: data.userName,
      senderEmail: data.userEmail,
      senderAvatar: data.userAvatar,
      content: message.content,
      messageType: message.type,
      createdAt: message.createdAt,
      channelId: message.channelId,
      metadata: message.metadata,
      isPinned: message.isPinned || false,
      pinnedAt: message.pinnedAt || null,
      pinnedBy: message.pinnedBy || null,
    };
  }

  async pinMessage(channelId: string, messageId: string, pinnedBy: string): Promise<MessageResponse> {
    return this.setMessagePinned(channelId, messageId, true, pinnedBy);
  }

  async unpinMessage(channelId: string, messageId: string, pinnedBy: string): Promise<MessageResponse> {
    return this.setMessagePinned(channelId, messageId, false, pinnedBy);
  }

  async deleteMessage(channelId: string, messageId: string): Promise<DeleteMessageResponse> {
    const message = await this.chatMessageModel.findOneAndDelete({ _id: messageId, channelId }).lean();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return {
      id: message._id?.toString?.() ?? messageId,
      channelId: message.channelId,
    };
  }

  async getMessagesByChannelId(channelId: string, size = 20, page = 1): Promise<GetMessagesResponse> {
    const limit = size + 1; // fetch one extra row to check hasMore cheaply

    const messages = await this.chatMessageModel
      .find({ channelId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(limit)
      .select(['senderId', 'content', 'type', 'createdAt', 'channelId', 'metadata', 'isPinned', 'pinnedAt', 'pinnedBy'])
      // Return plain objects instead of Mongoose Documents
      .lean();

    const hasMore = messages.length === limit;
    const sliced = hasMore ? messages.slice(0, size) : messages;

    return {
      messages: sliced.map((m: any) => ({
        id: m._id?.toString?.() ?? m.id,
        senderId: m.senderId,
        senderName: '', // Will be populated by stack-api if needed
        senderEmail: '',
        senderAvatar: '',
        content: m.content,
        messageType: m.type || MessageType.TEXT,
        createdAt: m.createdAt,
        channelId: m.channelId,
        metadata: m.metadata,
        isPinned: m.isPinned || false,
        pinnedAt: m.pinnedAt || null,
        pinnedBy: m.pinnedBy || null,
      })),
      hasMore,
    };
  }

  private async setMessagePinned(
    channelId: string,
    messageId: string,
    isPinned: boolean,
    pinnedBy: string
  ): Promise<MessageResponse> {
    const message = await this.chatMessageModel.findOne({ _id: messageId, channelId });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.isPinned = isPinned;
    message.pinnedAt = isPinned ? new Date() : null;
    message.pinnedBy = isPinned ? pinnedBy : null;
    await message.save();

    return {
      id: message.id,
      senderId: message.senderId,
      senderName: '',
      senderEmail: '',
      senderAvatar: '',
      content: message.content,
      messageType: message.type || MessageType.TEXT,
      createdAt: message.createdAt,
      channelId: message.channelId,
      metadata: message.metadata,
      isPinned: message.isPinned || false,
      pinnedAt: message.pinnedAt || null,
      pinnedBy: message.pinnedBy || null,
    };
  }

  private normalizeMetadata(metadata?: Record<string, any> | string): Record<string, any> | undefined {
    if (!metadata) return undefined;
    if (typeof metadata !== 'string') return metadata;
    try {
      return JSON.parse(metadata);
    } catch {
      return undefined;
    }
  }
}
