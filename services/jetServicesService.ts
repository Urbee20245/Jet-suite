/**
 * JetServices Service
 * Handles API calls for service listings CRUD, service images, and calendar events.
 * Follows JetSuite pattern: API routes for database operations.
 */

export interface ServiceListing {
  id: string;
  user_id: string;
  business_id: string;
  title: string;
  description: string;
  category: string;
  price?: string;
  price_type: 'fixed' | 'starting_at' | 'hourly' | 'custom' | 'free';
  duration?: string;
  is_active: boolean;
  images: ServiceImage[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string; // base64 data URL or stored URL
  is_ai_generated: boolean;
  ai_prompt?: string;
  position: number;
  created_at: string;
}

export interface ServiceCalendarEvent {
  id: string;
  user_id: string;
  business_id: string;
  service_id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SERVICE LISTINGS API
// ============================================================================

export async function getServiceListings(
  userId: string,
  businessId: string
): Promise<ServiceListing[]> {
  try {
    const params = new URLSearchParams({ userId, businessId });
    const response = await fetch(`/api/services/get-services?${params}`);

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[JetServices] Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('[JetServices] Failed to fetch service listings');
      return [];
    }

    const data = await response.json();
    return data.services || [];
  } catch (error: any) {
    console.error('[JetServices] Get services error:', error);
    return [];
  }
}

export async function createServiceListing(
  userId: string,
  businessId: string,
  serviceData: Omit<ServiceListing, 'id' | 'user_id' | 'business_id' | 'images' | 'created_at' | 'updated_at'>
): Promise<ServiceListing> {
  try {
    const response = await fetch('/api/services/create-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, businessId, ...serviceData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create service');
    }

    const data = await response.json();
    return data.service;
  } catch (error: any) {
    console.error('[JetServices] Create service error:', error);
    throw error;
  }
}

export async function updateServiceListing(
  serviceId: string,
  updates: Partial<Omit<ServiceListing, 'id' | 'user_id' | 'business_id' | 'created_at' | 'updated_at'>>
): Promise<ServiceListing> {
  try {
    const response = await fetch('/api/services/update-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service');
    }

    const data = await response.json();
    return data.service;
  } catch (error: any) {
    console.error('[JetServices] Update service error:', error);
    throw error;
  }
}

export async function deleteServiceListing(serviceId: string): Promise<void> {
  try {
    const response = await fetch('/api/services/delete-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete service');
    }
  } catch (error: any) {
    console.error('[JetServices] Delete service error:', error);
    throw error;
  }
}

// ============================================================================
// SERVICE IMAGES API
// ============================================================================

export async function saveServiceImage(
  serviceId: string,
  imageData: {
    image_url: string;
    is_ai_generated: boolean;
    ai_prompt?: string;
    position: number;
  }
): Promise<ServiceImage> {
  try {
    const response = await fetch('/api/services/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, ...imageData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save image');
    }

    const data = await response.json();
    return data.image;
  } catch (error: any) {
    console.error('[JetServices] Save image error:', error);
    throw error;
  }
}

export async function deleteServiceImage(imageId: string): Promise<void> {
  try {
    const response = await fetch('/api/services/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error: any) {
    console.error('[JetServices] Delete image error:', error);
    throw error;
  }
}

// ============================================================================
// CALENDAR EVENTS API
// ============================================================================

export async function getCalendarEvents(
  userId: string,
  businessId: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceCalendarEvent[]> {
  try {
    const params = new URLSearchParams({ userId, businessId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/services/get-events?${params}`);

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[JetServices] Server returned HTML instead of JSON');
      return [];
    }

    if (!response.ok) {
      console.error('[JetServices] Failed to fetch calendar events');
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error: any) {
    console.error('[JetServices] Get events error:', error);
    return [];
  }
}

export async function createCalendarEvent(
  userId: string,
  businessId: string,
  eventData: Omit<ServiceCalendarEvent, 'id' | 'user_id' | 'business_id' | 'created_at' | 'updated_at'>
): Promise<ServiceCalendarEvent> {
  try {
    const response = await fetch('/api/services/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, businessId, ...eventData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }

    const data = await response.json();
    return data.event;
  } catch (error: any) {
    console.error('[JetServices] Create event error:', error);
    throw error;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<Omit<ServiceCalendarEvent, 'id' | 'user_id' | 'business_id' | 'created_at' | 'updated_at'>>
): Promise<ServiceCalendarEvent> {
  try {
    const response = await fetch('/api/services/update-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }

    const data = await response.json();
    return data.event;
  } catch (error: any) {
    console.error('[JetServices] Update event error:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const response = await fetch('/api/services/delete-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
  } catch (error: any) {
    console.error('[JetServices] Delete event error:', error);
    throw error;
  }
}

// ============================================================================
// SERVICE CATEGORIES
// ============================================================================

export const SERVICE_CATEGORIES = [
  'Consulting',
  'Coaching',
  'Design',
  'Development',
  'Marketing',
  'Photography',
  'Videography',
  'Writing',
  'Accounting',
  'Legal',
  'Health & Wellness',
  'Beauty & Spa',
  'Fitness & Training',
  'Home Services',
  'Auto Services',
  'Cleaning',
  'Landscaping',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Pet Services',
  'Education & Tutoring',
  'Event Planning',
  'Catering',
  'Music & Entertainment',
  'Real Estate',
  'Insurance',
  'Financial Planning',
  'IT Support',
  'Other',
];

export const PRICE_TYPES: { value: ServiceListing['price_type']; label: string }[] = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_at', label: 'Starting At' },
  { value: 'hourly', label: 'Per Hour' },
  { value: 'custom', label: 'Custom Quote' },
  { value: 'free', label: 'Free' },
];
