import { IsNotEmpty, IsEnum, IsDate, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty()
  content: string;

  media: any; // Assuming media is stored in a JSON format

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsDate()
  @Type(() => Date) // This line will transform the incoming string to a Date object
  scheduledAt?: Date;

  @IsString()
  @IsNotEmpty()
  channelId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  workSpaceId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  userId: string; // Single user ID
}
