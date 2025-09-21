import type { Role } from "@prisma/client";
import { IsEnum, IsString, MinLength } from "class-validator";
import { Roles } from "src/auth/roles.decorator";

export class CreateManagerDto {
  @IsString()

  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  role:["PROPERTY_VERIFIER","ESCROW_MANAGER","DISPUTE_RESOLVER"]
  @IsString()
  createrId:any

}
