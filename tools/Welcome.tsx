// In tools/Welcome.tsx, replace the QuickStatsCards section with:

{/* Simplified Stats Header - Just 3 stats */}
<div className="flex justify-center gap-6 mb-6">
  {/* Growth Score */}
  <div className="bg-brand-card rounded-xl p-4 border border-brand-border shadow-md min-w-[140px]">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-accent-purple/10 rounded-lg flex items-center justify-center">
        <SparklesIcon className="w-4 h-4 text-accent-purple" />
      </div>
      <span className="text-xs text-brand-text-muted">Growth Score</span>
    </div>
    <div className="text-3xl font-bold text-brand-text">{growthScore}</div>
    <div className="text-xs text-accent-purple mt-1">Building Momentum</div>
  </div>

  {/* Pending Tasks */}
  <div className="bg-brand-card rounded-xl p-4 border border-brand-border shadow-md min-w-[140px]">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-accent-pink/10 rounded-lg flex items-center justify-center">
        <CheckCircleIcon className="w-4 h-4 text-accent-pink" />
      </div>
      <span className="text-xs text-brand-text-muted">Pending Tasks</span>
    </div>
    <div className="text-3xl font-bold text-brand-text">{pendingTasksCount}</div>
    <div className="text-xs text-brand-text-muted mt-1">Tasks to complete</div>
  </div>

  {/* GBP Reviews */}
  <div className="bg-brand-card rounded-xl p-4 border border-brand-border shadow-md min-w-[140px]">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 bg-accent-blue/10 rounded-lg flex items-center justify-center">
        <StarIcon className="w-4 h-4 text-accent-blue" />
      </div>
      <span className="text-xs text-brand-text-muted">GBP Rating</span>
    </div>
    <div className="text-3xl font-bold text-brand-text">
      {profileData.googleBusiness?.rating || '0.0'} ★
    </div>
    <div className="text-xs text-brand-text-muted mt-1">
      {profileData.googleBusiness?.totalReviews || 0} Reviews
    </div>
  </div>
</div>