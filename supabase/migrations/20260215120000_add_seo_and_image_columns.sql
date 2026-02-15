-- ============================================================================
-- SEO AND IMAGE OPTIMIZATION COLUMNS
-- Purpose: Add missing columns for SEO optimization and featured image prompts
-- Created: February 2026
-- ============================================================================

-- Add SEO optimization columns to blog_publications
ALTER TABLE public.blog_publications
ADD COLUMN IF NOT EXISTS featured_image_prompt TEXT,
ADD COLUMN IF NOT EXISTS optimized_keywords TEXT[],
ADD COLUMN IF NOT EXISTS optimized_tags TEXT[],
ADD COLUMN IF NOT EXISTS auto_optimized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wordpress_post_id TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.blog_publications.featured_image_prompt IS 'The AI prompt used to generate the featured image';
COMMENT ON COLUMN public.blog_publications.optimized_keywords IS 'AI-generated SEO keywords for the post';
COMMENT ON COLUMN public.blog_publications.optimized_tags IS 'AI-generated tags for the post';
COMMENT ON COLUMN public.blog_publications.auto_optimized IS 'Whether SEO was automatically optimized';
COMMENT ON COLUMN public.blog_publications.wordpress_post_id IS 'WordPress post ID (for backwards compatibility with platform_post_id)';

-- Create index for SEO keyword searches
CREATE INDEX IF NOT EXISTS idx_blog_publications_keywords
ON public.blog_publications USING gin(optimized_keywords);

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_blog_publications_tags
ON public.blog_publications USING gin(optimized_tags);

-- ============================================================================
-- COMPLETE
-- ============================================================================
