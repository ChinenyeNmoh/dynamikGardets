import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';

dotenv.config();
sharp.cache(false);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME as string,
  api_key: process.env.API_KEY as string,
  api_secret: process.env.CLOUD_API_SECRET as string,
});

// Define file type for Multer
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
}

interface MulterRequest extends Request {
    files?: Express.Multer.File[];
  }

// Resize the image using Sharp and return the resized buffer
async function resizeFile(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(800, 800) // Specify the desired width and height
      .toBuffer(); // Convert to buffer to manipulate in-memory
  } catch (error: any) {
    throw new Error(`Error resizing the image: ${error.message}`);
  }
}

// Upload images to Cloudinary
const cloudinaryUploadImage = async (files: MulterFile[]): Promise<{ url: string; imageId: string }[]> => {
  try {
    const uploadResults = await Promise.all(
      files.map(async (image) => {
        const imageData = image.buffer.toString('base64');
        const mimeType = image.mimetype;

        const result = await cloudinary.uploader.upload(
          `data:${mimeType};base64,${imageData}`,
          { folder: 'gadgets' }
        );
        return { url: result.secure_url, imageId: result.public_id };
      })
    );

    return uploadResults;
  } catch (error: any) {
    console.error('Error uploading images:', error.message);
    throw new Error(`Error uploading images: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (imageId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(imageId);
    console.log(`Image deleted successfully with ID: ${imageId}`);
  } catch (error: any) {
    console.error('Error deleting image:', error.message);
    throw new Error(`Error deleting image: ${error.message}`);
  }
};

// Middleware to resize images before uploading
const productImgResize = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.files || req.files.length === 0) {
      return next();
    }
  
    try {
      req.files = await Promise.all(
        req.files.map(async (file) => {
          const resizedBuffer = await resizeFile(file.buffer);
          return { ...file, buffer: resizedBuffer };
        })
      );
    } catch (error: any) {
      console.error('Error resizing image:', error);
      res.status(500).json({ error: error.message });
      return;
    }
  
    next();
  };

export default cloudinary;
export { productImgResize, cloudinaryUploadImage, deleteImage };
