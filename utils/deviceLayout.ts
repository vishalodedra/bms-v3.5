/**
 * Device Layout Resolver
 * Pure utility to identify device categories based on width.
 * @foundation V34-FND-BP-08
 */

export type DeviceLayout = "mobile" | "tablet" | "desktop";

export const BP_MOBILE_MAX = 767;
export const BP_TABLET_MAX = 1023;

/**
 * Resolves width into a semantic device layout category.
 */
export function resolveDeviceLayout(width: number): DeviceLayout {
  if (width <= BP_MOBILE_MAX) return "mobile";
  if (width <= BP_TABLET_MAX) return "tablet";
  return "desktop";
}
