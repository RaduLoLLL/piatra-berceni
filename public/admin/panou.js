// Extensii pentru panoul de administrare (Decap CMS):
//  1. câmpul „Categorie”: alegi o categorie existentă sau adaugi una nouă direct din formularul produsului;
//  2. căutarea rapidă: buton „Caută” mereu vizibil (sau Ctrl+K), caută în toate produsele și lucrările, fără diacritice.
// Datele vin din /admin/date.json, generat la fiecare publicare (src/pages/admin/date.json.ts).
(function () {
	'use strict';

	// Utilizatorul logat, așa cum îl păstrează Decap. Fără el, nu afișăm căutarea și nu cerem datele.
	function utilizator() {
		try {
			return JSON.parse(localStorage.getItem('decap-cms-user') || 'null');
		} catch (e) {
			return null;
		}
	}
	function logat() {
		var paginaLogare = Array.prototype.some.call(document.querySelectorAll('button'), function (b) {
			return /^(Intră în cont|Autentifică-te( cu GitHub)?)$/.test(b.textContent.trim());
		});
		return Boolean(utilizator()) && !paginaLogare;
	}

	var GOL = { categorii: [], cautare: [] };
	var date = null;
	function incarcaDate() {
		if (!date) {
			var u = utilizator();
			// Datele sunt protejate (functions/admin/_middleware.js): le cerem cu cheia sesiunii din panou.
			date = fetch('/admin/date.json', {
				cache: 'no-cache',
				headers: u && u.token ? { Authorization: 'token ' + u.token } : {},
			})
				.then(function (r) {
					if (!r.ok) throw new Error(r.status);
					return r.json();
				})
				.catch(function () {
					date = null; // încercăm din nou data viitoare (de exemplu, după logare)
					return GOL;
				});
		}
		return date;
	}

	// Aceeași regulă ca pe site (src/lib/date.ts): fără diacritice, litere mici.
	function slug(s) {
		return String(s || '')
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	// ---------- 1. Câmpul „Categorie” ----------

	var h = window.h;
	var NOUA = '__categorie_noua__';
	var categoriiSesiune = []; // categorii adăugate acum, înainte de următoarea publicare

	var stilButon = {
		marginLeft: '8px',
		padding: '0 16px',
		height: '40px',
		border: '0',
		borderRadius: '5px',
		background: '#b8402a',
		color: '#fff',
		fontWeight: 600,
		cursor: 'pointer',
	};

	var ControlCategorie = window.createClass({
		getInitialState: function () {
			return { optiuni: [], adaug: false, text: '', eroare: '' };
		},
		componentDidMount: function () {
			var self = this;
			incarcaDate().then(function (d) {
				self.setState({ optiuni: d.categorii || [] });
			});
		},
		optiuni: function () {
			var toate = this.state.optiuni.concat(categoriiSesiune);
			var unice = [];
			toate.forEach(function (c) {
				if (!unice.some(function (u) { return slug(u) === slug(c); })) unice.push(c);
			});
			return unice.sort(function (a, b) { return a.localeCompare(b, 'ro'); });
		},
		alege: function (e) {
			if (e.target.value === NOUA) {
				this.setState({ adaug: true, text: '', eroare: '' });
			} else {
				this.props.onChange(e.target.value);
			}
		},
		adauga: function () {
			var nume = this.state.text.replace(/\s+/g, ' ').trim();
			if (nume.length < 2) {
				this.setState({ eroare: 'Scrie numele categoriei (cel puțin 2 litere).' });
				return;
			}
			nume = nume.charAt(0).toUpperCase() + nume.slice(1);
			// Dacă există deja (chiar scrisă puțin diferit), o folosim pe cea existentă.
			var existenta = this.optiuni().filter(function (c) { return slug(c) === slug(nume); })[0];
			if (!existenta) categoriiSesiune.push(nume);
			this.props.onChange(existenta || nume);
			this.setState({ adaug: false, text: '', eroare: '' });
		},
		render: function () {
			var self = this;
			var p = this.props;
			var valoare = p.value || '';
			var optiuni = this.optiuni();
			var curenta = optiuni.filter(function (c) { return slug(c) === slug(valoare); })[0];
			if (valoare && !curenta) {
				optiuni.push(valoare);
				curenta = valoare;
			}

			if (this.state.adaug) {
				return h(
					'div',
					null,
					h(
						'div',
						{ style: { display: 'flex', alignItems: 'center' } },
						h('input', {
							id: p.forID,
							className: p.classNameWrapper,
							value: this.state.text,
							autoFocus: true,
							placeholder: 'Numele noii categorii, ex. Bolțari de gard',
							onChange: function (e) { self.setState({ text: e.target.value, eroare: '' }); },
							onKeyDown: function (e) {
								if (e.key === 'Enter') { e.preventDefault(); self.adauga(); }
								if (e.key === 'Escape') self.setState({ adaug: false });
							},
							onFocus: p.setActiveStyle,
							onBlur: p.setInactiveStyle,
						}),
						h('button', { type: 'button', style: stilButon, onClick: this.adauga }, 'Adaugă'),
						h(
							'button',
							{
								type: 'button',
								style: Object.assign({}, stilButon, { background: 'transparent', color: '#555' }),
								onClick: function () { self.setState({ adaug: false }); },
							},
							'Renunță',
						),
					),
					this.state.eroare && h('p', { style: { color: '#b8402a', margin: '8px 0 0' } }, this.state.eroare),
					h(
						'p',
						{ style: { color: '#777', fontSize: '13px', margin: '8px 0 0' } },
						'Categoria nouă apare automat pe site, cu pagina ei, după ce salvezi produsul.',
					),
				);
			}

			return h(
				'select',
				{
					id: p.forID,
					className: p.classNameWrapper,
					value: curenta || '',
					onChange: this.alege,
					onFocus: p.setActiveStyle,
					onBlur: p.setInactiveStyle,
					style: { cursor: 'pointer' },
				},
				h('option', { value: '', disabled: true }, 'Alege categoria…'),
				optiuni.map(function (c) {
					return h('option', { key: c, value: c }, c);
				}),
				h('option', { value: NOUA }, '＋ Adaugă o categorie nouă…'),
			);
		},
	});

	window.CMS.registerWidget('categorie', ControlCategorie);


	// ---------- 2. Căutarea rapidă ----------

	var stil = document.createElement('style');
	stil.textContent =
		'.cauta-buton{position:fixed;right:20px;bottom:20px;z-index:300;display:flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;background:#1e1c1a;color:#fff;font:600 15px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}' +
		'.cauta-buton[hidden]{display:none}.cauta-buton kbd{padding:2px 6px;border-radius:4px;background:rgba(255,255,255,.15);font:12px system-ui,sans-serif}' +
		'.cauta-fundal{position:fixed;inset:0;z-index:400;display:flex;justify-content:center;align-items:flex-start;padding:10vh 16px 16px;background:rgba(20,18,16,.55)}' +
		'.cauta-fereastra{width:100%;max-width:640px;max-height:75vh;display:flex;flex-direction:column;overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:system-ui,sans-serif}' +
		'.cauta-fereastra input{width:100%;padding:20px 22px;border:0;border-bottom:1px solid #e4dfd6;font:18px system-ui,sans-serif;outline:none}' +
		'.cauta-lista{margin:0;padding:6px;overflow-y:auto;list-style:none}' +
		'.cauta-lista a{display:flex;justify-content:space-between;gap:16px;padding:12px 14px;border-radius:8px;color:#1b1a18;text-decoration:none}' +
		'.cauta-lista a[aria-selected=true]{background:#f3eee6}' +
		'.cauta-lista strong{display:block;font-weight:600}.cauta-lista small{color:#777}' +
		'.cauta-lista em{flex:none;align-self:center;padding:2px 8px;border-radius:999px;background:#efebe4;color:#555;font:600 11px system-ui,sans-serif;font-style:normal;text-transform:uppercase;letter-spacing:.06em}' +
		'.cauta-gol{padding:24px;color:#777;text-align:center}';
	document.head.appendChild(stil);

	var buton = document.createElement('button');
	buton.type = 'button';
	buton.className = 'cauta-buton';
	buton.innerHTML = '<span aria-hidden="true">⌕</span> Caută produs <kbd>Ctrl K</kbd>';
	buton.hidden = true;
	buton.addEventListener('click', deschide);
	document.body.appendChild(buton);

	new MutationObserver(function () {
		// Butonul de logare: clientul nu are cont GitHub, intră cu un cod pe email (functions/api/auth.js).
		document.querySelectorAll('button').forEach(function (b) {
			if (b.textContent.trim() === 'Autentifică-te cu GitHub') b.textContent = 'Intră în cont';
		});
		// Căutarea apare doar după logare.
		var vizibil = logat();
		if (buton.hidden === vizibil) buton.hidden = !vizibil;
		if (!vizibil) {
			inchide();
			date = null;
		}
	}).observe(document.body, { childList: true, subtree: true });

	var fundal = null;

	function deschide() {
		if (fundal || !logat()) return;
		fundal = document.createElement('div');
		fundal.className = 'cauta-fundal';
		fundal.innerHTML =
			'<div class="cauta-fereastra" role="dialog" aria-label="Caută în panou">' +
			'<input type="search" placeholder="Caută produse și lucrări: nume, categorie, dimensiuni, culoare…" aria-label="Caută" />' +
			'<ul class="cauta-lista" role="listbox"></ul></div>';
		document.body.appendChild(fundal);
		var input = fundal.querySelector('input');
		var lista = fundal.querySelector('.cauta-lista');
		var selectat = 0;
		var rezultate = [];

		function afiseaza() {
			incarcaDate().then(function (d) {
				var cuvinte = slug(input.value).split('-').filter(Boolean);
				rezultate = (d.cautare || []).filter(function (x) {
					return cuvinte.every(function (w) { return x.text.indexOf(w) > -1; });
				}).slice(0, 50);
				selectat = Math.min(selectat, Math.max(rezultate.length - 1, 0));
				lista.innerHTML = rezultate.length
					? ''
					: '<li class="cauta-gol">' + (input.value ? 'Nimic găsit. Încearcă alt cuvânt.' : 'Nu există încă produse.') + '</li>';
				rezultate.forEach(function (x, i) {
					var li = document.createElement('li');
					var a = document.createElement('a');
					a.href = x.url;
					a.setAttribute('role', 'option');
					a.setAttribute('aria-selected', i === selectat ? 'true' : 'false');
					a.innerHTML = '<span><strong></strong><small></small></span><em></em>';
					a.querySelector('strong').textContent = x.titlu;
					a.querySelector('small').textContent = x.detalii;
					a.querySelector('em').textContent = x.tip;
					a.addEventListener('click', function (e) {
						e.preventDefault();
						deschideIntrare(x.url);
					});
					li.appendChild(a);
					lista.appendChild(li);
				});
			});
		}

		input.addEventListener('input', function () {
			selectat = 0;
			afiseaza();
		});
		input.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				selectat = Math.max(0, Math.min(rezultate.length - 1, selectat + (e.key === 'ArrowDown' ? 1 : -1)));
				lista.querySelectorAll('a').forEach(function (a, i) {
					a.setAttribute('aria-selected', i === selectat ? 'true' : 'false');
					if (i === selectat) a.scrollIntoView({ block: 'nearest' });
				});
			} else if (e.key === 'Enter' && rezultate[selectat]) {
				e.preventDefault();
				deschideIntrare(rezultate[selectat].url);
			}
		});
		fundal.addEventListener('click', function (e) {
			if (e.target === fundal) inchide();
		});
		afiseaza();
		input.focus();
	}

	function inchide() {
		if (fundal) fundal.remove();
		fundal = null;
	}

	// Reîncărcăm pagina la deschiderea unei intrări: Decap poate păstra datele intrării anterioare
	// dacă treci direct dintr-un formular în altul doar schimbând adresa.
	function deschideIntrare(url) {
		inchide();
		location.assign(location.pathname + '?d=' + Date.now() + url);
	}

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && fundal) {
			inchide();
		} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			// În editorul de text, Ctrl+K adaugă un link; nu-l furăm de acolo.
			var t = e.target;
			if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName)) && !(fundal && fundal.contains(t))) return;
			e.preventDefault();
			fundal ? inchide() : deschide();
		}
	});
})();
