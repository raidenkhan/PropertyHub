import { Injectable } from '@nestjs/common';
import * as cloudinary from 'cloudinary';
import * as fs from 'fs/promises'; 

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload(
        file.path,
        {
          folder: 'propertyhub/properties',
          use_filename: true,
          unique_filename: false,
        },
        async (error, result) => {
          //  Clean up temp file FIRST
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temp file:', unlinkError);
          }

          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('Upload failed: No result returned from Cloudinary'));
          } else {
            resolve(result.secure_url);
          }
        },
      );
    });
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }
}