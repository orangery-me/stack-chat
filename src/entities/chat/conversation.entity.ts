import { Prop } from '@nestjs/mongoose';
import { AbstractEntity } from '../abstract.entity';
import { Types } from 'mongoose';

export enum ConversationType {
  CHANNEL = 'channel',
  DM = 'dm',
  GROUP_DM = 'group_dm',
}

export class ConversationEntity extends AbstractEntity {
  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspaceId: string;

  @Prop({ type: String, enum: Object.values(ConversationType) })
  type: ConversationType;

  @Prop({ type: Types.ObjectId, ref: 'Channel', required: false })
  channelId?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: false })
  memberIds?: string[];
}
