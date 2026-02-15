import React, { useState } from 'react';
import type { ProfileData } from '../../types';
import { BookOpenIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface ArticleFormData {
  title: string;
  articleType: string;
  depthLevel: 'comprehensive' | 'standard';
  mainSections: string[];
  includeExecutiveSummary: boolean;
  includeStatistics: boolean;
  includeExpertPerspectives: boolean;
  includeReferences: boolean;
  includeKeyTakeaways: boolean;
  targetPublication: string;
}

interface ArticleCreatorProps {
  profileData: ProfileData;
  onGenerate: (formData: ArticleFormData) => Promise<void>;
  onSaveDraft: (formData: ArticleFormData) => Promise<void>;
}

export const ArticleCreator: React.FC<ArticleCreatorProps> = ({ profileData, onGenerate, onSaveDraft }) => {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    articleType: '',
    depthLevel: 'comprehensive',
    mainSections: [''],
    includeExecutiveSummary: true,
    includeStatistics: true,
    includeExpertPerspectives: true,
    includeReferences: true,
    includeKeyTakeaways: true,
    targetPublication: 'website',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Please enter an article title');
      return;
    }

    if (!formData.articleType) {
      setError('Please select an article type');
      return;
    }

    const nonEmptySections = formData.mainSections.filter(s => s.trim());
    if (nonEmptySections.length === 0) {
      setError('Please add at least one main section');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onGenerate({ ...formData, mainSections: nonEmptySections });
    } catch (err: any) {
      setError(err.message || 'Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Article
            </h1>
            <p className="text-gray-600">
              Establish thought leadership with in-depth, authoritative content
            </p>
          </div>
          <button
            onClick={() => onSaveDraft(formData)}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">

          {/* Article Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Article Title / Topic *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., The Complete Guide to Healthcare Compliance for Small Practices"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2">
              Be specific and descriptive. The AI will refine this into a compelling headline.
            </p>
          </div>

          {/* Article Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Article Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'complete_guide', label: 'Complete Guide', icon: BookOpenIcon },
                { value: 'industry_analysis', label: 'Industry Analysis', icon: ChartBarIcon },
                { value: 'case_study', label: 'Case Study', icon: LightBulbIcon },
                { value: 'research_report', label: 'Research Report', icon: ChartBarIcon },
                { value: 'trend_forecast', label: 'Trend Forecast', icon: LightBulbIcon },
                { value: 'best_practices', label: 'Best Practices', icon: BookOpenIcon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, articleType: value })}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.articleType === value
                      ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Depth Level */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Content Depth
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200">
                <input
                  type="radio"
                  name="depthLevel"
                  value="comprehensive"
                  checked={formData.depthLevel === 'comprehensive'}
                  onChange={(e) => setFormData({ ...formData, depthLevel: e.target.value as 'comprehensive' })}
                  className="mt-1 w-4 h-4 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <div className="font-medium text-gray-900">Comprehensive</div>
                  <div className="text-sm text-gray-600">
                    2,500-3,000 words • Deep analysis • Multiple perspectives • Extensive research
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200">
                <input
                  type="radio"
                  name="depthLevel"
                  value="standard"
                  checked={formData.depthLevel === 'standard'}
                  onChange={(e) => setFormData({ ...formData, depthLevel: e.target.value as 'standard' })}
                  className="mt-1 w-4 h-4 text-accent-blue focus:ring-accent-blue"
                />
                <div>
                  <div className="font-medium text-gray-900">Standard</div>
                  <div className="text-sm text-gray-600">
                    1,500-2,000 words • Focused analysis • Key insights • Solid research
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Main Sections */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Main Sections
            </label>
            <p className="text-sm text-gray-600 mb-4">
              List the key sections your article should cover. The AI will expand these into comprehensive content.
            </p>
            <div className="space-y-3">
              {formData.mainSections.map((section, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => {
                      const newSections = [...formData.mainSections];
                      newSections[index] = e.target.value;
                      setFormData({ ...formData, mainSections: newSections });
                    }}
                    placeholder={`Section ${index + 1}: e.g., Current Industry Landscape`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200"
                  />
                  {formData.mainSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = formData.mainSections.filter((_, i) => i !== index);
                        setFormData({ ...formData, mainSections: newSections });
                      }}
                      className="px-3 py-2 text-gray-500 hover:text-red-600 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mainSections: [...formData.mainSections, ''] })}
                className="text-sm text-accent-blue font-medium hover:underline"
              >
                + Add Section
              </button>
            </div>
          </div>

          {/* Include Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Include in Article
            </label>
            <div className="space-y-3">
              {[
                { key: 'includeExecutiveSummary', label: 'Executive Summary', desc: '200-word overview of key findings' },
                { key: 'includeStatistics', label: 'Statistics & Data', desc: 'Relevant industry data and metrics' },
                { key: 'includeExpertPerspectives', label: 'Expert Perspectives', desc: 'Multiple viewpoints and insights' },
                { key: 'includeReferences', label: 'References / Citations', desc: 'Formatted source citations' },
                { key: 'includeKeyTakeaways', label: 'Key Takeaways Box', desc: 'Bulleted summary of main points' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof ArticleFormData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="mt-1 w-4 h-4 text-accent-blue focus:ring-accent-blue rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Target Publication */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Target Publication
            </label>
            <select
              value={formData.targetPublication}
              onChange={(e) => setFormData({ ...formData, targetPublication: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="website">Your Website</option>
              <option value="linkedin">LinkedIn Article</option>
              <option value="medium">Medium</option>
              <option value="industry">Industry Publication</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              This helps optimize the content for your chosen platform
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">AI will generate:</span> Comprehensive {formData.depthLevel} article with {formData.mainSections.filter(s => s.trim()).length} main sections
            </div>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.articleType}
              className="px-8 py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Generating Article...' : 'Generate Article with AI'}
            </button>
          </div>

        </div>
      </form>

    </div>
  );
};
