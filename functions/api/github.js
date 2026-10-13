// Logare cu GitHub pentru dezvoltator (pasul 1: trimite utilizatorul la GitHub). Clientul folosește codul pe email (auth.js).
//
// Variabile de mediu (Cloudflare Pages):
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET  dintr-o aplicație OAuth GitHub
//   (GitHub → Settings → Developer settings → OAuth Apps), cu
//   "Authorization callback URL" = https://<domeniu>/api/callback

export async function onRequestGet({ request, env }) {
	if (!env.GITHUB_CLIENT_ID) {
		return new Response('GITHUB_CLIENT_ID nu este configurat.', { status: 500 });
	}
	const url = new URL(request.url);
	const stare = crypto.randomUUID();
	const github = new URL('https://github.com/login/oauth/authorize');
	github.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
	github.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
	github.searchParams.set('scope', 'repo,user');
	github.searchParams.set('state', stare);

	return new Response(null, {
		status: 302,
		headers: {
			Location: github.toString(),
			'Set-Cookie': `oauth_stare=${stare}; Path=/api/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
		},
	});
}
