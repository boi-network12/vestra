import { useContext } from 'react';
import { FriendContext } from '../context/FriendContext';

export const useFriends = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};