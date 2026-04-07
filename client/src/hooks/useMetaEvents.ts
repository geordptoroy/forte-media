import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Meta API Event Structure
 */
export interface MetaApiEvent {
  userId: number;
  timestamp: string;
  type: "request" | "response" | "error" | "status";
  service: "ad_library" | "marketing_api";
  action: string;
  payload?: any;
  duration?: number;
}

interface UseMetaEventsOptions {
  enabled?: boolean;
  onEvent?: (event: MetaApiEvent) => void;
  onRequest?: (event: MetaApiEvent) => void;
  onResponse?: (event: MetaApiEvent) => void;
  onError?: (event: MetaApiEvent) => void;
}

/**
 * Hook to consume real-time Meta API events via SSE.
 * Provides live feedback for long-running API calls.
 */
export function useMetaEvents(options: UseMetaEventsOptions = {}) {
  const { enabled = true, onEvent, onRequest, onResponse, onError } = options;
  const [events, setEvents] = useState<MetaApiEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<MetaApiEvent | null>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;

    const connect = () => {
      // Use absolute path which is proxied by Nginx
      eventSource = new EventSource("/api/meta/events");

      eventSource.onopen = () => {
        setIsConnected(true);
        retryCount = 0;
        console.log("[MetaEvents] SSE Connected");
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        console.error("[MetaEvents] SSE Error:", err);
        eventSource?.close();

        // Exponential backoff retry
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryCount++;
          setTimeout(connect, delay);
        }
      };

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          
          // Handle initial connection event
          if (data.type === "connected") return;

          const event = data as MetaApiEvent;
          setLastEvent(event);
          setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events

          // Callbacks
          if (onEvent) onEvent(event);
          
          switch (event.type) {
            case "request":
              if (onRequest) onRequest(event);
              break;
            case "response":
              if (onResponse) onResponse(event);
              break;
            case "error":
              if (onError) onError(event);
              toast.error(`Meta API Error: ${event.payload?.error || "Unknown error"}`);
              break;
          }
        } catch (err) {
          console.error("[MetaEvents] Failed to parse event data:", err);
        }
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
        console.log("[MetaEvents] SSE Closed");
      }
    };
  }, [enabled, onEvent, onRequest, onResponse, onError]);

  return {
    events,
    isConnected,
    lastEvent,
    clearEvents,
  };
}
