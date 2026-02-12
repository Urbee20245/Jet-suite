import React, { useState, useCallback } from 'react';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postText: string;
  hashtags?: string;
  platform?: string;
  imageUrl?: string;
}

/**
 * Manual sharing modal for JetSocial posts.
 *
 * Compliance guarantees:
 *  - Every share is initiated by an explicit user click.
 *  - No automation, bots, scheduled shares, or background posting.
 *  - No contact or group-list access — the external app handles recipient selection.
 *  - No delivery confirmation, recipient tracking, or contact storage.
 *
 * Share priority:
 *  1. Native OS share sheet (navigator.share) – opens installed apps including
 *     WhatsApp, Telegram, and others.
 *  2. Platform-specific deep links (WhatsApp & Telegram) as fallback on desktop
 *     or when the Web Share API is unavailable.
 *  3. Copy-to-clipboard as a universal last resort.
 */
export const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  postText,
  hashtags,
  platform,
  imageUrl,
}) => {
  const [copyFeedback, setCopyFeedback] = useState('');
  const [nativeShareError, setNativeShareError] = useState('');

  // Defensive: coerce props to strings (DB may return non-string types)
  const safePostText = typeof postText === 'string' ? postText : String(postText ?? '');
  const safeHashtags = typeof hashtags === 'string' ? hashtags : Array.isArray(hashtags) ? (hashtags as string[]).join(' ') : String(hashtags ?? '');
  const fullText = [safePostText, safeHashtags].filter(Boolean).join('\n\n').trim();

  // --- Native share sheet (preferred) ---
  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = useCallback(async () => {
    setNativeShareError('');
    try {
      const shareData: ShareData = {
        title: platform ? `${platform} Post` : 'JetSocial Post',
        text: fullText,
      };

      // The Web Share API on some platforms can share files (images).
      // We only attempt this when the browser supports canShare with files.
      if (imageUrl && imageUrl.startsWith('data:') && navigator.canShare) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const file = new File([blob], 'post-image.png', { type: blob.type });
          const shareWithFile = { ...shareData, files: [file] };
          if (navigator.canShare(shareWithFile)) {
            shareData.files = [file];
          }
        } catch {
          // Fall through — share without the image.
        }
      }

      await navigator.share(shareData);
      onClose();
    } catch (err: any) {
      // User cancelled the share sheet — not an error.
      if (err?.name === 'AbortError') return;
      setNativeShareError('Share failed. Use the platform buttons below instead.');
    }
  }, [fullText, platform, imageUrl, onClose]);

  // --- WhatsApp deep link ---
  const handleWhatsAppShare = useCallback(() => {
    const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [fullText]);

  // --- Telegram share URL ---
  const handleTelegramShare = useCallback(() => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [fullText]);

  // --- Copy to clipboard ---
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback('Copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  }, [fullText]);

  // Early return AFTER all hooks (React Rules of Hooks)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-brand-text">Share Post</h3>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Post preview */}
        <div className="bg-brand-light border border-brand-border rounded-lg p-4 mb-5 max-h-40 overflow-y-auto">
          <p className="text-brand-text text-sm whitespace-pre-wrap line-clamp-5">{safePostText}</p>
          {safeHashtags && (
            <p className="text-accent-cyan text-xs mt-2">{safeHashtags}</p>
          )}
        </div>

        {/* Native share sheet (mobile-first, preferred) */}
        {supportsNativeShare && (
          <button
            onClick={handleNativeShare}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition duration-300 hover:shadow-lg mb-3"
          >
            Share via Apps...
          </button>
        )}

        {nativeShareError && (
          <p className="text-red-500 text-xs mb-3 text-center">{nativeShareError}</p>
        )}

        {/* Platform-specific buttons */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegramShare}
            className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#006daa] text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </button>
        </div>

        {/* Copy to clipboard */}
        <button
          onClick={handleCopy}
          className="w-full bg-brand-light border border-brand-border text-brand-text font-semibold py-3 px-4 rounded-lg hover:bg-opacity-80 transition duration-200"
        >
          {copyFeedback || 'Copy Text to Clipboard'}
        </button>

        {/* Compliance note */}
        <p className="text-brand-text-muted text-[11px] text-center mt-4 leading-relaxed">
          Sharing opens the selected app where you choose the recipient.
          JetSocial does not send messages, access contacts, or track delivery.
        </p>
      </div>
    </div>
  );
};
