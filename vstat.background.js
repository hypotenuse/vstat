
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

var background = {}

// Stored loaded data for domain
background.data = {}

;
(function(window, chrome, undefined) {
	
	var tools = vstat.tools

	var currentTabId = void 0
	
	var fallToDefault = function(text) { return text == void 0 || text == String() || /^\s*n\/a\s*$/i.test(text) ? true : false }

	var loadAndCacheData = function(tabInfo) {

		var tabURL = tabInfo.url
		var extractedDomainName = tools.extractDomainName(tabURL)
		var tabURLParsed = tools.url(tabURL)

		if (/https?/.test(tabURLParsed.protocol)) {

			if (tools.isObject(background.data[extractedDomainName]) == false) {

				background.data[extractedDomainName] = {

					similarweb: {

						payloadStatus: 'pending',
						payload: void 0,

						process: function() {
							var _this = this
							return new Promise(function(resolve, reject) {
								similarwebParser.process(extractedDomainName).then(function(response) {
									_this.payloadStatus = 'done'
									_this.payload = { status: response.status, parsedResponse: JSON.parse(response.responseText) }
									resolve(_this.payload)
								})
								.catch(function(error) {
									_this.payloadStatus = 'error'
									_this.payload = error
									resolve(_this.payload)
								})
							})
						}
					},

					similarsitesearch: {

						payloadStatus: 'pending',
						payload: void 0,

						process: function() {
							var _this = this
							return new Promise(function(resolve, reject) {
								similarsitesearchParser.process(extractedDomainName, 5).then(function(response) {
									_this.payloadStatus = 'done'
									_this.payload = { status: response.status, parsedResponse: JSON.parse(response.responseText) }
									resolve(_this.payload)
								})
								.catch(function(error) {
									_this.payloadStatus = 'error'
									_this.payload = error
									resolve(_this.payload)
								})
							})
						}
					}
				}

				background.data[extractedDomainName].similarsitesearch.process = background.data[extractedDomainName].similarsitesearch.process()
				background.data[extractedDomainName].similarweb.process = background.data[extractedDomainName].similarweb.process()
			}
		}
	}

	var Badge = {
		
		defaultBadgeColor: [181, 181, 181, 180],
		defaultBadgeText: 'N/A',
		defaultBadgeTitle: 'N/A',
		additionalText: ' unique sessions per month',

		display: function(components) {
			chrome.browserAction.setBadgeBackgroundColor({ 
				color: components.badgeColor || this.defaultBadgeColor
			})
			chrome.browserAction.setBadgeText({ 
				text: components.badgeText || this.defaultBadgeText
			})
			chrome.browserAction.setTitle({ 
				title: components.badgeTitle || this.defaultBadgeTitle
			})
		},

		defineComponents: function(payload) {
			if (tools.statusOk(payload.status)) {
				
				payload = payload.parsedResponse
				
				// X[KMBGT] XX[KMBGT] XXX[KMBGT] X.X[KMBGT] XX.X[KMBGT] XXX.X[KMBGT]
				var indexFullRE = /^(\d{1,3})(\.\d)?([KMBGT])$/i

				var preparedTotalVisits = preparedBadgeColor = void 0
				var _this = this
			
				var prepareTotalVisits = function(totalVisits) {

					if (fallToDefault(totalVisits)) {
						return _this.defaultBadgeText
					}

					if (/^\d{1, 3}$/.test(totalVisits)) {
						return totalVisits
					}
					else if (indexFullRE.test(totalVisits)) {
						return totalVisits.replace(/^(\d{1,3})(\.\d)?([KMBGT])$/i, function(match, digits, floatDigit, index) {
							if (floatDigit) {
								if ((digits.length == 2 || digits.length == 3)) {
									return String(Math.round(digits + floatDigit)) + index
								}
								else {
									return match
								}
							}
							else {
								if (digits.length == 1) {
									return digit + '.0' + index
								}
								else {
									return match
								}
							}
						}).replace(/B/i, 'G') // B -> G
					}

					return totalVisits
				}

				var prepareBadgeColor = function(preparedTotalVisits) {
					var colorsMap = {
						'g': '#8A9A5B',
						'r': '#DE3163',
						'y': '#DAA520'
					}
					var preparedTotalVisitsComponents = preparedTotalVisits.match(/([KMGT])/i)
					if (preparedTotalVisitsComponents) {
						if (preparedTotalVisitsComponents[1].toLowerCase() == 'k') {
							return colorsMap['y']
						}
						else {
							return colorsMap['r']
						}
					}
					else {
						if (fallToDefault(preparedTotalVisits)) {
							return void 0
						}
						else {
							return colorsMap['g']
						}
					}
				}
				
				preparedTotalVisits = prepareTotalVisits(payload.totalVisits)
				preparedBadgeColor = prepareBadgeColor(preparedTotalVisits)

				return { badgeText: preparedTotalVisits, badgeTitle: preparedTotalVisits + _this.additionalText, badgeColor: preparedBadgeColor }
			}
			else {
				return {}
			}
		},

		init: function(extractedDomainName, tabId) {
			var _this = this
			if (tools.isObject(background.data[extractedDomainName])) {
				var similarweb = background.data[extractedDomainName].similarweb
				if (similarweb.payloadStatus == 'pending') {
					chrome.browserAction.setBadgeText({ text: '···' })
					similarweb.process.then(function(payload) {
						if (tabId == currentTabId) {
							_this.display(_this.defineComponents(payload))
						}
					})
				}
				else if (similarweb.payloadStatus == 'done' || similarweb.payloadStatus == 'error') {
					this.display(this.defineComponents(similarweb.payload))
				}
			}
			else {
				this.display({})
			}
		}
	
	}

	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.get(tab.id, function(tabInfo) {
			currentTabId = tabInfo.id
			loadAndCacheData(tabInfo)
			Badge.init(tools.extractDomainName(tabInfo.url))
		})
	})

	chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
		chrome.tabs.get(tabId, function(tabInfo) {
			currentTabId = tabInfo.id
			loadAndCacheData(tabInfo)
			Badge.init(tools.extractDomainName(tabInfo.url), tabId)
			Visits.writeNewVisit(navigator.userAgent, tabInfo.url, tools.extractDomainName(tabInfo.url))
		})
	})

	// Fired even when current tab is updated by newly created tab (opened link in new tab from current one)
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if ('url' in changeInfo) {
			if (currentTabId == tabId) {
				loadAndCacheData(changeInfo)
				Badge.init(tools.extractDomainName(changeInfo.url), tabId)
				Visits.writeNewVisit(navigator.userAgent, changeInfo.url, tools.extractDomainName(changeInfo.url))
			}
		}
	})

})(window, chrome, void 0);