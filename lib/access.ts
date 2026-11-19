import "server-only";
import type { Lesson } from "./curriculum";

/**
 * The freemium switch. While it is off (the default), every lesson is open.
 * Set PAYWALL_ENABLED=true in the hosting environment to lock Pro lessons.
 *
 * This file is server-only on purpose: access is decided on the server, and a
 * locked lesson's content is never rendered or sent to the browser.
 */
export function paywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED === "true";
}

export interface Viewer {
  isPro: boolean;
}

// Accounts arrive in Phase 3. Until then every visitor is a guest.
export async function getViewer(): Promise<Viewer> {
  return { isPro: false };
}

export function canAccess(lesson: Lesson, viewer: Viewer): boolean {
  if (!paywallEnabled()) return true;
  return lesson.access === "free" || viewer.isPro;
}
