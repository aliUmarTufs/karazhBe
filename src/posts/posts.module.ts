import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GetFile } from 'src/aws/getfile.service';

@Module({
  imports: [PrismaModule],
  controllers: [PostsController],
  providers: [PostsService, GetFile],
})
export class PostsModule {}
