import Image from 'next/image';
import Link from 'next/link';
import ResetPasswordForm from './ResetPasswordForm';

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: { message: string; code: string };
}) {
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

          <ResetPasswordForm code={searchParams.code} />
        </div>
      </main>
    </div>
  );
}

