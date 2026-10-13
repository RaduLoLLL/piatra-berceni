// Prima pagină din fereastra de logare a panoului: clientul își scrie emailul.
// (Decap CMS deschide /api/auth; dezvoltatorul poate alege de aici logarea cu GitHub.)
import { formularEmail, paginaLogin } from '../../server/pagini.js';

export function onRequestGet() {
	return paginaLogin(formularEmail());
}
