import { Lucia } from "lucia";
import { GitHub } from "arctic";

import type { DatabaseUser } from "./db";
import { D1Adapter } from "@lucia-auth/adapter-sqlite";

export function initializeLucia(D1: D1Database) {
	const adapter = new D1Adapter(D1, {
		user: "user",
		session: "session"
	});
	console.log(import.meta.env)
	return new Lucia(adapter, {
		sessionCookie: {
			attributes: {
				// set to `true` when using HTTPS
				secure: false // import.meta.env.PROD
			}
		},
		getUserAttributes: (attributes) => {
			return {
				githubId: attributes.github_id,
				username: attributes.username
			};
		}
	});
}

declare module "lucia" {
	interface Register {
		Lucia: ReturnType<typeof initializeLucia>;
		DatabaseUserAttributes: Omit<DatabaseUser, "id">;
	}
}
