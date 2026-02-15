import React from 'react';
import { DocumentTextIcon, NewspaperIcon, SpeakerphoneIcon } from '@heroicons/react/24/outline';

interface ContentTypeSelectorProps {
  onSelect: (type: 'blog_post' | 'article' | 'press_release') => void;
}

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Create Professional Content
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the type of content that best serves your business objectives
        </p>
      </div>

      {/* Three-column selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Blog Post Card */}
        <button
          onClick={() => onSelect('blog_post')}
          className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left hover:border-accent-blue hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          {/* Icon container with gradient */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <DocumentTextIcon className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Blog Post
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            SEO-optimized articles that drive organic traffic and answer customer questions
          </p>

          {/* Specs */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              800-1,500 words
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Conversational tone
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Keyword-focused
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center text-accent-blue font-semibold group-hover:translate-x-1 transition-transform duration-300">
            Create Blog Post
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Article Card */}
        <button
          onClick={() => onSelect('article')}
          className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left hover:border-accent-purple hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          {/* Premium badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              Premium
            </span>
          </div>

          {/* Icon container with gradient */}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <NewspaperIcon className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Article
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            In-depth, authoritative content that establishes thought leadership and industry expertise
          </p>

          {/* Specs */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              1,500-3,000+ words
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Research-backed
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Industry authority
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center text-accent-purple font-semibold group-hover:translate-x-1 transition-transform duration-300">
            Create Article
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Press Release Card */}
        <button
          onClick={() => onSelect('press_release')}
          className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left hover:border-emerald-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          {/* Premium badge */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              Premium
            </span>
          </div>

          {/* Icon container with gradient */}
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <SpeakerphoneIcon className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Press Release
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Formal announcements in AP Style format, ready for media distribution and coverage
          </p>

          {/* Specs */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              300-500 words
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              AP Style format
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Media-ready
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform duration-300">
            Create Press Release
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

      </div>

      {/* Bottom help text */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Not sure which to choose? Our AI will guide you through the process.{' '}
          <span className="text-accent-blue font-medium">
            Each content type is optimized for specific business goals.
          </span>
        </p>
      </div>
    </div>
  );
};
