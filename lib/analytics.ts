/**
 * Analytics and Performance Monitoring
 * Tracks user interactions and performance metrics
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private isEnabled: boolean;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.isEnabled = process.env.NODE_ENV === "production";
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", eventName, properties);
      }
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Send to analytics service (e.g., Google Analytics, Plausible, etc.)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", eventName, properties);
    }

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    this.track("page_view", { path, title });
  }

  /**
   * Track exam start
   */
  examStart(examId: string, examType: string) {
    this.track("exam_start", { examId, examType });
  }

  /**
   * Track exam completion
   */
  examComplete(examId: string, score: number, duration: number) {
    this.track("exam_complete", { examId, score, duration });
  }

  /**
   * Track lesson view
   */
  lessonView(lessonId: string, language: string) {
    this.track("lesson_view", { lessonId, language });
  }

  /**
   * Track user sign up
   */
  signUp(method: "email" | "google") {
    this.track("sign_up", { method });
  }

  /**
   * Track user login
   */
  login(method: "email" | "google") {
    this.track("login", { method });
  }

  /**
   * Track error
   */
  error(error: Error, context?: string) {
    this.track("error", {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * Track performance metric
   */
  performance(metricName: string, value: number, unit: string = "ms") {
    this.track("performance", { metricName, value, unit });
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear() {
    this.events = [];
  }
}

// Singleton instance
export const analytics = new Analytics();

// Performance monitoring
if (typeof window !== "undefined") {
  // Track Core Web Vitals
  if ("PerformanceObserver" in window) {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        analytics.performance("LCP", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          analytics.performance("FID", entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        analytics.performance("CLS", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      // Performance Observer not supported
    }
  }

  // Track page load time
  window.addEventListener("load", () => {
    if (window.performance && window.performance.timing) {
      const loadTime =
        window.performance.timing.loadEventEnd -
        window.performance.timing.navigationStart;
      analytics.performance("page_load", loadTime);
    }
  });
}

