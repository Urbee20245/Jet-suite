import React, { useState } from 'react';
import type { Tool } from '../types';
import { ALL_TOOLS, SIDEBAR_STATIC_TOP_TOOLS, SIDEBAR_COLLAPSIBLE_CATEGORIES, SIDEBAR_STATIC_BOTTOM_TOOLS, ADMIN_SIDEBAR_TOOLS } from '../constants';
import { ChevronDownIcon, ArrowRightStartOnRectangleIcon, CheckCircleIcon } from '../components/icons/MiniIcons';

interface SidebarProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null, articleId?: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
  toolCompletionStatus: Record<string, boolean>;
}

const ToolButton: React.FC<{
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  isAdmin?: boolean;
  isComplete: boolean;
}> = ({ tool, isActive, onClick, isCollapsed, isAdmin = false, isComplete }) => {
  const isComingSoon = tool.isComingSoon;
  
  // --- UPDATED STYLES ---
  // 1. Active State: bg-accent-purple, text-white
  // 2. Hover State: hover:bg-brand-dark/50
  // 3. Inactive Text: text-gray-300
  // 5. Admin Styles: bg-red-600 (active), bg-red-500/10 (inactive)

  const inactiveUserStyles = 'text-gray-300 hover:bg-brand-dark/50 hover:text-white';
  const activeUserStyles = 'bg-accent-purple text-white';
  
  const adminStyles = isAdmin
    ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200'
    : inactiveUserStyles;
  
  const activeAdminStyles = isActive
    ? isAdmin
      ? 'bg-red-600 text-white'
      : activeUserStyles
    : adminStyles;
  
  const iconActiveColor = isActive
    ? 'text-white'
    : isAdmin
    ? 'text-red-400'
    : 'text-gray-400';
  // --- END UPDATED STYLES ---

  return (
    <button
      data-tour={tool.id === "business-details" ? "business-details" : tool.id === "jetbiz" ? "jetbiz" : tool.id === "jetviz" ? "jetviz" : tool.id === "growth-plan" ? "growth-plan" : tool.id === "ask-boris" ? "ask-boris" : undefined}
      key={tool.id}
      onClick={() => !isComingSoon && onClick()}
      disabled={isComingSoon}
      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 text-left relative ${
        isActive
          ? activeAdminStyles
          : isComingSoon
          ? 'opacity-60 cursor-not-allowed'
          : adminStyles
      } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
      title={isCollapsed ? tool.name : ''}
    >
      <tool.icon
        className={`w-6 h-6 flex-shrink-0 ${iconActiveColor}`}
      />
      {!isCollapsed && <span className="ml-4 font-medium">{tool.name}</span>}
      
      {/* NEW CHECKMARK INDICATOR */}
      {!isCollapsed && isComplete && (
          <CheckCircleIcon className="w-4 h-4 text-green-400 ml-auto" />
      )}
      
      {!isCollapsed && isComingSoon && !isComplete && ( // Ensure 'Soon' doesn't overlap checkmark
        <span className="ml-auto text-xs font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}
    </button>
  );
};

const CollapsibleCategory: React.FC<{
  category: { name: string; tools: string[] };
  activeTool: Tool | null;
  setActiveTool: (tool: Tool | null) => void;
  isSidebarCollapsed: boolean;
  toolCompletionStatus: Record<string, boolean>;
}> = ({ category, activeTool, setActiveTool, isSidebarCollapsed, toolCompletionStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (activeTool && category.tools.includes(activeTool.id)) {
      setIsOpen(true);
    }
  }, [activeTool, category.tools]);

  if (isSidebarCollapsed) {
    return (
      <div className="space-y-1 mt-1">
        {category.tools.map((toolId) => {
          const tool = ALL_TOOLS[toolId];
          if (!tool) return null;
          const isActive = activeTool?.id === tool.id;
          return (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={isActive}
              onClick={() => setActiveTool(tool)}
              isCollapsed={isSidebarCollapsed}
              isComplete={toolCompletionStatus[tool.id] || false}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        // 4. CATEGORY HEADER STYLING
        className="flex items-center justify-between w-full p-3 text-left text-xs font-semibold uppercase text-gray-400 tracking-wider hover:text-gray-200"
      >
        <span>{category.name}</span>
        <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
      </button>
      {isOpen && (
        <div className="space-y-1 mt-1">
          {category.tools.map((toolId) => {
            const tool = ALL_TOOLS[toolId];
            if (!tool) return null;
            const isActive = activeTool?.id === tool.id;
            return (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={isActive}
                onClick={() => setActiveTool(tool)}
                isCollapsed={isSidebarCollapsed}
                isComplete={toolCompletionStatus[tool.id] || false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  setActiveTool,
  isAdmin,
  onLogout,
  toolCompletionStatus
}) => {
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);

  // On screens larger than md, the sidebar is always expanded
  // On smaller screens, we use state to control it, but for now it's always collapsed
  const isCollapsed = typeof window !== 'undefined' && window.innerWidth < 768 ? isMobileCollapsed : false;

  return (
    <div className={`bg-brand-darker p-2 md:p-4 flex flex-col transition-all duration-300 overflow-y-auto w-20 md:w-64`}>

      {/* 🔥 BRANDING (LOGO + TEXT) */}
      <button
        onClick={() => setActiveTool(null)}
        className={`flex items-center mb-6 text-left focus:outline-none focus:ring-2 focus:ring-accent-purple rounded-lg p-1 justify-center md:justify-start`}
        aria-label="Go to Command Center"
      >
        <img
          src="/Jetsuitewing.png"
          alt="JetSuite"
          className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
          loading="eager"
        />
        <h1 className="hidden md:block ml-2 text-2xl font-bold text-gray-100">
            JetSuite
        </h1>
      </button>

      <nav className="flex flex-col flex-1 space-y-2">
        <div className="space-y-1">
          {SIDEBAR_STATIC_TOP_TOOLS.map((toolId) => {
            const tool = ALL_TOOLS[toolId];
            if (!tool) return null;
            const isActive =
              (activeTool === null && tool.id === 'home') ||
              activeTool?.id === tool.id;
            const onClick = () =>
              setActiveTool(tool.id === 'home' ? null : tool);
            return (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={isActive}
                onClick={onClick}
                isCollapsed={isCollapsed}
                isComplete={toolCompletionStatus[tool.id] || false}
              />
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-700">
          {SIDEBAR_COLLAPSIBLE_CATEGORIES.map((category) => (
            <CollapsibleCategory
              key={category.name}
              category={category}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              isSidebarCollapsed={isCollapsed}
              toolCompletionStatus={toolCompletionStatus}
            />
          ))}
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-700 space-y-1">
        {SIDEBAR_STATIC_BOTTOM_TOOLS.map((toolId) => {
          const tool = ALL_TOOLS[toolId];
          if (!tool) return null;
          const isActive = activeTool?.id === tool.id;
          return (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={isActive}
              onClick={() => setActiveTool(tool)}
              isCollapsed={isCollapsed}
              isComplete={toolCompletionStatus[tool.id] || false}
            />
          );
        })}

        {isAdmin && (
          <div className="pt-2 mt-2 border-t border-slate-700">
            {ADMIN_SIDEBAR_TOOLS.map((toolId) => {
              const tool = ALL_TOOLS[toolId];
              if (!tool) return null;
              const isActive = activeTool?.id === tool.id;
              return (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  isActive={isActive}
                  onClick={() => setActiveTool(tool)}
                  isCollapsed={isCollapsed}
                  isAdmin
                  isComplete={toolCompletionStatus[tool.id] || false}
                />
              );
            })}
          </div>
        )}

        <button
          onClick={onLogout}
          // 6. LOGOUT BUTTON STYLING
          className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 text-left text-gray-400 hover:bg-brand-dark/50 hover:text-white mt-2 justify-center md:justify-start`}
          title="Log Out"
        >
          <ArrowRightStartOnRectangleIcon className="w-6 h-6 flex-shrink-0 text-gray-400" />
          <span className="hidden md:inline ml-4 font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};