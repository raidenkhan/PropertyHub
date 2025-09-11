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
