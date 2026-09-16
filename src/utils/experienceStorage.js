const CHAT_KEY = 'tadla_ai_chat_v1';
const PLANNER_KEY = 'tadla_planner_session_v1';
const VISITED_KEY = 'tanmiya_visited';
const MAX_CHAT_MESSAGES = 40;
const MAX_PLANNER_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode or when the quota is full.
  }
}

export function loadChatMessages() {
  const stored = readJson(CHAT_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .slice(-MAX_CHAT_MESSAGES);
}

export function saveChatMessages(messages) {
  writeJson(CHAT_KEY, (Array.isArray(messages) ? messages : []).slice(-MAX_CHAT_MESSAGES));
}

export function clearChatMessages() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CHAT_KEY);
}

export function loadPlannerSession() {
  const stored = readJson(PLANNER_KEY, null);
  if (!stored || typeof stored !== 'object') return null;
  if (!stored.savedAt || Date.now() - stored.savedAt > MAX_PLANNER_AGE_MS) {
    clearPlannerSession();
    return null;
  }
  return stored.data && typeof stored.data === 'object' ? stored.data : null;
}

export function savePlannerSession(data) {
  writeJson(PLANNER_KEY, { savedAt: Date.now(), data });
}

export function clearPlannerSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PLANNER_KEY);
}

export function getVisitedPoiIds() {
  const stored = readJson(VISITED_KEY, []);
  return Array.isArray(stored) ? [...new Set(stored.filter(Boolean))] : [];
}

export function setVisitedPoiIds(ids) {
  const next = [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))];
  writeJson(VISITED_KEY, next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tadla:visits-changed', { detail: next }));
  }
  return next;
}

export const TOURIST_BADGES = [
  { id: 'first-step', icon: 'footprint', threshold: 1, kind: 'total' },
  { id: 'pathfinder', icon: 'explore', threshold: 3, kind: 'total' },
  { id: 'atlas-explorer', icon: 'landscape', threshold: 5, kind: 'total' },
  { id: 'grand-tour', icon: 'workspace_premium', threshold: 10, kind: 'total' },
  {
    id: 'heritage-keeper',
    icon: 'account_balance',
    threshold: 3,
    kind: 'categories',
    categories: ['heritage', 'museum', 'market', 'village'],
  },
  {
    id: 'nature-guardian',
    icon: 'forest',
    threshold: 4,
    kind: 'categories',
    categories: ['nature', 'valley', 'peak', 'gorge', 'geology', 'park'],
  },
  {
    id: 'water-seeker',
    icon: 'water',
    threshold: 3,
    kind: 'categories',
    categories: ['waterfall', 'lake', 'spring', 'river'],
  },
];

export function getBadgeProgress(pois, visitedIds = getVisitedPoiIds()) {
  const byId = new Map((Array.isArray(pois) ? pois : []).map((poi) => [poi.id, poi]));
  const visited = visitedIds.map((id) => byId.get(id)).filter(Boolean);

  return TOURIST_BADGES.map((badge) => {
    const value =
      badge.kind === 'total'
        ? visited.length
        : visited.filter((poi) => badge.categories.includes(poi.category)).length;
    return {
      ...badge,
      value,
      unlocked: value >= badge.threshold,
      progress: Math.min(100, Math.round((value / badge.threshold) * 100)),
    };
  });
}
