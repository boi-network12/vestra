import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "picsum.photos",                // Sample image service
      "res.cloudinary.com",           // Cloudinary
      "s3.amazonaws.com",             // AWS S3 default endpoint
      "bucket-name.s3.amazonaws.com", // Specific S3 bucket (replace bucket-name)
      "bucket-name.s3.region.amazonaws.com", // Regional S3 endpoint
      "cdn.jsdelivr.net",              // JSDelivr CDN
      "lh3.googleusercontent.com",     // Google profile pictures
      "avatars.githubusercontent.com", // GitHub avatars
      "firebasestorage.googleapis.com",// Firebase Storage
    ],
  },
};

export default nextConfig;
