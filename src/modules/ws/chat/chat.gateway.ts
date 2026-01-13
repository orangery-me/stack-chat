import { JwtService } from '@app/modules/jwt/jwt.service';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from '@app/entities/chat/chat-message.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService, private readonly chatService: ChatService) {}

  afterInit() {
    console.log('Chat gateway initialized');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verifyToken(token);
      // Store user info in socket data
      client.data.user = payload;
      client.data.accessToken = token;
    } catch (error) {
      client.disconnect();
    }
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      workspaceId: string;
      conversationId: string;
      content: string;
      type?: MessageType;
    }
  ) {
    const userId = client?.data?.user?.userId || client?.data?.user?.sub;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const message = await this.chatService.saveMessage(
        userId,
        data.workspaceId,
        data.conversationId,
        data.content,
        data.type || MessageType.TEXT
      );

      const room = `conversation:${data.conversationId}`;
      client.join(room);
      client.to(room).emit('new_message', message);
      client.emit('message_sent', message);
    } catch (error: any) {
      client.emit('error', { message: error?.message || 'Failed to send message' });
    }
  }
}
