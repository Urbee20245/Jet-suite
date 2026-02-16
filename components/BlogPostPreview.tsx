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
  const firstParagraph = paragraphs[0] || '';
  const remainingContent = paragraphs.slice(1, 3).join('\n\n');

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Preview Header */}
      <div className="mb-6 pb-4 border-b border-brand-border/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-text">Blog Post Preview</h3>
          <span className="text-xs font-medium text-brand-text-muted bg-brand-light px-3 py-1.5 rounded-full">
            Live Preview
          </span>
        </div>
        <p className="text-sm text-brand-text-muted mt-2">
          This is how your blog post will appear to readers
        </p>
      </div>

      {/* Main Preview Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">

        {/* Featured Image - Full width but reasonable height */}
        {featuredImage && (
          <div className="relative w-full h-64 sm:h-80 bg-gray-100">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Content Section */}
        <div className="p-8 sm:p-10 lg:p-12">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 text-accent-blue border border-accent-blue/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            {title}
          </h1>

          {/* Meta Description */}
          {metaDescription && (
            <p className="text-lg text-gray-600 mb-6 leading-relaxed font-medium">
              {metaDescription}
            </p>
          )}

          {/* Divider */}
          <div className="w-16 h-1 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full mb-8" />

          {/* Content Preview */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-800 leading-relaxed mb-6 text-base sm:text-lg">
              {firstParagraph}
            </p>
            {remainingContent && (
              <div className="text-gray-700 leading-relaxed space-y-4 text-base">
                {remainingContent.split('\n\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            )}
          </div>

          {/* Read More Indicator */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">
              Preview showing first 3 paragraphs. Full content will be published.
            </p>
          </div>
        </div>

        {/* SEO Footer */}
        {(keywords.length > 0 || slug) && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-t border-gray-200/80 px-8 sm:px-10 lg:px-12 py-6">
            <div className="space-y-4">
              {/* SEO Keywords */}
              {keywords.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    SEO Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-gray-200 shadow-sm"
                      >
                        <svg className="w-3 h-3 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* URL Slug */}
              {slug && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Published URL
                  </label>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
                    <p className="text-sm font-mono text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-gray-400">yoursite.com/blog/</span>
                      <span className="text-accent-blue font-semibold">{slug}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
