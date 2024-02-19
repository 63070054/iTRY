import { ITryActivity } from "@/app/utils/ManageActivityPage/activity";
import { Notification } from "@/app/utils/ManageEmail/email";
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name: string;
      email: string;
      notifications: Notification[];
      activitiesFollow: ITryActivity[];
    } & DefaultSession
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    name: string;
    email: string;
    notifications: Notification[];
    activitiesFollow: ITryActivity[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    name: string;
    email: string;
    notifications: Notification[];
    activitiesFollow: ITryActivity[];
  }
}