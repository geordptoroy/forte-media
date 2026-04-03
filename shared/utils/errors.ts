/**
 * Utilitários de tratamento de erros
 * Utilizados tanto no frontend quanto no backend
 */

// ============================================================================
// Tipos de Erro
// ============================================================================

export enum ErrorCode {
  // Autenticação e Autorização
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Validação
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Recursos
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Meta API
  META_API_ERROR = "META_API_ERROR",
  INVALID_META_TOKEN = "INVALID_META_TOKEN",
  META_RATE_LIMIT = "META_RATE_LIMIT",

  // Banco de Dados
  DATABASE_ERROR = "DATABASE_ERROR",
  DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE",

  // Servidor
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================================================
// Funções de Erro
// ============================================================================

export function createUnauthorizedError(message: string = "Unauthorized"): AppError {
  return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
}

export function createForbiddenError(message: string = "Forbidden"): AppError {
  return new AppError(ErrorCode.FORBIDDEN, message, 403);
}

export function createValidationError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
}

export function createNotFoundError(resource: string): AppError {
  return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
}

export function createConflictError(message: string): AppError {
  return new AppError(ErrorCode.CONFLICT, message, 409);
}

export function createMetaApiError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(ErrorCode.META_API_ERROR, message, 502, details);
}

export function createDatabaseError(message: string = "Database error"): AppError {
  return new AppError(ErrorCode.DATABASE_ERROR, message, 500);
}

export function createInternalError(message: string = "Internal server error"): AppError {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, 500);
}

// ============================================================================
// Tratamento de Erros
// ============================================================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return ErrorCode.INTERNAL_ERROR;
}

export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}
