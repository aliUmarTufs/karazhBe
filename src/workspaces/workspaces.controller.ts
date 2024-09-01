import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';

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

  @UseGuards(LocalAuthGuard)
  @Get('get-details/:workspaceId')
  async findOne(@Param('workspaceId') workspaceId: string, @Req() req) {
    return await this.workspacesService.findOne(workspaceId, req.user);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  // ) {
  //   return this.workspacesService.update(+id, updateWorkspaceDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.workspacesService.remove(+id);
  // }
}
