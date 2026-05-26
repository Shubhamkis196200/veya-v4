// ============================================================================
// VEYa API Client — AWS Backend (replaces Supabase)
// Drop-in replacement that maintains compatible interface
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://58to1i483l.execute-api.us-east-1.amazonaws.com';
const TOKEN_KEY = 'veya_auth_token';
const USER_KEY = 'veya_user';

// ============================================================================
// Token management
// ============================================================================

let authToken: string | null = null;
let currentUser: any = null;
let authStateListeners: Array<(event: string, session: any) => void> = [];

async function getToken(): Promise<string | null> {
  if (authToken) return authToken;
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
}

async function setToken(token: string | null) {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

async function setUser(user: any) {
  currentUser = user;
  if (user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

// ============================================================================
// HTTP helpers
// ============================================================================

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error ${response.status}`);
  }

  return data;
}

// ============================================================================
// Auth (compatible with Supabase auth interface)
// ============================================================================

export const auth = {
  async signUp({ email, password, name }: { email: string; password: string; name?: string }) {
    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      await setToken(data.token);
      await setUser(data.user);
      notifyAuthChange('SIGNED_IN', { access_token: data.token, user: data.user });
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setToken(data.token);
      await setUser(data.user);
      notifyAuthChange('SIGNED_IN', { access_token: data.token, user: data.user });
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  async signOut() {
    await setToken(null);
    await setUser(null);
    notifyAuthChange('SIGNED_OUT', null);
    return { error: null };
  },

  async getUser() {
    try {
      const token = await getToken();
      if (!token) return { data: { user: null }, error: null };
      const data = await apiRequest('/auth/user');
      currentUser = data.user;
      return { data: { user: { id: data.user.user_id, ...data.user } }, error: null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  async getSession() {
    const token = await getToken();
    if (!token) return { data: { session: null }, error: null };
    return { data: { session: { access_token: token, user: currentUser } }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authStateListeners.push(callback);
    // Immediately check current state
    getToken().then(token => {
      if (token) {
        callback('INITIAL_SESSION', { access_token: token, user: currentUser });
      }
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authStateListeners = authStateListeners.filter(l => l !== callback);
          },
        },
      },
    };
  },
};

function notifyAuthChange(event: string, session: any) {
  authStateListeners.forEach(listener => listener(event, session));
}

// ============================================================================
// Database (compatible with Supabase .from() interface)
// ============================================================================

class QueryBuilder {
  private table: string;
  private method: string = 'GET';
  private bodyData: any = null;
  private queryParams: Record<string, string> = {};
  private selectFields: string = '*';
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private singleResult = false;
  private upsertData: any = null;
  private upsertOptions: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.method = 'GET';
    this.selectFields = fields;
    return this;
  }

  insert(data: any) {
    this.method = 'POST';
    this.bodyData = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this.method = 'POST';
    this.bodyData = data;
    this.upsertData = data;
    this.upsertOptions = options;
    return this;
  }

  update(data: any) {
    this.method = 'PUT';
    this.bodyData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.singleResult = true;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    return this.then((result: any) => result);
  }

  async then(resolve: (value: any) => any, reject?: (reason: any) => any): Promise<any> {
    try {
      const result = await this._execute();
      return resolve ? resolve(result) : result;
    } catch (err) {
      if (reject) return reject(err);
      return { data: null, error: err };
    }
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      // Map table names to API endpoints
      const endpoint = this._getEndpoint();
      const data = await apiRequest(endpoint, {
        method: this.method === 'GET' ? 'GET' : this.method === 'DELETE' ? 'DELETE' : this.method === 'PUT' ? 'PUT' : 'POST',
        ...(this.bodyData && this.method !== 'GET' ? { body: JSON.stringify(this.bodyData) } : {}),
      });

      return { data: this._extractData(data), error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  private _getEndpoint(): string {
    const tableMap: Record<string, string> = {
      'user_profiles': '/profile',
      'birth_charts': '/chart',
      'daily_readings': '/readings',
      'ai_conversations': '/conversations',
      'streaks': '/streak',
      'user_embeddings': '/ai/generate', // embeddings go through AI endpoint
      'rituals': '/profile', // rituals stored in profile for now
      'subscriptions': '/profile',
    };

    let endpoint = tableMap[this.table] || `/${this.table}`;

    // Add query params for GET requests
    if (this.method === 'GET') {
      const params = new URLSearchParams();
      this.filters.forEach(f => params.set(f.field, f.value));
      const qs = params.toString();
      if (qs) endpoint += `?${qs}`;
    }

    return endpoint;
  }

  private _extractData(response: any): any {
    // Extract the relevant data from the response
    if (response.user) return this.singleResult ? response.user : [response.user];
    if (response.chart) return this.singleResult ? response.chart : [response.chart];
    if (response.reading) return this.singleResult ? response.reading : [response.reading];
    if (response.streak) return this.singleResult ? response.streak : [response.streak];
    if (response.conversations) return response.conversations;
    if (response.success) return this.bodyData;
    return response;
  }
}

export function from(table: string) {
  return new QueryBuilder(table);
}

// ============================================================================
// RPC (replaces supabase.rpc())
// ============================================================================

export async function rpc(functionName: string, params: any) {
  // match_user_embeddings — for now, return empty results (RAG disabled for demo)
  if (functionName === 'match_user_embeddings') {
    return { data: [], error: null };
  }
  return { data: null, error: { message: `RPC ${functionName} not implemented` } };
}

// ============================================================================
// Functions (replaces supabase.functions.invoke())
// ============================================================================

export const functions = {
  async invoke(name: string, options?: { body?: any }) {
    try {
      // Map Supabase Edge Function names to our API
      const fnMap: Record<string, string> = {
        'ai-chat': '/ai/chat',
        'ai-generate': '/ai/generate',
        'voice-transcribe': '/voice/transcribe',
        'voice-tts': '/voice/tts',
        'generate-reading': '/ai/generate',
        'calculate-chart': '/chart',
      };

      const endpoint = fnMap[name] || `/ai/${name}`;
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(options?.body || {}),
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// ============================================================================
// Supabase-compatible export (drop-in replacement)
// ============================================================================

export const supabase = {
  auth,
  from,
  rpc,
  functions,
};

export default supabase;

// Also export the API base for direct use
export const API_URL = API_BASE;
