
import React, { useState } from 'react';
import { JetSuiteLogo } from '../components/JetSuiteLogo';

interface LoginPageProps {
    navigate: (path: string) => void;
    onLoginSuccess: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Placeholder for authentication logic
        setTimeout(() => {
            if (email === 'theivsightcompany@gmail.com' && password === 'Takashi1*..') {
                // In a real app, you would verify credentials here
                onLoginSuccess(email);
            } else {
                setError('Invalid email or password.');
                setLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-4">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <button onClick={() => navigate('/')} className="inline-block">
                       <JetSuiteLogo className="w-16 h-16 mx-auto"/>
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to your JetSuite account.</p>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl shadow-accent-purple/10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-300" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
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
                                className="mt-2 block w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                                placeholder="••••••••"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
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
                    <p className="text-center text-sm text-gray-400 mt-6">
                        Don't have an account?{' '}
                        <button onClick={() => navigate('/pricing')} className="font-semibold text-accent-purple hover:underline">
                            Get Started
                        </button>
                    </p>
                </div>

                <div className="text-center mt-8">
                    <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">&larr; Back to Home</button>
                </div>
             </div>
        </div>
    );
};
