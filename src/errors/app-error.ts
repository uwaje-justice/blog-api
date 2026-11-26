class AppError extends Error {
  readonly statusCode: number;
  readonly errors: Record<string, string>;

  constructor(statusCode: number, message: string, errors = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "AppError";
  }
}

export default AppError;
