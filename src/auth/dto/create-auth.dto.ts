import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20) // Minimum length of 6 and maximum length of 20 characters
  password: string;
}

export class UserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class profileDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  industry?: string;
}

export class UploadFileDto {
  file: Express.Multer.File;
  directory: string;
}
