import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
// import * as AWS from 'aws-sdk';
// import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GetFile {
  //AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
  async get_s3(dest) {
    const s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });
    const key = dest;

    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const url = await getSignedUrl(s3, command, { expiresIn: 300 }); //1 minute
      return {
        status: true,
        message: 'file get successfully',
        data: url,
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }
}
