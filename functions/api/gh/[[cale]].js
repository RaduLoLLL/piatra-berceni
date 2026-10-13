// Intermediar între panou (Decap CMS) și API-ul GitHub. Panoul îl folosește prin `api_root` (src/pages/admin/index.astro).
//
// - Cu o sesiune de client (cod pe email): verifică sesiunea și face cererea cu cheia temporară a aplicației GitHub.
//   Clientul nu primește niciodată o cheie GitHub.
// - Cu o cheie GitHub obișnuită (logarea dezvoltatorului): o transmite mai departe neschimbată.
// În ambele cazuri, sunt permise doar cererile către depozitul site-ului.
import { antetGithub, cheieInstalare, esteSesiune, repo, verificaSesiune } from '../../../server/autentificare.js';

const json = (date, status = 200) => new Response(JSON.stringify(date), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequest({ request, env, params }) {
	const cale = (params.cale || []).join('/');
	const url = new URL(request.url);
	const token = (request.headers.get('Authorization') || '').replace(/^(token|bearer)\s+/i, '');
	const depozit = `repos/${repo(env)}`;

	// Fără segmente „..” sau goale, care ar putea ieși din depozitul permis.
	const segmenteSigure = (params.cale || []).every((s) => s && s !== '.' && s !== '..' && !s.includes('/'));
	if (!segmenteSigure || (cale !== 'user' && cale !== depozit && !cale.startsWith(`${depozit}/`))) {
		return json({ message: 'Cerere nepermisă' }, 403);
	}

	let autorizare = request.headers.get('Authorization');
	let email = null;
	if (esteSesiune(token)) {
		email = await verificaSesiune(env, token);
		// 401 face panoul să ceară din nou logarea.
		if (!email) return json({ message: 'Sesiunea a expirat. Autentifică-te din nou.' }, 401);

		// Decap cere datele utilizatorului; cheia aplicației nu are acces la ele, așa că le dăm noi.
		if (cale === 'user') {
			return json({ login: email.split('@')[0], name: email, email, avatar_url: '' });
		}
		try {
			autorizare = `Bearer ${await cheieInstalare(env)}`;
		} catch (e) {
			console.error(e);
			return json({ message: 'Panoul nu se poate conecta la GitHub. Contactează dezvoltatorul.' }, 502);
		}
	}

	const antete = antetGithub(autorizare);
	const tip = request.headers.get('Content-Type');
	if (tip) antete['Content-Type'] = tip;
	// Accept contează: Decap cere uneori conținutul brut al fișierelor (application/vnd.github.v3.raw).
	for (const nume of ['Accept', 'If-None-Match', 'If-Modified-Since']) {
		const v = request.headers.get(nume);
		if (v) antete[nume] = v;
	}

	const caleCodificata = params.cale.map(encodeURIComponent).join('/');
	const raspuns = await fetch(`https://api.github.com/${caleCodificata}${url.search}`, {
		method: request.method,
		headers: antete,
		body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
	});

	// Decap verifică dacă utilizatorul poate scrie în depozit; cheia aplicației nu primește câmpul `permissions`.
	if (email && cale === depozit && request.method === 'GET' && raspuns.ok) {
		const date = await raspuns.json();
		return json({ ...date, permissions: { admin: false, maintain: false, push: true, triage: false, pull: true } });
	}

	const iesire = new Headers();
	for (const nume of ['Content-Type', 'ETag', 'Last-Modified', 'Link', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']) {
		const v = raspuns.headers.get(nume);
		if (v) iesire.set(nume, v);
	}
	iesire.set('Cache-Control', 'no-store');
	return new Response(raspuns.body, { status: raspuns.status, headers: iesire });
}
