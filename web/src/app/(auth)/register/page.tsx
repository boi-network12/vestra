"use client";
import { useAuth } from '@/hooks/authHooks';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
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
      if (!form.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!form.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        newErrors.email = 'Invalid email address';
      }
      if (form.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
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
            console.log('Navigating to verify with email:', form.email); // Debug log
            router.push(`/verify?email=${encodeURIComponent(form.email)}`);
        }, 1000)
      } else {
        console.error('Registration failed. Please try again.');
      }
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // Clear error on change
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg md:shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder='first name'
            value={form.firstName}
            onChange={handleChange}
            className={`mt-1 block w-full p-2 border ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            } rounded-md`}
            disabled={isLoading}
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder='last name'
            value={form.lastName}
            onChange={handleChange}
            className={`mt-1 block w-full p-2 border ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            } rounded-md`}
            disabled={isLoading}
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder='info@example.com'
            value={form.email}
            onChange={handleChange}
            className={`mt-1 block w-full p-2 border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md`}
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder='********'
              value={form.password}
              onChange={handleChange}
              className={`mt-1 block w-full p-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-md`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className={`w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:underline">
          Log in
        </a>
      </p>
    </div>
  )
}
