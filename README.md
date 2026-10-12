# Piatra Berceni – site de prezentare

Site static, rapid, pentru Piatra Berceni SRL (pavele, borduri, piatră decorativă). Făcut cu [Astro](https://astro.build), cu panou de administrare [Decap CMS](https://decapcms.org) și găzduire pe Cloudflare Pages.

## Comenzi

| Comandă | Ce face |
|---|---|
| `npm install` | Instalează dependențele (o singură dată) |
| `npm run dev` | Pornește site-ul local la http://localhost:4321 |
| `npm run cms` | Pornește serverul local al panoului (în paralel cu `dev`), apoi deschide http://localhost:4321/admin/ |
| `npm run build` | Construiește site-ul final în `dist/` |
| `npm run preview` | Afișează local versiunea construită |

## Unde e conținutul

| Ce | Fișier | Se editează din panou |
|---|---|---|
| Produse | `src/content/produse/*.md` | Produse |
| Lucrări realizate | `src/content/lucrari/*.md` | Lucrări realizate |
| Pagina „Despre noi” | `src/content/pagini/despre.md` | Pagini |
| Date firmă, telefon, program | `src/data/firma.json` | Setări site → Date firmă |
| Texte prima pagină | `src/data/acasa.json` | Setări site → Prima pagină |
| Categorii | `src/data/categorii.json` | Setări site → Categorii |
| Servicii | `src/data/servicii.json` | Setări site → Servicii |
| Fotografii | `src/assets/produse/`, `src/assets/lucrari/` | Se încarcă din formularul produsului |
| Fișe tehnice PDF | `public/fise/` | Câmpul „Fișă tehnică” |

Conținutul este validat la build (`src/content.config.ts`, `src/lib/date.ts`). O greșeală, de exemplu o categorie inexistentă, oprește publicarea în loc să strice site-ul.

Cât timp un produs nu are fotografii, site-ul afișează un desen cu modelul de pavaj (`src/lib/modele.ts`), în culorile produsului.

## Ce trebuie completat înainte de lansare

Conținutul actual este **demonstrativ**:

- [ ] Datele reale ale firmei în `src/data/firma.json`: telefon, WhatsApp, email, adresă, coordonate, program, CUI.
- [ ] Domeniul real în `astro.config.mjs` (`site`), `public/robots.txt` și `public/admin/config.yml` (`base_url`, `site_url`, `repo`).
- [ ] Produsele reale, cu fotografii, dimensiuni și (opțional) prețuri.
- [ ] Textele de pe prima pagină și din Servicii: confirmă transportul, montajul etc.
- [ ] Lucrările marcate „Exemplu”: înlocuiește-le sau șterge-le.

## Lansare pe Cloudflare Pages

1. Proiectul este în depozitul GitHub `RaduLoLLL/piatra-berceni`.
2. În Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, alege depozitul.
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Variabilă de mediu: `NODE_VERSION` = `22`
3. Adaugă domeniul la **Custom domains**.
4. De acum, orice modificare salvată în GitHub (inclusiv din panou) republică site-ul automat în ~1 minut.

### Formularul de ofertă

Formularul trimite la `functions/api/oferta.js`, care trimite emailul prin [Resend](https://resend.com) (gratuit până la 3.000 de emailuri pe lună).

1. Creează un cont Resend și verifică domeniul firmei.
2. În Cloudflare Pages → **Settings → Variables and Secrets** adaugă:
   - `RESEND_API_KEY`: cheia de la Resend (ca secret)
   - `EMAIL_CATRE`: adresa unde vrei să primești cererile
   - `EMAIL_DE_LA`: de exemplu `Site Piatra Berceni <site@domeniul-tau.ro>`

Protecția anti-spam constă într-un câmp ascuns și o verificare de timp, fără CAPTCHA.

### Panoul de administrare online

Panoul de la `/admin/` folosește autentificarea GitHub prin `functions/api/auth.js` și `functions/api/callback.js`.

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://domeniul-tau.ro`
   - Authorization callback URL: `https://domeniul-tau.ro/api/callback`
2. În Cloudflare Pages adaugă `GITHUB_CLIENT_ID` și `GITHUB_CLIENT_SECRET` (ca secret).
3. Persoana care editează are nevoie de un cont GitHub cu acces de scriere la depozit.

Panoul trebuie deschis pe același domeniu ca `base_url` din `public/admin/config.yml`.

## Viteză

- 0 KB JavaScript pe majoritatea paginilor. Doar filtrele din categorii, harta și formularul au câte un mic script inline.
- CSS-ul este pus direct în pagină; nu se încarcă fonturi externe.
- Fotografiile se transformă automat în AVIF/WebP, la 4–5 mărimi, și se încarcă doar când ajung pe ecran.
- Harta Google se încarcă numai la click.
- Paginile se pre-încarcă la hover (Speculation Rules), așa că navigarea pare instantanee în Chrome și Edge.
- Fișierele din `/_astro/` sunt păstrate în cache un an (`public/_headers`).
