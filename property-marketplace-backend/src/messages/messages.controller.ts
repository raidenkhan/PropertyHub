import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Post(':userId/mark-read')
async markAsRead(@Param('userId') userId: string, @Req() req) {
  await this.messagesService.markAsRead(req.user.userId, parseInt(userId));
  return {
    status: 'success',
    message: 'Messages marked as read',
  };
}
   @Get()
  async getConversations(@Req() req) {
    const conversations = await this.messagesService.getConversations(req.user.userId);
    return {
      status: 'success',
       conversations,
    };
  }
  @Get('unread-count')
async getUnreadCount(@Req() req) {
  const count = await this.messagesService.getTotalUnreadCount(req.user.userId);
  return { status: 'success', count };
}
   @Get(':userId')
  async getMessages(@Param('userId') userId: string, @Req() req) {
    const messages = await this.messagesService.getMessages(
      req.user.userId,
      parseInt(userId),
    );
    return {
      status: 'success',
       messages,
    };
  }
   @Post(':messageId/report')
  async reportMessage(@Param('messageId') messageId: string, @Req() req) {
    const result = await this.messagesService.reportMessage(
      parseInt(messageId),
      req.user.userId,
    );
    return {
      status: 'success',
      message: 'Message reported successfully',
       result,
    };
  }


  @Post()
  async create(@Req() req, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(req.user.sub, dto);
  }

  @Get(':otherUserId')
  async findConversation(@Req() req, @Param('otherUserId') otherUserId: string) {
    return this.messagesService.findConversation(req.user.sub, +otherUserId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async findAllForAdmin() {
    return this.messagesService.findAllForAdmin();
  }
}
