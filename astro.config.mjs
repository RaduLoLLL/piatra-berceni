// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// TODO: înlocuiește cu domeniul real înainte de lansare (folosit în sitemap și link-uri canonice).
	site: 'https://piatraberceni.ro',
	// Adresele merg și cu, și fără / la final (ex. /admin și /admin/).
	trailingSlash: 'ignore',
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/multumim/') && !page.includes('/admin/'),
		}),
	],
	build: {
		// CSS-ul mic se pune direct în pagină: o cerere în minus la prima vizită.
		inlineStylesheets: 'always',
	},
});
