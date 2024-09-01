import {
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { PostStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string; // Single channel ID

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // This line will transform the incoming string to a Date object
  scheduledAt?: Date;

  @IsOptional()
  @IsArray()
  @Type(() => Array) // This line will transform the incoming string to a Date object
  channelsArray?: [{ name: string; id: string }]; // Single channel ID

  @IsString()
  @IsNotEmpty()
  workSpaceId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  userId: string; // Single user ID
}
