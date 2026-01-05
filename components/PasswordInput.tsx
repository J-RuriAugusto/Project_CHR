'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function PasswordInput(props: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative">
            <style jsx>{`
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
            `}</style>
            <input
                {...props}
                type={showPassword ? 'text' : 'password'}
                className={`w-full bg-[#f8f9fa] border-none rounded-xl px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ea2ef] placeholder:font-medium pr-10 ${props.className || ''}`}
            />
            <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5ea2ef] hover:text-[#4d91de] focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? (
                    <EyeOff size={20} />
                ) : (
                    <Eye size={20} />
                )}
            </button>
        </div>
    );
}
