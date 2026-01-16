/**
 * Active Context Manager
 * 
 * Handles the persistence of "Active Runbook" context across the application.
 * Uses sessionStorage to survive page refreshes without backend persistence.
 */

export interface ActiveContext {
  runbookId?: string;
  runbookTitle?: string;
  stageId?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'bpm_active_context';
let memoryContext: ActiveContext | null = null;

export const setActiveContext = (ctx: ActiveContext) => {
  const contextWithTimestamp = { ...ctx, timestamp: Date.now() };
  memoryContext = contextWithTimestamp;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contextWithTimestamp));
  } catch (e) {
    console.warn('BPM-OS: SessionStorage unavailable for context handoff.');
  }
};

export const getActiveContext = (): ActiveContext | null => {
  if (memoryContext) return memoryContext;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      memoryContext = JSON.parse(stored);
      return memoryContext;
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const clearActiveContext = () => {
  memoryContext = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
};
