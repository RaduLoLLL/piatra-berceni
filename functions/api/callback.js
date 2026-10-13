// Logare cu GitHub pentru dezvoltator (pasul 2): GitHub se întoarce aici cu un cod,
// îl schimbăm pe un token și îl trimitem ferestrei panoului.
import { predaPanoului } from '../../server/pagini.js';

const sterge = { 'Set-Cookie': 'oauth_stare=; Path=/api/callback; Max-Age=0' };
const eroare = (mesaj) => predaPanoului('Autentificare eșuată', 'authorization:github:error:' + JSON.stringify({ message: mesaj }), sterge);

export async function onRequestGet({ request, env }) {
	const url = new URL(request.url);
	const cod = url.searchParams.get('code');
	const stare = url.searchParams.get('state');
	const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_stare=([^;]+)/)?.[1];

	if (!cod || !stare || stare !== cookie) return eroare('Stare invalidă');

	const raspuns = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'piatra-berceni-cms' },
		body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: cod }),
	});
	const date = await raspuns.json().catch(() => ({}));
	if (!date.access_token) return eroare(date.error_description || 'Eroare GitHub');

	return predaPanoului('Autentificare reușită', 'authorization:github:success:' + JSON.stringify({ token: date.access_token, provider: 'github' }), sterge);
}
