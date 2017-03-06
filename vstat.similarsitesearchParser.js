
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

;
(function(window, chrome, undefined) {
	
	var similarsitesearchParser = {
		
		_domain: 'www.similarsitesearch.com/alternatives-to',
		_protocol: 'http',

		_db: { domain: 'vstat.hobot.ru', protocol: 'http', parser: 'app_source/ext/similarsitesearchParser.php' },

		_showcount: 5,

		_parse: function(service, showcount) {

			var _this = this
			_this._showcount = showcount
			
			return new Promise(function(resolve, reject) {

				var xhr = new XMLHttpRequest()
				xhr.open('GET', vstat.tools.interpolate('{{protocol}}://{{domain}}/{{service}}')({ protocol: _this._protocol, domain: _this._domain, service: service }), true)

				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (vstat.tools.statusOk(xhr.status)) {

							var similarsitesRE = /\<h2\s+class\s*=\s*["']restitle["']\>(?:[\s\S]*?)\<a\s+href\s*=\s*["'](.+?)["'](?:.*?)\>(.+?)\<\/a\>/g
							var similarsites = []
							var i = -1, count = _this._showcount, state

							try {
								while (++i < count && (state = similarsitesRE.exec(xhr.responseText))) {
									similarsites.push({
										link: state[1], 
										title: state[2]
									})
								}
							}
							catch (ex) {}

							resolve({
								responseText: JSON.stringify({ similarsites: similarsites }),
								status: xhr.status 
							})
						}
						else {
							// N/A
							resolve({ responseText: JSON.stringify({ similarsites: [] }), status: 200 })
						}
					}
				}

				xhr.send(void 0)

			})
		},

		_sendToTheServer: function(payload, method, service) {
			var _this = this
			var xhr = new XMLHttpRequest()
			xhr.open('POST', vstat.tools.interpolate('{{protocol}}://{{domain}}/{{parser}}')({ protocol: _this._db.protocol, domain: _this._db.domain, parser: _this._db.parser }), true)
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8')
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (vstat.tools.statusOk(xhr.status) == false) {
						console.log('Cannot perform action ' + method)
					}
				}
			}
			xhr.send('payload=' + encodeURIComponent(payload.responseText) + '&method=' + encodeURIComponent(method) + '&service=' + encodeURIComponent(service))
		},

		process: function(service, showcount) {

			// this._parse(service, showcount)
			var _this = this

			return new Promise(function(resolve, reject) {

				var xhr2 = new XMLHttpRequest()
				xhr2.open('GET', vstat.tools.interpolate('{{protocol}}://{{domain}}/{{parser}}?service={{service}}')({ protocol: _this._db.protocol, domain: _this._db.domain, parser: _this._db.parser, service: encodeURIComponent(service) }), true)

				xhr2.onreadystatechange = function() {
					if (xhr2.readyState == 4) {
						if (vstat.tools.statusOk(xhr2.status)) {

							var payload = JSON.parse(xhr2.responseText)

							if (payload.data == 'yes') {
								resolve({ responseText: JSON.stringify(payload.payload), status: xhr2.status })
							}

							else if (payload.data == 'update') {
								_this._parse(service, showcount).then(function(payload) {
									if (vstat.tools.statusOk(payload.status)) {
										_this._sendToTheServer(payload, 'update', service)
									}
									resolve(payload)
								})
							}

							else if (payload.data == 'publish') {
								_this._parse(service, showcount).then(function(payload) {
									if (vstat.tools.statusOk(payload.status)) {
										_this._sendToTheServer(payload, 'publish', service)
									}
									resolve(payload)
								})
							}

						}
						// Server not available
						else {
							_this._parse(service, showcount).then(function(payload) { resolve(payload) })
						}
					}
				}

				xhr2.send(void 0)

			}.bind(this))

		}
	}

	window.similarsitesearchParser = similarsitesearchParser

})(window, chrome, void 0);