import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

// === USER MODERATION DTOs ===
export class SuspendUserDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason?: string;
}

export class WarnUserDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason?: string;
}

export class ActivateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// === PROPERTY MANAGEMENT DTOs ===
export class ApproveRejectPropertyDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string; // Required for rejection, optional for approval
}

export class SuspendPropertyDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

// === TRANSACTION MANAGEMENT DTOs ===
export class ReleaseEscrowDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CancelTransactionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}

// === DISPUTE MANAGEMENT DTOs ===
export class EscalateDisputeDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  escalationReason?: string;
}

export class ResolveDisputeDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  resolution: string;

  @IsOptional()
  @IsEnum(['COMPLAINANT', 'RESPONDENT', 'MUTUAL'])
  rulingInFavorOf?: 'COMPLAINANT' | 'RESPONDENT' | 'MUTUAL';
}

// === REPORTING SYSTEM DTOs ===
export class CreateReportDto {
  @IsEnum(['USER', 'PROPERTY', 'MESSAGE', 'TRANSACTION'])
  type: 'USER' | 'PROPERTY' | 'MESSAGE' | 'TRANSACTION';

  @IsInt()
  entityId: number;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// === PAGINATION DTOs ===
export class PaginationDto {
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 50;
}

export class UserFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ALL'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ALL';

  @IsOptional()
  @IsString()
  role?: string;
}

export class PropertyFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'LISTED', 'UNDER_OFFER', 'SOLD', 'SUSPENDED', 'ALL'])
  status?: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'LISTED' | 'UNDER_OFFER' | 'SOLD' | 'SUSPENDED' | 'ALL' = 'ALL';

  @IsOptional()
  @IsEnum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'ALL'])
  type?: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'LAND' | 'OFFICE' | 'WAREHOUSE' | 'ALL' = 'ALL';
}

export class TransactionFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'ESCROW', 'PAYMENT_CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'ALL'])
  status?: 'PENDING' | 'ESCROW' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'ALL' = 'ALL';
}

export class DisputeFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED', 'ESCALATED', 'ALL'])
  status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED' | 'ESCALATED' | 'ALL' = 'ALL';

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ALL'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ALL' = 'ALL';
}








// For filtering
