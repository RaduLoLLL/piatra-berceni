// Verifică codul primit pe email și, dacă e corect, deschide panoul cu o sesiune semnată de 12 ore.
// După 5 coduri greșite, codul se anulează.
import { creeazaSesiune, egal, emailuriPermise, sha256 } from '../../server/autentificare.js';
import { formularCod, formularEmail, paginaLogin, predaPanoului } from '../../server/pagini.js';

const MAX_INCERCARI = 5;
const sterge = 'cms_cod=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

export async function onRequestPost({ request, env }) {
	const id = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)cms_cod=([0-9a-f-]{36})/)?.[1];
	const form = await request.formData().catch(() => null);
	const cod = String(form?.get('cod') || '').replace(/\D/g, '');
	const salvat = id && env.CMS_KV ? await env.CMS_KV.get(`cod:${id}`, 'json') : null;

	if (!salvat || salvat.expira < Date.now()) {
		return paginaLogin(formularEmail({ eroare: 'Codul a expirat sau nu mai e valabil. Cere unul nou.' }), { antete: { 'Set-Cookie': sterge } });
	}

	if (!egal(await sha256(`${id}:${cod}`), salvat.amprenta)) {
		salvat.incercari += 1;
		if (salvat.incercari >= MAX_INCERCARI) {
			await env.CMS_KV.delete(`cod:${id}`);
			return paginaLogin(formularEmail({ eroare: 'Prea multe încercări greșite. Cere un cod nou.', email: salvat.email }), {
				antete: { 'Set-Cookie': sterge },
			});
		}
		const ramas = Math.max(60, Math.floor((salvat.expira - Date.now()) / 1000));
		await env.CMS_KV.put(`cod:${id}`, JSON.stringify(salvat), { expirationTtl: ramas });
		return paginaLogin(formularCod({ email: salvat.email, eroare: `Cod greșit. Mai ai ${MAX_INCERCARI - salvat.incercari} încercări.` }));
	}

	await env.CMS_KV.delete(`cod:${id}`);
	if (!emailuriPermise(env).includes(salvat.email)) {
		return paginaLogin(formularEmail({ eroare: 'Această adresă nu mai are acces la panou.' }), { antete: { 'Set-Cookie': sterge } });
	}
	const token = await creeazaSesiune(env, salvat.email);
	return predaPanoului('Te-ai autentificat', 'authorization:github:success:' + JSON.stringify({ token, provider: 'github' }), { 'Set-Cookie': sterge });
}
