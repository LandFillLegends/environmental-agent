/**
 * API service — handles all communication with the FastAPI backend.
 */
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ClassificationRequest, ClassificationResponse } from '@/types/classification';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function storeGoogleTokens(session: Session): Promise<void> {
  if (!session.provider_token) return;
  const response = await fetch(`${API_BASE_URL}/api/v1/users/store-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      google_access_token: session.provider_token,
      google_refresh_token: session.provider_refresh_token ?? null,
    }),
  });
  await handleResponse<{ status: string }>(response);
}

export async function classifyWasteInput(
  request: ClassificationRequest,
): Promise<ClassificationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/classify`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<ClassificationResponse>(response);
}

// ── Scheduling ─────────────────────────────────────────────────────────────────

export interface SlotSuggestion {
  date: string;         // "2026-04-07"
  time: string;         // "14:00"
  day_display: string;  // "Mon, Apr 7"
  time_display: string; // "2:00 PM"
  reason: string;
  label: string;        // "Recommended" | ""
}

export interface SuggestSlotsResponse {
  suggestions: SlotSuggestion[];
}

export async function getSuggestedSlots(
  facilityName: string,
  facilityAddress: string,
  wasteItem: string,
  timezone: string,
): Promise<SuggestSlotsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/schedule/suggest`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      facility_name: facilityName,
      facility_address: facilityAddress,
      waste_item: wasteItem,
      timezone,
    }),
  });
  return handleResponse<SuggestSlotsResponse>(response);
}

export async function scheduleDisposal(
  facilityName: string,
  facilityAddress: string,
  date: string,
  time: string,
  wasteItem: string,
  timezone: string,
): Promise<{ status: string; event: unknown }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/schedule`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      facility_name: facilityName,
      facility_address: facilityAddress,
      date,
      time,
      waste_item: wasteItem,
      timezone,
    }),
  });
  return handleResponse<{ status: string; event: unknown }>(response);
}
