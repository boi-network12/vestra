import { LoginProps } from '@/types/LoginProps';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SideImage from '@/assets/img/icon.png'; // replace with your image

export default function TabletLogin({
  form,
  setForm,
  showPassword,
  setShowPassword,
  errors,
  handleSubmit,
  isLoading,
}: LoginProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50">
      <main className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto flex-grow">
        {/* Left: Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-xl text-base"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-5 py-3 border border-gray-300 rounded-xl text-base"
                placeholder="Enter your password"
              />
              <div className="flex justify-between items-center mt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-sm text-blue-600"
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              {errors.password && <p className="text-red-500 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              Register
            </Link>
          </div>
        </div>

        {/* Right: Image Section */}
        <div className="hidden md:flex w-1/2 justify-center items-center">
          <Image
            src={SideImage}
            alt="Login illustration"
            width={500}
            height={500}
            className="object-contain"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} KamdiDev. All rights reserved.
      </footer>
    </div>
  );
}
