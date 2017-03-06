
/*
 * @desc: Chrome vstat plugin
 * @author: Ivan Schneider <hypotenuse@yandex.ru>
 *
 */

;
(function(window, chrome, undefined) {

	var Visits = {
		
		_db: { domain: 'vstat.hobot.ru', protocol: 'http', logger: 'app_source/ext/VisitsPublisher.php' },

		writeNewVisit: function(useragent, url, domain) {
			
			var xhr = new XMLHttpRequest()
			xhr.open('POST', vstat.tools.interpolate('{{protocol}}://{{domain}}/{{logger}}')({ protocol: this._db.protocol, domain: this._db.domain, logger: this._db.logger }), true)
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8')
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (vstat.tools.statusOk(xhr.status) == false) {
						console.log('Cannot perform logging due to status code: ' + xhr.status)
					}
				}
			}
			xhr.send('useragent=' + encodeURIComponent(useragent) + '&url=' + encodeURIComponent(url) + '&domain=' + encodeURIComponent(domain))

		}
	}
	
	window.Visits = Visits

})(window, chrome, void 0);