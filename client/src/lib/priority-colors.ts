export const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-green-500 text-white",
  "Crítica": "bg-red-500 text-white",
  "Alta": "bg-orange-500 text-white",
  "Média": "bg-yellow-500 text-black",
  "Baixa": "bg-green-500 text-white",
};

export const PRIORITY_BG_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  "Crítica": "bg-red-500",
  "Alta": "bg-orange-500",
  "Média": "bg-yellow-500",
  "Baixa": "bg-green-500",
};

export const PRIORITY_HEX_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
  "Crítica": "#EF4444",
  "Alta": "#F97316",
  "Média": "#EAB308",
  "Baixa": "#22C55E",
};

export const DEFAULT_PRIORITY_COLOR = "bg-gray-500 text-white";
export const DEFAULT_PRIORITY_BG = "bg-gray-500";
export const DEFAULT_PRIORITY_HEX = "#6B7280";

export function getPriorityColor(priority: string | null | undefined): string {
  if (!priority) return DEFAULT_PRIORITY_COLOR;
  return PRIORITY_COLORS[priority] || DEFAULT_PRIORITY_COLOR;
}

export function getPriorityBgColor(priority: string | null | undefined): string {
  if (!priority) return DEFAULT_PRIORITY_BG;
  return PRIORITY_BG_COLORS[priority] || DEFAULT_PRIORITY_BG;
}

export function getPriorityHexColor(priority: string | null | undefined): string {
  if (!priority) return DEFAULT_PRIORITY_HEX;
  return PRIORITY_HEX_COLORS[priority] || DEFAULT_PRIORITY_HEX;
}

export function getTitleAbbreviation(title: string): string {
  if (!title || title.length === 0) return "??";
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
}
