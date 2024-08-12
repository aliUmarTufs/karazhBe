export interface JwtPayload {
    email: string;
    sub: number; // Adjust type if your user ID is not a number
  }