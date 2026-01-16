// Universal sync service for all data types
export const syncToSupabase = async (
  userId: string,
  businessId: string | null,
  dataType: string,
  data: any,
  analysisName?: string // <-- ADD analysisName
) => {
  try {
    await fetch('/api/sync/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, businessId, dataType, data, analysisName }), // <-- PASS analysisName
    });
  } catch (error) {
    console.error(`Error syncing ${dataType}:`, error);
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
    if (response.ok) {
      const { data } = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error loading ${dataType}:`, error);
    return null;
  }
};