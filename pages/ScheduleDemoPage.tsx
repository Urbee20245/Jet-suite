import React, { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    PlayCircleIcon,
    StarIcon,
    ClockIcon,
    UserGroupIcon,
    RocketLaunchIcon,
    SparklesIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface ScheduleDemoPageProps {
    navigate: (path: string) => void;
}

export const ScheduleDemoPage: React.FC<ScheduleDemoPageProps> = ({ navigate }) => {
    const [calEventId, setCalEventId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCalEvent = async () => {
            try {
                const res = await fetch('/api/calcom/get-event');
                if (res.ok) {
                    const data = await res.json();
                    setCalEventId(data.eventId);
                }
            } catch {
                // Cal.com not configured, will show fallback
            }
            setLoading(false);
        };
        fetchCalEvent();
    }, []);

    // Load Cal.com embed script
    useEffect(() => {
        if (!calEventId) return;

        const script = document.createElement('script');
        script.src = 'https://app.cal.com/embed/embed.js';
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [calEventId]);

    const benefits = [
        { icon: SparklesIcon, title: 'See AI in Action', desc: 'Watch JetSuite analyze a real business profile live' },
        { icon: ChartBarIcon, title: 'Get Your Growth Score', desc: 'See where your business stands vs competitors' },
        { icon: RocketLaunchIcon, title: 'Custom Strategy', desc: 'Walk away with actionable steps for your business' },
        { icon: ClockIcon, title: '30 Minutes', desc: 'Quick, focused session tailored to your needs' },
    ];

    const testimonials = [
        { name: 'Mike R.', business: 'Triad Mechanical', text: 'The demo showed me exactly how much I was missing. Signed up that day.', rating: 5 },
        { name: 'Sarah K.', business: 'Luxe Hair Studio', text: 'I had no idea my Google profile was so incomplete. The live audit was eye-opening.', rating: 5 },
        { name: 'James T.', business: 'Elite Plumbing', text: 'Best 30 minutes I spent on my business this year. Clear, actionable, no pressure.', rating: 5 },
    ];

    return (
        <div className="bg-brand-darker text-gray-300 font-sans overflow-x-hidden">

            {/* Hero Section */}
            <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
                                <PlayCircleIcon className="w-5 h-5 text-blue-400" />
                                <span className="text-blue-300 text-sm font-semibold">Live Personalized Demo</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
                                See How JetSuite Can <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                                    Transform Your Business
                                </span>
                            </h1>

                            <p className="text-lg text-gray-400 leading-relaxed mb-8">
                                Get a free, no-pressure walkthrough of JetSuite with one of our growth specialists. We'll analyze your business live and show you exactly how to outrank your competitors.
                            </p>

                            <div className="space-y-4 mb-8">
                                {benefits.map((b, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 shrink-0">
                                            <b.icon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{b.title}</h3>
                                            <p className="text-gray-400 text-sm">{b.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                                <div className="flex -space-x-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 border-2 border-brand-darker flex items-center justify-center text-white text-xs font-bold">
                                            {['M', 'S', 'J', 'A'][i]}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-gray-400 text-xs mt-0.5">Trusted by 360+ local businesses</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Cal.com Embed / Booking Widget */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-teal-500/20 rounded-2xl blur-xl"></div>
                            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-5 text-center">
                                    <h2 className="text-xl font-bold text-white">Book Your Free Demo</h2>
                                    <p className="text-blue-100 text-sm mt-1">Pick a time that works best for you</p>
                                </div>

                                <div className="p-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : calEventId ? (
                                        <div
                                            data-cal-link={calEventId}
                                            data-cal-config='{"layout":"month_view","theme":"dark"}'
                                            style={{ width: '100%', minHeight: '400px', overflow: 'auto' }}
                                        ></div>
                                    ) : (
                                        /* Fallback form if Cal.com is not configured */
                                        <FallbackForm />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What Happens in the Demo */}
            <section className="py-20 px-4 bg-slate-900/50 border-t border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-white">What Happens in Your Demo</h2>
                        <p className="text-gray-400 mt-3 max-w-2xl mx-auto">No generic slideshow. Every demo is tailored to your specific business.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Live Business Audit',
                                desc: 'We pull up your Google Business Profile and website in real-time and show you exactly what customers and Google see.',
                                color: 'from-blue-500 to-blue-600'
                            },
                            {
                                step: '02',
                                title: 'Competitor Comparison',
                                desc: 'We compare your online presence against your top local competitors so you can see exactly where you stand.',
                                color: 'from-teal-500 to-teal-600'
                            },
                            {
                                step: '03',
                                title: 'Your Growth Roadmap',
                                desc: 'Walk away with a clear, prioritized action plan. Even if you don\'t sign up, you\'ll know exactly what to fix first.',
                                color: 'from-purple-500 to-purple-600'
                            }
                        ].map((item, i) => (
                            <div key={i} className="group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-sm" style={{backgroundImage: `linear-gradient(to bottom, var(--tw-gradient-stops))`}}></div>
                                <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-8 h-full group-hover:border-slate-600 transition-colors">
                                    <div className={`text-5xl font-black bg-gradient-to-br ${item.color} bg-clip-text text-transparent mb-4`}>
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-brand-darker border-t border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white">What Business Owners Say</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <StarIcon key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-300 italic mb-4">"{t.text}"</p>
                                <div className="border-t border-slate-700 pt-4">
                                    <p className="text-white font-semibold">{t.name}</p>
                                    <p className="text-gray-500 text-sm">{t.business}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-20 px-4 bg-gradient-to-br from-blue-900/40 via-slate-900 to-brand-darker border-t border-slate-800">
                <div className="max-w-3xl mx-auto text-center">
                    <UserGroupIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-4">Not Ready for a Demo?</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Try our free self-service demos instead. Analyze your Google Business Profile or website instantly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/demo/jetbiz')}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300"
                        >
                            Free Google Business Audit
                        </button>
                        <button
                            onClick={() => navigate('/demo/jetviz')}
                            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                        >
                            Free Website Audit
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

/* Fallback form when Cal.com is not configured */
const FallbackForm: React.FC = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', business: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="text-center py-12">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Request Received!</h3>
                <p className="text-gray-400">We'll get back to you within 24 hours to schedule your personalized demo.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
                <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="John Doe"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="john@business.com"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="(555) 123-4567"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
                    <input
                        type="text"
                        value={form.business}
                        onChange={e => setForm({ ...form, business: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="My Business"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">What would you like to see?</label>
                <textarea
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Tell us about your business and goals..."
                />
            </div>
            <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20"
            >
                Request My Free Demo
            </button>
            <p className="text-center text-gray-500 text-xs">No commitment required. We'll reach out to find a time.</p>
        </form>
    );
};
