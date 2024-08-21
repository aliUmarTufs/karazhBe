import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateWorkspaceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  timeZone: string;

  @IsOptional()
  @IsString()
  timeZoneOffset?: string;

  @IsNotEmpty()
  @IsString()
  startDay: string;
}
