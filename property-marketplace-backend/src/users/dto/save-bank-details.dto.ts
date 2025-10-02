import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class SaveBankDetailsDto {
  @IsEnum(['nuban', 'mobile_money'])
  @IsNotEmpty()
  type: 'nuban' | 'mobile_money';

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;
}
