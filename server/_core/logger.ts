import { EventEmitter } from "events";
import { ENV } from "./env";

/**
 * Event-Driven Logging and Tracing System
 * Handles both standard logging and real-time event emission for Meta API calls.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const currentLogLevel = LOG_LEVEL_MAP[ENV.logLevel.toLowerCase()] ?? LogLevel.INFO;

export interface MetaApiEvent {
  userId: number;
  timestamp: string;
  type: "request" | "response" | "error" | "status";
  service: "ad_library" | "marketing_api";
  action: string;
  payload?: any;
  duration?: number;
}

class Logger extends EventEmitter {
  private format(level: string, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: any) {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.debug(this.format("debug", message, context));
    }
  }

  info(message: string, context?: any) {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(this.format("info", message, context));
    }
  }

  warn(message: string, context?: any) {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(this.format("warn", message, context));
    }
  }

  error(message: string, context?: any) {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(this.format("error", message, context));
    }
  }

  /**
   * Traces a Meta API event and emits it for SSE subscribers.
   */
  traceMeta(event: MetaApiEvent) {
    const level = event.type === "error" ? "error" : "info";
    this[level](`Meta API ${event.type.toUpperCase()} | ${event.service} | ${event.action}`, {
      userId: event.userId,
      duration: event.duration,
      error: event.type === "error" ? event.payload : undefined,
    });

    // Emit event for real-time streaming
    this.emit(`meta_event:${event.userId}`, event);
  }
}

export const logger = new Logger();
