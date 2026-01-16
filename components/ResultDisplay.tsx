import React from 'react';

interface ResultDisplayProps {
  markdownText: string;
}

// A simple markdown to HTML converter. For a real app, a library like 'marked' or 'react-markdown' would be better.
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const elements = text.split('\n').map((line, index) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-accent-purple">{line.substring(2, line.length - 2)}</h2>;
    }
    if (line.startsWith('* ') || line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\* |^\d+\.\s/, '');
      const boldMatch = content.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const parts = content.split(boldMatch[0]);
        return (
          <li key={index} className="ml-6 list-disc">
            {parts[0]}<strong className="font-semibold text-brand-text">{boldMatch[1]}</strong>{parts[1]}
          </li>
        );
      }
      return <li key={index} className="ml-6 list-disc">{content}</li>;
    }
    if (line.trim() === '') {
      return <br key={index} />;
    }
    return <p key={index} className="mb-2">{line}</p>;
  });

  return <>{elements}</>;
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ markdownText }) => {
  if (!markdownText) return null;

  return (
    <div className="mt-6 bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-brand-text">Analysis Result</h3>
      <div className="prose max-w-none text-brand-text-muted">
         <SimpleMarkdown text={markdownText} />
      </div>
    </div>
  );
};