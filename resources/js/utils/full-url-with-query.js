import objExtend from './obj-extend';

/**
 * Laravel-like Request's fullUrlWithQuery method
 * @param  {Object} newQuery New query
 * @return {String}          Generated URL
 */
function fullUrlWithQuery(newQuery)
{
	// get current URL params
	let params = window.location.search;

	if(params.substr(0, 1) === '?')
		params = params.substr(1, params.length);

	if(params)
		params = JSON.parse('{"' + decodeURI(params.replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}');
	else
		params = {};

	if(newQuery)  {
		// if object given
		if(typeof newQuery === 'object' && Object.prototype.toString.call(newQuery) !== '[object Array]') {
			// then extend with current URL params
			params = objExtend(params, newQuery);
		}else{
			// if array given
			if(Object.prototype.toString.call(newQuery) === '[object Array]') {
				// then delete keys from object
				newQuery.forEach(function(q) {
					delete params[q];
				});
			}else{
				return console.warn('Not valid datatype; value given:', newQuery);
			}
		}
	}

	params = (new URLSearchParams(params).toString());

	return params ? '?' + params : '';
}

export default fullUrlWithQuery;