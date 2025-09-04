// app/register/page.tsx
"use client";
import { useAuth } from '@/hooks/authHooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export default function Register() {
  const { isLoading, error, register } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      newErrors.email = 'Invalid email address';
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const success = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });

      if (success) {
        await localStorage.setItem('pendingVerificationEmail', form.email);
        toast.info('Please verify your email to complete registration.');
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(form.email)}`);
        }, 1000);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Join Vestra</h2>

      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm text-center mb-4" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
              errors.firstName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="First name"
            disabled={isLoading}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-red-500 dark:text-red-400 text-xs mt-1">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
              errors.lastName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Last name"
            disabled={isLoading}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-red-500 dark:text-red-400 text-xs mt-1">
              {errors.lastName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
              errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="info@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 dark:text-red-400 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                errors.password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="********"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-red-500 dark:text-red-400 text-xs mt-1">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 dark:bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Log in
        </Link>
      </p>

      <footer className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        Vestra © {new Date().getFullYear()}
      </footer>
    </div>
  );
}