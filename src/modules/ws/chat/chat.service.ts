import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessageEntity, MessageType } from '@app/entities/chat/chat-message.entity';
import { UserClientService } from '@app/modules/api-client/user-client.service';
import { WorkspaceClientService } from '@app/modules/api-client/workspace-client.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessageEntity.name)
    private readonly chatMessageModel: Model<ChatMessageEntity>,
    private readonly workspaceClientService: WorkspaceClientService,
    private readonly userClientService: UserClientService
  ) {}

  async sendChannelMessage(senderId, workspaceId, channelId, content) {
    // Check permission
    await this.workspaceClientService.verifyWorkspaceMembership(senderId, workspaceId);

    // get sender profile
    const profile = await this.userClientService.getUserProfile(senderId);
    const message = await this.chatMessageModel.create({
      senderId,
      workspaceId,
      channelId,
      content,
      type: MessageType.TEXT,
    });

    return {
      id: message.id,
      senderId: message.senderId,
      senderName: profile?.name,
      senderEmail: profile?.email,
      senderAvatar: profile?.avatar,
      content: message.content,
      createdAt: message.createdAt,
      channelId: message.channelId,
    };
  }

  async getMessagesByChannelId(channelId: string, size = 20, page = 1): Promise<{ messages: any[]; hasMore: boolean }> {
    const messages = await this.chatMessageModel
      .find({ channelId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(size);

    const hasMore = messages.length === size;

    const senderIds = Array.from(new Set(messages.map((m) => m.senderId).filter((id) => !!id)));
    const profileEntries = await Promise.all(
      senderIds.map(async (id) => {
        const profile = await this.userClientService.getUserProfile(id);
        return [id, profile] as const;
      })
    );
    const profileMap = new Map(profileEntries);

    // Return in chronological order
    return {
      messages: messages.reverse().map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: profileMap.get(m.senderId)?.name || 'Unknown',
        senderEmail: profileMap.get(m.senderId)?.email || null,
        senderAvatar: profileMap.get(m.senderId)?.avatar || null,
        content: m.content,
        createdAt: m.createdAt,
        channelId: m.channelId,
      })),
      hasMore,
    };
  }
}
