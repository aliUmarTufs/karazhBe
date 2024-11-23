import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { HttpModule } from '@nestjs/axios';
import { ChannelController } from './channel.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [ChannelController],
  providers: [ChannelService, PrismaService],
})
export class ChannelModule {}
