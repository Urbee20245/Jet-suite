import React, { useState } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client'; // Import centralized client function

interface LoginPageProps {
    navigate: (path: string) => void;
    onLoginSuccess: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [useMagicLink, setUseMagicLink] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = getSupabaseClient();
        if (!supabase) {
            setError('Authentication service is currently unavailable. Please check your connection.');
            setLoading(false);
            return;
        }

        try {
            // Use Supabase authentication
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                console.error('Login error:', authError);
                setError(authError.message || 'Invalid email or password.');
                setLoading(false);
                return;
            }

            if (data?.user) {
                console.log('Login successful:', data.user.email);
                // Auth state listener in App.tsx will handle the session
                // Just call the callback to trigger navigation
                onLoginSuccess(data.user.email || email);
            } else {
                setError('Login failed. Please try again.');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('Login exception:', err);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = getSupabaseClient();
        if (!supabase) {
            setError('Authentication service is currently unavailable. Please check your connection.');
            setLoading(false);
            return;
        }

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                },
            });

            if (otpError) {
                console.error('Magic link error:', otpError);
                setError(otpError.message || 'Failed to send magic link. Please try again.');
                setLoading(false);
                return;
            }

            setMagicLinkSent(true);
            setLoading(false);
        } catch (err: any) {
            console.error('Magic link exception:', err);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <button onClick={() => navigate('/')} className="inline-block">
                       <img src="/Jetsuitewing.png" alt="JetSuite Logo" className="w-16 h-16 mx-auto" />
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to your JetSuite account.</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl shadow-accent-purple/10">
                    {magicLinkSent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-accent-purple/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Check your email</h2>
                            <p className="text-gray-400 text-sm">
                                We sent a magic link to <span className="text-white font-medium">{email}</span>. Click the link in the email to sign in.
                            </p>
                            <p className="text-gray-500 text-xs">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setMagicLinkSent(false); setError(''); }}
                                className="text-sm text-accent-purple hover:underline mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    ) : useMagicLink ? (
                        <>
                            <form onSubmit={handleMagicLinkLogin} className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-300" htmlFor="magic-email">Email</label>
                                    <input
                                        id="magic-email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="mt-2 block w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {error && (
                                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-300 shadow-lg shadow-accent-purple/20 disabled:opacity-50"
                                    >
                                        {loading ? 'Sending...' : 'Send Magic Link'}
                                    </button>
                                </div>
                            </form>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-800/50 text-gray-400">or</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setUseMagicLink(false); setError(''); }}
                                className="w-full border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                            >
                                Sign in with password
                            </button>
                            <p className="text-center text-sm text-gray-400 mt-6">
                                Don't have an account?{' '}
                                <button onClick={() => navigate('/pricing')} className="font-semibold text-accent-purple hover:underline">
                                    Get Started
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-300" htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="mt-2 block w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-baseline">
                                       <label className="text-sm font-medium text-gray-300" htmlFor="password">Password</label>
                                       <button type="button" className="text-sm text-accent-purple hover:underline">Forgot password?</button>
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="mt-2 block w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {error && (
                                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}
                                <div>
                                   <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity duration-300 shadow-lg shadow-accent-purple/20 disabled:opacity-50"
                                    >
                                        {loading ? 'Signing In...' : 'Sign In'}
                                    </button>
                                </div>
                            </form>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-slate-800/50 text-gray-400">or</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setUseMagicLink(true); setError(''); }}
                                className="w-full border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                            >
                                Sign in with magic link
                            </button>
                            <p className="text-center text-sm text-gray-400 mt-6">
                                Don't have an account?{' '}
                                <button onClick={() => navigate('/pricing')} className="font-semibold text-accent-purple hover:underline">
                                    Get Started
                                </button>
                            </p>
                        </>
                    )}
                </div>

                <div className="text-center mt-8">
                    <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">&larr; Back to Home</button>
                </div>
             </div>
        </div>
    );
};