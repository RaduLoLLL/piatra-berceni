import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';
import { FORME, type Forma } from './constante';
import firmaJson from '../data/firma.json';
import categoriiJson from '../data/categorii.json';
import acasaJson from '../data/acasa.json';
import serviciiJson from '../data/servicii.json';

// Fișierele din src/data sunt editate din panoul de administrare.
// Le validăm aici, ca o greșeală de editare să oprească publicarea, nu să strice site-ul.

const gol = (v: unknown) => (v === '' || v === null ? undefined : v);

const firma = z
	.object({
		nume: z.string(),
		nume_scurt: z.string(),
		slogan: z.string(),
		telefon: z.string(),
		telefon_link: z.string(),
		whatsapp: z.string().default(''),
		email: z.string(),
		adresa: z.string(),
		localitate: z.string(),
		judet: z.string(),
		cod_postal: z.string().default(''),
		latitudine: z.coerce.number().optional(),
		longitudine: z.coerce.number().optional(),
		link_google_maps: z.string(),
		link_recenzii_google: z.string().default(''),
		facebook: z.string().default(''),
		program: z.array(z.object({ zile: z.string(), ore: z.string() })),
		cui: z.string().default(''),
		reg_com: z.string().default(''),
	})
	.parse(firmaJson);

const categoriiSetari = z
	.object({
		categorii: z
			.array(
				z.object({
					nume: z.string().min(1),
					descriere: z.preprocess(gol, z.string().default('')),
					forma: z.preprocess(gol, z.enum(FORME).optional()),
					imagine: z.preprocess(gol, z.string().optional()),
				}),
			)
			.default([]),
	})
	.parse(categoriiJson).categorii;

const acasa = z
	.object({
		titlu: z.string(),
		subtitlu: z.string(),
		imagine: z.preprocess(gol, z.string().optional()),
		avantaje: z.array(z.object({ titlu: z.string(), text: z.string() })).default([]),
	})
	.parse(acasaJson);

const servicii = z
	.object({
		intro: z.string(),
		servicii: z.array(z.object({ titlu: z.string(), text: z.string() })).default([]),
	})
	.parse(serviciiJson);

export { firma, acasa, servicii };
export type Produs = CollectionEntry<'produse'>;
export type Lucrare = CollectionEntry<'lucrari'>;
export type Categorie = { slug: string; nume: string; descriere: string; forma: Forma; imagine?: ImageMetadata };

/** "Piatră decorativă" → "piatra-decorativa". Folosit pentru adrese și pentru a potrivi categoriile după nume. */
export const slugify = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

// Fotografiile încărcate din panou în câmpurile din src/data (categorii, prima pagină) sunt salvate ca
// "/src/assets/...". Le căutăm aici ca să treacă prin optimizarea de imagini a lui Astro.
const imaginiData = import.meta.glob<{ default: ImageMetadata }>('/src/assets/{categorii,acasa}/*.{jpg,jpeg,png,webp,avif}', {
	eager: true,
});
export function imagineDinCale(cale?: string): ImageMetadata | undefined {
	if (!cale) return undefined;
	const gasita = imaginiData[cale.startsWith('/') ? cale : `/${cale}`];
	if (!gasita) throw new Error(`Imaginea "${cale}" nu există în src/assets/categorii sau src/assets/acasa`);
	return gasita.default;
}

export const imagineAcasa = imagineDinCale(acasa.imagine);

export async function getProduse(): Promise<Produs[]> {
	const produse = await getCollection('produse', (p) => p.data.publicat);
	return produse.sort((a, b) => a.data.ordine - b.data.ordine || a.data.nume.localeCompare(b.data.nume, 'ro'));
}

/**
 * Categoriile din Setări → Categorii (în ordinea de acolo), plus categoriile noi scrise direct
 * în formularul unui produs, care apar automat, în ordine alfabetică.
 */
export async function getCategorii(): Promise<Categorie[]> {
	const produse = await getProduse();
	const rezultat: Categorie[] = [];
	const vazute = new Set<string>();

	for (const c of categoriiSetari) {
		const slug = slugify(c.nume);
		if (vazute.has(slug)) continue;
		vazute.add(slug);
		const primul = produse.find((p) => slugCategorie(p) === slug);
		rezultat.push({
			slug,
			nume: c.nume,
			descriere: c.descriere,
			forma: c.forma ?? primul?.data.forma ?? 'dreptunghi',
			imagine: imagineDinCale(c.imagine),
		});
	}

	const noi = new Map<string, Produs>();
	for (const p of produse) {
		const slug = slugCategorie(p);
		if (!vazute.has(slug) && !noi.has(slug)) noi.set(slug, p);
	}
	for (const [slug, p] of [...noi].sort((a, b) => a[1].data.categorie.localeCompare(b[1].data.categorie, 'ro'))) {
		rezultat.push({ slug, nume: p.data.categorie.trim(), descriere: '', forma: p.data.forma });
	}
	return rezultat;
}

export async function getLucrari(): Promise<Lucrare[]> {
	const lucrari = await getCollection('lucrari', (l) => l.data.publicat);
	return lucrari.sort((a, b) => b.data.data.getTime() - a.data.data.getTime());
}

export const slugCategorie = (p: Produs) => slugify(p.data.categorie);
export const urlCategorie = (slug: string) => `/produse/${slug}/`;
export const urlProdus = (p: Produs) => `/produse/${slugCategorie(p)}/${p.id}/`;
export const urlOferta = (produs?: string) =>
	produs ? `/contact/?produs=${encodeURIComponent(produs)}#oferta` : '/contact/#oferta';

export function formatPret(p: Produs): string | undefined {
	if (!p.data.pret) return undefined;
	const valoare = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(p.data.pret);
	return `${valoare} lei / ${p.data.unitate_pret}`;
}

export const linkWhatsapp = (mesaj = '') =>
	firma.whatsapp ? `https://wa.me/${firma.whatsapp}${mesaj ? `?text=${encodeURIComponent(mesaj)}` : ''}` : '';
