import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  @Get(':userId')
  async getUserWorkSpaces(@Param('userId') userId: string) {
    return this.workspacesService.getUserWorkSpaces(userId);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.workspacesService.findOne(+id);
  // }

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
