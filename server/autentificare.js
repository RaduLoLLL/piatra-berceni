// Autentificarea clientului în panou fără cont GitHub.
//
// 1. Clientul își scrie emailul și primește un cod de 6 cifre (functions/api/cod.js, functions/api/verifica.js).
// 2. După cod, primește o SESIUNE semnată (valabilă 12 ore), nu o cheie GitHub.
// 3. Panoul trimite cererile către GitHub prin functions/api/gh/[[cale]].js, care verifică sesiunea și le face
//    cu o cheie temporară a aplicației GitHub „Piatra Berceni CMS”, valabilă o oră și doar pentru acest depozit.
//
// Variabile de mediu (Cloudflare Pages → Settings → Variables and Secrets):
//   ADMIN_EMAILURI          adresele care au voie să intre, separate prin virgulă
//   GITHUB_APP_ID           ID-ul aplicației GitHub (text)
//   GITHUB_APP_PRIVATE_KEY  cheia privată a aplicației, fișierul .pem întreg (secret)
//   GITHUB_REPO             opțional, implicit RaduLoLLL/piatra-berceni
//   RESEND_API_KEY, EMAIL_DE_LA  pentru trimiterea codului (aceleași ca la formularul de ofertă)
// Legătură KV (Settings → Bindings): CMS_KV

export const DURATA_SESIUNE = 12 * 60 * 60; // secunde
export const repo = (env) => env.GITHUB_REPO || 'RaduLoLLL/piatra-berceni';

const text = new TextEncoder();

function base64url(bytes) {
	let s = '';
	for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function dinBase64url(s) {
	const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export async function sha256(s) {
	return base64url(await crypto.subtle.digest('SHA-256', text.encode(s)));
}

export function egal(a, b) {
	// Comparație în timp constant, ca durata să nu dezvăluie cât din cod e corect.
	if (a.length !== b.length) return false;
	let r = 0;
	for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return r === 0;
}

export function emailuriPermise(env) {
	return (env.ADMIN_EMAILURI || '')
		.split(/[,;\s]+/)
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
}

// ---------- Sesiuni semnate ----------

// Cheia de semnare e derivată din cheia privată a aplicației: dacă o schimbi, toate sesiunile expiră.
async function cheieSesiune(env) {
	if (!env.GITHUB_APP_PRIVATE_KEY) throw new Error('GITHUB_APP_PRIVATE_KEY nu este configurat');
	const material = await crypto.subtle.digest('SHA-256', text.encode('sesiune-cms:' + env.GITHUB_APP_PRIVATE_KEY));
	return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function creeazaSesiune(env, email) {
	const date = base64url(text.encode(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + DURATA_SESIUNE })));
	const semnatura = base64url(await crypto.subtle.sign('HMAC', await cheieSesiune(env), text.encode(date)));
	return `cms.${date}.${semnatura}`;
}

/** Întoarce emailul din sesiune, sau null dacă sesiunea e invalidă, expirată ori adresa nu mai are acces. */
export async function verificaSesiune(env, token) {
	const parti = (token || '').split('.');
	if (parti.length !== 3 || parti[0] !== 'cms') return null;
	const [, date, semnatura] = parti;
	let ok = false;
	try {
		ok = await crypto.subtle.verify('HMAC', await cheieSesiune(env), dinBase64url(semnatura), text.encode(date));
	} catch {
		return null;
	}
	if (!ok) return null;
	const { email, exp } = JSON.parse(new TextDecoder().decode(dinBase64url(date)));
	if (exp < Date.now() / 1000) return null;
	return emailuriPermise(env).includes(email) ? email : null;
}

export const esteSesiune = (token) => (token || '').startsWith('cms.');

// ---------- Cheia temporară de la aplicația GitHub ----------

function pemInDer(pem) {
	const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function lungimeDer(n) {
	if (n < 0x80) return [n];
	const octeti = [];
	while (n > 0) {
		octeti.unshift(n & 0xff);
		n >>= 8;
	}
	return [0x80 | octeti.length, ...octeti];
}

// GitHub dă cheia în format PKCS#1 („BEGIN RSA PRIVATE KEY”), iar WebCrypto acceptă doar PKCS#8.
// O împachetăm: SEQUENCE { INTEGER 0, SEQUENCE { rsaEncryption, NULL }, OCTET STRING { cheia } }.
function pkcs1InPkcs8(pkcs1) {
	const algoritm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
	const octetString = [0x04, ...lungimeDer(pkcs1.length), ...pkcs1];
	const continut = [0x02, 0x01, 0x00, ...algoritm, ...octetString];
	return Uint8Array.from([0x30, ...lungimeDer(continut.length), ...continut]);
}

async function jwtAplicatie(env) {
	const pem = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
	const der = pem.includes('BEGIN RSA PRIVATE KEY') ? pkcs1InPkcs8(pemInDer(pem)) : pemInDer(pem);
	const cheie = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	const acum = Math.floor(Date.now() / 1000);
	const cap = base64url(text.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
	const corp = base64url(text.encode(JSON.stringify({ iat: acum - 60, exp: acum + 540, iss: String(env.GITHUB_APP_ID) })));
	const semnatura = base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cheie, text.encode(`${cap}.${corp}`)));
	return `${cap}.${corp}.${semnatura}`;
}

const antetGithub = (autorizare) => ({
	Authorization: autorizare,
	Accept: 'application/vnd.github+json',
	'User-Agent': 'piatra-berceni-cms',
	'X-GitHub-Api-Version': '2022-11-28',
});

let cache = null; // { token, expira } — rămâne în memorie cât timp instanța funcției e activă

export async function cheieInstalare(env) {
	if (cache && cache.expira - Date.now() > 5 * 60 * 1000) return cache.token;
	const jwt = await jwtAplicatie(env);
	const [proprietar, nume] = repo(env).split('/');
	const instalare = await fetch(`https://api.github.com/repos/${proprietar}/${nume}/installation`, { headers: antetGithub(`Bearer ${jwt}`) });
	if (!instalare.ok) throw new Error(`Aplicația GitHub nu e instalată pe ${repo(env)} (${instalare.status})`);
	const { id } = await instalare.json();
	const r = await fetch(`https://api.github.com/app/installations/${id}/access_tokens`, {
		method: 'POST',
		headers: { ...antetGithub(`Bearer ${jwt}`), 'Content-Type': 'application/json' },
		body: JSON.stringify({ repositories: [nume], permissions: { contents: 'write', metadata: 'read' } }),
	});
	if (!r.ok) throw new Error(`GitHub a refuzat cheia temporară (${r.status}): ${await r.text()}`);
	const date = await r.json();
	cache = { token: date.token, expira: Date.parse(date.expires_at) };
	return cache.token;
}

export { antetGithub };
