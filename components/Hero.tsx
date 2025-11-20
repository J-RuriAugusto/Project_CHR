import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';

// Helper function to get base URL (move outside component)
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return 'http://localhost:3000';
}

export const Hero = async ({
  searchParams,
}: {
  searchParams?: { message: string };
}) => {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's an invalid credentials error
      if (error.message === 'Invalid login credentials') {
        // Check if the email exists
        const { data: emailExists } = await supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();
        
        if (emailExists) {
          return redirect('/?message=Incorrect password');
        }
      }
      return redirect('/?message=Could not authenticate user');
    }

    return redirect('/');
  };

  // Add Google sign-in server action
  const signInWithGoogle = async () => {
    'use server';

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      return redirect('/?message=Could not authenticate with Google');
    }

    if (data?.url) {
      return redirect(data.url);
    }
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

      {/* Right side - Login Section */}
      <div className="flex flex-1 bg-white lg:px-12 h-screen">
        <div className="m-auto w-full max-w-sm lg:max-w-md flex flex-col items-center">
          {/* Logo + Header */}
          <div className="flex flex-col items-center mb-3">
            <div className="relative w-36 h-28 lg:w-44 lg:h-36 -mb-2">
              <Image
                src="/cmms-logo.png"
                alt="CMMS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl lg:text-2xl font-bold text-midnightNavy mt-0 text-center">
              Login to Your Account
            </h1>
            <p className="text-center text-midnightNavy mt-1 text-lg lg:text-base leading-relaxed">
              Manage and monitor CHR case records with role-based access
              to ensure confidentiality and security.
            </p>
          </div>

          {session ? (
            <>
              {/* Redirect to dashboard if logged in */}
              {redirect('/dashboard')}
            </>
          ) : (
            <div className="space-y-4 w-full">
              {/* Email/Password Form */}
              <form action={signIn} className="space-y-4">
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
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    className="mt-1 block w-full rounded-md border border-midnightNavy px-4 py-2 text-midnightNavy text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Options */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 border-midnightNavy rounded-full"
                    />
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
                  className="w-full bg-midnightNavy text-white py-2 rounded-full hover:bg-[#153568] transition text-sm font-semibold"
                >
                  Log In
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

              {/* Google Button - Separate form */}
              <form action={signInWithGoogle}>
                <button
                  type="submit"
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
              </form>
              
              {/* Error message display */}
              {searchParams?.message && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  <p className="text-center text-sm">{searchParams.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};