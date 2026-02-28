/**
 * API service — handles all communication with the FastAPI backend.
 *
 * Key concepts:
 * - Uses native fetch() (built into React Native, no extra library needed)
 * - __DEV__ is a React Native global that's true in development, false in production builds
 * - Auth token is stubbed for now (backend has BYPASS_AUTH=true)
 */

import { ClassificationRequest, ClassificationResponse } from '@/types/classification';

// In development, your phone/simulator needs to reach your computer's localhost.
// On iOS simulator, localhost works. On Android emulator, use 10.0.2.2.
// On a physical device, use your computer's local IP (e.g., 192.168.1.x).
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.landfilllegends.com';

export async function classifyWasteInput(
  request: ClassificationRequest,
): Promise<ClassificationResponse> {
  // TODO: Replace with real OAuth token once your friend's branch is merged
  const token: string | null = null;

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
