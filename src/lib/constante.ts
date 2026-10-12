export const FORME = ['dreptunghi', 'spic', 'patrat', 'dala', 'bordura', 'pietris', 'pasi'] as const;
export type Forma = (typeof FORME)[number];

export const UNITATI = ['m²', 'ml', 'buc', 'tonă', 'sac'] as const;

/** Culorile pe care le poate alege editorul în panou, cu nuanța folosită în desene și filtre. */
export const CULORI: Record<string, string> = {
	gri: '#9a9893',
	antracit: '#4a4a4a',
	negru: '#2b2b2b',
	rosu: '#a8513c',
	caramiziu: '#b86a45',
	maro: '#7a5a43',
	galben: '#c9a64d',
	bej: '#cdbb9b',
	alb: '#e9e6df',
	verde: '#6f8065',
	'mix toamna': '#9c6b48',
};

export const NUME_CULORI: Record<string, string> = {
	gri: 'Gri',
	antracit: 'Antracit',
	negru: 'Negru',
	rosu: 'Roșu',
	caramiziu: 'Cărămiziu',
	maro: 'Maro',
	galben: 'Galben',
	bej: 'Bej',
	alb: 'Alb',
	verde: 'Verde',
	'mix toamna': 'Mix toamnă',
};
