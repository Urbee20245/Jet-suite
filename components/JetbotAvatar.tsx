import React from 'react';

interface JetbotAvatarProps {
  size?: number;
  className?: string;
}

/**
 * JetbotAvatar — SVG illustration of the Jetbot mascot.
 * Clean flat mascot style: white/light body, dark lens eyes with
 * cyan glow centers, indigo accents — matches the original Jetbot images.
 */
export const JetbotAvatar: React.FC<JetbotAvatarProps> = ({ size = 40, className = '' }) => {
  const uid = React.useId().replace(/:/g, '');
  const bodyGradId  = `jb-bg-${uid}`;
  const eyeGradId   = `jb-eye-${uid}`;
  const glowId      = `jb-glow-${uid}`;
  const chestGradId = `jb-chest-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Jetbot mascot"
      role="img"
    >
      <defs>
        {/* Very light blue body fill — matches the white/light Jetbot in images */}
        <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>

        {/* Cyan radial glow for eye centers */}
        <radialGradient id={eyeGradId} cx="40%" cy="38%" r="55%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="35%"  stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>

        {/* Chest accent gradient */}
        <linearGradient id={chestGradId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Soft glow blur for eye & antenna */}
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── ANTENNA ── */}
      <line x1="50" y1="5" x2="50" y2="17" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
      {/* Glow halo */}
      <circle cx="50" cy="4" r="5.5" fill="#22d3ee" opacity="0.25" />
      {/* Ball */}
      <circle cx="50" cy="4" r="4"   fill="#22d3ee" filter={`url(#${glowId})`} />
      {/* Inner shine */}
      <circle cx="51.5" cy="2.5" r="1.5" fill="white" opacity="0.85" />

      {/* ── EAR / SIDE NUBS ── */}
      <rect x="7"  y="31" width="9" height="22" rx="4.5" fill="#6366f1" />
      <rect x="84" y="31" width="9" height="22" rx="4.5" fill="#6366f1" />

      {/* ── HEAD ── */}
      {/* Shadow/depth behind head */}
      <rect x="14" y="18" width="72" height="58" rx="22" fill="#c7d2fe" opacity="0.6" transform="translate(0,2)" />
      {/* Head body */}
      <rect x="14" y="16" width="72" height="58" rx="22" fill={`url(#${bodyGradId})`} />
      {/* Outline */}
      <rect x="14" y="16" width="72" height="58" rx="22" stroke="#6366f1" strokeWidth="2" fill="none" />
      {/* Forehead sheen */}
      <rect x="24" y="19" width="52" height="10" rx="6" fill="white" opacity="0.55" />

      {/* ── LEFT EYE SOCKET (dark lens) ── */}
      <circle cx="36" cy="42" r="13.5" fill="#1e1b4b" />
      <circle cx="36" cy="42" r="12"   fill="#0f172a" />
      {/* Eye glow */}
      <circle cx="36" cy="42" r="8"    fill={`url(#${eyeGradId})`} filter={`url(#${glowId})`} />
      {/* Pupil */}
      <circle cx="36" cy="42" r="3.5"  fill="#0e7490" />
      {/* Shine */}
      <circle cx="39.5" cy="38.5" r="2.8" fill="white" opacity="0.9" />
      <circle cx="37"   cy="46"   r="1.2" fill="white" opacity="0.35" />

      {/* ── RIGHT EYE SOCKET (dark lens) ── */}
      <circle cx="64" cy="42" r="13.5" fill="#1e1b4b" />
      <circle cx="64" cy="42" r="12"   fill="#0f172a" />
      {/* Eye glow */}
      <circle cx="64" cy="42" r="8"    fill={`url(#${eyeGradId})`} filter={`url(#${glowId})`} />
      {/* Pupil */}
      <circle cx="64" cy="42" r="3.5"  fill="#0e7490" />
      {/* Shine */}
      <circle cx="67.5" cy="38.5" r="2.8" fill="white" opacity="0.9" />
      <circle cx="65"   cy="46"   r="1.2" fill="white" opacity="0.35" />

      {/* ── MOUTH / SMILE ── */}
      {/* Mouth backing pill */}
      <rect x="33" y="57" width="34" height="11" rx="5.5" fill="#c7d2fe" opacity="0.6" />
      {/* Smile arc */}
      <path d="M37 60 Q50 70 63 60" stroke="#4338ca" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── NECK ── */}
      <rect x="38" y="74" width="24" height="9" rx="4.5" fill="#6366f1" />
      {/* Neck highlight */}
      <rect x="42" y="75.5" width="16" height="3" rx="1.5" fill="white" opacity="0.3" />

      {/* ── BODY ── */}
      {/* Shadow behind body */}
      <rect x="9" y="81" width="82" height="34" rx="16" fill="#c7d2fe" opacity="0.5" transform="translate(0,2)" />
      {/* Body fill */}
      <rect x="9" y="81" width="82" height="34" rx="16" fill={`url(#${bodyGradId})`} />
      {/* Body outline */}
      <rect x="9" y="81" width="82" height="34" rx="16" stroke="#6366f1" strokeWidth="2" fill="none" />
      {/* Body top sheen */}
      <rect x="18" y="83" width="64" height="9" rx="5" fill="white" opacity="0.5" />

      {/* Chest accent stripe */}
      <rect x="22" y="89" width="56" height="18" rx="8" fill={`url(#${chestGradId})`} opacity="0.85" />
      {/* Stripe highlight */}
      <rect x="26" y="91" width="48" height="5" rx="3" fill="white" opacity="0.2" />

      {/* Single center LED */}
      <circle cx="50" cy="100" r="5"   fill="#22d3ee" opacity="0.3" />
      <circle cx="50" cy="100" r="3.5" fill="#22d3ee" filter={`url(#${glowId})`} />
      <circle cx="50" cy="100" r="1.5" fill="white" opacity="0.9" />

      {/* ── ARMS ── */}
      {/* Left arm */}
      <rect x="1"  y="83" width="10" height="26" rx="5" fill={`url(#${bodyGradId})`} />
      <rect x="1"  y="83" width="10" height="26" rx="5" stroke="#6366f1" strokeWidth="1.8" fill="none" />
      {/* Left arm sheen */}
      <rect x="3"  y="86" width="6"  height="5"  rx="2" fill="white" opacity="0.45" />
      {/* Right arm */}
      <rect x="89" y="83" width="10" height="26" rx="5" fill={`url(#${bodyGradId})`} />
      <rect x="89" y="83" width="10" height="26" rx="5" stroke="#6366f1" strokeWidth="1.8" fill="none" />
      {/* Right arm sheen */}
      <rect x="91" y="86" width="6"  height="5"  rx="2" fill="white" opacity="0.45" />
    </svg>
  );
};
