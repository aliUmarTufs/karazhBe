import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Query() query?: { channelName?: string },
  ) {
    this.logger.log(
      `${this.createPost.name} has been called | createPostDto: ${JSON.stringify(createPostDto)}`,
    );
    const { channelName } = query;
    return this.postsService.createPost(createPostDto, channelName);
  }

  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    this.logger.log(
      `${this.updatePost.name} has been called | id:${id} updatePostDto: ${JSON.stringify(updatePostDto)}`,
    );
    return this.postsService.updatePost(id, updatePostDto);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    this.logger.log(`${this.deletePost.name} has been called id: ${id}`);

    return this.postsService.deletePost(id);
  }

  @Get()
  async getPosts(@Query() filterPostsDto: FilterPostsDto) {
    this.logger.log(
      `${this.getPosts.name} has been called | filterPostsDto: ${JSON.stringify(filterPostsDto)}`,
    );
    return this.postsService.getPosts(filterPostsDto);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    this.logger.log(`${this.getPostById.name} has been called | id: ${id}`);
    return this.postsService.getPostById(id);
  }
}
