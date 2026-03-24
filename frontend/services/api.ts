/**
 * API service — handles all communication with the FastAPI backend.
 *
 * Key concepts:
 * - Uses native fetch() (built into React Native, no extra library needed)
 * - __DEV__ is a React Native global that's true in development, false in production builds
 * - Auth token is pulled from Supabase session
 */
import { ClassificationRequest, ClassificationResponse } from '@/types/classification';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  ? 'https://api.landfilllegends.com'
  : process.env.EXPO_PUBLIC_API_URL;

export async function classifyWasteInput(
  request: ClassificationRequest,
): Promise<ClassificationResponse> {
  // Get the current session token from Supabase
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? null

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/classify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}
