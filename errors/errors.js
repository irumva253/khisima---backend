
export class TooManyRequestsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TooManyRequestsError';
    this.statusCode = 429;
    this.isOperational = true;
  }
}