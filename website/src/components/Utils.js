import ErrorBoxModal from './ErrorBoxModal';
import MessageBoxModal from './MessageBoxModal';
import Vue from 'vue';

/**
 * Creates a MessageBoxModal component and injects it in the page.
 * @param {string} title
 * @param {string} message
 * @param {Object} options - Supported options: okOnly=true
 */
export function MessageBox(title, message, options) {
	document.body.classList.remove('modal-open'); // ensures the new modal can open
	return new Promise(resolve => {
		let MessageBoxConstructor = Vue.extend(MessageBoxModal);
		let component = new MessageBoxConstructor();
		component.$props.title = title;
		component.$props.message = message;
		component.$props.okOnly = (options && options.okOnly !== undefined) ? options.okOnly : true;
		component.$on('cancel', () => resolve(false));
		component.$on('hide', () => resolve(false));
		component.$on('hidden', () => document.body.removeChild(component.$el));
		component.$on('ok', () => resolve(true));
		component.$mount();
		document.body.appendChild(component.$el);
	});
}

/**
 * Creates an ErrorBoxModal component and injects it in the page.
 * @param {string} message - Simple message to explain what went wrong to the user
 * @param {Object} [error] - Error object to display advanced info
 */
export function Error(message, error) {
	document.body.classList.remove('modal-open'); // ensures the new modal can open
	return new Promise(resolve => {
		let ErrorBoxConstructor = Vue.extend(ErrorBoxModal);
		let component = new ErrorBoxConstructor();
		component.$props.message = message;
		component.$props.error = error;
		component.$on('hide', () => resolve());
		component.$on('hidden', () => document.body.removeChild(component.$el));
		component.$mount();
		document.body.appendChild(component.$el);
		if (error) console.error(error);
	});
}

/**
 * Creates a GeoJson feature representing a straight line.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {Object}
 */
export function createLineFeature(lat1, lon1, lat2, lon2) {
	const geojson = {
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [
				[lon1, lat1],
				[lon2, lat2]
			]
		}
	}
	return geojson;
}