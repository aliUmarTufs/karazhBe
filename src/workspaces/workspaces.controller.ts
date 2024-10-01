import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkSpaceAdminGuard } from 'src/guards/workspace-admin.guard';
import { Role } from '@prisma/client';
import { AddMemberDto } from './dto/create-workspace.dto';
import { query } from 'express';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // @Post()
  // create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
  //   return this.workspacesService.create(createWorkspaceDto);
  // }
  @UseGuards(LocalAuthGuard)
  @Get()
  async getUserWorkSpaces(
    @Req() req,
    @Query() query: { limit?: number; offset?: number },
  ) {
    return this.workspacesService.getUserWorkSpaces(req.user.userId, query);
  }
  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Patch(':workspaceId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return await this.workspacesService.update(workspaceId, updateWorkspaceDto);
  }

  @UseGuards(LocalAuthGuard)
  @Get('get-details/:workspaceId')
  async findOne(@Param('workspaceId') workspaceId: string, @Req() req) {
    return await this.workspacesService.findOne(workspaceId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Get('get-members/:workspaceId')
  async getMembersByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Req() req,
  ) {
    return await this.workspacesService.getMembersByWorkspace(
      workspaceId,
      req.user,
    );
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Patch('update-member/:workspaceId')
  async updateMember(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { id?: string; role?: Role; isConfirmed?: boolean },
    @Req() req,
  ) {
    const allowedRolesForUpdate: Role[] = ['MEMBER', 'ADMIN'];
    if (!allowedRolesForUpdate.includes(body.role)) {
      throw new BadRequestException('Role must be either MEMBER or ADMIN');
    }
    return await this.workspacesService.updateMember(body?.id, body, req.user);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Patch('remove-member/:workspaceId')
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { id?: string },
    @Req() req,
  ) {
    return await this.workspacesService.removeMember(body?.id, req.user);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Post('add-member/:workspaceId')
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() addMemberDto: AddMemberDto,
    @Req() req,
  ) {
    const origin = req.headers['origin'] || req.headers['referer']; // Extract the origin or referer from headers
    return await this.workspacesService.addMember(
      workspaceId,
      addMemberDto,
      origin,
    );
  }

  @Post('accept-invite')
  async acceptInvite(@Body() body: { token: string }) {
    return await this.workspacesService.acceptInvite(body.token);
  }
}
