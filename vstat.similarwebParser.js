
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

;
(function(window, chrome, undefined) {
	
	var similarwebParser = {

		_domain: 'www.similarweb.com/website',
		_protocol: 'https',

		_db: { domain: 'vstat.hobot.ru', protocol: 'http', parser: 'app_source/ext/similarwebParser.php' },

		_parse: function (service) {
			
			var _this = this

			return new Promise(function(resolve, reject) {

				var xhr = new XMLHttpRequest()
				xhr.open('GET', vstat.tools.interpolate('{{protocol}}://{{domain}}/{{service}}')({ protocol: _this._protocol, domain: _this._domain, service: service }), true)

				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (vstat.tools.statusOk(xhr.status)) {
							var engagementInfoREg = /\<span\s+class\s*=\s*["']engagementInfo-valueNumber js-countValue["']\>(.+?)\<\/span\>/g
							var engagementInfoRE = /\<span\s+class\s*=\s*["']engagementInfo-valueNumber js-countValue["']\>(.+?)\<\/span\>/
							var categoryRE = /data-analytics-label\s*=\s*["'][Cc]ategory [Rr]ank\/(?:.+?)["']\>(.+?)\<\/a\>/

							var topReferringSitesREg = /data-analytics-label\s*=\s*["'][Rr]eferring [Ss]ites\/(?:.+?)["']\>(.+?)\<\/a\>/g
							var topReferringSitesRE = /data-analytics-label\s*=\s*["'][Rr]eferring [Ss]ites\/(?:.+?)["']\>(.+?)\<\/a\>/

							var topOrganicKeywordsREg = /\<span\s+class\s*=\s*["']searchKeywords-words["'](?:.*?)\>(.+?)\<\/span\>/g
							var topOrganicKeywordsRE = /\<span\s+class\s*=\s*["']searchKeywords-words["'](?:.*?)\>(.+?)\<\/span\>/

							// console.log(xhr.responseText)

							var engagementInfoNodes = xhr.responseText.match(engagementInfoREg)

							try { var category = xhr.responseText.match(categoryRE)[1] } catch (ex) { var category = null }

							try { var totalVisits = engagementInfoNodes[0].match(engagementInfoRE)[1] } catch (ex) { var totalVisits = null }
							try { var pagesPerVisit = engagementInfoNodes[2].match(engagementInfoRE)[1] } catch (ex) { var pagesPerVisit = null }
							try { var bounceRate = engagementInfoNodes[3].match(engagementInfoRE)[1] } catch (ex) { var bounceRate = null }

							var topReferringSitesNodes = xhr.responseText.match(topReferringSitesREg)
							var topReferringSites = []

							try {
								for (var i = 0; i < topReferringSitesNodes.length; ++i) {
									topReferringSites.push(topReferringSitesNodes[i].match(topReferringSitesRE)[1])
								}
							} catch(ex) {}

							var topOrganicKeywordsNodes = xhr.responseText.match(topOrganicKeywordsREg)
							var topOrganicKeywords = []

							try {
								for (var i = 0; i < topOrganicKeywordsNodes.length; ++i) {
									topOrganicKeywords.push(topOrganicKeywordsNodes[i].match(topOrganicKeywordsRE)[1])
								}
							} catch(ex) {}

							if (topOrganicKeywords.length > 5) {
								topOrganicKeywords = topOrganicKeywords.slice(0, -5)
							}

							resolve({
								responseText: JSON.stringify({
									category: category,
									totalVisits: totalVisits,
									pagesPerVisit: pagesPerVisit,
									bounceRate: bounceRate,
									topReferringSites: topReferringSites,
									topOrganicKeywords: topOrganicKeywords
								}), 
								status: xhr.status 
							})
						}
						else {
							resolve({ responseText: xhr.responseText, status: xhr.status })
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

		process: function(service) {
			
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
								_this._parse(service).then(function(payload) {
									if (vstat.tools.statusOk(payload.status)) {
										_this._sendToTheServer(payload, 'update', service)
									}
									resolve(payload)
								})
							}

							else if (payload.data == 'publish') {
								_this._parse(service).then(function(payload) {
									if (vstat.tools.statusOk(payload.status)) {
										_this._sendToTheServer(payload, 'publish', service)
									}
									resolve(payload)
								})
							}

						}
						// Server not available
						else {
							_this._parse(service).then(function(payload) { resolve(payload) })
						}
					}
				}

				xhr2.send(void 0)
			
			}.bind(this))

		}
	}

	window.similarwebParser = similarwebParser

})(window, chrome, void 0);