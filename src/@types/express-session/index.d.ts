import "express-session";

declare module "express-session" {
  interface SessionData {
    admin?: {
      _id: unknown;
      email: string;
      firstName: string;
      lastName: string;
    };
  }
}