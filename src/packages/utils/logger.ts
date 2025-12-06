type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private level: LogLevel;
  private prefix: string;

  /**
   * Constructor
   * @param options Logger options
   */
  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.prefix = options.prefix ?? "";
  }

  /**
   * Format log message
   * @param level Log level
   * @param message Message
   * @param meta Additional metadata
   * @returns Formatted message
   */
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}] ` : "";
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level.toUpperCase()} ${prefixStr}${message}${metaStr}`;
  }

  /**
   * Check if log level should be output
   * @param level Log level
   * @returns True if should log
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Log debug message
   * @param message Message
   * @param meta Additional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, meta));
    }
  }

  /**
   * Log info message
   * @param message Message
   * @param meta Additional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, meta));
    }
  }

  /**
   * Log warning message
   * @param message Message
   * @param meta Additional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, meta));
    }
  }

  /**
   * Log error message
   * @param message Message
   * @param meta Additional metadata
   */
  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message, meta));
    }
  }

  /**
   * Create child logger with prefix
   * @param prefix Prefix
   * @returns Child logger
   */
  child(prefix: string): Logger {
    const combinedPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({ level: this.level, prefix: combinedPrefix });
  }
}

export default Logger;
