import React from 'react';

interface BlogPostPreviewProps {
  title: string;
  content: string;
  featuredImage?: string;
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  slug?: string;
}

export const BlogPostPreview: React.FC<BlogPostPreviewProps> = ({
  title,
  content,
  featuredImage,
  metaDescription,
  keywords = [],
  tags = [],
  slug,
}) => {
  // Parse markdown content to extract first paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('**'));
  const excerpt = paragraphs[0]?.substring(0, 280) || '';

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Preview Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-text uppercase tracking-wide">Preview</h3>
          <p className="text-xs text-brand-text-muted mt-0.5">How your blog post will look</p>
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
          ✓ Ready to Publish
        </span>
      </div>

      {/* Main Preview Card - Cleaner, more compact design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Featured Image */}
          {featuredImage && (
            <div className="relative lg:h-full h-56 bg-gray-100 overflow-hidden">
              <img
                src={featuredImage}
                alt={title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
                  Featured Post
                </div>
              </div>
            </div>
          )}

          {/* Right Side - Content */}
          <div className={`p-6 lg:p-8 flex flex-col justify-center ${!featuredImage ? 'lg:col-span-2' : ''}`}>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-accent-blue/10 text-accent-blue"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {title}
            </h1>

            {/* Meta Description or Excerpt */}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
              {metaDescription || excerpt}
            </p>

            {/* SEO Keywords - Compact Display */}
            {keywords.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium uppercase tracking-wide">SEO Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.slice(0, 4).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {keyword}
                    </span>
                  ))}
                  {keywords.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                      +{keywords.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* URL Slug - Compact */}
            {slug && (
              <div className="flex items-center gap-2 text-xs">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-gray-400 font-mono">yoursite.com/</span>
                <span className="text-accent-blue font-mono font-semibold">{slug}</span>
              </div>
            )}

            {/* Read Full Post Hint */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Full article ready for publication</span>
                <span className="flex items-center gap-1 text-accent-blue font-medium">
                  View Full Content
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Content Collapsible Section */}
      <details className="mt-4 group">
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
            <svg className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-sm font-medium text-gray-700">View Full Article Content</span>
          </div>
        </summary>
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="mb-4">{para}</p>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
};
