// Trimitere de emailuri prin Resend (resend.com). Folosit de formularul de ofertă și de codul de logare în panou.
// Variabile: RESEND_API_KEY (secret), EMAIL_DE_LA (expeditor pe un domeniu verificat în Resend).

export const emailConfigurat = (env) => Boolean(env.RESEND_API_KEY && env.EMAIL_DE_LA);

export async function trimiteEmail(env, { catre, subiect, text, raspunsLa }) {
	const r = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: env.EMAIL_DE_LA,
			to: [catre],
			reply_to: raspunsLa,
			subject: subiect,
			text,
		}),
	});
	if (!r.ok) {
		console.error('Resend a răspuns', r.status, await r.text());
		return false;
	}
	return true;
}
