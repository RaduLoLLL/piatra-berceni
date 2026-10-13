// Date pentru panoul de administrare, generate la fiecare publicare:
// - lista de categorii pentru câmpul „Categorie” din formularul de produs (public/admin/panou.js);
// - indexul pentru căutarea rapidă din panou, inclusiv produsele nepublicate.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCategorii, slugify } from '../../lib/date';
import { NUME_CULORI } from '../../lib/constante';

const numeFisier = (cale?: string) => (cale ?? '').split(/[\\/]/).pop()!.replace(/\.md$/, '');
const normalizeaza = (...parti: (string | number | undefined)[]) => slugify(parti.filter(Boolean).join(' ')).replace(/-/g, ' ');

export const GET: APIRoute = async () => {
	const produse = await getCollection('produse');
	const lucrari = await getCollection('lucrari');

	// Categoriile de pe site, plus cele folosite doar de produse nepublicate.
	const categorii = (await getCategorii()).map((c) => c.nume);
	for (const p of produse) {
		if (!categorii.some((c) => slugify(c) === slugify(p.data.categorie))) categorii.push(p.data.categorie.trim());
	}

	const cautare = [
		...produse.map((p) => ({
			tip: 'Produs',
			titlu: p.data.nume,
			detalii: [p.data.categorie, p.data.dimensiuni, p.data.publicat ? '' : 'nepublicat'].filter(Boolean).join(' · '),
			url: `#/collections/produse/entries/${numeFisier(p.filePath)}`,
			text: normalizeaza(p.data.nume, p.data.categorie, p.data.rezumat, p.data.dimensiuni, p.data.utilizare, p.data.grosime_cm && `${p.data.grosime_cm} cm`, ...p.data.culori.map((c) => NUME_CULORI[c] ?? c)),
		})),
		...lucrari.map((l) => ({
			tip: 'Lucrare',
			titlu: l.data.titlu,
			detalii: [l.data.localitate, l.data.publicat ? '' : 'nepublicată'].filter(Boolean).join(' · '),
			url: `#/collections/lucrari/entries/${numeFisier(l.filePath)}`,
			text: normalizeaza(l.data.titlu, l.data.localitate, ...l.data.produse),
		})),
	];

	return new Response(JSON.stringify({ categorii, cautare }), { headers: { 'Content-Type': 'application/json' } });
};
