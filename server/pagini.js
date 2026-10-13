// Paginile din fereastra de logare a panoului (deschisă de Decap CMS).

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function paginaLogin(continut, { status = 200, antete = {} } = {}) {
	return new Response(
		`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Intră în panou</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:#f8f6f2;color:#1b1a18;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:380px;padding:32px 28px;background:#fff;border-top:4px solid #b8402a;box-shadow:0 12px 32px rgba(0,0,0,.08)}
h1{margin:0 0 6px;font-size:22px}p{margin:0 0 18px;color:#66605a}label{display:block;margin-bottom:6px;font-weight:600;font-size:14px}
input{width:100%;height:48px;margin-bottom:16px;padding:0 14px;border:1px solid #cdc7bb;border-radius:4px;font:inherit;font-size:17px}
input:focus{outline:2px solid #b8402a;border-color:#b8402a}input.cod{letter-spacing:.4em;text-align:center;font-size:24px;font-weight:600}
button{width:100%;height:48px;border:0;border-radius:4px;background:#b8402a;color:#fff;font:inherit;font-weight:700;cursor:pointer}button:hover{background:#93311f}
.eroare{padding:10px 12px;border-radius:4px;background:#fdecea;color:#8a1c10}.mic{margin:20px 0 0;font-size:13px;text-align:center}a{color:#b8402a}
</style></head><body><main>${continut}</main></body></html>`,
		{ status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...antete } },
	);
}

export function formularEmail({ eroare = '', email = '' } = {}) {
	return `<h1>Intră în panou</h1>
<p>Scrie adresa de email și îți trimitem un cod de acces.</p>
${eroare ? `<p class="eroare">${escape(eroare)}</p>` : ''}
<form method="post" action="/api/cod">
<label for="email">Email</label>
<input id="email" name="email" type="email" required autocomplete="email" autofocus value="${escape(email)}">
<button type="submit">Trimite codul</button>
</form>
<p class="mic"><a href="/api/github">Dezvoltator? Intră cu GitHub</a></p>`;
}

export function formularCod({ email, eroare = '' }) {
	return `<h1>Verifică emailul</h1>
<p>Dacă <strong>${escape(email)}</strong> are acces la panou, ți-am trimis un cod de 6 cifre. E valabil 10 minute.</p>
${eroare ? `<p class="eroare">${escape(eroare)}</p>` : ''}
<form method="post" action="/api/verifica">
<label for="cod">Cod</label>
<input id="cod" class="cod" name="cod" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code" autofocus>
<button type="submit">Intră</button>
</form>
<p class="mic"><a href="/api/auth">Altă adresă sau cod nou</a></p>`;
}

/**
 * Pasul final: transmite rezultatul ferestrei panoului, după protocolul Decap CMS
 * („authorizing:github”, apoi „authorization:github:success:{token}”).
 */
export function predaPanoului(mesaj, rezultat, antete = {}) {
	// "<" este codificat ca să nu poată închide eticheta <script>.
	const sigur = JSON.stringify(rezultat).replace(/</g, '\\u003c');
	return paginaLogin(
		`<h1>${escape(mesaj)}</h1><p>Fereastra se închide singură.</p><script>
(function () {
	function primeste(e) {
		if (e.origin !== location.origin) return;
		window.removeEventListener('message', primeste);
		window.opener.postMessage(${sigur}, e.origin);
	}
	window.addEventListener('message', primeste);
	window.opener.postMessage('authorizing:github', location.origin);
})();
</script>`,
		{ antete },
	);
}
