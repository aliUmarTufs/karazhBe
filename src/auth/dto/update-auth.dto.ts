import { PartialType } from '@nestjs/mapped-types';
import { AuthDto } from './create-auth.dto';

export class UpdateUserDto extends PartialType(AuthDto) {}
