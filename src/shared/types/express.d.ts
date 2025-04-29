// Extend Express Request type
declare namespace Express {
  interface Request {
    id?: string;
    _startTime?: number;
  }
}
