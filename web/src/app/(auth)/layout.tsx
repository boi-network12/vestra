// app/auth/layout.tsx
import { Suspense } from 'react';
import PublicRoute from '../_components/public-route';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg transition-all duration-300">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[200px] text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </PublicRoute>
  );
}