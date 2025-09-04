import { User } from '@/types/user';
import React, { useRef, useState } from 'react';
import { FaTimes, FaCamera } from 'react-icons/fa';
import Image from 'next/image';
import { toast } from 'react-toastify';

interface EditProfileProps {
  user: User | null;
  onSave: (
    profileData: Partial<User['profile']>,
    avatarFile?: File,
    coverPhotoFile?: File
  ) => Promise<boolean>;
  onClose: () => void;
}

const EditProfile = ({ user, onSave, onClose }: EditProfileProps) => {
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    linkTitle: user?.profile?.links?.[0]?.title || '',
    linkUrl: user?.profile?.links?.[0]?.url || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'coverPhoto'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.');
        return;
      }
      if (type === 'avatar') {
        setAvatarFile(file);
      } else {
        setCoverPhotoFile(file);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      links: formData.linkTitle && formData.linkUrl ? [{ title: formData.linkTitle, url: formData.linkUrl }] : [],
    };
    const success = await onSave(profileData, avatarFile || undefined, coverPhotoFile || undefined);
    if (success) onClose();
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60">
      <div className="w-full sm:max-w-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h2>
          <button
            aria-label="Close edit profile modal"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Cover Photo */}
        <div className="relative h-36 bg-gray-200 dark:bg-gray-700">
          <Image
            src={
              coverPhotoFile
                ? URL.createObjectURL(coverPhotoFile)
                : user?.profile?.coverPhoto || 'https://picsum.photos/800/300'
            }
            alt="Cover photo"
            fill
            className="object-cover"
            priority
          />
          <button
            aria-label="Change cover photo"
            onClick={() => coverPhotoInputRef.current?.click()}
            className="absolute top-2 right-2 bg-black/50 dark:bg-black/70 p-2 rounded-full text-white hover:bg-black/70 dark:hover:bg-black/80"
          >
            <FaCamera />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={coverPhotoInputRef}
            onChange={(e) => handleImageChange(e, 'coverPhoto')}
            className="hidden"
            aria-label="Cover Photo"
          />
        </div>

        {/* Avatar */}
        <div className="relative flex justify-center -mt-12">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden relative">
            <Image
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : user?.profile?.avatar || 'https://picsum.photos/200'
              }
              alt="Avatar"
              fill
              className="object-cover"
            />
            <button
              aria-label="Change avatar photo"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-black/50 dark:bg-black/70 text-white p-1 rounded-full hover:bg-black/70 dark:hover:bg-black/80"
            >
              <FaCamera size={14} />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={(e) => handleImageChange(e, 'avatar')}
              className="hidden"
              aria-label="Avatar"
            />
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-6 space-y-4">
          <div>
            <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <input
              id="firstName"
              aria-label="First Name"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <input
              id="lastName"
              aria-label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              id="bio"
              aria-label="Bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          <div>
            <label htmlFor="linkTitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Link Title
            </label>
            <input
              id="linkTitle"
              aria-label="Link Title"
              type="text"
              value={formData.linkTitle}
              onChange={(e) => setFormData({ ...formData, linkTitle: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Add link title"
            />
          </div>

          <div>
            <label htmlFor="linkUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Link URL
            </label>
            <input
              id="linkUrl"
              aria-label="Link URL"
              type="url"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Add the link"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;