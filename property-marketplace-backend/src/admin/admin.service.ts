import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManagerDto } from './dto/create-manager.dto';


@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
    ) {}
    createManager(data:CreateManagerDto) {
      
    }

  
}