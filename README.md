# Piatra Berceni – site de prezentare

Online: https://piatra-berceni.pages.dev · Panou: https://piatra-berceni.pages.dev/admin/

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
| Categorii (descriere, fotografie, ordine) | `src/data/categorii.json` | Setări site → Categorii, sau direct din formularul produsului |
| Servicii | `src/data/servicii.json` | Setări site → Servicii |
| Fotografii | `src/assets/produse/`, `src/assets/lucrari/`, `src/assets/categorii/`, `src/assets/acasa/` | Se încarcă din formulare |
| Fișe tehnice PDF | `public/fise/` | Câmpul „Fișă tehnică” |

### Panoul de administrare: ce e în plus față de Decap

- **Căutare rapidă:** butonul „Caută produs” (jos, dreapta) sau **Ctrl+K**. Caută în toate produsele (inclusiv cele nepublicate) și lucrările, după nume, categorie, dimensiuni, culoare. Nu ține cont de diacritice. Produsele noi apar în căutare după următoarea publicare (~1 minut).
- **Categorii din formular:** în câmpul „Categorie” al unui produs poți alege „＋ Adaugă o categorie nouă…”. Categoria apare automat pe site, cu pagina ei, în meniu și pe prima pagină. Descrierea, fotografia și ordinea se pot seta din Setări site → Categorii (cu exact același nume).
- Codul acestor extensii: `public/admin/panou.js`. Datele lor: `src/pages/admin/date.json.ts` (generat la build).

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

Proiectul Cloudflare Pages `piatra-berceni` este conectat la depozitul GitHub `RaduLoLLL/piatra-berceni` (build: `npm run build`, output: `dist`, Node 22 din `.node-version`).

1. Pentru domeniul final: Cloudflare → piatra-berceni → **Custom domains**.
2. De acum, orice modificare salvată în GitHub (inclusiv din panou) republică site-ul automat în ~1 minut.

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

Aplicația OAuth există deja: **Piatra Berceni CMS** (GitHub → Settings → Developer settings → OAuth Apps), cu callback `https://piatra-berceni.pages.dev/api/callback`. În Cloudflare Pages sunt setate `GITHUB_CLIENT_ID` (text) și `GITHUB_CLIENT_SECRET` (secret).

- **La mutarea pe domeniul final:** schimbă în aplicația OAuth *Homepage URL* și *Authorization callback URL* la `https://domeniul-final.ro/api/callback`. Panoul își ia singur adresa din domeniul pe care e deschis (`src/pages/admin/index.astro`), deci nu e nevoie de modificări în cod.
- Persoana care editează are nevoie de un cont GitHub cu acces de scriere la depozit (Settings → Collaborators).
- Token-urile GitHub expiră după 8 ore; după aceea panoul cere din nou autentificarea.

## Viteză

- 0 KB JavaScript pe majoritatea paginilor. Doar filtrele din catalog, căutarea, harta și formularul au câte un mic script inline.
- CSS-ul este pus direct în pagină. Fontul titlurilor (Barlow Condensed) e descărcat la build și servit de pe site, fără Google Fonts; textul folosește fontul sistemului.
- Fotografiile se transformă automat în AVIF/WebP, la 4–5 mărimi, și se încarcă doar când ajung pe ecran.
- Harta Google se încarcă numai la click.
- Paginile se pre-încarcă la hover (Speculation Rules), așa că navigarea pare instantanee în Chrome și Edge.
- Fișierele din `/_astro/` sunt păstrate în cache un an (`public/_headers`).
