const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL, // e.g. http://localhost:3000
});