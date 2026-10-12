## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Proiect

Site static pentru Piatra Berceni SRL (pavele). Prioritate: viteză și navigare simplă. Codul și conținutul sunt în română.

- Conținut: `src/content/` (colecții Astro) și `src/data/*.json`, editabile din Decap CMS (`public/admin/config.yml`). Câmpurile noi trebuie adăugate în ambele locuri.
- Nu adăuga framework-uri JS sau scripturi externe pe paginile publice; scripturile mici se scriu `is:inline`.
- Desenele de rezervă pentru produse fără poze: `src/lib/modele.ts`, servite din `src/pages/modele/[model].svg.ts`.
- Funcții Cloudflare Pages: `functions/api/` (formular ofertă, OAuth GitHub pentru CMS).
