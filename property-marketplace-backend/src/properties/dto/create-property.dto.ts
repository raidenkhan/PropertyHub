import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsArray, 
  IsObject, 
  MinLength, 
  MaxLength, 
  Min,
  IsBoolean,
  ValidateNested,

} from 'class-validator';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { Optional } from '@nestjs/common';
// Enums from your schema
export enum PropertyType {
  RENT = 'RENT',
  LEASE = 'LEASE',
  SELL = 'SELL'
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  LISTED = 'LISTED',
  UNDER_OFFER = 'UNDER_OFFER',
  SOLD = 'SOLD',
  DELISTED = 'DELISTED',
  SUSPENDED = 'SUSPENDED'
}

// Coordinates DTO
export class CoordinatesDto {
  @IsNumber()

  lat: number;

  @IsNumber()

  lng: number;
}

// Create Property DTO
export class CreatePropertyDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  location: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsObject()
  specifications?: any;
}

// Update Property DTO
export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsObject()
  specifications?: any;

  @IsOptional()
  status?: PropertyStatus;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

// Property Search DTO
export class PropertySearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  bathrooms?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Property Filter DTO (for simpler filtering)
export class PropertyFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
// Property Statistics Response DTO
export class PropertyStatsDto {
  total: number;
  draft: number;
  pending_verification: number;
  verified: number;
  listed: number;
  under_offer: number;
  sold: number;
  suspended: number;
  by_type: {
    type: PropertyType;
    count: number;
  }[];
  recent_activity: {
    date: string;
    created: number;
    listed: number;
    sold: number;
  }[];
}

// Property Response DTO (for consistent API responses)
export class PropertyResponseDto {
  id: number;
  propertyId: string;
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  location: string;
  coordinates?: CoordinatesDto;
  images: string[];
  amenities: string[];
  specifications?: any;
  status: PropertyStatus;
  isVerified: boolean;
  currentOwner: {
    id: number;
    name: string;
    email?: string;
  };
  listedBy?: {
    id: number;
    name: string;
  };
  verifiedBy?: {
    id: number;
    name: string;
  };
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  listedAt?: Date;
  soldAt?: Date;
}

// Paginated Response DTO
export class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Location-based Search DTO
export class LocationSearchDto {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}