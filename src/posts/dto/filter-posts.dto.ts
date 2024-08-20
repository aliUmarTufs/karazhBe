import {
  IsOptional,
  IsEnum,
  IsDate,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma/client';

export class FilterPostsDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  @Type(() => String)
  channelId?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  workSpaceId?: string;

  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  userId: string; // Single user ID

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
