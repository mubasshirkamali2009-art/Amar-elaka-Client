import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // Same domain as the frontend now, since auth runs inside Next.js.
    // Can even be omitted entirely if it's the same origin.
    baseURL: "http://localhost:3000",
});