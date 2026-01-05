import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ResetButton } from './ResetButton';
import { PasswordInput } from '@/components/PasswordInput';

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: { message: string; code: string };
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return redirect('/');
  }

  const resetPassword = async (formData: FormData) => {
    'use server';

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const supabase = createClient();

    if (password !== confirmPassword) {
      return redirect(
        `/reset-password?message=Passwords do not match&code=${searchParams.code || ''}`
      );
    }

    if (searchParams.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(
        searchParams.code
      );

      if (error) {
        return redirect(
          `/reset-password?message=Unable to reset Password. Link expired!`
        );
      }
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.log(error);
      return redirect(
        `/reset-password?message=Unable to reset Password. Try again!`
      );
    }

    redirect(
      `/login?message=Your Password has been reset successfully. Sign in.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navy Header */}
      <header className="bg-[#012453] px-5 py-1">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="relative w-44 h-20 -my-2">
            <Image
              src="/cmms-logo2.png"
              alt="CMMS Logo"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Home Link */}
          <Link
            href="/"
            className="text-white text-sm hover:text-gray-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl py-6 px-8 w-full max-w-[400px] flex flex-col items-center">
          {/* Lock Icon */}
          <div className="relative w-32 h-20 mb-2">
            <Image
              src="/streamline-plump-color_password-lock-flat.png"
              alt="Reset Password"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-[#2859C5] text-2xl font-bold mb-4 text-center font-sans">
            Reset Your Password
          </h1>

          <form action={resetPassword} className="w-full space-y-3">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#737373] mb-2 ml-1 font-sans"
              >
                New Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Input your new password..."
                required
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-[#737373] mb-2 ml-1 font-sans"
              >
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your new Password..."
                required
              />
            </div>

            <ResetButton />

            {/* Error/Success Message */}
            {searchParams?.message && (
              <div className={`mt-4 p-3 rounded-md text-xs text-center ${searchParams.message.includes('success')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
                }`}>
                {searchParams.message}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
