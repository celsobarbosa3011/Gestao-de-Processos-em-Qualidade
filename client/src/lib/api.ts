import type { Profile, Process, ProcessComment, ProcessEvent, AlertSettings, InsertProcess, UpdateProcess, BrandingConfig, WipLimit, UpdateWipLimit, ProcessChecklist, ProcessAttachment, ProcessLabel, ChatMessage, Permission, RolePermission, UserPermission, ProcessTemplate, FeatureToggle, TimeEntry, InsertTimeEntry, CustomField, InsertCustomField, CustomFieldValue, Automation, InsertAutomation, Notification, Swimlane, InsertSwimlane, DashboardWidget, InsertDashboardWidget, Unit, InsertUnit, UpdateUnit, ProcessType, Priority } from "@shared/schema";
import { useStore } from "./store";

const API_BASE = "/api";

export function getAuthHeaders(includeContentType: boolean = true): HeadersInit {
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

export async function register(data: { name: string; email: string; password: string; confirmPassword: string }): Promise<Profile & { token?: string }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao criar conta");
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

export async function generateProvisionalPassword(userId: string): Promise<{ provisionalPassword: string; expiresAt: string; message: string; emailSent?: boolean }> {
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
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update profile");
  return response.json();
}

export async function createProfile(data: { 
  name: string; 
  email: string; 
  role: string; 
  unit: string; 
  status: string; 
  avatar?: string;
  motherName?: string;
  cpf?: string;
  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  secondaryPhone?: string;
}): Promise<Profile & { emailSent?: boolean }> {
  const response = await fetch(`${API_BASE}/profiles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
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

// Units
export async function getAllUnits(): Promise<Unit[]> {
  const response = await fetch(`${API_BASE}/units`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch units");
  return response.json();
}

export async function getUnit(id: number): Promise<Unit> {
  const response = await fetch(`${API_BASE}/units/${id}`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch unit");
  return response.json();
}

export async function createUnit(data: InsertUnit): Promise<Unit> {
  const response = await fetch(`${API_BASE}/units`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create unit");
  }
  return response.json();
}

export async function updateUnit(id: number, updates: UpdateUnit): Promise<Unit> {
  const response = await fetch(`${API_BASE}/units/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update unit");
  return response.json();
}

export async function deleteUnit(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/units/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete unit");
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
  // Step 1: Request presigned URL for Object Storage upload
  const urlResponse = await fetch(`${API_BASE}/processes/${processId}/attachments/request-url`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  
  if (!urlResponse.ok) {
    throw new Error("Failed to get upload URL");
  }
  
  const { uploadURL, objectPath } = await urlResponse.json();
  
  // Step 2: Upload file directly to Object Storage (presigned URL)
  const uploadResponse = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  
  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }
  
  // Step 3: Save attachment metadata to database
  const saveResponse = await fetch(`${API_BASE}/processes/${processId}/attachments/save`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      objectPath,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });
  
  if (!saveResponse.ok) {
    throw new Error("Failed to save attachment");
  }
  
  return saveResponse.json();
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

export interface ChatConversationSummary {
  otherUserId: string;
  otherUserName: string;
  otherUserUnit: string;
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageSenderName: string;
  lastMessageAt: string;
  unreadCount: number;
}

export async function getUserConversations(): Promise<ChatConversationSummary[]> {
  const response = await fetch(`${API_BASE}/chat/conversations`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch conversations");
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

export async function updateTemplate(id: number, template: Partial<Omit<ProcessTemplate, 'id' | 'createdAt' | 'createdBy'>>): Promise<ProcessTemplate> {
  const response = await fetch(`${API_BASE}/templates/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(template),
  });
  if (!response.ok) throw new Error("Failed to update template");
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

// Time Entries
export async function getTimeEntries(processId: number): Promise<TimeEntry[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/time-entries`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch time entries");
  return response.json();
}

export async function createTimeEntry(processId: number, data: { description?: string; minutes: number; date?: string }): Promise<TimeEntry> {
  const response = await fetch(`${API_BASE}/processes/${processId}/time-entries`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create time entry");
  return response.json();
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/time-entries/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete time entry");
}

export async function getTotalTime(processId: number): Promise<{ total: number }> {
  const response = await fetch(`${API_BASE}/processes/${processId}/total-time`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch total time");
  return response.json();
}

// Custom Fields
export async function getCustomFields(): Promise<CustomField[]> {
  const response = await fetch(`${API_BASE}/custom-fields`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch custom fields");
  return response.json();
}

export async function createCustomField(field: InsertCustomField): Promise<CustomField> {
  const response = await fetch(`${API_BASE}/custom-fields`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(field),
  });
  if (!response.ok) throw new Error("Failed to create custom field");
  return response.json();
}

export async function updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CustomField> {
  const response = await fetch(`${API_BASE}/custom-fields/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update custom field");
  return response.json();
}

export async function deleteCustomField(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/custom-fields/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete custom field");
}

export async function getCustomFieldValues(processId: number): Promise<CustomFieldValue[]> {
  const response = await fetch(`${API_BASE}/processes/${processId}/custom-field-values`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch custom field values");
  return response.json();
}

export async function setCustomFieldValue(processId: number, fieldId: number, value: string | null): Promise<CustomFieldValue> {
  const response = await fetch(`${API_BASE}/processes/${processId}/custom-field-values`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ fieldId, value }),
  });
  if (!response.ok) throw new Error("Failed to set custom field value");
  return response.json();
}

// Automations
export async function getAutomations(): Promise<Automation[]> {
  const response = await fetch(`${API_BASE}/automations`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch automations");
  return response.json();
}

export async function createAutomation(automation: InsertAutomation): Promise<Automation> {
  const response = await fetch(`${API_BASE}/automations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(automation),
  });
  if (!response.ok) throw new Error("Failed to create automation");
  return response.json();
}

export async function updateAutomation(id: number, updates: Partial<InsertAutomation>): Promise<Automation> {
  const response = await fetch(`${API_BASE}/automations/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update automation");
  return response.json();
}

export async function deleteAutomation(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/automations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete automation");
}

// Notifications
export async function getNotifications(): Promise<Notification[]> {
  const response = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function markNotificationAsRead(id: number): Promise<Notification> {
  const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
  return response.json();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`${API_BASE}/notifications/read-all`, {
    method: "POST",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to mark all notifications as read");
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to get unread notification count");
  return response.json();
}

export async function deleteNotification(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete notification");
}

// Swimlanes
export async function getSwimlanes(): Promise<Swimlane[]> {
  const response = await fetch(`${API_BASE}/swimlanes`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch swimlanes");
  return response.json();
}

export async function createSwimlane(swimlane: InsertSwimlane): Promise<Swimlane> {
  const response = await fetch(`${API_BASE}/swimlanes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(swimlane),
  });
  if (!response.ok) throw new Error("Failed to create swimlane");
  return response.json();
}

export async function updateSwimlane(id: number, updates: Partial<InsertSwimlane>): Promise<Swimlane> {
  const response = await fetch(`${API_BASE}/swimlanes/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update swimlane");
  return response.json();
}

export async function deleteSwimlane(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/swimlanes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete swimlane");
}

// Analytics
export async function getCumulativeFlowData(): Promise<{ status: string; date: string; count: number }[]> {
  const response = await fetch(`${API_BASE}/analytics/cumulative-flow`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch cumulative flow data");
  return response.json();
}

// Dashboard Widgets
export async function getDashboardWidgets(): Promise<DashboardWidget[]> {
  const response = await fetch(`${API_BASE}/dashboard/widgets`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard widgets");
  return response.json();
}

export async function createDashboardWidget(widget: Omit<InsertDashboardWidget, 'userId'>): Promise<DashboardWidget> {
  const response = await fetch(`${API_BASE}/dashboard/widgets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(widget),
  });
  if (!response.ok) throw new Error("Failed to create widget");
  return response.json();
}

export async function updateDashboardWidget(id: number, updates: Partial<InsertDashboardWidget>): Promise<DashboardWidget> {
  const response = await fetch(`${API_BASE}/dashboard/widgets/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update widget");
  return response.json();
}

export async function deleteDashboardWidget(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/dashboard/widgets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete widget");
}

export async function reorderDashboardWidgets(positions: { id: number; position: number }[]): Promise<void> {
  const response = await fetch(`${API_BASE}/dashboard/widgets/reorder`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ positions }),
  });
  if (!response.ok) throw new Error("Failed to reorder widgets");
}

export async function resetDashboardWidgets(): Promise<DashboardWidget[]> {
  const response = await fetch(`${API_BASE}/dashboard/widgets/reset`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to reset widgets");
  return response.json();
}

// Process Types
export async function getAllProcessTypes(): Promise<ProcessType[]> {
  const response = await fetch(`${API_BASE}/process-types`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch process types");
  return response.json();
}

export async function createProcessType(data: { name: string; description?: string; color?: string; order?: number; active?: boolean }): Promise<ProcessType> {
  const response = await fetch(`${API_BASE}/process-types`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create process type");
  }
  return response.json();
}

export async function updateProcessType(id: number, updates: { name?: string; description?: string; color?: string; order?: number; active?: boolean }): Promise<ProcessType> {
  const response = await fetch(`${API_BASE}/process-types/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update process type");
  return response.json();
}

export async function deleteProcessType(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/process-types/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete process type");
}

// Priorities
export async function getAllPriorities(): Promise<Priority[]> {
  const response = await fetch(`${API_BASE}/priorities`, {
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to fetch priorities");
  return response.json();
}

export async function createPriority(data: { name: string; level?: number; color?: string; order?: number; active?: boolean }): Promise<Priority> {
  const response = await fetch(`${API_BASE}/priorities`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create priority");
  }
  return response.json();
}

export async function updatePriority(id: number, updates: { name?: string; level?: number; color?: string; order?: number; active?: boolean }): Promise<Priority> {
  const response = await fetch(`${API_BASE}/priorities/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update priority");
  return response.json();
}

export async function deletePriority(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/priorities/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!response.ok) throw new Error("Failed to delete priority");
}
