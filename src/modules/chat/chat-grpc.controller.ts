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
}

interface SendMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
  channelId: string;
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
  createdAt: string;
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
    });

    return {
      id: result.id,
      senderId: result.senderId,
      senderName: result.senderName,
      senderEmail: result.senderEmail,
      senderAvatar: result.senderAvatar,
      content: result.content,
      createdAt: result.createdAt.toISOString(),
      channelId: result.channelId,
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
        createdAt: m.createdAt.toISOString(),
        channelId: m.channelId,
      })),
      hasMore: result.hasMore,
    };
  }
}
