import { getCollection, type CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import { FORME } from './constante';
import firmaJson from '../data/firma.json';
import categoriiJson from '../data/categorii.json';
import acasaJson from '../data/acasa.json';
import serviciiJson from '../data/servicii.json';

// Fișierele din src/data sunt editate din panoul de administrare.
// Le validăm aici, ca o greșeală de editare să oprească publicarea, nu să strice site-ul.

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

const categorii = z
	.object({
		categorii: z
			.array(
				z.object({
					slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug-ul poate conține doar litere mici, cifre și cratimă'),
					nume: z.string(),
					descriere: z.string(),
					forma: z.enum(FORME).default('dreptunghi'),
				}),
			)
			.min(1),
	})
	.parse(categoriiJson).categorii;

const acasa = z
	.object({
		titlu: z.string(),
		subtitlu: z.string(),
		avantaje: z.array(z.object({ titlu: z.string(), text: z.string() })).default([]),
	})
	.parse(acasaJson);

const servicii = z
	.object({
		intro: z.string(),
		servicii: z.array(z.object({ titlu: z.string(), text: z.string() })).default([]),
	})
	.parse(serviciiJson);

export { firma, categorii, acasa, servicii };
export type Categorie = (typeof categorii)[number];
export type Produs = CollectionEntry<'produse'>;
export type Lucrare = CollectionEntry<'lucrari'>;

export async function getProduse(): Promise<Produs[]> {
	const produse = await getCollection('produse', (p) => p.data.publicat);
	for (const p of produse) {
		if (!categorii.some((c) => c.slug === p.data.categorie)) {
			throw new Error(`Produsul "${p.data.nume}" are categoria "${p.data.categorie}", care nu există în categorii.json`);
		}
	}
	return produse.sort((a, b) => a.data.ordine - b.data.ordine || a.data.nume.localeCompare(b.data.nume, 'ro'));
}

export async function getLucrari(): Promise<Lucrare[]> {
	const lucrari = await getCollection('lucrari', (l) => l.data.publicat);
	return lucrari.sort((a, b) => b.data.data.getTime() - a.data.data.getTime());
}

export const urlCategorie = (slug: string) => `/produse/${slug}/`;
export const urlProdus = (p: Produs) => `/produse/${p.data.categorie}/${p.id}/`;
export const urlOferta = (produs?: string) =>
	produs ? `/contact/?produs=${encodeURIComponent(produs)}#oferta` : '/contact/#oferta';

export function formatPret(p: Produs): string | undefined {
	if (!p.data.pret) return undefined;
	const valoare = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(p.data.pret);
	return `${valoare} lei / ${p.data.unitate_pret}`;
}

export const linkWhatsapp = (mesaj = '') =>
	firma.whatsapp ? `https://wa.me/${firma.whatsapp}${mesaj ? `?text=${encodeURIComponent(mesaj)}` : ''}` : '';
