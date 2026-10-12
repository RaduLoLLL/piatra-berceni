// Cloudflare Pages Function: primește formularul de ofertă și îl trimite pe email prin Resend (resend.com).
//
// Variabile de mediu (Cloudflare Pages → Settings → Variables and Secrets):
//   RESEND_API_KEY  cheia API de la Resend (secret)
//   EMAIL_CATRE     adresa unde ajung cererile, ex. contact@firma.ro
//   EMAIL_DE_LA     expeditorul, pe un domeniu verificat în Resend, ex. "Site Piatra Berceni <site@firma.ro>"

const LIMITE = { nume: 100, telefon: 30, email: 120, localitate: 80, produs: 120, suprafata: 20, mesaj: 2000 };

const curat = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);
const oLinie = (v) => v.replace(/\s+/g, ' ');

function redirect(request, cale) {
	return Response.redirect(new URL(cale, request.url).toString(), 303);
}

export async function onRequestPost({ request, env }) {
	let form;
	try {
		form = await request.formData();
	} catch {
		return redirect(request, '/contact/?eroare=1#oferta');
	}

	// Roboții completează câmpul ascuns sau trimit formularul instantaneu. Le răspundem ca și cum ar fi mers.
	const t = Number(form.get('t'));
	if (form.get('website') || (t && Date.now() - t < 3000)) {
		return redirect(request, '/multumim/');
	}

	const date = Object.fromEntries(Object.entries(LIMITE).map(([camp, max]) => [camp, curat(form.get(camp), max)]));
	for (const camp of ['nume', 'telefon', 'email', 'localitate', 'produs', 'suprafata']) date[camp] = oLinie(date[camp]);

	if (!date.nume || !/\d{6,}/.test(date.telefon.replace(/\D/g, ''))) {
		return redirect(request, '/contact/?eroare=1#oferta');
	}

	if (!env.RESEND_API_KEY || !env.EMAIL_CATRE || !env.EMAIL_DE_LA) {
		console.error('Formular ofertă: lipsesc variabilele RESEND_API_KEY / EMAIL_CATRE / EMAIL_DE_LA');
		return redirect(request, '/contact/?eroare=2#oferta');
	}

	const text = [
		`Cerere de ofertă de pe site`,
		``,
		`Nume: ${date.nume}`,
		`Telefon: ${date.telefon}`,
		`Email: ${date.email || '-'}`,
		`Localitate: ${date.localitate || '-'}`,
		`Produs: ${date.produs || '-'}`,
		`Suprafață: ${date.suprafata ? `${date.suprafata} m²` : '-'}`,
		``,
		`Detalii:`,
		date.mesaj || '-',
	].join('\n');

	const raspuns = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: env.EMAIL_DE_LA,
			to: [env.EMAIL_CATRE],
			reply_to: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(date.email) ? date.email : undefined,
			subject: `Cerere ofertă: ${date.nume}${date.produs ? ` – ${date.produs}` : ''}`,
			text,
		}),
	});

	if (!raspuns.ok) {
		console.error('Formular ofertă: Resend a răspuns', raspuns.status, await raspuns.text());
		return redirect(request, '/contact/?eroare=2#oferta');
	}

	return redirect(request, '/multumim/');
}
