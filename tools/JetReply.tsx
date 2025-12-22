
import React, { useState } from 'react';
import type { Tool, ProfileData, ReadinessState } from '../types';
import { generateReviewReply } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { ReadinessBanner } from '../components/ReadinessBanner';

interface JetReplyProps {
  tool: Tool;
  profileData: ProfileData;
  readinessState: ReadinessState;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetReply: React.FC<JetReplyProps> = ({ tool, profileData, readinessState, setActiveTool }) => {
  const [review, setReview] = useState('');
  const [isPositive, setIsPositive] = useState(true);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review) {
      setError('Please paste the customer review.');
      return;
    }
    setError('');
    setLoading(true);
    setReply('');
    setCopied(false);
    try {
      const result = await generateReviewReply(review, isPositive, profileData.business.dna.style);
      setReply(result);
    } catch (err) {
      setError('Failed to generate reply. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReady = readinessState === 'Foundation Ready';

  return (
    <div>
      {showHowTo && (
        <HowToUse toolName={tool.name} onDismiss={() => setShowHowTo(false)}>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Paste a customer's review into the text box.</li>
                <li>Select whether the review is 'Positive' or 'Negative'.</li>
                <li>Click 'Draft Reply' to get a professional, on-brand response.</li>
            </ul>
        </HowToUse>
      )}

      {showBanner && !isReady && (
        <ReadinessBanner 
            readinessState={readinessState}
            onContinue={() => setShowBanner(false)}
            setActiveTool={setActiveTool}
        />
      )}

      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <p className="text-brand-text-muted mb-6">{tool.description}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="review" className="block text-sm font-medium text-brand-text mb-2">Customer Review</label>
            <textarea
              id="review"
              rows={5}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Paste customer review here..."
              className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
            />
          </div>
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-sm font-medium text-brand-text">Review Type:</span>
            <button type="button" onClick={() => setIsPositive(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isPositive ? 'bg-green-500 text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>Positive</button>
            <button type="button" onClick={() => setIsPositive(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!isPositive ? 'bg-red-500 text-white shadow' : 'bg-brand-light text-brand-text-muted hover:bg-gray-200'}`}>Negative</button>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue hover:to-accent-purple/80 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
            {loading ? 'Drafting...' : 'Draft Reply'}
          </button>
        </form>
      </div>
      {loading && <Loader />}
      {reply && (
        <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-brand-text">Suggested Reply</h3>
          <p className="text-brand-text-muted whitespace-pre-wrap bg-brand-light p-4 rounded-lg border border-brand-border">{reply}</p>
          <button onClick={handleCopyToClipboard} className="mt-4 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
    </div>
  );
};
