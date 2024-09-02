import {
  IsOptional,
  IsEnum,
  IsDate,
  IsString,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma/client';

export class FilterPostsDto {
  @IsNotEmpty()
  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @IsArray()
  @Type(() => Array<string>)
  channelIds?: string[];

  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  workSpaceId: string;

  @IsNotEmpty()
  @IsString()
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
