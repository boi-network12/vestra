'use client';

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { User } from '@/types/user';
import Image from 'next/image';
import { FaShare, FaLink, FaDownload, FaTimes } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

interface ShareProfileProps {
  user: User | null;
}

export interface ShareProfileRef {
  open: () => void;
  close: () => void;
}

const ShareProfile = forwardRef<ShareProfileRef, ShareProfileProps>(({ user }, ref) => {
  const [visible, setVisible] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  if (!user) return null;

  const profileLink = `myapp://profile/${user?._id}`;
  const fallbackLink = `myapp://profile/${user?._id}`;
  const shareLink = profileLink || fallbackLink;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${user?.username}'s Profile`,
            text: `Check out my profile: ${fallbackLink}`,
            url: fallbackLink,
          });
        } catch {
          await navigator.clipboard.writeText(fallbackLink);
          toast.success('Profile link copied to clipboard!');
        }
      } else {
        await navigator.clipboard.writeText(fallbackLink);
        toast.success('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Something went wrong while sharing.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Profile link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link.');
    }
  };

  const handleDownload = () => {
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `${user?.username}-profile-qr.png`);
            toast.success('QR code downloaded!');
          }
        });
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code.');
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/60 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-50`}
    >
      <div className="relative w-full max-w-[360px] mx-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          onClick={() => setVisible(false)}
          aria-label="Close modal"
        >
          <FaTimes size={20} />
        </button>

        {/* Profile Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <Image
              src={user?.profile?.avatar || ''}
              alt={`${user?.username}'s avatar`}
              fill
              className="rounded-full object-cover"
            />
          </div>
        </div>

        {/* Username */}
        <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
          @{user?.username || 'user'}
        </h3>

        {/* QR Code */}
        <div ref={qrRef} className="flex justify-center my-6">
          <QRCodeCanvas
            value={shareLink}
            size={160}
            bgColor="transparent"
            fgColor="#2563EB"
            level="H"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            onClick={handleShare}
          >
            <FaShare size={16} className="text-blue-600 dark:text-blue-400" />
            Share
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            onClick={handleCopyLink}
          >
            <FaLink size={16} className="text-blue-600 dark:text-blue-400" />
            Copy Link
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            onClick={handleDownload}
          >
            <FaDownload size={16} className="text-blue-600 dark:text-blue-400" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
});

ShareProfile.displayName = 'ShareProfile';

export default ShareProfile;