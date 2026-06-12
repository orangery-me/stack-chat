import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from '../abstract.entity';
import { Types } from 'mongoose';
import { applyBaseSchemaTransform } from '@app/helpers/transform';

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  EMOJI = 'emoji',
}

@Schema({
  collection: 'chat_messages',
})
export class ChatMessageEntity extends AbstractEntity {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  senderId: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', index: true })
  workspaceId: string;

  @Prop({ type: Types.ObjectId, ref: 'Channel', index: true })
  channelId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, enum: Object.values(MessageType), default: MessageType.TEXT })
  type: string;

  @Prop({ type: Object, required: false })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false, index: true })
  isPinned: boolean;

  @Prop({ type: Date, required: false, default: null })
  pinnedAt?: Date | null;

  @Prop({ type: String, required: false, default: null })
  pinnedBy?: string | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessageEntity);
ChatMessageSchema.index({ channelId: 1, createdAt: -1 });
applyBaseSchemaTransform(ChatMessageSchema);
