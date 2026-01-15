'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#0b2347] text-white py-3 rounded-full hover:bg-[#153568] transition text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {pending ? 'Sending...' : 'Send Reset Link'}
        </button>
    );
}
