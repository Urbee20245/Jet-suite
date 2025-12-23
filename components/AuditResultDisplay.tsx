
import React from 'react';
import type { AuditReport, AuditIssue, GrowthPlanTask } from '../types';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  ArrowPathIcon 
} from './icons/MiniIcons';

const priorityStyles = {
  High: {
    icon: ExclamationTriangleIcon,
    badge: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-500',
  },
  Medium: {
    icon: ExclamationTriangleIcon,
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-500',
  },
  Low: {
    icon: InformationCircleIcon,
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-500',
  },
};

const TaskCard: React.FC<{ task: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>, isWeeklyAction?: boolean }> = ({ task, isWeeklyAction = false }) => (
  <div className={`flex items-start p-4 rounded-lg border ${isWeeklyAction ? 'bg-white shadow glow-card glow-card-rounded-lg' : 'bg-brand-light'}`}>
    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
    <div className="ml-4">
      <h4 className="font-bold text-brand-text">{task.title}</h4>
      <p className="text-sm text-brand-text-muted mt-1">{task.description}</p>
      <div className="mt-2 flex items-center space-x-4 text-xs text-brand-text-muted font-medium">
        <span>Effort: <span className="font-bold text-brand-text">{task.effort}</span></span>
        <span>Source: <span className="font-bold text-brand-text">{task.sourceModule}</span></span>
      </div>
    </div>
  </div>
);

const IssueCard: React.FC<{ issue: AuditIssue }> = ({ issue }) => {
  const styles = priorityStyles[issue.priority];
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-brand-border glow-card glow-card-rounded-xl">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start">
          <styles.icon className={`w-6 h-6 ${styles.iconColor} flex-shrink-0`} />
          <h3 className="ml-3 text-lg font-bold text-brand-text leading-tight">{issue.issue}</h3>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles.badge}`}>{issue.priority}</span>
      </div>
      
      <div className="ml-9">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-brand-text-muted mb-1">Why This Matters</h4>
          <p className="text-sm text-brand-text">{issue.whyItMatters}</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-brand-text-muted mb-1">Exact Fix Instructions</h4>
          <p className="text-sm text-brand-text whitespace-pre-wrap">{issue.fix}</p>
        </div>
        
        <div className="bg-brand-light p-3 rounded-md border border-brand-border">
          <h4 className="text-sm font-semibold text-brand-text mb-1">Growth Plan Task</h4>
          <p className="text-sm text-brand-text-muted">{issue.task.title} (Effort: {issue.task.effort})</p>
        </div>
      </div>
    </div>
  );
};

interface AuditResultDisplayProps {
  report: AuditReport;
  onRerun: (e: React.FormEvent) => Promise<void>;
  isRunning: boolean;
}

export const AuditResultDisplay: React.FC<AuditResultDisplayProps> = ({ report, onRerun, isRunning }) => {
  return (
    <div className="space-y-8 mt-6">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-2xl font-extrabold text-brand-text">What You Should Do This Week</h2>
                <p className="text-brand-text-muted mt-1">Focus on these high-impact tasks to see the fastest results.</p>
            </div>
            <button
              onClick={onRerun}
              disabled={isRunning}
              className="flex items-center bg-white hover:bg-brand-light border border-brand-border text-brand-text font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Re-running...' : 'Re-run Analysis'}
            </button>
        </div>
        <div className="space-y-4">
          {report.weeklyActions.map((task, index) => (
            <TaskCard key={index} task={task} isWeeklyAction />
          ))}
        </div>
        <p className="text-xs text-brand-text-muted mt-4 text-right">
            Analysis run on: {new Date(report.timestamp).toLocaleString()}
        </p>
      </div>

      <div>
        <h3 className="text-xl font-bold text-brand-text mb-4">Full List of Issues Identified</h3>
        <div className="space-y-4">
          {report.issues.map((issue, index) => (
            <IssueCard key={index} issue={issue} />
          ))}
        </div>
      </div>
    </div>
  );
};
