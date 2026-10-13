// Protejează datele panoului (/admin/date.json: lista de produse, inclusiv cele nepublicate, și categoriile).
// Se servesc doar cu o sesiune de client validă sau cu o cheie GitHub care poate scrie în depozit.
// Restul fișierelor din /admin (pagina panoului, configurarea, scriptul) trec neschimbate.
import { antetGithub, esteSesiune, repo, verificaSesiune } from '../../server/autentificare.js';

async function autorizat(env, token) {
	if (!token) return false;
	if (esteSesiune(token)) return Boolean(await verificaSesiune(env, token));
	// Logarea dezvoltatorului cu GitHub: verificăm la GitHub că are drept de scriere pe depozit.
	const r = await fetch(`https://api.github.com/repos/${repo(env)}`, { headers: antetGithub(`token ${token}`) });
	if (!r.ok) return false;
	const date = await r.json();
	return Boolean(date.permissions?.push);
}

export async function onRequest({ request, env, next }) {
	const cale = new URL(request.url).pathname.replace(/\/+$/, '');
	if (cale !== '/admin/date.json') return next();

	const token = (request.headers.get('Authorization') || '').replace(/^(token|bearer)\s+/i, '');
	if (!(await autorizat(env, token))) {
		return new Response(JSON.stringify({ message: 'Autentifică-te în panou.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
		});
	}
	const raspuns = await next();
	const antete = new Headers(raspuns.headers);
	antete.set('Cache-Control', 'private, no-store');
	return new Response(raspuns.body, { status: raspuns.status, headers: antete });
}
