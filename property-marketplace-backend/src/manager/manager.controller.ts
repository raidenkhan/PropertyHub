import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ManagerService } from './manager.service';
import {
  SuspendUserDto,
  WarnUserDto,
  ActivateUserDto,
  ApproveRejectPropertyDto,
  SuspendPropertyDto,
  EscalateDisputeDto,
  ResolveDisputeDto,
  CreateReportDto,
  UserFilterDto,
  PropertyFilterDto,
  TransactionFilterDto,
  DisputeFilterDto,
} from './dto/manager.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  // === DASHBOARD STATS ===
  @Get('dashboard/stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER')
  async getDashboardStats() {
    return this.managerService.getDashboardStats();
  }

  // === USER MANAGEMENT ===
  @Get('users')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllUsers(@Query() filterDto: UserFilterDto) {
    return this.managerService.getAllUsers(filterDto.page, filterDto.limit);
  }

  @Patch('users/:id/suspend')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async suspendUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: SuspendUserDto,
    @Req() req,
  ) {
    return this.managerService.suspendUser(userId, dto, req.user.userId);
  }

  @Patch('users/:id/activate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async activateUser(
    @Param('id', ParseIntPipe) userId: number,
    @Req() req,
  ) {
    return this.managerService.activateUser(userId, req.user.userId);
  }

  @Post('users/:id/warn')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async warnUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: WarnUserDto,
    @Req() req,
  ) {
    // Implementation would depend on if you want to track warnings
    return { message: 'Warning sent to user', userId };
  }

  // === PROPERTY MANAGEMENT ===
  @Get('properties/pending')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async getPendingProperties() {
 
    return this.managerService.getPendingProperties();
  }

  @Patch('properties/:id/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async approveProperty(
    @Param('id', ParseIntPipe) propertyId: number,
    @Req() req,
  ) {
    return this.managerService.approveProperty(propertyId, req.user.userId);
  }

  @Patch('properties/:id/reject')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async rejectProperty(
    @Param('id', ParseIntPipe) propertyId: number,
    @Body() dto: ApproveRejectPropertyDto,
    @Req() req,
  ) {
    return this.managerService.rejectProperty(propertyId, dto, req.user.userId);
  }

  @Patch('properties/:id/suspend')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER')
  async suspendProperty(
    @Param('id', ParseIntPipe) propertyId: number,
    @Body() dto: SuspendPropertyDto,
    @Req() req,
  ) {
    return this.managerService.suspendProperty(propertyId, dto.reason, req.user.userId);
  }

  // === TRANSACTION MANAGEMENT ===
  @Get('transactions')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async getAllTransactions(@Query() filterDto: TransactionFilterDto) {
    return this.managerService.getAllTransactions();
  }

  @Get('transactions/escrow')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async getEscrowTransactions() {
    return this.managerService.getEscrowTransactions();
  }

  @Patch('transactions/:id/release-escrow')
  @Roles('SUPER_ADMIN', 'ADMIN', 'ESCROW_MANAGER')
  async releaseEscrow(
    @Param('id', ParseIntPipe) transactionId: number,
    @Body() dto: { notes?: string },
    @Req() req,
  ) {
    return this.managerService.releaseEscrow(
      transactionId,
      dto.notes,
      req.user.userId,
    );
  }

  // === DISPUTE MANAGEMENT ===
  @Get('disputes')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DISPUTE_RESOLVER')
  async getAllDisputes(@Query() filterDto: DisputeFilterDto) {
    return this.managerService.getAllDisputes();
  }

  @Patch('disputes/:id/escalate')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DISPUTE_RESOLVER')
  async escalateDispute(
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() dto: EscalateDisputeDto,
    @Req() req,
  ) {
    return this.managerService.escalateDispute(disputeId, req.user.userId, dto.escalationReason);
  }

  @Patch('disputes/:id/resolve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DISPUTE_RESOLVER')
  async resolveDispute(
    @Param('id', ParseIntPipe) disputeId: number,
    @Body() dto: ResolveDisputeDto,
    @Req() req,
  ) {
    return this.managerService.resolveDispute(disputeId, dto.resolution, req.user.userId);
  }

  // === MESSAGE MANAGEMENT ===
  @Get('messages')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllMessages() {
    return this.managerService.getAllMessages();
  }

  // === REPORTING ===
  @Post('reports')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROPERTY_VERIFIER', 'ESCROW_MANAGER', 'DISPUTE_RESOLVER')
  async createReport(@Body() dto: CreateReportDto, @Req() req) {
    return { message: 'Report created successfully', reportId: Date.now() }; // Simplified implementation
  }
}