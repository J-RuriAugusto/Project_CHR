import Link from 'next/link';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function ForgotPassword({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return redirect('/');
  }

  const confirmReset = async (formData: FormData) => {
    'use server';

    const origin = headers().get('origin');
    const email = formData.get('email') as string;
    const supabase = createClient();

    // Check if email exists in the users table
    const { data: emailExists } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (!emailExists) {
      return redirect('/forgot-password?message=Email address not registered.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      return redirect('/forgot-password?message=Could not reset password');
    }

    return redirect(
      '/confirm?message=Password reset link has been sent to your email address'
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side illustration - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 h-screen items-center justify-center bg-gray-50">
        <div className="relative w-full h-full">
          <Image
            src="/cmms-bg.png"
            alt="CHR Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Right side - Forgot Password Section */}
      <div className="flex flex-1 bg-white lg:px-12 h-screen">
        <div className="m-auto w-full max-w-sm lg:max-w-md flex flex-col items-center">
          {/* Logo + Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-36 h-28 lg:w-44 lg:h-36 -mb-2">
              <Image
                src="/cmms-logo.png"
                alt="CMMS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mt-0 text-center">
              Reset Your Password
            </h1>
            <p className="text-center text-gray-600 mt-2 text-sm lg:text-base leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form action={confirmReset} className="space-y-6 w-full">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#0b2347] text-white py-3 rounded-full hover:bg-[#153568] transition text-sm font-medium"
            >
              Send Reset Link
            </button>

            {/* Message */}
            {searchParams?.message && (
              <div className={`p-4 rounded-md text-sm text-center ${
                searchParams.message.includes('error') || searchParams.message.includes('Could not') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {searchParams.message}
              </div>
            )}

            {/* Back to Login */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}