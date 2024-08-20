import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { PostStatus } from '@prisma/client';
import { CreateIdeaDto } from './dto/create-idea.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  constructor(private prisma: PrismaService) {}

  async createPost(
    createPostDto: CreatePostDto,
    channelName?: string | null | undefined,
  ) {
    this.logger.log(
      `${this.createPost.name} has been called | createPostDto: ${JSON.stringify(createPostDto)}`,
    );
    try {
      let createPost;
      if (createPostDto.status === PostStatus.IDEA) {
        const createIdeaDto: CreateIdeaDto = {
          content: createPostDto.content,
          media: createPostDto.media,
          userId: createPostDto.userId,
          workSpaceId: createPostDto.workSpaceId,
          status: createPostDto.status,
        };
        createPost = await this.prisma.post.create({
          data: {
            ...createIdeaDto,
          },
        });
      } else {
        if (
          (channelName !== undefined || channelName !== null) &&
          (channelName === 'tiktok' || channelName === 'instagram') &&
          Object.keys(createPostDto.media).length === 0
        ) {
          throw new BadRequestException(
            'Error: Media Should not be Empty for Tiktok/Instagram',
          );
        }
        createPost = await this.prisma.post.create({
          data: {
            ...createPostDto,
          },
        });
      }

      return {
        status: true,
        message: `Your ${createPostDto.status === 'IDEA' ? 'idea' : 'post'} has been created!`,
        data: createPost,
      };
    } catch (error) {
      this.logger.error(
        `${this.createPost.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async updatePost(postId: string, updatePostDto: UpdatePostDto) {
    this.logger.log(
      `${this.updatePost.name} has been called | postId:${postId} updatePostDto: ${JSON.stringify(updatePostDto)}`,
    );
    try {
      const updatePost = await this.prisma.post.update({
        where: { id: postId },
        data: {
          ...updatePostDto,
        },
      });

      return {
        status: true,
        message: 'Your changes has been saved!',
        data: updatePost,
      };
    } catch (error) {
      this.logger.error(
        `${this.updatePost.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async deletePost(postId: string) {
    this.logger.log(
      `${this.deletePost.name} has been called | postId:${postId}`,
    );
    try {
      const deletePost = await this.prisma.post.delete({
        where: { id: postId },
      });

      return {
        status: true,
        message: 'Post Deleted Successfully',
        data: deletePost,
      };
    } catch (error) {
      this.logger.error(
        `${this.deletePost.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async getPosts(filterPostsDto: FilterPostsDto) {
    this.logger.log(
      `${this.getPosts.name} has been called | filterPostsDto: ${JSON.stringify(filterPostsDto)}`,
    );
    try {
      const { status, channelId, startDate, endDate, userId, workSpaceId } =
        filterPostsDto;
      const where = {
        userId,
        workSpaceId,
        AND: [
          status === 'ALL'
            ? {
                status: {
                  not: {
                    equals: PostStatus.IDEA, // Use the enum value instead of a string
                  },
                },
              }
            : { status: status as PostStatus }, // Correctly cast the status to the enum type
          channelId === 'ALL' ? {} : { channelId },
          startDate && endDate
            ? {
                OR: [
                  {
                    scheduledAt: {
                      gte: startDate,
                      lte: endDate,
                    },
                  },
                  {
                    createdAt: {
                      gte: startDate,
                      lte: endDate,
                    },
                  },
                ],
              }
            : {},
        ],
      };
      const postsByFilter = await this.prisma.post.findMany({
        where,
        include: {
          channel: true,
        },
      });

      return {
        status: true,
        message: 'Posts Fetched By Filter Successfully',
        count: postsByFilter.length,
        data: postsByFilter,
      };
    } catch (error) {
      this.logger.error(
        `${this.getPosts.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async getPostById(postId: string) {
    this.logger.log(
      `${this.getPostById.name} has been called | postId:${postId}`,
    );
    try {
      const postData = await this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          channel: true,
        },
      });

      return {
        status: true,
        message: 'Post Data Fetched Successfully',
        data: postData,
      };
    } catch (error) {
      this.logger.error(
        `${this.getPostById.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }
}
