import type { Profile, Process, ProcessComment, ProcessEvent, AlertSettings, InsertProcess, UpdateProcess, BrandingConfig, WipLimit, UpdateWipLimit } from "@shared/schema";
import { useStore } from "./store";

const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = useStore.getState().authToken;
  return token 
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// Auth
export async function login(email: string, password: string): Promise<Profile & { mustChangePassword?: boolean; token?: string }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Invalid credentials");
  }
  
  return response.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<Profile & { token?: string }> {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to change password");
  }
  
  return response.json();
}

export async function generateProvisionalPassword(userId: string): Promise<{ provisionalPassword: string; expiresAt: string; message: string }> {
  const response = await fetch(`${API_BASE}/profiles/${userId}/provisional-password`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate provisional password");
  }
  
  return response.json();
}

// Profiles
export async function getAllProfiles(): Promise<Profile[]> {
  const response = await fetch(`${API_BASE}/profiles`);
  if (!response.ok) throw new Error("Failed to fetch profiles");
  return response.json();
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function createProfile(data: { name: string; email: string; role: string; unit: string; status: string; avatar?: string }): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, password: 'senha123' }),
  });
  if (!response.ok) throw new Error("Failed to create profile");
  return response.json();
}

export async function deleteProfile(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/profiles/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete profile");
}

// Processes
export async function getAllProcesses(): Promise<Process[]> {
  const response = await fetch(`${API_BASE}/processes`);
  if (!response.ok) throw new Error("Failed to fetch processes");
  return response.json();
}

export async function getProcess(id: number): Promise<Process> {
  const response = await fetch(`${API_BASE}/processes/${id}`);
  if (!response.ok) throw new Error("Failed to fetch process");
  return response.json();
}

export async function createProcess(data: InsertProcess): Promise<Process> {
  const response = await fetch(`${API_BASE}/processes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create process");
  return response.json();
}

export async function updateProcess(id: number, updates: UpdateProcess & { userId?: string }): Promise<Process> {
  const response = await fetch(`${API_BASE}/processes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update process");
  return response.json();
}

// Comments
export async function getProcessComments(processId: number): Promise<ProcessComment[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/comments`);
  if (!response.ok) throw new Error("Failed to fetch comments");
  return response.json();
}

export async function createComment(processId: number, userId: string, text: string): Promise<ProcessComment> {
  const response = await fetch(`${API_BASE}/processes/${processId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text }),
  });
  if (!response.ok) throw new Error("Failed to create comment");
  return response.json();
}

// Events
export async function getProcessEvents(processId: number): Promise<ProcessEvent[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/events`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

export async function getAllEvents(): Promise<ProcessEvent[]> {
  const response = await fetch(`${API_BASE}/events`);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

// Alert Settings
export async function getAlertSettings(): Promise<AlertSettings> {
  const response = await fetch(`${API_BASE}/settings/alerts`);
  if (!response.ok) throw new Error("Failed to fetch alert settings");
  return response.json();
}

export async function updateAlertSettings(settings: Partial<AlertSettings>): Promise<AlertSettings> {
  const response = await fetch(`${API_BASE}/settings/alerts`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error("Failed to update alert settings");
  return response.json();
}

// Branding Config
export async function getBrandingConfig(): Promise<BrandingConfig> {
  const response = await fetch(`${API_BASE}/settings/branding`);
  if (!response.ok) throw new Error("Failed to fetch branding config");
  return response.json();
}

export async function updateBrandingConfig(config: Partial<BrandingConfig> & { userId: string }): Promise<BrandingConfig> {
  const response = await fetch(`${API_BASE}/settings/branding`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update branding config (${response.status})`);
  }
  return response.json();
}

// WIP Limits
export async function getWipLimits(): Promise<WipLimit[]> {
  const response = await fetch(`${API_BASE}/settings/wip-limits`);
  if (!response.ok) throw new Error("Failed to fetch WIP limits");
  return response.json();
}

export async function updateWipLimit(columnId: string, updates: UpdateWipLimit): Promise<WipLimit> {
  const response = await fetch(`${API_BASE}/settings/wip-limits/${columnId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update WIP limit (${response.status})`);
  }
  return response.json();
}
