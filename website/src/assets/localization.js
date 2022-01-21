import Cookies from 'cookies-js';
import { en, it } from './loc_strings.js';

let localization = {
	_language: '',
	// localized strings from loc_strings.js
	en,
	it
}

export default localization;

/**
 * Restore language from cookies
 */
localization.init = function ()
{
	if (Cookies.get('language')) {
		let lang = Cookies.get('language');
		this.setLanguage(lang);
	} else {
		this.setLanguage('en');
	}
}

/**
 * Returns the current language code.
 */
localization.getLanguage = function ()
{
	return this._language;
}

/**
 * Returns the current language name.
 */
localization.getLanguageName = function ()
{
	let name = 'unknown';
	switch (this._language) {
	case 'it':
		name = 'Italiano';
		break;
	case 'en':
		name = 'English';
		break;
	}
	return name;
}

/**
 * Sets the language.
 * @param {string} language - The language code to set.
 */
localization.setLanguage = function (language)
{
	if (!this[language]) {
		console.error(`Language does not exits: ${language}`);
		return;
	}
	this._language = language;
	Cookies.set('language', language)
	// copy all strings from the specified language
	for (var key in this[language]) {
		this[key] = this[language][key];
	}
}
