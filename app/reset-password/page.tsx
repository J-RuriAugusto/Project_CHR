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

  // Allow logged-in users to access this page if they have a code,
  // or if they are just doing a manual reset.
  // We do NOT redirect if session exists, because they might have clicked the link while logged in.

  // If there is a code in URL, we need to defer the exchange to the client or server action?
  // Actually, resetPasswordForEmail link contains a `code`.
  // Supabase Auth usually handles the code exchange in a callback route OR we must handle it.
  // The standard flow is: link -> /auth/callback?code=... -> exchange -> redirect to /reset-password
  // IF the link points directly to /reset-password?code=..., then we must handle it.

  // Checking typical valid logic:
  // If this page is reached with a valid session, let them reset.
  // If not valid session but has code, we might need to exchange it first?
  // NextJS Supabase helpers usually suggest an auth callback route.

  // Current Issue:
  // implementation had: if (session) return redirect('/');
  // This explicitly kicks them out if they are logged in.

  // FIX: Just remove that block.

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

    // Capture the code from searchParams
    const code = searchParams.code;

    if (code) {
      // If we have a code, we try to exchange it for a session first
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Exchange Error:", exchangeError);
        return redirect(`/reset-password?message=Invalid or expired reset link.`);
      }
    } else {
      // If NO CODE, we must ensure the user is already logged in
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        return redirect('/');
      }
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error('Update Error:', updateError);
      return redirect(
        `/reset-password?message=Unable to reset Password. Try again!&code=${code || ''}`
      );
    }

    // Success! Redirect to login.
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
