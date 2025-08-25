const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const multer = require('multer');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
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
exports.uploadMedia = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
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

      // Attach Cloudinary response to req.file
      if (req.file) {
        try {
          const isVideo = req.file.mimetype.startsWith('video');
          const folder = `social_media/${isVideo ? 'videos' : 'images'}`;
          const publicId = `${req.user._id}_${Date.now()}_${path.parse(req.file.originalname).name}`;

          const params = {
            Bucket: process.env.B2_BUCKET_NAME,
            Key: `${folder}/${publicId}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);

          // Generate public URL
          const url = `https://${process.env.B2_BUCKET_NAME}.${process.env.B2_ENDPOINT}/${folder}/${publicId}`;

          req.file.url = url;
          req.file.public_id = publicId;
          req.file.resource_type = isVideo ? 'video' : 'image';
        } catch (error) {
          console.error('Backblaze upload error:', uploadErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload file to Backblaze',
          });
        }
      }

      next();
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