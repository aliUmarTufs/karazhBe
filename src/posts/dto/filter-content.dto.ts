import { IsOptional, IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterContentDto {
  // @IsOptional()
  // @IsString()
  // @Type(() => Array<string>)
  // channelIds?: string[];

  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  workSpaceId: string;

  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  userId: string; // Single user ID

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number;
}
