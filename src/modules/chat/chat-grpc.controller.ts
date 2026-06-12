import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ChatService } from './chat.service';

interface SendMessageRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  workspaceId: string;
  channelId: string;
  content: string;
  messageType: string;
  metadata?: string;
}

interface SendMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  content: string;
  messageType: string;
  createdAt: string;
  channelId: string;
  metadata?: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
}

interface GetMessagesRequest {
  channelId: string;
  page: number;
  size: number;
}

interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  content: string;
  messageType: string;
  createdAt: string;
  channelId: string;
  metadata?: string;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
}

interface PinMessageRequest {
  channelId: string;
  messageId: string;
  pinnedBy: string;
}

interface DeleteMessageRequest {
  channelId: string;
  messageId: string;
  deletedBy: string;
}

interface DeleteMessageResponse {
  id: string;
  channelId: string;
}

interface GetMessagesResponse {
  messages: MessageItem[];
  hasMore: boolean;
}

@Controller()
export class ChatGrpcController {
  constructor(private readonly chatService: ChatService) {}

  @GrpcMethod('ChatService', 'SendMessage')
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    const result = await this.chatService.sendChannelMessage({
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      userAvatar: data.userAvatar,
      workspaceId: data.workspaceId,
      channelId: data.channelId,
      content: data.content,
      messageType: data.messageType,
      metadata: data.metadata,
    });

    return {
      id: result.id,
      senderId: result.senderId,
      senderName: result.senderName,
      senderEmail: result.senderEmail,
      senderAvatar: result.senderAvatar,
      content: result.content,
      messageType: result.messageType,
      createdAt: result.createdAt.toISOString(),
      channelId: result.channelId,
      metadata: this.stringifyMetadata(result.metadata),
      isPinned: result.isPinned || false,
      pinnedAt: result.pinnedAt ? result.pinnedAt.toISOString() : '',
      pinnedBy: result.pinnedBy || '',
    };
  }

  @GrpcMethod('ChatService', 'GetMessages')
  async getMessages(data: GetMessagesRequest): Promise<GetMessagesResponse> {
    const page = data.page || 1;
    const size = data.size || 20;

    const result = await this.chatService.getMessagesByChannelId(data.channelId, size, page);

    return {
      messages: result.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderEmail: m.senderEmail,
        senderAvatar: m.senderAvatar,
        content: m.content,
        messageType: m.messageType,
        createdAt: m.createdAt.toISOString(),
        channelId: m.channelId,
        metadata: this.stringifyMetadata(m.metadata),
        isPinned: m.isPinned || false,
        pinnedAt: m.pinnedAt ? m.pinnedAt.toISOString() : '',
        pinnedBy: m.pinnedBy || '',
      })),
      hasMore: result.hasMore,
    };
  }

  @GrpcMethod('ChatService', 'PinMessage')
  async pinMessage(data: PinMessageRequest): Promise<MessageItem> {
    const result = await this.chatService.pinMessage(data.channelId, data.messageId, data.pinnedBy);
    return this.toMessageItem(result);
  }

  @GrpcMethod('ChatService', 'UnpinMessage')
  async unpinMessage(data: PinMessageRequest): Promise<MessageItem> {
    const result = await this.chatService.unpinMessage(data.channelId, data.messageId, data.pinnedBy);
    return this.toMessageItem(result);
  }

  @GrpcMethod('ChatService', 'DeleteMessage')
  async deleteMessage(data: DeleteMessageRequest): Promise<DeleteMessageResponse> {
    return this.chatService.deleteMessage(data.channelId, data.messageId);
  }

  private stringifyMetadata(metadata?: Record<string, any>): string {
    return metadata ? JSON.stringify(metadata) : '';
  }

  private toMessageItem(result: any): MessageItem {
    return {
      id: result.id,
      senderId: result.senderId,
      senderName: result.senderName,
      senderEmail: result.senderEmail,
      senderAvatar: result.senderAvatar,
      content: result.content,
      messageType: result.messageType,
      createdAt: result.createdAt.toISOString(),
      channelId: result.channelId,
      metadata: this.stringifyMetadata(result.metadata),
      isPinned: result.isPinned || false,
      pinnedAt: result.pinnedAt ? result.pinnedAt.toISOString() : '',
      pinnedBy: result.pinnedBy || '',
    };
  }
}
