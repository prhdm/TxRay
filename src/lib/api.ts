import { getAccessToken } from './auth';

// API client with automatic token injection
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: await this.getHeaders(),
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  async post(endpoint: string, data?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async put(endpoint: string, data?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse(response);
  }

  async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
      credentials: 'include',
    });

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null;
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Supabase API client for authenticated requests
export const supabaseApiClient = new ApiClient(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Helper functions for common API operations
export const api = {
  // User profile operations
  async getProfile(walletAddress: string) {
    return supabaseApiClient.get(`/rest/v1/profiles?wallet_address=eq.${walletAddress}&select=*`);
  },

  async updateProfile(walletAddress: string, data: any) {
    return supabaseApiClient.patch(`/rest/v1/profiles?wallet_address=eq.${walletAddress}`, data);
  },

  // Example: Game data operations (customize based on your needs)
  async getUserGameData(walletAddress: string) {
    return supabaseApiClient.get(`/rest/v1/user_game_data?wallet_address=eq.${walletAddress}&select=*`);
  },

  async updateUserGameData(walletAddress: string, data: any) {
    return supabaseApiClient.post(`/rest/v1/user_game_data`, {
      wallet_address: walletAddress,
      ...data,
      updated_at: new Date().toISOString(),
    });
  },
};

