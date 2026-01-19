import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetMessagesDto } from './dto/get-messages.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async getMessages(@Body() getMessagesDto: GetMessagesDto) {
    const { channelId, page = 1, size = 20 } = getMessagesDto;
    return this.chatService.getMessagesByChannelId(channelId, size, page);
  }
}
