import { initializeLucia } from "../../lib/auth";

import type { APIContext } from "astro";

export async function POST(context: APIContext): Promise<Response> {
	const { D1 } = context.locals.runtime.env;
	const lucia = initializeLucia(D1)
	if (!context.locals.session) {
		return new Response(null, {
			status: 401
		});
	}

	await lucia.invalidateSession(context.locals.session.id);

	const sessionCookie = lucia.createBlankSessionCookie();
	context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

	return new Response();
}
