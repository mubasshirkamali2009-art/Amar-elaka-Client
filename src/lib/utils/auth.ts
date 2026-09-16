import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

// This file runs on the Next.js SERVER only (never sent to the browser),
// so it's safe to use these secrets here.
const client = new MongoClient(process.env.MONGO_DB_URI as string);
const db = client.db("territoryRunDB");

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL, // should be your Next.js URL now

    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {},

    database: mongodbAdapter(db, {
        client,
    }),
});