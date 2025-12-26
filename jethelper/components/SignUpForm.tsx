
import React, { useState } from 'react';

interface SignUpFormProps {
    onSubmit: (name: string, email: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) {
            setEmailError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            setIsSubmitting(false);
            return;
        }

        if (name && email) {
            await onSubmit(name, email);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-[#1E293B] border border-[#28334E] p-4 rounded-lg my-2 animate-fade-in-up w-full max-w-sm mx-auto shadow-lg">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Get Your 20% Off Coupon!</h3>
                <p className="text-gray-400 text-sm">Enter your details to get your code.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#28334E] border border-[#3A4562] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A69FF] text-white placeholder-gray-500 text-sm"
                        placeholder="Full Name"
                        aria-label="Full Name"
                    />
                </div>
                <div>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        className={`w-full px-3 py-2 bg-[#28334E] border rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A69FF] text-white placeholder-gray-500 text-sm ${emailError ? 'border-red-500' : 'border-[#3A4562]'}`}
                        placeholder="Email Address"
                        aria-label="Email Address"
                    />
                    {emailError && <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p>}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-[#4A69FF] text-white font-semibold rounded-md hover:bg-[#3A56D5] focus:outline-none focus:ring-2 focus:ring-[#4A69FF] focus:ring-offset-2 focus:ring-offset-[#1E293B] transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Get My Coupon'}
                </button>
            </form>
        </div>
    );
};
