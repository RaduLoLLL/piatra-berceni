// Desene SVG cu modele de pavaj, folosite în locul fotografiilor cât timp un produs nu are poze.
// Se generează o singură dată la build, ca fișiere statice în /modele/, deci se descarcă o dată și rămân în cache.
import { CULORI } from './constante';
import type { Forma } from './constante';

export const LATIME = 400;
export const INALTIME = 300;

type Dreptunghi = { x: number; y: number; w: number; h: number };

export function slugModel(forma: Forma, culori: string[]): string {
	const c = culori.length ? culori : ['gri'];
	return `${forma}-${c.map((x) => x.replace(/\s+/g, '_')).join('-')}`;
}

export const urlModel = (forma: Forma, culori: string[]) => `/modele/${slugModel(forma, culori)}.svg`;

export function parseSlugModel(slug: string): { forma: Forma; culori: string[] } {
	const [forma, ...culori] = slug.split('-');
	return { forma: forma as Forma, culori: culori.map((c) => c.replace(/_/g, ' ')) };
}

function nuanta(hex: string, factor: number): string {
	const n = parseInt(hex.slice(1), 16);
	const canal = (v: number) => Math.max(0, Math.min(255, Math.round(factor >= 0 ? v + (255 - v) * factor : v * (1 + factor))));
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(canal);
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Generator pseudo-aleator determinist, ca desenul să fie identic la fiecare build. */
function aleator(samanta: number) {
	let s = samanta >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return (s >>> 0) / 4294967296;
	};
}

function paleta(culori: string[]): string[] {
	const baze = (culori.length ? culori : ['gri']).map((c) => CULORI[c] ?? CULORI.gri);
	return baze.flatMap((b) => [b, nuanta(b, 0.08), nuanta(b, -0.08), nuanta(b, 0.15)]);
}

// Culoarea unei piese depinde doar de poziția ei în perioada tiparului,
// astfel încât piesele tăiate la marginea tiparului au aceeași culoare pe ambele părți.
function culoarePiesa(culori: string[], x: number, y: number, perX: number, perY: number) {
	const p = paleta(culori);
	const kx = ((Math.round(x) % perX) + perX) % perX;
	const ky = ((Math.round(y) % perY) + perY) % perY;
	const r = aleator(kx * 7919 + ky * 104729 + 17)();
	return p[Math.floor(r * p.length)];
}

function tipar(id: string, latime: number, inaltime: number, piese: Dreptunghi[], culori: string[], u: number, transform = '') {
	const rost = Math.max(1, u * 0.09);
	const rects = piese
		.filter((d) => d.x < latime && d.y < inaltime && d.x + d.w > 0 && d.y + d.h > 0)
		.map((d) => {
			const fill = culoarePiesa(culori, d.x, d.y, latime, inaltime);
			return `<rect x="${d.x + rost / 2}" y="${d.y + rost / 2}" width="${d.w - rost}" height="${d.h - rost}" rx="${rost}" fill="${fill}"/>`;
		})
		.join('');
	return `<pattern id="${id}" width="${latime}" height="${inaltime}" patternUnits="userSpaceOnUse"${transform ? ` patternTransform="${transform}"` : ''}>${rects}</pattern>`;
}

function pieseRanduri(u: number, lung: number, perX: number, perY: number, decalat = true): Dreptunghi[] {
	// Rânduri de piese lungi (lung × 1); dacă e cazul, fiecare al doilea rând e decalat cu o jumătate de piesă.
	const piese: Dreptunghi[] = [];
	for (let r = 0; r < perY; r++) {
		const decalaj = decalat && r % 2 ? (lung * u) / 2 : 0;
		for (let x = -lung * u; x < perX * u + lung * u; x += lung * u) {
			piese.push({ x: x + decalaj, y: r * u, w: lung * u, h: u });
		}
	}
	return piese;
}

function pieseSpic(u: number, per: number): Dreptunghi[] {
	// Spic la 90°: scări de piese orizontale și verticale, repetate la fiecare 4 unități.
	const piese: Dreptunghi[] = [];
	for (let m = -per; m <= per; m++) {
		for (let k = -per; k <= per * 2; k++) {
			const x = k + 4 * m;
			piese.push({ x: x * u, y: k * u, w: 2 * u, h: u });
			piese.push({ x: x * u, y: (k + 1) * u, w: u, h: 2 * u });
		}
	}
	return piese;
}

