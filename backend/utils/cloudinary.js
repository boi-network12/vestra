const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

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

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video');
    return {
      folder: `social_media/${isVideo ? 'videos' : 'images'}`,
      resource_type: isVideo ? 'video' : 'image',
      public_id: `${req.user._id}_${Date.now()}_${path.parse(file.originalname).name}`,
      transformation: isVideo
        ? [{ quality: 'auto', fetch_format: 'auto' }]
        : [{ width: 1080, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

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

// Export upload middleware
exports.uploadMedia = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
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
        req.file.url = req.file.path; // Cloudinary URL
        req.file.public_id = req.file.filename; // Cloudinary public_id
        req.file.resource_type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      }

      next();
    });
  };
};

// Export delete media function
exports.deleteMedia = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    throw new Error('Failed to delete media');
  }
};