import { LoginProps } from '@/types/LoginProps'
import { isIOS, isAndroid } from 'react-device-detect';
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { BiChevronDown, BiCloudDownload, BiHide, BiShow } from 'react-icons/bi'
import Logo from "../../../assets/img/icon.png"

export default function MobileLogin({
  form,
  setForm,
  showPassword,
  setShowPassword,
  errors,
  handleSubmit,
  isLoading,
}: LoginProps) {
  return (
    <div className='w-full min-h-screen bg-white flex flex-col items-center justify-start pt-8 px-4'>

      {/* Download Banner */}
      <div className='w-full flex flex-row items-center gap-2 border-b border-gray-300 pb-2'>
        <BiCloudDownload className='text-gray-900 text-xl' />
        <Link href="/" className='text-[#030120] text-sm'>Get Vestra for {isIOS ? 'iPhone' : isAndroid ? 'Android' : 'your device'} or Browser &#45; faster</Link>
      </div>

      {/* Language + Logo */}
      <div className='flex flex-col items-center justify-center mt-5 gap-4'>
        <p className='flex items-center gap-1 text-sm text-[#030120] cursor-pointer'>
          English (UK) <BiChevronDown className='text-gray-900 text-lg' />
        </p>
        <Image src={Logo} alt="logo" className='rounded-full w-16 h-16 object-contain' />
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className='w-full mt-8 flex flex-col gap-4'
      >
        {/* Email */}
        <div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address"
            className='w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:border-blue-500'
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className='relative'>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className='w-full border border-gray-300 px-3 py-2 rounded-md text-sm outline-none focus:border-blue-500'
          />
          <div
            className='absolute right-3 top-2.5 text-xl text-gray-500 cursor-pointer'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <BiHide /> : <BiShow />}
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className='bg-[#1877f2] text-white text-sm py-2 rounded-md font-semibold'
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        {/* Forgot Password */}
        <Link href="/forgot-password" className='text-blue-600 text-sm text-center'>
          Forgotten password?
        </Link>

        {/* Sign Up */}
        <Link
          href="/register"
          className='w-full text-center py-2 text-sm text-[#1877f2] font-medium border border-gray-300 rounded-md'
        >
          Create new account
        </Link>
      </form>

      {/* Footer */}
      <div className='mt-10 text-xs text-gray-500 text-center'>
        Vestra © {new Date().getFullYear()}
      </div>
    </div>
  )
}
