import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { FORME, UNITATI } from './lib/constante';

// Decap CMS scrie "" sau null pentru câmpurile opționale lăsate goale.
const gol = (v: unknown) => (v === '' || v === null ? undefined : v);
const numarOptional = z.preprocess(gol, z.coerce.number().positive().optional());
const textOptional = z.preprocess(gol, z.string().optional());

const produse = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/produse' }),
	schema: ({ image }) =>
		z.object({
			nume: z.string(),
			categorie: z.string(),
			publicat: z.boolean().default(true),
			recomandat: z.boolean().default(false),
			ordine: z.coerce.number().default(100),
			rezumat: z.string(),
			// Folosită pentru desenul de rezervă când produsul nu are încă fotografii.
			forma: z.enum(FORME).default('dreptunghi'),
			imagini: z.preprocess(gol, z.array(image()).default([])),
			culori: z.preprocess(gol, z.array(z.string()).default([])),
			grosime_cm: numarOptional,
			dimensiuni: textOptional,
			buc_mp: numarOptional,
			greutate_kg_mp: numarOptional,
			utilizare: textOptional,
			pret: numarOptional,
			unitate_pret: z.preprocess(gol, z.enum(UNITATI).default('m²')),
			fisa_tehnica: textOptional,
		}),
});

const lucrari = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/lucrari' }),
	schema: ({ image }) =>
		z.object({
			titlu: z.string(),
			publicat: z.boolean().default(true),
			exemplu: z.boolean().default(false),
			data: z.coerce.date(),
			localitate: z.string(),
			suprafata_mp: numarOptional,
			produse: z.preprocess(gol, z.array(z.string()).default([])),
			forma: z.enum(FORME).default('spic'),
			imagini: z.preprocess(gol, z.array(image()).default([])),
		}),
});

const pagini = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pagini' }),
	schema: z.object({
		titlu: z.string(),
		descriere: z.string(),
	}),
});

export const collections = { produse, lucrari, pagini };
