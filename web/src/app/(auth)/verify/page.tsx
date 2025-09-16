// app/verify/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/authHooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import Logo from "../../../assets/img/icon.png";

interface FormErrors {
  code?: string;
}

export default function Verify() {
  const { isLoading, verifyUser, resendVerificationCode, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Set email from search params or localStorage
  useEffect(() => {
    const emailFromParams = searchParams.get("email");
    const emailFromStorage = localStorage.getItem("pendingVerificationEmail");
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams));
      localStorage.setItem("pendingVerificationEmail", decodeURIComponent(emailFromParams));
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    }
  }, [searchParams]);

  // Redirect if user is verified
  useEffect(() => {
    console.log("Verify useEffect: user=", user, "pathname=", pathname);
    if (user && user.isVerified === true && pathname !== "/home") {
      const redirected = localStorage.getItem("hasRedirected");
      console.log("Redirect check: hasRedirected=", redirected);
      if (!redirected) {
        localStorage.setItem("hasRedirected", "true");
        router.replace("/home");
      }
    }
  }, [user, pathname, router]);
  
  // useEffect(() => {
  //   if (user?.isVerified && !localStorage.getItem("hasRedirected")) {
  //     localStorage.setItem("hasRedirected", "true");
  //     router.replace("/home");
  //   }
  // }, [user, router]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Validate form
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!code.trim() || code.length !== 6 || !/^\d{6}$/.test(code)) {
      newErrors.code = "Please enter a valid 6-digit code";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(newErrors.code, { position: "top-center" });
    }
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    try {
      const success = await verifyUser(code);
      if (success) {
        toast.success("Account verified successfully!", { position: "top-center" });
        router.replace("/home");
      } else {
        setErrors({ code: "Invalid or expired code" });
        toast.error("Invalid or expired code", { position: "top-center" });
      }
    } catch {
      setErrors({ code: "An error occurred while verifying the code" });
      toast.error("An error occurred while verifying the code", { position: "top-center" });
    }
  };

  // Handle resend code
  const handleResend = async () => {
    if (!email) {
      toast.error("No email found. Please try registering or logging in again.", {
        position: "top-center",
      });
      return;
    }

    try {
      const success = await resendVerificationCode({ email });
      if (success) {
        setResendCooldown(60);
        toast.success("Verification code resent to your email.", { position: "top-center" });
      } else {
        toast.error("Failed to resend verification code.", { position: "top-center" });
      }
    } catch {
      toast.error("An error occurred while resending the code.", { position: "top-center" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 sm:p-8">
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
        <h2
          className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6"
        >
          Verify Your Email
        </h2>

        {/* Instructions */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
          We sent a 6-digit code to{" "}
          <span className="font-semibold">{email || "your email"}</span>. Please enter it below to verify your account.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setErrors((prev) => ({ ...prev, code: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-200 text-center tracking-widest ${
                errors.code
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="123456"
              maxLength={6}
              disabled={isLoading}
              autoFocus
              aria-required="true"
            />
            {errors.code && (
              <p
                id="code-error"
                className="text-red-500 dark:text-red-400 text-xs mt-1"
                role="alert"
              >
                {errors.code}
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
                Verifying...
              </span>
            ) : (
              "Verify Account"
            )}
          </button>
        </form>

        {/* Resend Code */}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Didn’t receive the code?{" "}
          <button
            onClick={handleResend}
            className={`text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 dark:disabled:text-gray-500 font-medium ${
              resendCooldown > 0 || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={resendCooldown > 0 || isLoading}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </p>

        {/* Back to Login */}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Already verified?{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Log in
          </Link>
        </p>

        {/* Footer */}
        <footer className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Vestra © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}