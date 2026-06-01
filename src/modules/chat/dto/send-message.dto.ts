export class SendMessageDto {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  workspaceId: string;
  channelId: string;
  content: string;
  messageType?: string;
  metadata?: Record<string, any> | string;
}
