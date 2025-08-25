const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');

// const s3Client = new S3Client({
//   region: process.env.B2_REGION,
//   endpoint: process.env.B2_ENDPOINT,
//   credentials: {
//     accessKeyId: process.env.B2_KEY_ID,
//     secretAccessKey: process.env.B2_APPLICATION_KEY,
//   },
// });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Define allowed media formats
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'video/webm',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/3gp',
  'video/mkv',
];

const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Configure Multer storage (in-memory for S3 upload)
const storage = multer.memoryStorage();


// File filter for allowed types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP, BMP, TIFF, HEIC, HEIF, SVG, MP4, MPEG, OGG, WEBM, AVI, MOV, WMV, FLV, 3GP, MKV'
      ),
      false
    );
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE), // e.g., 10MB
  },
  fileFilter: fileFilter,
});

// Upload middleware
exports.uploadMedia = (fieldNames) => {
  return (req, res, next) => {
    upload.fields(
      fieldNames.map((name) => ({ name, maxCount: 1 }))
    )(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }


      if (req.files) {
        try {
          for (const fieldName of fieldNames) {
            if (req.files[fieldName]) {
              const file = req.files[fieldName][0];
              const isVideo = file.mimetype.startsWith('video');
              const folder = `social_media/${isVideo ? 'videos' : 'images'}`;
              const publicId = `${req.user._id}_${Date.now()}_${path.parse(file.originalname).name}`;

              await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                  {
                    folder: folder,
                    public_id: publicId,
                    resource_type: isVideo ? 'video' : 'image',
                  },
                  (error, result) => {
                    if (error) {
                      return reject(new Error('Failed to upload file to Cloudinary'));
                    }
                    file.url = result.secure_url;
                    file.public_id = publicId;
                    file.resource_type = isVideo ? 'video' : 'image';
                    resolve();
                  }
                ).end(file.buffer);
              });
            }
          }
          next();
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload file to Cloudinary',
          });
        }
      } else {
        next();
      }
    });
  };
};

// Delete media from Cloudinary
exports.deleteMedia = async (publicId, resourceType = 'image') => {
  try {
    const folder = `social_media/${resourceType}s`;
    const params = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: `${folder}/${publicId}`,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error('Backblaze delete error:', err);
    throw new Error('Failed to delete media');
  }
};