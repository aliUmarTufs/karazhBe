export interface JwtPayload {
  email: string;
  sub: string; // Adjust type if your user ID is not a number
  userId: string;
}
