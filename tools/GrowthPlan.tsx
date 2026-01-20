import React, { useMemo, useState, useEffect } from 'react';
import type { GrowthPlanTask, Tool } from '../types';
import { ALL_TOOLS } from '../constants';
import { TrashIcon, CheckCircleIcon, ArrowDownTrayIcon, ChevronDownIcon, InformationCircleIcon, ArrowPathIcon } from '../components/icons/MiniIcons';
import { GrowthPlanIcon } from '../components/icons/ToolIcons';
import { syncToSupabase, loadFromSupabase } from '../utils/syncService';

interface GrowthPlanProps {
  tasks: GrowthPlanTask[];
  setTasks: (tasks: GrowthPlanTask[]) => void;
  setActiveTool: (tool: Tool | null) => void;
  onTaskStatusChange: (taskId: string, newStatus: GrowthPlanTask['status']) => void;
  growthScore: number;
  userId: string;
  activeBusinessId: string | null;
  onPlanSaved?: (tasks: GrowthPlanTask[]) => void; // New prop
}

const statusStyles: { [key in GrowthPlanTask['status']]: { badge: string; text: string } } = {
  to_do: { badge: 'bg-red-100 text-red-800', text: 'To Do' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
  completed: { badge: 'bg-green-100 text-green-800', text: 'Completed' },
};

const PendingTaskCard: React.FC<{ task: GrowthPlanTask; onStatusChange: (id: string, status: GrowthPlanTask['status']) => void; onRemove: (id: string) => void; }> = ({ task, onStatusChange, onRemove }) => {
  
  const handleMarkComplete = () => {
    onStatusChange(task.id, 'completed');
  };

  return (
    <div className="p-5 rounded-xl shadow-md border bg-white border-brand-border hover:border-accent-purple/50 glow-card glow-card-rounded-xl">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-brand-text pr-4">{task.title}</h3>
            <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                    <select 
                        value={task.status} 
                        onChange={(e) => onStatusChange(task.id, e.target.value as GrowthPlanTask['status'])} 
                        className={`text-xs font-semibold rounded-full border-none appearance-none cursor-pointer py-1 pl-2 pr-7 ${statusStyles[task.status].badge}`}
                    >
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button 
                  onClick={() => onRemove(task.id)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete Task"
                >
                  <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" />
                </button>
            </div>
        </div>
      
        <div className="mt-4 space-y-3">
            <div>
                <h4 className="text-sm font-semibold text-brand-text-muted mb-1 flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1"/>Why this matters</h4>
                <p className="text-brand-text">{task.whyItMatters}</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">How to do it</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{task.description}</p>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-brand-border flex justify-between items-center text-xs text-brand-text-muted">
            <div>
                <span>Effort: <span className="font-bold text-brand-text">{task.effort}</span></span>
                <span className="mx-2">|</span>
                <span>Source: <span className="font-bold text-brand-text">{task.sourceModule}</span></span>
            </div>
            <button onClick={handleMarkComplete} className="bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Mark Complete ✓</button>
        </div>
    </div>
  );
};

const CompletedTaskCard: React.FC<{ task: GrowthPlanTask; onStatusChange: (id: string, status: GrowthPlanTask['status']) => void; onRemove: (id: string) => void; }> = ({ task, onStatusChange, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDelete = () => {
      if (window.confirm("Warning: This will permanently delete this completed task. Are you sure?")) {
        onRemove(task.id);
      }
    };

    return (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600"/>
                    <span className="ml-3 text-brand-text-muted line-through">{task.title}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-brand-text-muted hidden sm:inline">Completed: {task.completionDate ? new Date(task.completionDate).toLocaleDateString() : 'N/A'}</span>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-accent-purple hover:underline">{isExpanded ? 'Collapse' : 'Expand'}</button>
                    <button onClick={() => onStatusChange(task.id, 'to_do')} className="text-xs font-semibold text-brand-text-muted hover:underline">Mark Incomplete</button>
                    <button onClick={handleDelete} title="Permanently Delete">
                      <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-green-200 space-y-3">
                     <div>
                        <h4 className="text-sm font-semibold text-brand-text-muted mb-1">Why this matters</h4>
                        <p className="text-sm text-brand-text">{task.whyItMatters}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-brand-text-muted mb-1">How to do it</h4>
                        <p className="text-sm text-brand-text whitespace-pre-wrap">{task.description}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export const GrowthPlan: React.FC<GrowthPlanProps> = ({ tasks, setTasks, setActiveTool, onTaskStatusChange, growthScore, userId, activeBusinessId, onPlanSaved }) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);
  
  const completionPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setStatusMessage('Task removed from list. Click Save Plan to finalize.');
  };

  const handleClearCompleted = () => {
    if (window.confirm('Warning: This will permanently remove all completed tasks from your history. Are you sure?')) {
      setTasks(tasks.filter(t => t.status !== 'completed'));
      setStatusMessage('Completed tasks cleared. Click Save Plan to finalize.');
    }
  };
  
  const handleManualSave = async () => {
    if (!userId || !activeBusinessId) {
        setStatusMessage('Error: Cannot save without active user or business ID.');
        return;
    }
    
    setIsSaving(true);
    setStatusMessage('Saving all tasks...');
    
    try {
        await syncToSupabase(userId, activeBusinessId, 'tasks', tasks);
        setStatusMessage('✅ Growth Plan saved successfully!');
        if (onPlanSaved) onPlanSaved(tasks); // Trigger update for Home page
    } catch (error) {
        setStatusMessage('❌ Failed to save plan. Please try again.');
        console.error('Manual save failed:', error);
    } finally {
        setIsSaving(false);
        setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleRetrieveTasks = async () => {
    if (!userId || !activeBusinessId) return;

    setIsRetrieving(true);
    setStatusMessage('Retrieving tasks from database...');

    try {
      const data = await loadFromSupabase(userId, activeBusinessId, 'tasks');
      if (data && Array.isArray(data)) {
        setTasks(data);
        setStatusMessage('✅ Successfully retrieved your tasks.');
        if (onPlanSaved) onPlanSaved(data); // Sync home count with retrieved data
      } else {
        setStatusMessage('ℹ️ No saved tasks found in database.');
      }
    } catch (error) {
      setStatusMessage('❌ Failed to retrieve tasks.');
      console.error('Retrieve failed:', error);
    } finally {
      setIsRetrieving(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div>
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-3xl font-extrabold text-brand-text">Your Growth Plan</h2>
                        <p className="text-brand-text-muted mt-2 leading-relaxed">
                            Your prioritized action items for business growth. <strong className="text-accent-purple">Complete these steps in order.</strong>
                        </p>
                    </div>
                    <div className="text-right ml-4">
                        <span className="text-sm font-semibold text-brand-text-muted">Growth Score</span>
                        <div className="text-4xl font-bold text-accent-purple">{growthScore}</div>
                    </div>
                </div>
            </div>

            <div className="bg-brand-light/50 p-5 rounded-xl border border-brand-border flex flex-col gap-3">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-brand-text mb-2">Step 1: Save plan changes</h4>
                    <button
                        onClick={handleManualSave}
                        disabled={isSaving || isRetrieving}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Saving...' : '💾 Save Plan Changes'}
                    </button>
                  </div>
                  
                  <button
                      onClick={handleRetrieveTasks}
                      disabled={isSaving || isRetrieving}
                      className="w-full text-accent-purple hover:text-accent-pink font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                      {isRetrieving ? 'Retrieving...' : <><ArrowPathIcon className="w-4 h-4" /> Retrieve Pending & Completed Tasks</>}
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-brand-border">
                    <InformationCircleIcon className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-text-muted leading-snug">
                        {statusMessage || 'Save your changes to persist them across sessions. Click retrieve to sync with the database.'}
                    </p>
                </div>
            </div>
        </div>

        {tasks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-brand-border">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-brand-text">Overall Progress</span>
                    <span className="text-sm font-bold text-accent-purple">{completedTasks.length} of {tasks.length} tasks complete</span>
                </div>
                <div className="w-full bg-brand-light rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-accent-blue to-accent-purple h-2.5 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                </div>
            </div>
        )}
      </div>
      
      {tasks.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-brand-text mb-4">Pending Tasks ({pendingTasks.length})</h3>
          <p className="text-sm text-brand-text-muted mb-4">
            These tasks will remain here until you mark them as completed.
          </p>
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              {pendingTasks.map(task => <PendingTaskCard key={task.id} task={task} onStatusChange={onTaskStatusChange} onRemove={handleRemoveTask} /> )}
            </div>
          ) : (
             <div className="text-center bg-brand-card p-12 rounded-xl shadow-lg border-2 border-dashed border-green-400">
                <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                <h3 className="text-xl font-bold text-brand-text mt-4">All tasks complete!</h3>
                <p className="text-brand-text-muted mt-2">Run a new analysis to generate more tasks.</p>
            </div>
          )}

          <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-brand-text">Completed Tasks ({completedTasks.length})</h3>
                <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm cursor-pointer"><input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} className="h-4 w-4 rounded mr-2"/> Show</label>
                    {completedTasks.length > 0 && <button onClick={handleClearCompleted} className="text-xs font-semibold text-red-500 hover:underline">Clear All</button>}
                </div>
            </div>
            {showCompleted && completedTasks.length > 0 && (
                <div className="space-y-3">
                    {completedTasks.map(task => <CompletedTaskCard key={task.id} task={task} onStatusChange={onTaskStatusChange} onRemove={handleRemoveTask} /> )}
                </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center bg-brand-card p-12 rounded-xl shadow-lg border-2 border-dashed border-brand-border">
          <div className="max-w-md mx-auto">
            <GrowthPlanIcon className="w-16 h-16 mx-auto text-brand-text-muted opacity-50" />
            <h3 className="text-xl font-bold text-brand-text mt-4">Your Growth Plan is Empty</h3>
            <p className="text-brand-text-muted mt-2 mb-6">Run an analysis from a tool like JetBiz or JetViz to automatically generate your prioritized action plan.</p>
            <button onClick={() => setActiveTool(ALL_TOOLS['jetbiz'])} className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-8 rounded-lg">Start an Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
};