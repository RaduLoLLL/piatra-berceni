// Date structurate schema.org, ca Google să înțeleagă firma, produsele și structura site-ului.
import { firma } from './date';

const ZILE: Record<string, string[]> = {
	luni: ['Monday'],
	marti: ['Tuesday'],
	miercuri: ['Wednesday'],
	joi: ['Thursday'],
	vineri: ['Friday'],
	sambata: ['Saturday'],
	duminica: ['Sunday'],
};
const ORDINE = Object.keys(ZILE);

const faraDiacritice = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Transformă "Luni – Vineri" / "08:00 – 18:00" în formatul schema.org. Rândurile pe care nu le înțelege sunt ignorate. */
function programSchema() {
	return firma.program.flatMap(({ zile, ore }) => {
		const ora = ore.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
		if (!ora) return [];
		const capete = faraDiacritice(zile).split(/\s*[–-]\s*/).map((z) => z.trim());
		const start = ORDINE.indexOf(capete[0]);
		const sfarsit = ORDINE.indexOf(capete[capete.length - 1]);
		if (start < 0 || sfarsit < start) return [];
		return [
			{
				'@type': 'OpeningHoursSpecification',
				dayOfWeek: ORDINE.slice(start, sfarsit + 1).flatMap((z) => ZILE[z]),
				opens: ora[1].padStart(5, '0'),
				closes: ora[2].padStart(5, '0'),
			},
		];
	});
}

export function schemaFirma(site: URL) {
	return {
		'@type': 'HomeAndConstructionBusiness',
		'@id': new URL('/#firma', site).href,
		name: firma.nume,
		url: site.href,
		telephone: firma.telefon_link,
		email: firma.email,
		address: {
			'@type': 'PostalAddress',
			streetAddress: firma.adresa,
			addressLocality: firma.localitate,
			addressRegion: firma.judet,
			postalCode: firma.cod_postal || undefined,
			addressCountry: 'RO',
		},
		geo:
			firma.latitudine && firma.longitudine
				? { '@type': 'GeoCoordinates', latitude: firma.latitudine, longitude: firma.longitudine }
				: undefined,
		openingHoursSpecification: programSchema(),
		areaServed: ['Ilfov', 'București'],
		sameAs: [firma.facebook].filter(Boolean),
	};
}

export function schemaFirimituri(site: URL, pasi: { nume: string; url: string }[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: pasi.map((p, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: p.nume,
			item: new URL(p.url, site).href,
		})),
	};
}
