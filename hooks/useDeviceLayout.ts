import { useState, useEffect } from 'react';
import { DeviceLayout, resolveDeviceLayout } from '../utils/deviceLayout';

/**
 * useDeviceLayout Hook
 * Listens to window resize events and returns the current DeviceLayout category.
 * @foundation V34-FND-BP-08
 */
export function useDeviceLayout(): DeviceLayout {
  const [layout, setLayout] = useState<DeviceLayout>(() => {
    // Initial server-safe / first-render width
    if (typeof window !== 'undefined') {
      return resolveDeviceLayout(window.innerWidth);
    }
    return "desktop";
  });

  useEffect(() => {
    // SSR Safety
    if (typeof window === 'undefined') return;

    function handleResize() {
      setLayout(resolveDeviceLayout(window.innerWidth));
    }

    // Register event listener
    window.addEventListener('resize', handleResize);
    
    // Initial sync
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
}
