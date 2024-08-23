import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreateIdeaDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  media: any; // Assuming media is stored in a JSON format

  @IsString()
  @IsNotEmpty()
  mediaUrl: string; // Single channel ID

  @IsEnum(PostStatus)
  status: PostStatus;

  @IsString()
  @IsNotEmpty()
  workSpaceId: string; // Single channel ID

  @IsString()
  @IsNotEmpty()
  userId: string; // Single user ID
}
