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

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