function pietris(culori: string[], samanta: number): string {
	const rnd = aleator(samanta);
	const p = paleta(culori);
	const fundal = nuanta(CULORI[culori[0]] ?? CULORI.gri, -0.45);
	const T = 160;
	const pietre: string[] = [];
	for (let i = 0; i < 70; i++) {
		const x = rnd() * T;
		const y = rnd() * T;
		const rx = 6 + rnd() * 9;
		const ry = rx * (0.6 + rnd() * 0.3);
		const unghi = Math.round(rnd() * 180);
		const fill = p[Math.floor(rnd() * p.length)];
		for (const dx of [-T, 0, T]) {
			for (const dy of [-T, 0, T]) {
				const cx = x + dx;
				const cy = y + dy;
				if (cx + rx < 0 || cy + rx < 0 || cx - rx > T || cy - rx > T) continue;
				pietre.push(
					`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${unghi} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${fill}"/>`,
				);
			}
		}
	}
	return `<defs><pattern id="m" width="${T}" height="${T}" patternUnits="userSpaceOnUse"><rect width="${T}" height="${T}" fill="${fundal}"/>${pietre.join('')}</pattern></defs><rect width="${LATIME}" height="${INALTIME}" fill="url(#m)"/>`;
}

function pasi(culori: string[], samanta: number): string {
	const rnd = aleator(samanta);
	const p = paleta(culori);
	const pasi: string[] = [];
	for (let i = 0; i < 6; i++) {
		const t = i / 5;
		const cx = 60 + t * 280;
		const cy = 150 + Math.sin(t * Math.PI * 1.6) * 70;
		const puncte: string[] = [];
		const raza = 30 + rnd() * 8;
		for (let a = 0; a < 7; a++) {
			const unghi = (a / 7) * Math.PI * 2 + rnd() * 0.4;
			const r = raza * (0.8 + rnd() * 0.3);
			puncte.push(`${(cx + Math.cos(unghi) * r * 1.2).toFixed(1)},${(cy + Math.sin(unghi) * r).toFixed(1)}`);
		}
		pasi.push(`<polygon points="${puncte.join(' ')}" fill="${p[i % p.length]}" stroke="#00000022" stroke-width="2" stroke-linejoin="round"/>`);
	}
	return `<rect width="${LATIME}" height="${INALTIME}" fill="#6e8a4e"/><rect width="${LATIME}" height="${INALTIME}" fill="url(#iarba)"/><defs><pattern id="iarba" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M2 12 L4 4 M8 12 L9 2" stroke="#86a463" stroke-width="1.5"/></pattern></defs>${pasi.join('')}`;
}

export function svgModel(forma: Forma, culori: string[], latime = LATIME, inaltime = INALTIME): string {
	const c = culori.length ? culori : ['gri'];
	const samanta = [...forma, ...c.join()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
	const rost = nuanta(CULORI[c[0]] ?? CULORI.gri, -0.55);
	let continut: string;

	switch (forma) {
		case 'pietris':
			continut = pietris(c, samanta);
			break;
		case 'pasi':
			continut = pasi(c, samanta);
			break;
		default: {
			const config: Record<string, { u: number; piese: (u: number) => Dreptunghi[]; w: number; h: number; t?: string }> = {
				dreptunghi: { u: 26, piese: (u) => pieseRanduri(u, 2, 8, 4), w: 8, h: 4 },
				spic: { u: 22, piese: (u) => pieseSpic(u, 8), w: 8, h: 8, t: 'rotate(45)' },
				patrat: { u: 30, piese: (u) => pieseRanduri(u, 1, 8, 4), w: 8, h: 4 },
				dala: { u: 92, piese: (u) => pieseRanduri(u, 1, 4, 2, false), w: 4, h: 2 },
				bordura: { u: 34, piese: (u) => pieseRanduri(u, 5, 10, 2), w: 10, h: 2 },
			};
			const k = config[forma] ?? config.dreptunghi;
			continut = `<defs>${tipar('m', k.w * k.u, k.h * k.u, k.piese(k.u), c, k.u, k.t)}</defs><rect width="${latime}" height="${inaltime}" fill="${rost}"/><rect width="${latime}" height="${inaltime}" fill="url(#m)"/>`;
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${latime} ${inaltime}" width="${latime}" height="${inaltime}" preserveAspectRatio="xMidYMid slice">${continut}</svg>`;
}
