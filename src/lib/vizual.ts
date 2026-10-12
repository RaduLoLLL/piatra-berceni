import type { Forma } from './constante';
import { urlModel } from './modele';
import type { Categorie, Lucrare, Produs } from './date';

// Ce desen de rezervă primește fiecare tip de pagină. Endpoint-ul /modele/ generează exact aceste combinații.

/** Fundalul mare din prima pagină și de pe harta din Contact: un singur desen lat, fără repetare. */
export const MODEL_FUNDAL: { forma: Forma; culori: string[] } = { forma: 'spic', culori: ['gri', 'antracit'] };
export const URL_FUNDAL = '/modele/fundal.svg';

export const modelProdus = (p: Produs) => ({ forma: p.data.forma, culori: p.data.culori });

export function modelCategorie(c: Categorie, produse: Produs[]) {
	const primul = produse.find((p) => p.data.categorie === c.slug);
	return { forma: c.forma, culori: primul?.data.culori.slice(0, 2) ?? ['gri'] };
}

export const modelLucrare = (l: Lucrare) => ({ forma: l.data.forma, culori: ['gri', 'rosu'] });

export const srcModel = (m: { forma: Forma; culori: string[] }) => urlModel(m.forma, m.culori);
