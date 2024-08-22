import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as moment from 'moment';
import path from 'path';

@Injectable()
export class AwsService {
  AWS_S3_BUCKET = process.env.AWS_BUCKET;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  private readonly logger = new Logger(AwsService.name);
  async uploadFile(file) {
    this.logger.log('Calling uploadFile service');
    const { originalname } = file;

    return await this.s3_upload(
      file.buffer,
      this.AWS_S3_BUCKET,
      originalname,
      file.mimetype,
    );
  }

  async s3_upload(file, bucket, name, mimetype) {
    this.logger.log('Calling s3_upload service');
    const format1 = 'YYYYMMDDHHmmss';
    const splittedFileName = name.split('.');
    const fileName =
      splittedFileName[0] +
      moment().format(format1) +
      '.' +
      splittedFileName[1];
    const params = {
      Bucket: bucket,
      Key: String(fileName),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();

      return s3Response;
    } catch (e) {
      throw new HttpException(
        { status: false, message: 'Unable to upload file ' + e },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async s3_get_file(url, bucket) {
    try {
      const image = await this.s3
        .getObject({ Bucket: bucket, Key: url })
        .promise();
      return image;
    } catch (e) {
      throw new HttpException(
        { status: false, message: 'Unable to get file ' + e },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
