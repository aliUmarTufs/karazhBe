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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { MediaInterceptor } from 'src/interceptors/media.interceptor';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { FilterContentDto } from './dto/filter-content.dto';

@UseGuards(LocalAuthGuard)
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);
  constructor(private readonly postsService: PostsService) {}

  @UseInterceptors(MediaInterceptor)
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto) {
    this.logger.log(
      `${this.createPost.name} has been called | createPostDto: ${JSON.stringify(createPostDto)}`,
    );
    return this.postsService.createPost(createPostDto);
  }

  @UseInterceptors(MediaInterceptor)
  @Post('idea')
  async createIdea(@Body() createIdeaDto: CreateIdeaDto) {
    this.logger.log(
      `${this.createIdea.name} has been called | createIdeaDto: ${JSON.stringify(createIdeaDto)}`,
    );
    return this.postsService.createIdea(createIdeaDto);
  }

  @UseInterceptors(MediaInterceptor)
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

  @UseInterceptors(MediaInterceptor)
  @Patch('idea/:id')
  async updateIdea(
    @Param('id') id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
  ) {
    this.logger.log(
      `${this.updateIdea.name} has been called | id:${id} updateIdeaDto: ${JSON.stringify(updateIdeaDto)}`,
    );
    return this.postsService.updateIdea(id, updateIdeaDto);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    this.logger.log(`${this.deletePost.name} has been called id: ${id}`);

    return this.postsService.deletePost(id);
  }

  @Delete('idea/:id')
  async deleteIdea(@Param('id') id: string) {
    this.logger.log(`${this.deleteIdea.name} has been called id: ${id}`);

    return this.postsService.deleteIdea(id);
  }

  @UseInterceptors(MediaInterceptor)
  @Get()
  async getPosts(@Query() filterPostsDto: FilterPostsDto) {
    this.logger.log(
      `${this.getPosts.name} has been called | filterPostsDto: ${JSON.stringify(filterPostsDto)}`,
    );
    return this.postsService.getPosts(filterPostsDto);
  }

  @UseInterceptors(MediaInterceptor)
  @Get('ideas')
  async getIdeas(@Query() filterContentDto: FilterContentDto) {
    this.logger.log(
      `${this.getIdeas.name} has been called | filterContentDto: ${JSON.stringify(filterContentDto)}`,
    );
    return this.postsService.getIdeas(filterContentDto);
  }

  @UseInterceptors(MediaInterceptor)
  @Get('drafts')
  async getDrafts(@Query() filterContentDto: FilterContentDto) {
    this.logger.log(
      `${this.getDrafts.name} has been called | filterContentDto: ${JSON.stringify(filterContentDto)}`,
    );
    return this.postsService.getDrafts(filterContentDto);
  }

  @UseInterceptors(MediaInterceptor)
  @Get(':id')
  async getPostById(@Param('id') id: string) {
    this.logger.log(`${this.getPostById.name} has been called | id: ${id}`);
    return this.postsService.getPostById(id);
  }
}
