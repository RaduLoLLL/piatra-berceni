// Trimite codul de 6 cifre pe email. Codul (doar amprenta lui) stă în KV 10 minute.
// Răspunsul e același și pentru adresele fără acces, ca să nu se poată afla cine are cont.
import { emailuriPermise, sha256 } from '../../server/autentificare.js';
import { emailConfigurat, trimiteEmail } from '../../server/email.js';
import { formularCod, formularEmail, paginaLogin } from '../../server/pagini.js';

const VALABILITATE = 600; // secunde

export async function onRequestPost({ request, env }) {
	const form = await request.formData().catch(() => null);
	const email = String(form?.get('email') || '')
		.trim()
		.toLowerCase()
		.slice(0, 120);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return paginaLogin(formularEmail({ eroare: 'Adresa de email nu pare corectă.', email }));
	}
	if (!env.CMS_KV || !emailConfigurat(env)) {
		console.error('Logare panou: lipsește legătura CMS_KV sau configurarea Resend');
		return paginaLogin(formularEmail({ eroare: 'Logarea cu cod nu este încă configurată. Contactează dezvoltatorul.', email }));
	}

	const id = crypto.randomUUID();
	if (emailuriPermise(env).includes(email)) {
		// Cel mult un email pe minut pentru aceeași adresă.
		const recent = await env.CMS_KV.get(`trimis:${email}`);
		if (!recent) {
			const cod = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
			await env.CMS_KV.put(`cod:${id}`, JSON.stringify({ email, amprenta: await sha256(`${id}:${cod}`), incercari: 0, expira: Date.now() + VALABILITATE * 1000 }), {
				expirationTtl: VALABILITATE,
			});
			await env.CMS_KV.put(`trimis:${email}`, id, { expirationTtl: 60 });
			await trimiteEmail(env, {
				catre: email,
				subiect: `Codul tău de acces: ${cod}`,
				text: `Codul pentru panoul de administrare al site-ului este:\n\n${cod}\n\nEste valabil 10 minute. Dacă nu ai cerut tu acest cod, poți ignora emailul.`,
			});
		} else {
			// Un cod a fost trimis acum câteva secunde: păstrăm sesiunea aceea, ca acel cod să fie cel valabil.
			return paginaLogin(formularCod({ email }), { antete: { 'Set-Cookie': cookie(recent) } });
		}
	}
	return paginaLogin(formularCod({ email }), { antete: { 'Set-Cookie': cookie(id) } });
}

const cookie = (id) => `cms_cod=${id}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${VALABILITATE}`;
