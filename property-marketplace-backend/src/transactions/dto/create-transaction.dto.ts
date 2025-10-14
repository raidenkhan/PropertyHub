import { IsInt, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { TransactionStatus } from '@prisma/client'; // Assuming you generate a client with enums

// A DTO for initiating a new transaction
export class CreateTransactionDto {
  @IsInt()
  propertyId: string;

  @IsNumber()
  offerAmount: number;
}

// A DTO for accepting an offer
export class AcceptOfferDto {
  @IsInt()
  transactionId: number;
}

// A DTO for releasing escrow
export class ReleaseEscrowDto {
  @IsInt()
  transactionId: number;
  
  @IsInt()
  @IsOptional()
  managerId?: number; // Optional, can be taken from request
}

// A DTO for canceling a transaction
export class CancelTransactionDto {
  @IsInt()
  transactionId: number;

  @IsOptional()
  reason?: string;
}

// A DTO for updating a transaction's status and amount (for disputes or adjustments)
export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsNumber()
  @IsOptional()
  amount?: number;
}