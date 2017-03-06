
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

;
(function(window, chrome, undefined) {
	
	window.vstat = window.vstat || {}
	
	window.vstat.tools = {
		interpolate: function(template) {
			return function(replacement) {
				return template.replace(/\{\{\s*(.+?)\s*\}\}/g, function(match, property) {
					return replacement[property]
				})
			}
		},
		
		isObject: function(value) { return typeof value == 'object' && value !== null },

		firstToUpper: function(string) {
			return string.length > 0 ? string.replace(/^(\w)(\w*)/, function(match, cg1, cg2) { return cg1.toUpperCase() + (cg2 || String()) }) : String()
		},

		url: function(url) {
			var parts = url.match(/^(.+?)\:\/\/((?:www\.)?.[^\/:]+)/)
			return { protocol: parts[1], host: parts[2] }
		},

		statusOk: function(status) { return status >= 200 && status <= 299 },

		extractDomainName: function(url) {
			return url.match(/:\/\/(www\.)?(.[^\/:]+)/)[2]
		},

		node: function(document, id) {
			return document.getElementById(id)
		},

		html: function(node, html) {
			node.innerHTML = html
		},

		css: function(node, properties) {
			var owns = Object.prototype.hasOwnProperty
			if (typeof properties == 'object' && properties !== null) {
				for (var property in properties) {
					if (owns.apply(properties, [property])) {
						node.style[property] = properties[property]
					}
				}
			}
		},

		checkIframeLoaded: function(iframe) {
			return new Promise(function(resolve, reject) {
				// 10s
				var loadLimit = 10000
				var lodingTime = 0

				var checkReadyState = function(first) {

					var iframeDocument = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document

					if (iframeDocument && iframeDocument.readyState == 'complete') {
						// Iframe is loaded
						return resolve()
					}
					console.log(iframeDocument)
					if (!first) {
						lodingTime = lodingTime + 10
						if (lodingTime >= loadLimit) {
							// Not loaded in loadLimit time
							reject()
						}
					}
					window.setTimeout(arguments.callee, 10)
				}
				checkReadyState(true)
			})
		}
	}

})(window, chrome, void 0);