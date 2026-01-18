// Universal sync service with robust error handling
export const syncToSupabase = async (
  userId: string,
  businessId: string | null,
  dataType: string,
  data: any,
  analysisName?: string
) => {
  try {
    const response = await fetch('/api/sync/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, businessId, dataType, data, analysisName }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error(`Sync ${dataType}: Server returned HTML instead of JSON. API route may not exist.`);
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      console.error(`Sync ${dataType} failed:`, error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error syncing ${dataType}:`, error);
    return null;
  }
};

export const loadFromSupabase = async (
  userId: string,
  businessId: string | null,
  dataType: string
) => {
  try {
    const params = new URLSearchParams({ 
      userId, 
      dataType,
      ...(businessId && { businessId }) 
    });
    
    const response = await fetch(`/api/sync/load?${params}`);
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error(`Load ${dataType}: Server returned HTML instead of JSON. API route may not exist.`);
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      console.error(`Load ${dataType} failed:`, error);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error(`Error loading ${dataType}:`, error);
    return null;
  }
};