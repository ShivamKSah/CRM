import type { Customer, Order, Segment, FilterRules, Campaign, CampaignStats, ChatAction, Communication } from '../types';

const API_BASE = '/api';

export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Customers
export const customersApi = {
  mapColumns: (headers: string[]) =>
    apiCall<{ mapping: Record<string, string | null> }>('/customers/map-columns', {
      method: 'POST',
      body: JSON.stringify({ headers }),
    }),

  bulkCreate: (customers: Partial<Customer>[]) =>
    apiCall<{ inserted: number; customers: Customer[] }>('/customers/bulk', {
      method: 'POST',
      body: JSON.stringify(customers),
    }),

  list: (params?: Record<string, string>) => {
    const searchParams = params ? `?${new URLSearchParams(params)}` : '';
    return apiCall<{ customers: Customer[]; total: number }>(`/customers${searchParams}`);
  },

  get: (id: string) => apiCall<Customer>(`/customers/${id}`),
};

// Orders
export const ordersApi = {
  bulkCreate: (orders: Partial<Order>[]) =>
    apiCall<{ inserted: number; orders: Order[] }>('/orders/bulk', {
      method: 'POST',
      body: JSON.stringify(orders),
    }),

  list: (params?: Record<string, string>) => {
    const searchParams = params ? `?${new URLSearchParams(params)}` : '';
    return apiCall<{ orders: Order[] }>(`/orders${searchParams}`);
  },
};

// Segments
export const segmentsApi = {
  create: (segment: { name: string; description?: string; filter_rules: FilterRules }) =>
    apiCall<Segment>('/segments', {
      method: 'POST',
      body: JSON.stringify(segment),
    }),

  list: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return apiCall<{ segments: Segment[]; total: number }>(`/segments${qs ? `?${qs}` : ''}`);
  },

  aiSuggest: (description: string) =>
    apiCall<{ filter_rules: FilterRules; segment_name?: string; segment_description?: string; preview_count: number }>('/segments/ai-suggest', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),

  getCustomers: (id: string) =>
    apiCall<{ customers: Customer[] }>(`/segments/${id}/customers`),

  delete: (id: string) =>
    apiCall<{ success: boolean }>(`/segments/${id}`, { method: 'DELETE' }),
};

// Campaigns
export const campaignsApi = {
  create: (campaign: { name: string; segment_id: string; channel: string; message_template: string }) =>
    apiCall<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    }),

  list: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return apiCall<{ campaigns: Campaign[]; total: number }>(`/campaigns${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiCall<Campaign>(`/campaigns/${id}`),

  launch: (id: string) =>
    apiCall<{ message: string; total_recipients: number }>(`/campaigns/${id}/launch`, {
      method: 'POST',
    }),

  generateMessage: (id: string, goal: string, channel: string) =>
    apiCall<{ message: string }>(`/campaigns/${id}/generate-message`, {
      method: 'POST',
      body: JSON.stringify({ goal, channel }),
    }),

  getStats: (id: string) =>
    apiCall<CampaignStats & { breakdown: Record<string, number> }>(`/campaigns/${id}/stats`),

  getCommunications: (
    id: string,
    params?: { status?: string; limit?: number; offset?: number }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return apiCall<{ communications: Communication[]; total: number }>(
      `/campaigns/${id}/communications${qs ? `?${qs}` : ''}`
    );
  },

  delete: (id: string) =>
    apiCall<{ success: boolean }>(`/campaigns/${id}`, { method: 'DELETE' }),
};

// Chat
export const chatApi = {
  send: (message: string, conversationHistory: { role: string; content: string }[] = []) =>
    apiCall<{ reply: string; actions: ChatAction[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
        context: null,
      }),
    }),
};

// Seed
export const seedApi = {
  generate: () => apiCall<{ message: string; customers: number; orders: number }>('/seed/generate', {
    method: 'POST',
  }),
};
