"use client";
import { useAuth } from "@/hooks/authHooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface FormErrors {
  code?: string;
}

export default function Verify() {
  const { isLoading, verifyUser, resendVerificationCode, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const emailFromParams = searchParams.get("email");
    const emailFromStorage = localStorage.getItem("pendingVerificationEmail");
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams));
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && user.isVerified === true) {
      router.replace("/home");
    }
  }, [user, router]);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const success = await verifyUser(code);
    if (success) {
      router.replace("/home");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("No email found. Please try registering or logging in again.", {
        position: "top-center",
      });
      return;
    }

    const success = await resendVerificationCode({ email });
    if (success) {
      setResendCooldown(60);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-600 mb-4">
          We sent a 6-digit code to <span className="font-semibold">{email || "your email"}</span>.
          Please enter it below to verify your account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
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
              className={`mt-1 block w-full p-2 border ${
                errors.code ? "border-red-500" : "border-gray-300"
              } rounded-md text-center text-lg tracking-widest`}
              placeholder="123456"
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />
            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
          </div>
          <button
            type="submit"
            className={`w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify Account"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleResend}
              className={`text-blue-500 hover:underline ${
                resendCooldown > 0 || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={resendCooldown > 0 || isLoading}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already verified?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}