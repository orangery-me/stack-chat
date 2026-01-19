import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from '../abstract.entity';
import { Types } from 'mongoose';
import { applyBaseSchemaTransform } from '@app/helpers/transform';

export enum MessageType {
  TEXT = 'text',
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

  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspaceId: string;

  @Prop({ type: Types.ObjectId, ref: 'Channel' })
  channelId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, enum: Object.values(MessageType), default: MessageType.TEXT })
  type: string;

  @Prop({ type: Object, required: false })
  metadata: Record<string, any>;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessageEntity);
applyBaseSchemaTransform(ChatMessageSchema);
