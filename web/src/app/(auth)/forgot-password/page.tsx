// app/forgot-password/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/authHooks";
import { useRouter } from "next/navigation";
import { BiHide, BiShow } from "react-icons/bi";

type Step = "request" | "reset";

interface FormState {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const initialFormState: FormState = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ForgetPassword() {
  const { forgotPassword, verifyResetOtp, resetPassword, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // Clear error on change
  };

  // Validate form based on step
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (step === "request") {
      if (!formState.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        newErrors.email = "Invalid email address";
      }
      if (otpSent && !formState.otp.match(/^\d{6}$/)) {
        newErrors.otp = "OTP must be a 6-digit code";
      }
    } else if (step === "reset") {
      if (formState.newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }
      if (formState.newPassword !== formState.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle clicks outside modal to close
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setStep("request");
      setFormState(initialFormState);
      setOtpSent(false);
      setErrors({});
    }
  }, []);

  // Handle Escape key to close modal
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setStep("request");
      setFormState(initialFormState);
      setOtpSent(false);
      setErrors({});
    }
  }, []);

  // Add event listeners for outside clicks and keydown
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  // Handle OTP request
  const handleRequestOtp = async () => {
    if (!validateForm()) return;
    try {
      const success = await forgotPassword(formState.email);
      if (success) {
        setOtpSent(true);
        console.log("OTP sent to your email.");
      } else {
        setErrors({ email: "Failed to send OTP. Please try again." });
      }
    } catch {
      setErrors({ email: "An error occurred while sending OTP." });
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const success = await verifyResetOtp(formState.email, formState.otp);
      if (success) {
        setStep("reset");
        console.log("OTP verified successfully!");
      } else {
        setErrors({ otp: "Invalid or expired OTP." });
      }
    } catch {
      setErrors({ otp: "An error occurred while verifying OTP." });
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const success = await resetPassword(formState.otp, formState.newPassword);
      if (success) {
        console.log("Password reset successfully!");
        setFormState(initialFormState);
        setStep("request");
        setOtpSent(false);
        router.push("/login");
      } else {
        setErrors({ newPassword: "Failed to reset password." });
      }
    } catch  {
      setErrors({ newPassword: "An error occurred while resetting password." });
    }
  };

  // Render form based on current step
  const renderForm = () => {
    if (step === "request") {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                errors.email
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter your email"
              required
              aria-required="true"
              disabled={otpSent || isLoading}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              OTP Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="otp"
                name="otp"
                value={formState.otp}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                  errors.otp
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                aria-required="true"
                disabled={!otpSent || isLoading}
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading || otpSent}
                className={`px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center ${
                  isLoading || otpSent ? "min-w-[100px]" : ""
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
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
                    Sending...
                  </span>
                ) : otpSent ? (
                  "Sent"
                ) : (
                  "Get Code"
                )}
              </button>
            </div>
            {errors.otp && (
              <p
                id="otp-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {errors.otp}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !otpSent}
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
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>
      );
    }

    if (step === "reset") {
      return (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formState.newPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                  errors.newPassword
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter new password"
                required
                aria-required="true"
                minLength={8}
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
            {errors.newPassword && (
              <p
                id="newPassword-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {errors.newPassword}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formState.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Confirm new password"
                required
                aria-required="true"
                minLength={8}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-lg text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>
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
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-md shadow-lg p-6 sm:p-8 relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            setStep("request");
            setFormState(initialFormState);
            setOtpSent(false);
            setErrors({});
          }}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 text-lg font-semibold transition-colors duration-200"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Title */}
        <h2
          id="modalTitle"
          className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6"
        >
          {step === "request" ? "Reset Your Password" : "Set New Password"}
        </h2>

        {/* Form */}
        {renderForm()}

        {/* Resend OTP */}
        {step === "request" && otpSent && (
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
            Didn’t receive an OTP?{" "}
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isLoading}
              className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 dark:disabled:text-gray-500"
            >
              Resend OTP
            </button>
          </p>
        )}

        {/* Back to Login */}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Remember your password?{" "}
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Log in
          </a>
        </p>

        {/* Footer */}
        <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Vestra © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}