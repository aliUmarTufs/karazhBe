import {
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsString,
  IsOptional,
} from 'class-validator';
import { PostStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  media: any; // Assuming media is stored in a JSON format

  @IsString()
  @IsNotEmpty()
  mediaUrl: string; // Single channel ID

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // This line will transform the incoming string to a Date object
  scheduledAt?: Date;

  @IsOptional()
  @IsString()
  channelId?: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  workSpaceId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  userId: string; // Single user ID
}
