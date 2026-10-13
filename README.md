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

Panoul de la `/admin/` are două feluri de logare:

**1. Clientul: cod pe email, fără cont GitHub**

Clientul își scrie emailul, primește un cod de 6 cifre (valabil 10 minute, maximum 5 încercări) și primește o sesiune de 12 ore. Panoul nu primește nicio cheie GitHub: cererile trec prin `functions/api/gh/`, care verifică sesiunea și lucrează cu o cheie temporară (1 oră) a aplicației GitHub **Piatra Berceni CMS**, limitată la acest depozit. Modificările apar în istoric ca făcute de aplicație, cu emailul clientului ca autor.

Configurare (o singură dată):
1. **Aplicația GitHub:** GitHub → Settings → Developer settings → GitHub Apps → *Piatra Berceni CMS*. Permisiuni: *Contents: Read and write*. Instalată doar pe `piatra-berceni`. Generează o cheie privată (fișier `.pem`).
2. **Cloudflare Pages → Settings → Variables and Secrets:**
   - `GITHUB_APP_ID`: ID-ul aplicației (text)
   - `GITHUB_APP_PRIVATE_KEY`: tot conținutul fișierului `.pem` (secret)
   - `ADMIN_EMAILURI`: adresele care au voie să intre, separate prin virgulă (text). Ca să scoți pe cineva, îi ștergi adresa.
   - `RESEND_API_KEY` (secret) și `EMAIL_DE_LA` (text), aceleași ca la formularul de ofertă.
3. **Cloudflare Pages → Settings → Bindings:** un KV namespace cu numele de variabilă `CMS_KV` (păstrează codurile cât sunt valabile).
4. Un deploy nou, ca variabilele să intre în vigoare.

Fără domeniu propriu verificat în Resend, emailurile pot fi trimise doar către adresa contului Resend (bun pentru test).

**Starea actuală:** aplicația GitHub *Piatra Berceni CMS* (App ID 5299314) e instalată doar pe `piatra-berceni`; `EMAIL_DE_LA` este expeditorul de test Resend (`onboarding@resend.dev`), iar `ADMIN_EMAILURI` conține doar adresa dezvoltatorului. După cumpărarea domeniului: verifică domeniul în Resend, schimbă `EMAIL_DE_LA` (ex. `Piatra Berceni <site@domeniu.ro>`) și adaugă adresa clientului în `ADMIN_EMAILURI`.

**2. Dezvoltatorul: GitHub**

În fereastra de logare: „Dezvoltator? Intră cu GitHub”. Folosește aplicația OAuth **Piatra Berceni CMS** (callback `https://piatra-berceni.pages.dev/api/callback`) și variabilele `GITHUB_CLIENT_ID` (text), `GITHUB_CLIENT_SECRET` (secret).

- **La mutarea pe domeniul final:** schimbă în aplicația OAuth *Homepage URL* și *Authorization callback URL* la `https://domeniul-final.ro/api/callback`. Panoul își ia singur adresa din domeniul pe care e deschis (`src/pages/admin/index.astro`).

Codul: `functions/api/auth.js`, `cod.js`, `verifica.js` (logare cu cod), `github.js`, `callback.js` (logare GitHub), `gh/[[cale]].js` (intermediarul), cu funcțiile comune în `server/`.

## Viteză

- 0 KB JavaScript pe majoritatea paginilor. Doar filtrele din catalog, căutarea, harta și formularul au câte un mic script inline.
- CSS-ul este pus direct în pagină. Fontul titlurilor (Barlow Condensed) e descărcat la build și servit de pe site, fără Google Fonts; textul folosește fontul sistemului.
- Fotografiile se transformă automat în AVIF/WebP, la 4–5 mărimi, și se încarcă doar când ajung pe ecran.
- Harta Google se încarcă numai la click.
- Paginile se pre-încarcă la hover (Speculation Rules), așa că navigarea pare instantanee în Chrome și Edge.
- Fișierele din `/_astro/` sunt păstrate în cache un an (`public/_headers`).
