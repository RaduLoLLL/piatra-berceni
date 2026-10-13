// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// TODO: înlocuiește cu domeniul real înainte de lansare (folosit în sitemap și link-uri canonice).
	site: 'https://piatraberceni.ro',
	// Adresele merg și cu, și fără / la final (ex. /admin și /admin/).
	trailingSlash: 'ignore',
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/multumim/') && !page.includes('/admin/') && !page.includes('/cautare/'),
		}),
	],
	// Un singur font, doar pentru titluri. E descărcat la build și servit de pe site (fără Google Fonts),
	// iar textul obișnuit folosește fontul sistemului, ca paginile să apară instant.
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Barlow Condensed',
			cssVariable: '--font-titlu',
			weights: [600],
			styles: ['normal'],
			subsets: ['latin', 'latin-ext'],
			fallbacks: ['Arial Narrow', 'sans-serif'],
		},
	],
	build: {
		// CSS-ul mic se pune direct în pagină: o cerere în minus la prima vizită.
		inlineStylesheets: 'always',
	},
});
