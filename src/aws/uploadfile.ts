import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
// import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadFile {
  //AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
  async uploadImg(file, folder) {
    const { originalname } = file;
    const fileType = await this.getFileExtension(originalname);
    const res = await this.s3_upload(
      file.buffer,
      fileType,
      //this.AWS_S3_BUCKET,type
      originalname,
      file.mimetype,
      folder,
    );

    return res;
  }

  async getFileExtension(filename) {
    // get file extension
    const extension = await filename.split('.').pop();
    return extension;
  }

  async s3_upload(file, filetype, name, mimetype, folder) {
    const s3 = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION, // ap-south-1
    });
    const getId = uuidv4();
    const key = `images/${getId}.${filetype}`;

    const params = {
      Bucket: process.env.AWS_BUCKET, //Public Bucket viabletree-flowforge-public
      Key: key,
      Body: file,
      // ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'ap-south-1',
      },
    };

    //console.log(params);

    try {
      const command = new PutObjectCommand(params);
      const responseS3 = await s3.send(command);
      const key = command?.input?.Key;
      return {
        status: true,
        message: 'image uploaded successfully',
        key: key,
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }

  // async uploadMultipleImg(files, folder){
  //   const { originalname } = files;
  //   const fileType = this.getFileExtension(originalname);
  //   const res = await this.s3_upload(
  //     files.buffer,
  //     fileType,
  //     //this.AWS_S3_BUCKET,type
  //     originalname,
  //     files.mimetype,
  //     folder,
  //   );

  //   return res;
  // }
}
