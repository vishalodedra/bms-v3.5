/**
 * Audit Event Utility
 * 
 * Manages a transient, client-side audit log for demonstration purposes.
 * Persists to sessionStorage to survive page reloads during a session.
 */

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorRole: string;
  stageId: string;
  actionId: string;
  message: string;
}

const STORAGE_KEY = 'bpm_audit_events';

export const getAuditEvents = (): AuditEvent[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const emitAuditEvent = (event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent => {
  const date = new Date();
  // Simple time formatting for demo
  const timeString = date.toLocaleTimeString('en-GB', { hour12: false }) + ' (IST)';
  
  const newEvent: AuditEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeString,
  };
  
  const current = getAuditEvents();
  // Keep latest 20 events
  const updated = [newEvent, ...current].slice(0, 20);
  
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('SessionStorage failed for audit events', e);
  }
  return newEvent;
};
