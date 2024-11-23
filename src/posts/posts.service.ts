import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FilterPostsDto } from './dto/filter-posts.dto';
import { PostStatus } from '@prisma/client';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { FilterContentDto } from './dto/filter-content.dto';
import { SocialMediaPlatform } from 'src/enum/SocialMediaPlatform';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  constructor(private prisma: PrismaService) {}

  async createIdea(createIdeaDto: CreateIdeaDto) {
    this.logger.log(
      `${this.createIdea.name} has been called | createIdeaDto: ${JSON.stringify(createIdeaDto)}`,
    );
    try {
      const idea = await this.prisma.post.create({
        data: {
          ...createIdeaDto,
          status: PostStatus.IDEA,
        },
      });

      idea['mediaKey'] = idea.mediaUrl;
      return {
        status: true,
        message: 'Your idea has been created!',
        data: idea,
      };
    } catch (error) {
      this.logger.error(
        `${this.createIdea.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async createPost(createPostDto: CreatePostDto) {
    this.logger.log(
      `${this.createPost.name} has been called | createPostDto: ${JSON.stringify(createPostDto)}`,
    );
    try {
      const { channelsArray } = createPostDto;
      delete createPostDto.channelsArray;
      if (createPostDto.status === PostStatus.IDEA) {
        throw new BadRequestException(
          'Use createIdea method to create an idea.',
        );
      }

      if (channelsArray && channelsArray.length > 0) {
        const channelNames = channelsArray.map((channel) => channel.name);

        if (
          channelNames &&
          (channelNames.includes(SocialMediaPlatform.TIKTOK) ||
            channelNames.includes(SocialMediaPlatform.INSTAGRAM)) &&
          (createPostDto?.mediaUrl === null ||
            createPostDto?.mediaUrl === undefined)
        ) {
          throw new BadRequestException(
            'Error: Media should not be empty for Tiktok/Instagram',
          );
        }

        // Create the post
        const createPost = await this.prisma.post.create({
          data: {
            ...createPostDto,
          },
        });

        // If channelNames are provided, associate the post with the channels
        if (channelNames && channelNames.length > 0) {
          const channels = await this.prisma.channel.findMany({
            where: {
              name: { in: channelNames },
              userId: createPostDto.userId,
              workSpaceId: createPostDto.workSpaceId,
            },
          });

          // Link the post to the channels
          await this.prisma.postChannel.createMany({
            data: channels.map((channel) => ({
              postId: createPost.id,
              channelId: channel.id,
            })),
          });
        }

        const completePostData = await this.prisma.post.findUnique({
          where: { id: createPost.id },
          include: {
            channels: {
              include: {
                channel: true,
              },
            },
          },
        });

        const channelData = completePostData.channels.map(
          (channel) => channel.channel,
        );

        const postData = {
          id: completePostData.id,
          content: completePostData.content,
          mediaUrl: completePostData.mediaUrl,
          mediaName: completePostData.mediaName,
          mediaType: completePostData.mediaType,
          mediaKey: completePostData.mediaUrl,
          status: completePostData.status,
          scheduledAt: completePostData.scheduledAt,
          createdAt: completePostData.createdAt,
          updatedAt: completePostData.updatedAt,
          userId: completePostData.userId,
          workSpaceId: completePostData.workSpaceId,
          channels: channelData,
        };

        if(completePostData.status === 'PUBLISHED'){

          const checkIfContentPublished = await this.publishContentToPlatform(postData)

        }
        return {
          status: true,
          message: 'Your post has been created!',
          data: postData,
        };
      } else {
        throw new BadRequestException('Error: atleast one channel is required');
      }
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

  async publishContentToPlatform(postData){

    const getUserProfileDetails = await this.getUserProfile()

  }

  async getUserProfile() {
    
  }

  async updatePost(postId: string, updatePostDto: UpdatePostDto) {
    this.logger.log(
      `${this.updatePost.name} has been called | postId:${postId} updatePostDto: ${JSON.stringify(updatePostDto)}`,
    );

    try {
      // Step 1: Check if the post exists
      const existingPost = await this.prisma.post.findFirst({
        where: { id: postId, deletedAt: null },
      });

      if (!existingPost) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }

      const { channelsArray } = updatePostDto;
      delete updatePostDto.channelsArray;

      // Step 3: Manage PostChannel relations if channelsArray is provided
      if (channelsArray) {
        if (channelsArray.length > 0) {
          const channelNames = channelsArray.map((channel) => channel.name);
          if (
            channelNames &&
            (channelNames.includes(SocialMediaPlatform.TIKTOK) ||
              channelNames.includes(SocialMediaPlatform.INSTAGRAM)) &&
            updatePostDto.mediaUrl === null
          ) {
            throw new BadRequestException(
              'Error: Media should not be empty for Tiktok/Instagram',
            );
          }
        }

        const existingChannels = await this.prisma.postChannel.findMany({
          where: { postId },
        });

        const existingChannelIds = existingChannels.map((ch) => ch.channelId);
        const newChannelIds = channelsArray.map((ch) => ch.id);

        const channelsToAdd = newChannelIds.filter(
          (id) => !existingChannelIds.includes(id),
        );
        const channelsToRemove = existingChannelIds.filter(
          (id) => !newChannelIds.includes(id),
        );

        await Promise.all(
          channelsToAdd.map((channelId) =>
            this.prisma.postChannel.create({
              data: { postId, channelId },
            }),
          ),
        );

        await Promise.all(
          channelsToRemove.map((channelId) =>
            this.prisma.postChannel.delete({
              where: { postId_channelId: { postId, channelId } },
            }),
          ),
        );
      }

      // Step 2: Update the post data itself
      const updatePost = await this.prisma.post.update({
        where: { id: postId },
        data: {
          ...updatePostDto,
        },
        include: {
          channels: {
            include: {
              channel: true,
            },
          },
        },
      });

      const channelData = updatePost.channels.map((channel) => channel.channel);

      const postData = {
        id: updatePost.id,
        content: updatePost.content,
        mediaUrl: updatePost.mediaUrl,
        mediaName: updatePost.mediaName,
        mediaType: updatePost.mediaType,
        mediaKey: updatePost.mediaUrl,
        status: updatePost.status,
        scheduledAt: updatePost.scheduledAt,
        createdAt: updatePost.createdAt,
        updatedAt: updatePost.updatedAt,
        userId: updatePost.userId,
        workSpaceId: updatePost.workSpaceId,
        channels: channelData,
      };

      return {
        status: true,
        message: 'Your changes have been saved!',
        data: postData,
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

  async updateIdea(ideaId: string, updateIdeaDto: UpdateIdeaDto) {
    this.logger.log(
      `${this.updateIdea.name} has been called | ideaId:${ideaId} updateIdeaDto: ${JSON.stringify(updateIdeaDto)}`,
    );
    try {
      const updateIdea = await this.prisma.post.update({
        where: { id: ideaId },
        data: {
          ...updateIdeaDto,
          status: PostStatus.IDEA, // Ensure the status remains as IDEA
        },
      });

      updateIdea['mediaKey'] = updateIdea.mediaUrl;
      return {
        status: true,
        message: 'Your idea has been updated!',
        data: updateIdea,
      };
    } catch (error) {
      this.logger.error(
        `${this.updateIdea.name} has an error | error: ${JSON.stringify(error)}`,
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
      const [deletePost, deletePostChannel] = await this.prisma.$transaction([
        this.prisma.post.update({
          where: { id: postId },
          data: { deletedAt: new Date() }, // Set the deletedAt field to the current date
        }),
        this.prisma.post.delete({
          where: { id: postId },
        }),
      ]);

      this.logger.debug(
        `deletePost: ${JSON.stringify(deletePost)}, deletePostChannel: ${JSON.stringify(deletePostChannel)}`,
      );

      return {
        status: true,
        message: 'Post deleted successfully',
        data: {
          id: deletePost.id,
          deletedAt: deletePost.deletedAt,
        },
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

  async deleteIdea(ideaId: string) {
    this.logger.log(
      `${this.deleteIdea.name} has been called | ideaId:${ideaId}`,
    );
    try {
      const deleteIdea = await this.prisma.post.update({
        where: { id: ideaId },
        data: { deletedAt: new Date() }, // Set the deletedAt field to the current date
      });
      this.logger.debug(`deleteIdea: ${JSON.stringify(deleteIdea)}}`);
      return {
        status: true,
        message: 'Idea deleted successfully',
        data: {
          id: deleteIdea.id,
          deletedAt: deleteIdea.deletedAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `${this.deleteIdea.name} has an error | error: ${JSON.stringify(error)}`,
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
      const { status, channelIds, startDate, endDate, userId, workSpaceId } =
        filterPostsDto;

      const where = {
        // userId,
        workSpaceId,
        deletedAt: null,
        AND: [
          status === 'ALL'
            ? {
                status: {
                  not: PostStatus.IDEA,
                },
                // OR: [
                //   {
                //     status: {
                //       not: PostStatus.IDEA,
                //     },
                //     scheduledAt: {
                //       not: null, // Ensure scheduledAt is not null for DRAFT posts in 'ALL' case
                //     },
                //   },
                //   {
                //     status: PostStatus.DRAFT,
                //     scheduledAt: {
                //       not: null, // Ensure scheduledAt is not null for DRAFT posts in 'ALL' case
                //     },
                //   },
                // ],
              }
            : // status === 'DRAFT'
              //   ? {
              //       status: status as PostStatus,
              //       scheduledAt: {
              //         not: null, // Ensure only scheduled drafts are fetched when status is 'DRAFT'
              //       },
              //     }
              //   :
              { status: status as PostStatus },
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
          Array.isArray(channelIds) && channelIds?.length > 0
            ? {
                channels: {
                  some: {
                    channelId: { in: channelIds },
                  },
                },
              }
            : {},
        ],
      };

      const postsByFilter = await this.prisma.post.findMany({
        where,
        include: {
          channels: {
            include: {
              channel: true,
            },
          },
        },
      });

      const result = [];
      if (postsByFilter.length > 0) {
        for (const post of postsByFilter) {
          const channelData = post.channels.map((channel) => channel.channel);

          const postData = {
            id: post.id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaName: post.mediaName,
            mediaType: post.mediaType,
            mediaKey: post.mediaUrl,
            status: post.status,
            scheduledAt: post.scheduledAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            userId: post.userId,
            workSpaceId: post.workSpaceId,
            channels: channelData,
          };
          result.push(postData);
        }
      }

      return {
        status: true,
        message: 'Posts fetched by filter successfully',
        count: result.length,
        data: result,
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

  async getIdeas(filterContentDto: FilterContentDto) {
    this.logger.log(
      `${this.getIdeas.name} has been called | filterContentDto: ${JSON.stringify(filterContentDto)}`,
    );
    try {
      const { userId, workSpaceId } = filterContentDto;
      const { limit, offset } = filterContentDto;

      const ideasForContent = await this.prisma.post.findMany({
        where: {
          // userId,
          workSpaceId,
          status: PostStatus.IDEA,
          scheduledAt: null,
          deletedAt: null,
        },
        take: limit > 0 ? limit : 20,
        skip: offset > 0 ? offset : 0,
        orderBy: { createdAt: 'desc' },
      });

      await Promise.all(
        ideasForContent.map((idea) => {
          idea['mediaKey'] = idea.mediaUrl;
        }),
      );

      return {
        status: true,
        message: 'Content fetched by filter successfully',
        data: ideasForContent,
        count: ideasForContent.length,
      };
    } catch (error) {
      this.logger.error(
        `${this.getIdeas.name} has an error | error: ${JSON.stringify(error)}`,
      );

      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async getDrafts(filterContentDto: FilterContentDto) {
    this.logger.log(
      `${this.getDrafts.name} has been called | filterContentDto: ${JSON.stringify(filterContentDto)}`,
    );
    try {
      const { userId, workSpaceId } = filterContentDto;
      const { limit, offset } = filterContentDto;

      const draftsForContent = await this.prisma.post.findMany({
        where: {
          // userId,
          workSpaceId,
          status: PostStatus.DRAFT,
          // scheduledAt: null,
          deletedAt: null,
        },
        include: {
          channels: {
            include: {
              channel: true,
            },
          },
        },
        take: limit > 0 ? limit : 20,
        skip: offset > 0 ? offset : 0,
        orderBy: { createdAt: 'desc' },
      });

      const draftResult = [];
      if (draftsForContent?.length > 0) {
        for (const post of draftsForContent) {
          const channelData = post?.channels?.map((channel) => channel.channel);

          const postData = {
            id: post.id,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaName: post.mediaName,
            mediaType: post.mediaType,
            mediaKey: post.mediaUrl,
            status: post.status,
            scheduledAt: post.scheduledAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            userId: post.userId,
            workSpaceId: post.workSpaceId,
            channels: channelData,
          };
          draftResult.push(postData);
        }
      }

      return {
        status: true,
        message: 'Content fetched by filter successfully',
        data: {
          // ideas: { data: ideasForContent, count: ideasForContent.length },
          drafts: { data: draftResult, count: draftResult?.length },
        },
      };
    } catch (error) {
      this.logger.error(
        `${this.getDrafts.name} has an error | error: ${JSON.stringify(error)}`,
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
      const completePostData = await this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          channels: {
            include: {
              channel: true,
            },
          },
        },
      });

      const channelData = completePostData?.channels?.map(
        (channel) => channel.channel,
      );

      const postData = {
        id: completePostData.id,
        content: completePostData.content,
        mediaUrl: completePostData.mediaUrl,
        mediaName: completePostData.mediaName,
        mediaType: completePostData.mediaType,
        mediaKey: completePostData.mediaUrl,
        status: completePostData.status,
        scheduledAt: completePostData.scheduledAt,
        createdAt: completePostData.createdAt,
        updatedAt: completePostData.updatedAt,
        userId: completePostData.userId,
        workSpaceId: completePostData.workSpaceId,
        channels: channelData,
      };

      return {
        status: true,
        message: 'Post data fetched successfully',
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
