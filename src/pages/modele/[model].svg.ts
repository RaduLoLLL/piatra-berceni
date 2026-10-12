import type { APIRoute, GetStaticPaths } from 'astro';
import { categorii, getLucrari, getProduse } from '../../lib/date';
import { parseSlugModel, slugModel, svgModel } from '../../lib/modele';
import { MODEL_FUNDAL, modelCategorie, modelLucrare, modelProdus } from '../../lib/vizual';

export const getStaticPaths = (async () => {
	const produse = await getProduse();
	const lucrari = await getLucrari();
	const modele = [
		...produse.map(modelProdus),
		...categorii.map((c) => modelCategorie(c, produse)),
		...lucrari.map(modelLucrare),
	];
	const unice = new Set(modele.map((m) => slugModel(m.forma, m.culori)));
	return ['fundal', ...unice].map((model) => ({ params: { model } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
	let svg: string;
	if (params.model === 'fundal') {
		svg = svgModel(MODEL_FUNDAL.forma, MODEL_FUNDAL.culori, 1600, 900);
	} else {
		const { forma, culori } = parseSlugModel(params.model!);
		svg = svgModel(forma, culori);
	}
	return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
