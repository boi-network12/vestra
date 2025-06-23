import { LoginProps } from '@/types/LoginProps';
import React from 'react';
import Link from 'next/link';

export default function BrowserLogin({
  form,
  setForm,
  showPassword,
  setShowPassword,
  errors,
  handleSubmit,
  isLoading,
  error,
}: LoginProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl text-blue-600 font-bold text-center mb-6">Vestra</h1>

        {/* Error Message */}
        {typeof error === 'string' && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="Email address or phone number"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              placeholder="Password"
            />
            <div className="flex justify-between items-center mt-1">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md text-sm transition"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Create New Account */}
          <Link
            href="/register"
            className="block text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-md text-sm transition"
          >
            Create New Account
          </Link>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-xs text-gray-500 text-center">
        vestra © {new Date().getFullYear()} 
      </footer>
    </div>
  );
}
