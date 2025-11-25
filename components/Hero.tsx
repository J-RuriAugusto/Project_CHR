import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import LoginForm from './LoginForm';

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

    // Check user status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('status')
      .eq('email', email)
      .single();

    if (!userError && userData && userData.status === 'INACTIVE') {
      await supabase.auth.signOut();
      return redirect('/?message=Your account is inactive. Please contact an administrator.');
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
      <div className="flex flex-1 bg-white lg:px-12 h-screen items-center justify-center">
        <div className="w-full max-w-sm lg:max-w-md flex flex-col items-center">
          {/* Logo + Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-48 h-40 lg:w-56 lg:h-48 -mt-2">
              <Image
                src="/cmms-logo.png"
                alt="CMMS Logo"
                fill
                className="object-contain object-top"
                priority
              />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-midnightNavy text-center -mt-20">
              Login to Your Account
            </h1>
            <p className="text-center text-midnightNavy mt-2 text-sm lg:text-base leading-relaxed">
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
            <LoginForm
              signInAction={signIn}
              googleSignInAction={signInWithGoogle}
              message={searchParams?.message}
            />
          )}
        </div>
      </div>
    </div>
  );
};