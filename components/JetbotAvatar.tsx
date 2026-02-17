import React from 'react';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

/**
 * JetbotAvatar — Digitized SVG illustration of the Jetbot mascot.
 * Used as Boris AI's visual identity across the app.
 *
 * Design: Friendly robot with rounded head, cyan glowing eyes,
 * antenna, chest panel with LED indicators, and arm stubs.
 * Colors match the JetSuite indigo/purple brand with cyan accents.
 */
export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  // Unique IDs to avoid SVG gradient ID collisions when rendered multiple times on the same page
  const uid = React.useId().replace(/:/g, '');
  const headGradId = `jb-head-${uid}`;
  const bodyGradId = `jb-body-${uid}`;
  const eyeGlowId = `jb-eye-${uid}`;
  const glowFilterId = `jb-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jetbot AI mascot"
      role="img"
    >
      <defs>
        {/* Head gradient: bright indigo top → deeper indigo bottom */}
        <linearGradient id={headGradId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Body gradient: indigo → deep indigo-navy */}
        <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>

        {/* Cyan eye glow */}
        <radialGradient id={eyeGlowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="60%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>

        {/* Soft glow filter for antenna ball and LED dots */}
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── ANTENNA ── */}
      {/* Stem */}
      <line x1="50" y1="7" x2="50" y2="20" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ball glow halo */}
      <circle cx="50" cy="5" r="6" fill="#22d3ee" opacity="0.3" />
      {/* Ball */}
      <circle cx="50" cy="5" r="4" fill="#22d3ee" filter={`url(#${glowFilterId})`} />
      {/* Ball inner shine */}
      <circle cx="51.5" cy="3.5" r="1.5" fill="white" opacity="0.8" />

      {/* ── EAR PANELS ── */}
      <rect x="8" y="29" width="11" height="24" rx="5.5" fill="#4338ca" />
      <rect x="81" y="29" width="11" height="24" rx="5.5" fill="#4338ca" />
      {/* Ear detail lines */}
      <line x1="12" y1="35" x2="12" y2="47" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="89" y1="35" x2="89" y2="47" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* ── HEAD ── */}
      <rect x="19" y="18" width="62" height="52" rx="14" fill={`url(#${headGradId})`} />
      {/* Top highlight sheen */}
      <rect x="25" y="20" width="50" height="9" rx="6" fill="white" opacity="0.10" />
      {/* Bottom inner shadow */}
      <rect x="19" y="58" width="62" height="12" rx="0" fill="#312e81" opacity="0.25" />
      <rect x="19" y="58" width="62" height="12" rx="0" fill="transparent"
        clipPath={`inset(0 0 0 0 round 0 0 14px 14px)`} />

      {/* ── LEFT EYE ── */}
      {/* Eye socket shadow */}
      <circle cx="36" cy="40" r="13" fill="#312e81" opacity="0.35" />
      {/* Eye white */}
      <circle cx="36" cy="40" r="11" fill="white" />
      {/* Iris glow */}
      <circle cx="36" cy="40" r="7.5" fill={`url(#${eyeGlowId})`} filter={`url(#${glowFilterId})`} />
      {/* Pupil */}
      <circle cx="36" cy="40" r="4" fill="#0e7490" />
      {/* Pupil center dot */}
      <circle cx="36" cy="40" r="1.8" fill="#164e63" />
      {/* Shine */}
      <circle cx="39.5" cy="36.5" r="2.5" fill="white" opacity="0.95" />
      <circle cx="37.5" cy="43" r="1" fill="white" opacity="0.4" />

      {/* ── RIGHT EYE ── */}
      {/* Eye socket shadow */}
      <circle cx="64" cy="40" r="13" fill="#312e81" opacity="0.35" />
      {/* Eye white */}
      <circle cx="64" cy="40" r="11" fill="white" />
      {/* Iris glow */}
      <circle cx="64" cy="40" r="7.5" fill={`url(#${eyeGlowId})`} filter={`url(#${glowFilterId})`} />
      {/* Pupil */}
      <circle cx="64" cy="40" r="4" fill="#0e7490" />
      {/* Pupil center dot */}
      <circle cx="64" cy="40" r="1.8" fill="#164e63" />
      {/* Shine */}
      <circle cx="67.5" cy="36.5" r="2.5" fill="white" opacity="0.95" />
      <circle cx="65.5" cy="43" r="1" fill="white" opacity="0.4" />

      {/* ── MOUTH ── */}
      {/* Mouth recess */}
      <rect x="32" y="54" width="36" height="11" rx="5.5" fill="#312e81" opacity="0.4" />
      {/* Smile arc */}
      <path
        d="M35 57 Q50 67 65 57"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Teeth hint */}
      <path
        d="M40 57.5 Q50 61 60 57.5"
        stroke="white"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* ── NECK ── */}
      <rect x="39" y="70" width="22" height="9" rx="4.5" fill="#3730a3" />
      {/* Neck bolts */}
      <circle cx="44" cy="74.5" r="2" fill="#4f46e5" />
      <circle cx="56" cy="74.5" r="2" fill="#4f46e5" />

      {/* ── BODY ── */}
      <rect x="11" y="77" width="78" height="43" rx="17" fill={`url(#${bodyGradId})`} />
      {/* Body top highlight */}
      <rect x="17" y="79" width="66" height="9" rx="6" fill="white" opacity="0.07" />

      {/* Chest panel background */}
      <rect x="27" y="87" width="46" height="26" rx="9" fill="white" opacity="0.10" />
      {/* Chest panel border */}
      <rect x="27.5" y="87.5" width="45" height="25" rx="8.5" stroke="white" strokeOpacity="0.22" strokeWidth="1" fill="none" />

      {/* Chest panel inner grid lines */}
      <line x1="50" y1="89" x2="50" y2="111" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="29" y1="100" x2="71" y2="100" stroke="white" strokeOpacity="0.08" strokeWidth="1" />

      {/* LED indicator dots */}
      {/* Left cyan */}
      <circle cx="39" cy="100" r="4.5" fill="#22d3ee" opacity="0.25" />
      <circle cx="39" cy="100" r="3.5" fill="#22d3ee" filter={`url(#${glowFilterId})`} />
      <circle cx="39" cy="100" r="1.5" fill="white" opacity="0.7" />
      {/* Center purple */}
      <circle cx="50" cy="100" r="4.5" fill="#a855f7" opacity="0.25" />
      <circle cx="50" cy="100" r="3.5" fill="#c084fc" filter={`url(#${glowFilterId})`} />
      <circle cx="50" cy="100" r="1.5" fill="white" opacity="0.7" />
      {/* Right cyan */}
      <circle cx="61" cy="100" r="4.5" fill="#22d3ee" opacity="0.25" />
      <circle cx="61" cy="100" r="3.5" fill="#22d3ee" filter={`url(#${glowFilterId})`} />
      <circle cx="61" cy="100" r="1.5" fill="white" opacity="0.7" />

      {/* ── ARMS ── */}
      {/* Left arm */}
      <rect x="-1" y="80" width="13" height="34" rx="6.5" fill="#3730a3" />
      <rect x="1" y="83" width="9" height="4" rx="2" fill="#4f46e5" opacity="0.6" />
      {/* Right arm */}
      <rect x="88" y="80" width="13" height="34" rx="6.5" fill="#3730a3" />
      <rect x="90" y="83" width="9" height="4" rx="2" fill="#4f46e5" opacity="0.6" />
    </svg>
  );
};
