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
    const [googleLoading, setGoogleLoading] = useState(false);

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

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);

        const supabase = getSupabaseClient();
        if (!supabase) {
            setError('Authentication service is currently unavailable. Please check your connection.');
            setGoogleLoading(false);
            return;
        }

        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`,
                },
            });

            if (oauthError) {
                console.error('Google OAuth error:', oauthError);
                setError(oauthError.message || 'Failed to sign in with Google. Please try again.');
                setGoogleLoading(false);
                return;
            }

            // OAuth redirect will happen automatically
            // No need to set loading to false as page will redirect
        } catch (err: any) {
            console.error('Google sign-in exception:', err);
            setError('An error occurred during Google sign-in. Please try again.');
            setGoogleLoading(false);
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
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="w-full border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
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
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className="w-full border border-slate-600 hover:border-slate-500 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
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