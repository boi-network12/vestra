"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/authHooks";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type Step = "request" | "reset";

interface FormState {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Handle clicks outside modal to close
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setStep("request");
        setFormState(initialFormState);
        setOtpSent(false);
      }
    },
    []
  );

  // Handle Escape key to close modal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStep("request");
        setFormState(initialFormState);
        setOtpSent(false);
      }
    },
    []
  );

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
    if (!formState.email) {
      console.error("Please enter your email.");
      return;
    }
    try {
      const success = await forgotPassword(formState.email);
      if (success) {
        setOtpSent(true);
        console.log("OTP sent to your email.");
      } else {
        console.log("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("An error occurred while sending OTP.");
    }
  };

  // Handle OTP verification and form submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.otp) {
      console.error("Please enter the OTP.");
      return;
    }
    try {
      const success = await verifyResetOtp(formState.email, formState.otp);
      if (success) {
        setStep("reset");
        console.log("OTP verified successfully!");
      } else {
        console.error("Invalid or expired OTP.");
      }
    } catch (error) {
      console.error("An error occurred while verifying OTP.");
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.newPassword !== formState.confirmPassword) {
      console.error("Passwords do not match.");
      return;
    }
    if (formState.newPassword.length < 8) {
      console.error("Password must be at least 8 characters long.");
      return;
    }
    try {
      const success = await resetPassword(formState.otp, formState.newPassword);
      if (success) {
        console.log("Password reset successfully!");
        setFormState(initialFormState);
        setStep("request");
        setOtpSent(false);
        router.push("/login");
      } else {
        console.error("Failed to reset password.");
      }
    } catch (error) {
      console.error("An error occurred while resetting password.");
    }
  };

  // Render form based on current step
  const renderForm = () => {
    if (step === "request") {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-required="true"
              disabled={otpSent}
            />
          </div>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              OTP Code
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="otp"
                name="otp"
                value={formState.otp}
                onChange={handleInputChange}
                className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                aria-required="true"
                disabled={!otpSent}
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading || otpSent}
                className="mt-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center"
              >
                {isLoading ? (
                  <>
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
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                      ></path>
                    </svg>
                    Sending...
                  </>
                ) : otpSent ? (
                  "Sent"
                ) : (
                  "Get Code"
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !otpSent}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      );
    }

    if (step === "reset") {
      return (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formState.newPassword}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-required="true"
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formState.confirmPassword}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              aria-required="true"
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div
        ref={modalRef}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md relative"
      >
        <button
          type="button"
          onClick={() => {
            setStep("request");
            setFormState(initialFormState);
            setOtpSent(false);
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg font-semibold"
          aria-label="Close modal"
        >
          ×
        </button>
        <h2
          id="modalTitle"
          className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-800"
        >
          {step === "request" ? "Reset Your Password" : "Set New Password"}
        </h2>
        {renderForm()}
        {step === "request" && otpSent && (
          <p className="mt-4 text-sm text-center text-gray-600">
            Didn’t receive an OTP?{" "}
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isLoading}
              className="text-blue-500 hover:underline disabled:text-gray-400"
            >
              Resend OTP
            </button>
          </p>
        )}
      </div>
    </div>
  );
}