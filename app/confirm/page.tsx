import Image from 'next/image';
import Link from 'next/link';

export default function Confirm({
  searchParams,
}: {
  searchParams: { message: string };
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
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Email Send Icon */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 mb-6">
          <Image
            src="/streamline-color_send-email-flat.png"
            alt="Email Sent"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Message */}
        <p className="text-[#0b2347] text-lg md:text-xl font-medium text-center max-w-md">
          {searchParams.message}
        </p>
      </main>
    </div>
  );
}
