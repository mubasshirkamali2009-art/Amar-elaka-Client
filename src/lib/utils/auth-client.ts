import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL, // e.g. http://localhost:3000
});

// সরাসরি ব্যবহার সহজ করার জন্য এক্সপোর্ট করুন:
export const { useSession, signOut, signIn, signUp } = authClient;