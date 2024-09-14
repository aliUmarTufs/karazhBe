import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkSpaceAdminGuard } from 'src/guards/workspace-admin.guard';
import { Role } from '@prisma/client';
import { AddMemberDto } from './dto/create-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // @Post()
  // create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
  //   return this.workspacesService.create(createWorkspaceDto);
  // }
  @UseGuards(LocalAuthGuard)
  @Get()
  async getUserWorkSpaces(@Req() req) {
    return this.workspacesService.getUserWorkSpaces(req.user.userId);
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
  ) {
    return await this.workspacesService.updateMember(body?.id, body);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Patch('remove-member/:workspaceId')
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { id?: string },
  ) {
    return await this.workspacesService.removeMember(body?.id);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Post('add-member/:workspaceId')
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return await this.workspacesService.addMember(workspaceId, addMemberDto);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() body: { token: string }) {
    return await this.workspacesService.acceptInvite(body.token);
  }
}
