import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';



export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 20) // Minimum length of 6 and maximum length of 20 characters
  password: string;
}

