/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, VerifyEmailDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { WorkSpaceAdminGuard } from 'src/guards/workspace-admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Get(':workspaceId')
  async getUsers(@Req() req, @Param('workspaceId') workspaceId: string) {
    const filter = {
      limit: +req.query.limit,
      offset: +req.query.offset,
      search: req.query.search,
    };
    return await this.usersService.getUsers(filter, req.user);
  }
  @UseGuards(LocalAuthGuard)
  @Post('check-email')
  async verifyUser(@Body() body: VerifyEmailDto, @Req() req) {
    return await this.usersService.verifyUser(body.email, req.user);
  }
}
