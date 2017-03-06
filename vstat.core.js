
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

;
(function(window, chrome, undefined) {

	var initPopup = function(tabId, tabUrl, extractedDomainName, backgroundPage, backgroundData) {
		
		var tools = backgroundPage.vstat.tools
		var html = tools.html, interpolate = tools.interpolate, css = tools.css, url = tools.url

		var node = function(id) { return tools.node(document, id) }

		var fallIfNotDefinedText = 'N/A'
		var dataLoadErrorText = 'Cannot load statistics data from {{service}} due to server response status code: {{statusCode}}'

		var fallIfNotDefined = function(text) { return text == void 0 || text == String() || /^\s*n\/a\s*$/i.test(text) ? fallIfNotDefinedText : text }

		var hostNode = node('host')
		var statistics = node('statistics')

		var statisticsTotalVisitsValue = node('statistics-total-visits-value')
		var statisticsCategoryValue = node('statistics-category-value')
		var statisticsBounceRateValue = node('statistics-bounce-rate-value')
		var statisticsPagesPerVisitValue = node('statistics-pages-per-visit-value')
		var statisticsTopDestinationSitesValue = node('statistics-top-destination-sites-value')
		var statisticsTopReferringSitesValue = node('statistics-top-referring-sites-value')

		var similarServicesList = node('similar-services-list')
		var similarwebTraffic = node('similarweb-traffic')

		var loader = node('loader')
		var content = node('content')

		var facebook = node('fa-facebook')
		var vk = node('fa-vk')
		var instagram = node('fa-instagram')
		var twitter = node('fa-twitter')
		var odnoklassniki = node('fa-odnoklassniki')

		var feedback = node('feedback')
		
		var feedbackParams = { url: 'http://vstat.info' }

		var soclialShare = {
			url: 'http://vstat.info',
			name: 'soclialShare',
			params: 'width=600,height=400'
		}

		feedback.addEventListener('click', function(Event) {
			chrome.tabs.create({ url: feedbackParams.url, active: false })
		})

		facebook.addEventListener('click', function(Event) {
			window.open(interpolate('https://www.facebook.com/sharer/sharer.php?u={{url}}&amp;src=sdkpreparse')({ url: soclialShare.url }), soclialShare.name, soclialShare.params)
		})

		vk.addEventListener('click', function(Event) {
			window.open(interpolate('http://vk.com/share.php?url={{url}}')({ url: soclialShare.url }), soclialShare.name, soclialShare.params)
		})

		odnoklassniki.addEventListener('click', function(Event) {
			window.open(interpolate('https://connect.ok.ru/offer?url={{url}}')({ url: soclialShare.url }), soclialShare.name, soclialShare.params)
		})

		twitter.addEventListener('click', function(Event) {
			window.open(interpolate('http://www.twitter.com/share?url={{url}}')({ url: soclialShare.url }), soclialShare.name, soclialShare.params)
		})

		var similarwebTrafficGraphic = interpolate('<iframe src="https://widget.similarweb.com/traffic/{{domain}}" frameborder="0" width="700" height="200" id="{{id}}"></iframe>')({ 
			domain: extractedDomainName,
			id: 'similarweb-traffic-graphic'
		})

		html(hostNode, interpolate('<a href="{{protocol}}://{{host}}" id="{{id}}">{{extractedDomainName}}</a>')({
			protocol: url(tabUrl).protocol,
			host: url(tabUrl).host,
			extractedDomainName: extractedDomainName,
			id: 'host-link'
		}))

		html(similarwebTraffic, similarwebTrafficGraphic)

		node('host-link').addEventListener('click', function(Event) {
			chrome.tabs.update(tabId, { url: this.href })
		})

		node('similarweb-traffic-graphic').addEventListener('load', function(Event) {

			var similarweb = backgroundData[extractedDomainName].similarweb
			var similarsitesearch = backgroundData[extractedDomainName].similarsitesearch

			var displaySimilarwebData = function(payload) {

				var toSpanRE = /(.+?)(\,|\s*$)/g
				
				css(loader, { display: 'none' })
				css(content, { display: 'block' })

				if (tools.statusOk(payload.status)) {

					payload = payload.parsedResponse

					html(statisticsTotalVisitsValue, fallIfNotDefined(payload.totalVisits))
					
					html(statisticsCategoryValue, fallIfNotDefined(payload.category))
					statisticsCategoryValue.setAttribute('title', fallIfNotDefined(payload.category))

					html(statisticsBounceRateValue, fallIfNotDefined(payload.bounceRate))
					html(statisticsPagesPerVisitValue, fallIfNotDefined(payload.pagesPerVisit))

					if (payload.topOrganicKeywords.length == 0) {
						html(statisticsTopDestinationSitesValue, interpolate('<div title="{{fallIfNotDefinedText}}" class="statistics-top-destination-sites-value">{{fallIfNotDefinedText}}</div>')({fallIfNotDefinedText: fallIfNotDefinedText}))
					}
					else {
						html(statisticsTopDestinationSitesValue, fallIfNotDefined(payload.topOrganicKeywords.join(',').replace(toSpanRE, '<div title="$1" class="statistics-top-destination-sites-value">$1</div>')))
					}

					if (payload.topReferringSites.length == 0) {
						html(statisticsTopReferringSitesValue, interpolate('<div title="{{fallIfNotDefinedText}}" class="statistics-top-referring-sites-value">{{fallIfNotDefinedText}}</div>')({fallIfNotDefinedText: fallIfNotDefinedText}))
					}
					else {
						html(statisticsTopReferringSitesValue, fallIfNotDefined(payload.topReferringSites.join(',').replace(toSpanRE, '<div title="$1" class="statistics-top-referring-sites-value">$1</div>')))
					}

					var referrings = statisticsTopReferringSitesValue.getElementsByClassName('statistics-top-referring-sites-value')
					var destinations = statisticsTopDestinationSitesValue.getElementsByClassName('statistics-top-destination-sites-value')

					for (var i = 0; i < destinations.length; ++i) {
						destinations[i].addEventListener('click', function(Event) {
							var linkNodeValue = this.firstChild.nodeValue
							if (payload.topOrganicKeywords.length != 0) {
								chrome.tabs.create({ url: interpolate('https://google.com/search?q={{query}}')({query: linkNodeValue}), active: false })
							}
						})
					}

					for (var i = 0; i < referrings.length; ++i) {
						referrings[i].addEventListener('click', function(Event) {
							var linkNodeValue = this.firstChild.nodeValue
							if (payload.topReferringSites.length != 0) {
								chrome.tabs.create({ url: interpolate('http://{{link}}')({link: linkNodeValue}), active: false })
							}
						})
					}

				}
				else {

					html(statisticsTotalVisitsValue, fallIfNotDefinedText)
					html(statisticsCategoryValue, fallIfNotDefinedText)
					html(statisticsBounceRateValue, fallIfNotDefinedText)
					html(statisticsPagesPerVisitValue, fallIfNotDefinedText)
					html(statisticsTopDestinationSitesValue, interpolate('<div title="{{fallIfNotDefinedText}}" class="statistics-top-destination-sites-value">{{fallIfNotDefinedText}}</div>')({fallIfNotDefinedText: fallIfNotDefinedText}))
					html(statisticsTopReferringSitesValue, interpolate('<div title="{{fallIfNotDefinedText}}" class="statistics-top-referring-sites-value">{{fallIfNotDefinedText}}</div>')({fallIfNotDefinedText: fallIfNotDefinedText}))
					
					console.error(interpolate(dataLoadErrorText)({ service: 'Similarweb', statusCode: payload.status }))
				}
			}

			var displaySimilarsitesearchData = function(payload) {
				if (tools.statusOk(payload.status)) {
					payload = payload.parsedResponse
					var similarsites = payload.similarsites
					if (similarsites.length > 0) {
						for (var i = 0; i < similarsites.length; ++i) {
							similarServicesList.insertAdjacentHTML('beforeEnd', interpolate(
								'<div class="similar-service-box"><div class="external-link-wrapper"><img src="https://www.google.com/s2/favicons?domain={{domain}}"></div><div class="similar-service-content"><div class="similar-service-box-title" title="{{title}}">{{title}}</div><div class="similar-service-box-url" title="{{link}}">{{link}}</div></div></div>'
							)
							({ 
								title: similarsites[i].title, 
								link: similarsites[i].link, 
								domain: tools.extractDomainName(similarsites[i].link)
							}))

							similarServicesList.lastElementChild.addEventListener('click', function(Event) {
								var linkNodeValue = this.getElementsByClassName('similar-service-box-url')[0].firstChild.nodeValue
								chrome.tabs.create({ url: linkNodeValue, active: false })
							})
						}
					}
					else {
						html(similarServicesList, '<div class="tac">Nothing Found</div>')
					}
				}
				else {
					html(similarServicesList, '<div class="tac"><i class="fa fa-exclamation-circle"></i><span>Not loaded</span></div>')
					console.error(interpolate(dataLoadErrorText)({ service: 'Similarsitesearch', statusCode: payload.status }))
				}
			}

			if (similarweb.payloadStatus == 'pending') {
				similarweb.process.then(function(payload) {
					displaySimilarwebData(payload)
				})
			}
			else if (similarweb.payloadStatus == 'done' || similarweb.payloadStatus == 'error') {
				displaySimilarwebData(similarweb.payload)
			}

			if (similarsitesearch.payloadStatus == 'pending') {
				similarsitesearch.process.then(function(payload) {
					displaySimilarsitesearchData(payload)
				})
			}
			else if (similarsitesearch.payloadStatus == 'done' || similarsitesearch.payloadStatus == 'error') {
				displaySimilarsitesearchData(similarsitesearch.payload)
			}
		})
	}

	chrome.runtime.getBackgroundPage(function() {
		
		var backgroundPage = arguments[0]
		var backgroundData = backgroundPage.background.data
		var tools = backgroundPage.vstat.tools

		// Get and process active page url
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.get(tab.id, function(tabInfo) {
				
				var tabURL = tabInfo.url
				var tabURLParsed = tools.url(tabURL)

				if (/https?/.test(tabURLParsed.protocol)) {
					initPopup(tabInfo.id, tabURL, tools.extractDomainName(tabURL), backgroundPage, backgroundData)
				}
				else {
					console.error('Cannot load data. Protocol should be http(s)')
				}
			})
		})

	})

})(window, chrome, void 0);