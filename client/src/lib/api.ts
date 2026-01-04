import type { Profile, Process, ProcessComment, ProcessEvent, AlertSettings, InsertProcess, UpdateProcess, BrandingConfig, WipLimit, UpdateWipLimit, ProcessChecklist, ProcessAttachment, ProcessLabel, ChatMessage, Permission, RolePermission, UserPermission, ProcessTemplate, FeatureToggle } from "@shared/schema";
import { useStore } from "./store";

const API_BASE = "/api";

function getAuthHeaders(includeContentType: boolean = true): HeadersInit {
  const token = useStore.getState().authToken;
  if (includeContentType) {
    return token 
      ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  }
  return token ? { "Authorization": `Bearer ${token}` } : {};
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
  const response = await fetch(`${API_BASE}/profiles`, {
    headers: getAuthHeaders(false),
  });
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

// Checklists
export async function getProcessChecklists(processId: number): Promise<ProcessChecklist[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/checklists`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch checklists");
  return response.json();
}

export async function createProcessChecklist(processId: number, text: string): Promise<ProcessChecklist> {
  const response = await fetch(`${API_BASE}/processes/${processId}/checklists`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Failed to create checklist item");
  return response.json();
}

export async function updateProcessChecklist(id: number, completed: boolean): Promise<ProcessChecklist> {
  const response = await fetch(`${API_BASE}/checklists/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error("Failed to update checklist item");
  return response.json();
}

export async function deleteProcessChecklist(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/checklists/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete checklist item");
}

// Attachments
export async function getProcessAttachments(processId: number): Promise<ProcessAttachment[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/attachments`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch attachments");
  return response.json();
}

export async function uploadProcessAttachment(processId: number, file: File): Promise<ProcessAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/processes/${processId}/attachments`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to upload attachment");
  return response.json();
}

export async function deleteProcessAttachment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/attachments/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete attachment");
}

// Labels
export async function getAllLabels(): Promise<ProcessLabel[]> {
  const response = await fetch(`${API_BASE}/labels`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch labels");
  return response.json();
}

export async function createLabel(name: string, color: string): Promise<ProcessLabel> {
  const response = await fetch(`${API_BASE}/labels`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, color }),
  });
  if (!response.ok) throw new Error("Failed to create label");
  return response.json();
}

export async function deleteLabel(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/labels/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete label");
}

export async function getProcessLabels(processId: number): Promise<ProcessLabel[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/labels`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch process labels");
  return response.json();
}

export async function addLabelToProcess(processId: number, labelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/processes/${processId}/labels/${labelId}`, {
    method: "POST",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to add label to process");
}

export async function removeLabelFromProcess(processId: number, labelId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/processes/${processId}/labels/${labelId}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to remove label from process");
}

// Chat
export async function getChatMessages(): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chat/messages`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
}

export async function getChatConversation(userId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chat/conversation/${userId}`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch conversation");
  return response.json();
}

export async function sendChatMessage(receiverId: string | null, message: string): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE}/chat/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId, message }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/chat/unread`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to get unread count");
  return response.json();
}

// Permissions
export async function getAllPermissions(): Promise<Permission[]> {
  const response = await fetch(`${API_BASE}/permissions`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch permissions");
  return response.json();
}

export async function getRolePermissions(role: string): Promise<RolePermission[]> {
  const response = await fetch(`${API_BASE}/permissions/role/${role}`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch role permissions");
  return response.json();
}

export async function setRolePermission(role: string, permissionKey: string): Promise<RolePermission> {
  const response = await fetch(`${API_BASE}/permissions/role/${role}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionKey }),
  });
  if (!response.ok) throw new Error("Failed to set role permission");
  return response.json();
}

export async function removeRolePermission(role: string, permissionKey: string): Promise<void> {
  const response = await fetch(`${API_BASE}/permissions/role/${role}/${permissionKey}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to remove role permission");
}

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const response = await fetch(`${API_BASE}/permissions/user/${userId}`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch user permissions");
  return response.json();
}

export async function setUserPermission(userId: string, permissionKey: string, granted: boolean): Promise<UserPermission> {
  const response = await fetch(`${API_BASE}/permissions/user/${userId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ permissionKey, granted }),
  });
  if (!response.ok) throw new Error("Failed to set user permission");
  return response.json();
}

// Templates
export async function getAllTemplates(): Promise<ProcessTemplate[]> {
  const response = await fetch(`${API_BASE}/templates`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch templates");
  return response.json();
}

export async function createTemplate(template: Omit<ProcessTemplate, 'id' | 'createdAt' | 'createdBy'>): Promise<ProcessTemplate> {
  const response = await fetch(`${API_BASE}/templates`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(template),
  });
  if (!response.ok) throw new Error("Failed to create template");
  return response.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete template");
}

// Feature Toggles
export async function getFeatureToggles(): Promise<FeatureToggle[]> {
  const response = await fetch(`${API_BASE}/features`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch features");
  return response.json();
}

export async function updateFeatureToggle(featureKey: string, enabled: boolean): Promise<FeatureToggle> {
  const response = await fetch(`${API_BASE}/features/${featureKey}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) throw new Error("Failed to update feature");
  return response.json();
}
