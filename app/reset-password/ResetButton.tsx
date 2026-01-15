'use client';

import { useFormStatus } from 'react-dom';

export function ResetButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#5ea2ef] text-white py-3 rounded-xl hover:bg-[#4d91de] transition text-md font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
            {pending ? 'Resetting...' : 'Reset Password'}
        </button>
    );
}
