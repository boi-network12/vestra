"use client";
import EditProfile from '@/components/Profile/Modal/EditProfile';
import ShareProfile, { ShareProfileRef } from '@/components/Profile/Modal/ShareProfile';
import ProfileDetailsCard from '@/components/Profile/ProfileDetailsCard';
import ProfileReminder from '@/components/Profile/ProfileReminder';
import { useAuth } from '@/hooks/authHooks'
import { useUser } from '@/hooks/userHooks';
import React, { useRef, useState } from 'react'

const Profile = () => {
  const { user, isLoading } = useAuth();
  const { updateProfile } = useUser();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const shareProfileRef = useRef<ShareProfileRef>(null);

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50"> 
        <div className="animate-spin h-10 w-10 border-4 border-t-transparent border-blue-500 rounded-full"></div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[350px_1fr]">
        
        {/* Profile Sidebar */}
        <aside className="bg-white rounded-2xl shadow p-6 h-fit">
          <ProfileDetailsCard 
             user={user} 
             handleEditBtnClick={() => setIsEditModalOpen(true)}
             handleShareBtnClick={() => shareProfileRef.current?.open()}
          />
        </aside>

        {/* Main Content */}
        <section className="flex flex-col">
          <ProfileReminder user={user} />
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </button>
          </div>

          {/* Posts Section */}
          <div
            className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
              No posts available
            </div>
          </div>
        </section>

      </main>

      {/* here will be a modal that will open when the edit button is clicked */}
      {isEditModalOpen && (
        <EditProfile
          user={user}
          onSave={updateProfile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* share profile modal */}
      <ShareProfile
         ref={shareProfileRef}
         user={user}
      />
    </div>
  );
}

export default Profile;
