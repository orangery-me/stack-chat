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

  @SubscribeMessage('send_channel_message')
  async handleSendChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      workspaceId: string;
      channelId: string;
      content: string;
    }
  ) {
    const userId = client?.data?.user?.userId || client?.data?.user?.sub;

    console.log('[Chat Gateway] 📥 Received send_channel_message:', {
      userId,
      channelId: data.channelId,
      workspaceId: data.workspaceId,
      content: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
      clientId: client.id,
    });

    if (!userId) {
      console.log('[Chat Gateway] ❌ Unauthorized: No userId found');
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const message = await this.chatService.sendChannelMessage(userId, data.workspaceId, data.channelId, data.content);

      console.log('[Chat Gateway] 💾 Message saved to database:', {
        messageId: message.id,
        channelId: message.channelId,
        senderId: message.senderId,
      });

      const room = `channel:${data.channelId}`;
      client.join(room);

      console.log('[Chat Gateway] 📤 Broadcasting new_message to room:', {
        room,
        messageId: message.id,
        channelId: message.channelId,
      });
      client.to(room).emit('new_message', message);

      console.log('[Chat Gateway] ✅ Sending message_sent confirmation to sender:', {
        clientId: client.id,
        messageId: message.id,
      });
      client.emit('message_sent', message);
    } catch (error: any) {
      console.error('[Chat Gateway] ❌ Error sending message:', {
        error: error?.message || error,
        channelId: data.channelId,
        userId,
      });
      client.emit('error', { message: error?.message || 'Failed to send message' });
    }
  }

  @SubscribeMessage('join_channel')
  async handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() data: { channelId: string }) {
    const room = `channel:${data.channelId}`;
    client.join(room);
    client.emit('joined_channel', { channelId: data.channelId });
  }

  @SubscribeMessage('load_messages')
  async handleLoadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      page?: number;
      size?: number;
    }
  ) {
    const userId = client?.data?.user?.userId || client?.data?.user?.sub;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const page = data.page || 1;
      const size = data.size || 20;

      const result = await this.chatService.getMessagesByChannelId(data.channelId, size, page);

      client.emit('messages_loaded', {
        channelId: data.channelId,
        messages: result.messages,
        page,
        hasMore: result.hasMore,
      });
    } catch (error: any) {
      client.emit('error', { message: error?.message || 'Failed to load messages' });
    }
  }
}
