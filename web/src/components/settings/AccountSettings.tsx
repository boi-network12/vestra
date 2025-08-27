// components/settings/AccountSettings.tsx
import React, { useState, useMemo } from 'react';
import { debounce } from 'lodash';
import { IoPencil, IoCheckmarkCircle, IoWarning, IoRefresh } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { SettingsComponentProps } from '@/types/settings';
import { User } from '@/types/user';

// Define the expected response type for validation functions
interface ValidationResponse {
  success: boolean;
  available: boolean;
  message: string;
}

const AccountSettings: React.FC<SettingsComponentProps> = ({
  user,
  updateUser,
  checkUsername,
  checkEmail,
  checkPhone,
  logout
}) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [isEditing, setIsEditing] = useState({
    username: false,
    email: false,
    phoneNumber: false,
  });
  const [status, setStatus] = useState({
    username: null as 'valid' | 'invalid' | 'checking' | null,
    email: null as 'valid' | 'invalid' | 'checking' | null,
    phoneNumber: null as 'valid' | 'invalid' | 'checking' | null,
  });
  const [errorMessages, setErrorMessages] = useState({
    username: '',
    email: '',
    phoneNumber: '',
  });

  // Create one debounced validator+updater
const debouncedValidateAndUpdate = useMemo(
  () =>
    debounce(
      async (field: keyof typeof formData, value: string) => {
        const updatedFields: Partial<Pick<User, 'username' | 'email' | 'phoneNumber'>> = {};
        try {
          if (field === 'username' && value !== user?.username) {
            updatedFields.username = value;
            if (value.length < 3) {
              setStatus((prev) => ({ ...prev, username: 'invalid' }));
              setErrorMessages((prev) => ({ ...prev, username: 'Username must be at least 3 characters' }));
              return;
            }
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              setStatus((prev) => ({ ...prev, username: 'invalid' }));
              setErrorMessages((prev) => ({
                ...prev,
                username: 'Username can only contain letters, numbers, and underscores',
              }));
              return;
            }
            const result: ValidationResponse = await checkUsername(value);
            setStatus((prev) => ({ ...prev, username: result.available ? 'valid' : 'invalid' }));
            setErrorMessages((prev) => ({ ...prev, username: result.message }));
            if (!result.available) return;
          } 
          else if (field === 'email' && value !== user?.email) {
            updatedFields.email = value;
            if (!/^\S+@\S+\.\S+$/.test(value)) {
              setStatus((prev) => ({ ...prev, email: 'invalid' }));
              setErrorMessages((prev) => ({ ...prev, email: 'Invalid email format' }));
              return;
            }
            const result: ValidationResponse = await checkEmail(value);
            setStatus((prev) => ({ ...prev, email: result.available ? 'valid' : 'invalid' }));
            setErrorMessages((prev) => ({ ...prev, email: result.message }));
            if (!result.available) return;
          } 
          else if (field === 'phoneNumber' && value !== user?.phoneNumber) {
            updatedFields.phoneNumber = value;
            if (!/^\+?[\d\s\-()]{7,15}$/.test(value)) {
              setStatus((prev) => ({ ...prev, phoneNumber: 'invalid' }));
              setErrorMessages((prev) => ({ ...prev, phoneNumber: 'Invalid phone number format' }));
              return;
            }
            const result: ValidationResponse = await checkPhone(value);
            setStatus((prev) => ({ ...prev, phoneNumber: result.available ? 'valid' : 'invalid' }));
            setErrorMessages((prev) => ({ ...prev, phoneNumber: result.message }));
            if (!result.available) return;
          }

          // If all good, update profile
          if (Object.keys(updatedFields).length > 0) {
            const result = await updateUser(updatedFields);
            if (result) {
              toast.success('Profile updated successfully!');
              setIsEditing((prev) => ({ ...prev, [field]: false }));
            } else {
              toast.error('Failed to update profile');
            }
          }
        } catch (error) {
          console.error('Validation/Update error:', error);
        }
      },
      600 // waits 600ms after typing stops
    ),
  [user, checkUsername, checkEmail, checkPhone, updateUser]
);

// Handle change and trigger debounce
const handleInputChange = (field: keyof typeof formData, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
  setStatus((prev) => ({ ...prev, [field]: value.trim() ? 'checking' : null }));
  setErrorMessages((prev) => ({ ...prev, [field]: '' }));

  debouncedValidateAndUpdate(field, value.trim());
};


  // Get icon based on status
  const getIcon = (field: keyof typeof isEditing) => {
    if (!isEditing[field]) return <IoPencil className="transition-transform hover:scale-110" />;
    if (status[field] === 'checking') return <IoRefresh className="animate-spin" />;
    if (status[field] === 'valid') return <IoCheckmarkCircle className="text-green-500 transition-transform scale-110" />;
    if (status[field] === 'invalid') return <IoWarning className="text-red-500 transition-transform scale-110" />;
    return <IoPencil className="transition-transform hover:scale-110" />;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto bg-white rounded-xl shadow-lg w-full">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h3>

      {/* Username */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
        <div
          className={`flex items-center border rounded-lg px-4 py-3 bg-gray-50 transition-all duration-300 ${
            status.username === 'invalid' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'
          } focus-within:ring-2 focus-within:ring-blue-400 shadow-sm`}
          onClick={() => setIsEditing((prev) => ({ ...prev, username: true }))}
        >
          <input
            type="text"
            value={formData.username}
            disabled={!isEditing.username}
            placeholder={`@${user?.username || 'Add username'}`}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm disabled:opacity-70 transition-all"
            onChange={(e) => handleInputChange('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          />
          <span className="text-lg">{getIcon('username')}</span>
        </div>
        {errorMessages.username && (
          <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errorMessages.username}</p>
        )}
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
        <div
          className={`flex items-center border rounded-lg px-4 py-3 bg-gray-50 transition-all duration-300 ${
            status.email === 'invalid' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'
          } focus-within:ring-2 focus-within:ring-blue-400 shadow-sm`}
          onClick={() => setIsEditing((prev) => ({ ...prev, email: true }))}
        >
          <input
            type="email"
            value={formData.email}
            disabled={!isEditing.email}
            placeholder={user?.email || 'Add email'}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm disabled:opacity-70 transition-all"
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
          <span className="text-lg">{getIcon('email')}</span>
        </div>
        {errorMessages.email && (
          <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errorMessages.email}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
        <div
          className={`flex items-center border rounded-lg px-4 py-3 bg-gray-50 transition-all duration-300 ${
            status.phoneNumber === 'invalid' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-300'
          } focus-within:ring-2 focus-within:ring-blue-400 shadow-sm`}
          onClick={() => setIsEditing((prev) => ({ ...prev, phoneNumber: true }))}
        >
          <input
            type="tel"
            value={formData.phoneNumber}
            disabled={!isEditing.phoneNumber}
            placeholder={user?.phoneNumber || 'Add phone number'}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm disabled:opacity-70 transition-all"
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          />
          <span className="text-lg">{getIcon('phoneNumber')}</span>
        </div>
        {errorMessages.phoneNumber && (
          <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{errorMessages.phoneNumber}</p>
        )}
      </div>

      {/* Country (Non-editable) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">Country</label>
        <div className="flex items-center border rounded-lg px-4 py-3 bg-gray-100 text-gray-600 text-sm cursor-not-allowed shadow-sm">
          <span>{user?.profile?.location?.country || 'Not set'}</span>
        </div>
      </div>

      <div className="mb-6">
        <button
           className="w-30 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
           onClick={logout}
        >
            logout
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;