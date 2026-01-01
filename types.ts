import type React from 'react';

export interface Tool {
  id: string;
  name:string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isComingSoon?: boolean;
}

export interface ToolCategory {
  name: string;
  description: string;
  emoji: string;
  tools: Tool[];
}

// ... existing types above BusinessReview stay unchanged ...

export interface GoogleBusinessProfile {
  profileName: string;
  mapsUrl: string;
  status: GbpStatus;
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

export interface BusinessReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  isPositive: boolean;
  // NEW: optional metadata when review comes from Google Business API
  source?: 'google_business' | 'ai';
  googleReviewName?: string;     // e.g. "accounts/123/locations/456/reviews/789"
  googleLocationName?: string;   // e.g. "accounts/123/locations/456"
}

// ... rest of file (BrandDnaProfile, ProfileData, Social types, etc.) remains exactly as before ...