/**
 * Offline Support Utilities
 * Handles offline detection and caching
 */

import React from "react";

class OfflineManager {
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((listener) => listener(isOnline));
  }

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to online/offline status changes
   */
  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners = [];
  }
}

export const offlineManager = new OfflineManager();

/**
 * React hook for offline status
 */
export function useOffline(): boolean {
  if (typeof window === "undefined") return false;

  const [isOnline, setIsOnline] = React.useState(offlineManager.getOnlineStatus());

  React.useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  return !isOnline; // Return offline status (inverse of online)
}

