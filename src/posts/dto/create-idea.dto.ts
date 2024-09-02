import { IsNotEmpty, IsEnum, IsString, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreateIdeaDto {
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string; // Single channel ID

  @IsOptional()
  @IsString()
  mediaName?: string; // Single channel ID

  @IsOptional()
  @IsString()
  mediaType?: string; // Single channel ID

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsString()
  @IsNotEmpty()
  workSpaceId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  userId: string; // Single user ID
}
