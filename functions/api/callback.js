// Autentificare GitHub pentru panoul de administrare (pasul 2: GitHub se întoarce aici cu un cod,
// îl schimbăm pe un token și îl trimitem ferestrei panoului, după protocolul Decap CMS).

function pagina(mesaj, continut) {
	// "<" este codificat ca să nu poată închide eticheta <script>.
	const sigur = JSON.stringify(continut).replace(/</g, '\\u003c');
	return new Response(
		`<!doctype html><html lang="ro"><meta charset="utf-8"><title>Autentificare</title><body><p>${mesaj}</p><script>
(function () {
	function primeste(e) {
		if (e.origin !== location.origin) return;
		window.removeEventListener('message', primeste);
		window.opener.postMessage(${sigur}, e.origin);
	}
	window.addEventListener('message', primeste);
	window.opener.postMessage('authorizing:github', location.origin);
})();
</script></body></html>`,
		{ headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'oauth_stare=; Path=/api/callback; Max-Age=0' } },
	);
}

export async function onRequestGet({ request, env }) {
	const url = new URL(request.url);
	const cod = url.searchParams.get('code');
	const stare = url.searchParams.get('state');
	const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_stare=([^;]+)/)?.[1];

	if (!cod || !stare || stare !== cookie) {
		return pagina('Autentificare eșuată. Închide fereastra și încearcă din nou.', 'authorization:github:error:' + JSON.stringify({ message: 'Stare invalidă' }));
	}

	const raspuns = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'piatra-berceni-cms' },
		body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: cod }),
	});
	const date = await raspuns.json().catch(() => ({}));

	if (!date.access_token) {
		return pagina('Autentificare eșuată. Închide fereastra și încearcă din nou.', 'authorization:github:error:' + JSON.stringify({ message: date.error_description || 'Eroare GitHub' }));
	}

	return pagina('Autentificare reușită. Poți închide fereastra.', 'authorization:github:success:' + JSON.stringify({ token: date.access_token, provider: 'github' }));
}
