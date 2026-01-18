'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<void>;
  googleSignInAction: () => Promise<void>;
  message?: string;
}

export default function LoginForm({
  signInAction,
  googleSignInAction,
  message,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(message);
  const supabase = createClient();

  // Clear URL params on mount to prevent stale messages on refresh
  useEffect(() => {
    // Check if there's a message in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('message')) {
      // Replace the URL without the message param to clean up on refresh
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    if (message) {
      setIsLoading(false);
      setDisplayMessage(message);
    }
  }, [message]);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await signInAction(formData);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
    // Note: We don't set isLoading(false) on success because the page will redirect
  };

  return (
    <div className="space-y-4 w-full">
      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-midnightNavy"
          >
            Enter Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="email@example.com"
            required
            className="mt-1 block w-full rounded-md border border-midnightNavy px-4 py-2 text-midnightNavy text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-bold text-midnightNavy"
          >
            Enter Password
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              required
              className="block w-full rounded-md border border-midnightNavy px-4 py-2 text-midnightNavy text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-midnightNavy hover:text-dustyBlue focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${rememberMe
                  ? 'bg-dustyBlue border-dustyBlue'
                  : 'border-midnightNavy bg-white'
                  }`}
              >
                {rememberMe && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-midnightNavy font-semibold">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-lightBlue font-semibold hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-midnightNavy text-white py-2 rounded-full hover:bg-[#153568] transition text-sm font-semibold ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center justify-center mt-2">
        <div className="w-full border-t border-gray-300"></div>
        <span className="px-2 text-midnightNavy font-semibold text-sm whitespace-nowrap">
          or connect with
        </span>
        <div className="w-full border-t border-gray-300"></div>
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center border border-midnightNavy py-2 rounded-full hover:bg-gray-50 transition text-sm font-semibold text-midnightNavy"
      >
        <div className="relative w-5 h-5 mr-2">
          <Image
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
            alt="Google"
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
        Continue with Google
      </button>

      {/* Error message display */}
      {displayMessage && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="text-center text-sm">{displayMessage}</p>
        </div>
      )}
    </div>
  );
}