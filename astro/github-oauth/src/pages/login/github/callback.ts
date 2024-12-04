import { initializeLucia } from "../../../lib/auth";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";

import type { APIContext } from "astro";
import type { DatabaseUser } from "../../../lib/db";
import { GitHub } from "arctic";

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("github_oauth_state")?.value ?? null;
	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const { D1, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.locals.runtime.env;
		const lucia = initializeLucia(D1)
		const github = new GitHub(
			GITHUB_CLIENT_ID,
			GITHUB_CLIENT_SECRET,
		);
		const tokens = await github.validateAuthorizationCode(code);
		const githubUserResponse = await fetch("https://api.github.com/user", {
			headers: {
				'User-Agent': context.request.headers.get('user-agent') ?? "",
				Authorization: `Bearer ${tokens.accessToken}`,
			}
		});
		const githubUser: GitHubUser = await githubUserResponse.json();
		const existingUser = await D1.prepare("SELECT * FROM user WHERE github_id = ?").bind(githubUser.id).first() as
			| DatabaseUser
			| undefined;

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
			return context.redirect("/");
		}

		const userId = generateId(15);
		await D1.prepare("INSERT INTO user (id, github_id, username) VALUES (?, ?, ?)").bind(
			userId,
			githubUser.id,
			githubUser.login
		).run();
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
		return context.redirect("/");
	} catch (e) {
		if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GitHubUser {
	id: string;
	login: string;
}
