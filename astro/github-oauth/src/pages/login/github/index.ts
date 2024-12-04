import { generateState } from "arctic";
import { GitHub } from "arctic";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.locals.runtime.env;
	const github = new GitHub(
		GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET,
	);
	const state = generateState();
	const url = await github.createAuthorizationURL(state);

	context.cookies.set("github_oauth_state", state, {
		path: "/",
		secure: false,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return context.redirect(url.toString());
}
