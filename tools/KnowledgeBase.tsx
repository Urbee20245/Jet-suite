import React, { useState, useEffect } from 'react';
import type { Tool } from '../types';
import { ALL_TOOLS } from '../constants';
import { KNOWLEDGE_BASE_ARTICLES, KbArticle } from '../constants/knowledgeBase';
import { ChevronDownIcon } from '../components/icons/MiniIcons';

// --- KB Navigation Data ---
const KB_SECTIONS = [
  {
    name: 'Getting Started',
    articles: [
      { id: 'getting-started/how-jetsuite-works', title: 'How JetSuite Works' },
      { id: 'getting-started/why-order-matters', title: 'Why Order Matters' },
      { id: 'getting-started/setup-profile', title: 'Setting Up Your Profile' },
      { id: 'getting-started/growth-score', title: 'Your Growth Score' },
    ],
  },
  {
    name: 'Build Your Foundation',
    articles: [
      { id: 'foundation/jetbiz', title: 'JetBiz: Google Business' },
      { id: 'foundation/jetviz', title: 'JetViz: Website Audit' },
      { id: 'foundation/jetkeywords', title: 'JetKeywords: Research' },
      { id: 'foundation/jetcompete', title: 'JetCompete: Competitors' },
    ],
  },
  {
    name: 'Create & Publish',
    articles: [
      { id: 'create-publish/jetcreate', title: 'JetCreate: Campaigns' },
      { id: 'create-publish/jetsocial', title: 'JetSocial: Social Media' },
      { id: 'create-publish/jetcontent', title: 'JetContent: Blog Posts' },
      { id: 'create-publish/jetimage', title: 'JetImage: Visuals' },
    ],
  },
  {
    name: 'Engage & Convert',
    articles: [
      { id: 'engage-convert/jetreply', title: 'JetReply: Reviews' },
      { id: 'engage-convert/jettrust', title: 'JetTrust: Widgets' },
      { id: 'engage-convert/jetleads', title: 'JetLeads: Discovery' },
      { id: 'engage-convert/jetevents', title: 'JetEvents: Promotions' },
      { id: 'engage-convert/jetads', title: 'JetAds: Ad Copy' },
    ],
  },
  {
    name: 'Growth Control',
    articles: [
      { id: 'growth-control/growthplan', title: 'Growth Plan: Action List' },
    ],
  },
];

// --- Simple Markdown Renderer ---
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const elements = text.split('\n').map((line, index) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <h4 key={index} className="text-md font-bold mt-4 mb-1 text-brand-text">{line.substring(2, line.length - 2)}</h4>;
    }
    if (line.trim() === '') return <br key={index} />;
    return <p key={index} className="mb-2">{line}</p>;
  });
  return <>{elements}</>;
};

// --- Article Component ---
const ArticleView: React.FC<{ article: KbArticle; setActiveTool: (tool: Tool | null, articleId?: string) => void; }> = ({ article, setActiveTool }) => (
  <div className="prose max-w-none text-brand-text-muted">
    <h2 className="text-3xl font-extrabold text-brand-text !mb-4">{article.title}</h2>
    <div className="space-y-6">
        <div><SimpleMarkdown text={`**What This Is**\n${article.what}`} /></div>
        <div><SimpleMarkdown text={`**Why This Matters**\n${article.why}`} /></div>
        <div><SimpleMarkdown text={`**When to Do This**\n${article.when}`} /></div>
        <div><SimpleMarkdown text={`**What Happens If You Skip It**\n${article.skip}`} /></div>
        <div><SimpleMarkdown text={`**How JetSuite Helps**\n${article.how}`} /></div>
    </div>
    {article.next && (
      <div className="mt-8 pt-6 border-t border-brand-border">
        <h4 className="font-semibold text-brand-text">Next Recommended Step:</h4>
        <button
          onClick={() => setActiveTool(ALL_TOOLS['knowledgebase'], article.next!.articleId)}
          className="text-accent-blue font-bold hover:underline"
        >
          {article.next.text} &rarr;
        </button>
      </div>
    )}
  </div>
);


// --- Main KnowledgeBase Component ---
interface KnowledgeBaseProps {
  initialArticleId?: string | null;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ initialArticleId, setActiveTool }) => {
  const [activeArticleId, setActiveArticleId] = useState(initialArticleId || 'getting-started/how-jetsuite-works');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if(initialArticleId) {
        setActiveArticleId(initialArticleId);
    }
  }, [initialArticleId]);

  const activeArticle = KNOWLEDGE_BASE_ARTICLES[activeArticleId] || KNOWLEDGE_BASE_ARTICLES['getting-started/how-jetsuite-works'];
  
  const filteredArticles = searchTerm
    ? Object.entries(KNOWLEDGE_BASE_ARTICLES)
        .filter(([id, article]) => 
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.what.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.why.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(([id, article]) => ({ id, title: article.title }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-brand-text">JetSuite Knowledge Base</h1>
        <p className="text-lg text-brand-text-muted mt-1">Learn how to grow your business — step by step.</p>
      </div>

      <div className="relative">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search topics, tools, or growth steps…"
          className="w-full p-4 pl-10 text-lg border-2 border-brand-border rounded-xl focus:ring-2 focus:ring-accent-purple focus:border-transparent"
        />
        {searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {filteredArticles.length > 0 ? (
                filteredArticles.map(({id, title}) => (
                    <button
                        key={id}
                        onClick={() => {
                            setActiveArticleId(id);
                            setSearchTerm('');
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-brand-light"
                    >
                        {title}
                    </button>
                ))
            ) : (
                <p className="px-4 py-2 text-brand-text-muted">No results found.</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Navigation */}
        <aside className="md:col-span-1">
          <nav className="space-y-4">
            {KB_SECTIONS.map(section => (
              <div key={section.name}>
                <h3 className="font-bold text-brand-text mb-2">{section.name}</h3>
                <ul className="space-y-1">
                  {section.articles.map(article => (
                    <li key={article.id}>
                      <button
                        onClick={() => setActiveArticleId(article.id)}
                        className={`w-full text-left text-sm py-1 px-2 rounded-md transition-colors ${activeArticleId === article.id ? 'bg-accent-purple/10 text-accent-purple font-semibold' : 'text-brand-text-muted hover:bg-brand-light'}`}
                      >
                        {article.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-3 bg-brand-card p-8 rounded-2xl shadow-lg">
          <ArticleView article={activeArticle} setActiveTool={setActiveTool} />
        </main>
      </div>
    </div>
  );
};