import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { SocialMediaPlatform } from 'src/enum/SocialMediaPlatform';
import { WorkSpaceAdminGuard } from 'src/guards/workspace-admin.guard';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelService.update(+id, updateChannelDto);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Post('create-channel')
  async createChannel(
    @Body()
    body: {
      name: string;
      userId: string;
      workSpaceId: string;
      authToken: string;
    },
  ) {
    return await this.channelService.createChannel(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('get-access-token')
  async getAccessToken(
    @Body()
    data: any,
  ) {
    return await this.channelService.getAccessToken(
      data.authorizationToken,
      data.redirectUri,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Delete('delete-channel/:channelId')
  async deleteChannel(@Param('channelId') channelId: string, @Req() req) {
    return await this.channelService.deleteChannel(channelId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Get('get-channels/:workspaceId')
  async getMyChannels(@Param('workspaceId') workspaceId: string, @Req() req) {
    return await this.channelService.getMyChannels(workspaceId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Patch('disconnect-channel/:channelId')
  async disconnectChannels(@Param('channelId') channelId: string, @Req() req) {
    return await this.channelService.disconnectChannels(channelId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Patch('refresh-channel/:channelId')
  async refreshChannels(
    @Param('channelId') channelId: string,
    @Body() data: any,
    @Req() req,
  ) {
    return await this.channelService.refreshChannels(
      channelId,
      data.authToken,
      req.user,
    );
  }

  @UseGuards(LocalAuthGuard)
  @Get('channel-enum')
  async getChannelEnum() {
    return {
      status: true,
      data: SocialMediaPlatform,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('check-authToken')
  async getAuthTokenStatus(@Body() data: any, @Req() req) {
    return await this.channelService.checkAuthTokenStatus(data, req.user);
  }
}
