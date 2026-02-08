-- Add scheduled_date column to growth_plan_tasks for calendar assignment
-- This allows users to assign tasks to specific days in the Planner

ALTER TABLE public.growth_plan_tasks
ADD COLUMN IF NOT EXISTS scheduled_date DATE;
