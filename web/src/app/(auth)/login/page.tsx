// app/login/page.tsx
"use client";

import { useAuth } from "@/hooks/authHooks";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BiHide, BiShow } from "react-icons/bi";
import Logo from "../../../assets/img/icon.png";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const { isLoading, error, login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!form.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      newErrors.email = "Invalid email address";
    }
    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const loginData = {
      email: form.email,
      password: form.password,
    };

    const success = await login(loginData);
    if (success) {
      router.replace("/home");
    }
  };

  useEffect(() => {
    if (error && error.toLowerCase().includes("please verify your account")) {
      localStorage.setItem("pendingVerificationEmail", form.email);
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(form.email)}`);
      }, 1000);
    }
  }, [error, form.email, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-md shadow-lg p-6 sm:p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src={Logo}
            alt="Vestra Logo"
            width={64}
            height={64}
            className="rounded-full object-contain"
            onError={(e) => (e.currentTarget.src = "/fallback-logo.png")} // Fallback image
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Welcome to Vestra
        </h1>

        {/* Error Message */}
        {error && (
          <p
            className="text-red-500 dark:text-red-400 text-sm text-center mb-4"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email or Phone
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address or phone number"
              className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                errors.email
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              disabled={isLoading}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                  errors.password
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-lg text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
              >
                {errors.password}
              </p>
            )}
            <Link
              href="/forgot-password"
              className="block text-right text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
            >
             Forgot password
            </Link>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={form.rememberMe}
              onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              disabled={isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-sm text-gray-600 dark:text-gray-300"
            >
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="block text-center bg-green-500 dark:bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-all duration-200"
          >
            Create New Account
          </Link>
        </form>

        {/* Footer */}
        <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Vestra © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}