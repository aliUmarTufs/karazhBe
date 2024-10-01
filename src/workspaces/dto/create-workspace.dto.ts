import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  ArrayNotEmpty,
  IsArray,
  ValidateIf,
  ValidateNested,
  IsEmail,
  IsIn,
} from 'class-validator';

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

export class AddMemberDto {
  @IsNotEmpty()
  @IsBoolean()
  isMultiple: boolean;

  @ValidateIf((o) => o.isMultiple === true)
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberDto) // Ensure proper type validation of array elements
  members: MemberDto[];
}

export class MemberDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsIn([Role.MEMBER, Role.ADMIN], {
    message: 'Role must be either MEMBER or ADMIN',
  })
  role: Role;
}
