import { User } from '@/types/user';
import React from 'react';
import { FaCheck, FaUserPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation'; // ✅ for Next.js navigation

interface ProfileReminderProps {
  user: User | null; 
}

const ProfileReminder: React.FC<ProfileReminderProps> = ({ user }) => {
  const router = useRouter();

  if (!user) return null;

  const followingCount = user.following?.length ?? 0;

  const reminders = [
    {
      title: 'Follow 10 profiles',
      desc: 'Fill your feed with things that interest you',
      buttonTitle: followingCount >= 10 ? 'Done' : 'See Profiles',
      completed: followingCount >= 10,
      icon: followingCount >= 10 ? FaCheck : FaUserPlus,
      onClick: () => {
        if (followingCount < 10) {
          router.push('/users'); // ✅ navigate to /users
        }
      }
    },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-600 mb-4">Finish your profile</h3>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {reminders.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center w-48 h-64"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  item.completed ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Icon
                  size={20}
                  className={item.completed ? 'text-green-500' : 'text-gray-600'}
                />
              </div>
              <h4 className="text-base font-medium text-gray-900 text-center">{item.title}</h4>
              <p className="text-sm text-gray-500 text-center mt-2">{item.desc}</p>
              {item.completed ? (
                <div className="mt-4 border border-gray-300 rounded-md px-4 py-2 w-full text-center">
                  <span className="text-sm text-gray-500">{item.buttonTitle}</span>
                </div>
              ) : (
                <button
                  onClick={item.onClick}
                  className="mt-4 bg-blue-600 text-white rounded-md px-4 py-2 w-full text-center text-sm font-medium hover:bg-blue-500"
                >
                  {item.buttonTitle}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileReminder;
