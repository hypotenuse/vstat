<?php

header('Content-Type: application/json;charset=utf-8');

/*
 * @author: Ivan P (hypotenuse)
 * @mail: hypotenuse@yandex.ru
 *
 *
 */

require '../../common/vendor/autoload.php';
require '../../common/httpful.phar';

require_once '../../common/DBConnectionLayer.php';
require_once '../../common/SimilarsitesearchPublisher.php';

if (class_exists('DOMDocument')) {

	class SimilarsitesearchParser {

                const NA = 'n/a';
		
		public function __construct($serviceName, $showcount) {
			if (isset($showcount)) {
				$this->showcount = $showcount;
			}
			$this->loadedHTML = $this->getHTML($this->similarsitesearchLink . (is_string($serviceName) ? $serviceName : ''));
		}
		
		public static function toJSON(array $array, $mask = NULL) {
			return json_encode($array);
		}

		protected $loadedHTML, $showcount = 5;
		protected $similarsitesearchLink = 'http://www.similarsitesearch.com/alternatives-to/';

		private function getHTML($url) {
			$DOMDocument = new DOMDocument();
			
			$response = \Httpful\Request::get($url)
				->expectsHtml()
				->addHeader('Accept-Charset', 'utf-8')
				->send();

			// See http://php.net/manual/ru/domdocument.loadhtml.php#95251
			@$DOMDocument->loadHTML('<?xml encoding="UTF-8">' . $response);

			foreach($DOMDocument->childNodes as $node) {
				if ($node->nodeType == XML_PI_NODE) {
					// Remove <?xml encoding="UTF-8">
					$DOMDocument->removeChild($node);
				}
			}
			$DOMDocument->encoding = 'UTF-8';

			return $DOMDocument;
		}

		public function getSimilarsites() {

			$similarsites = array();
			$lis = $this->loadedHTML->getElementsByTagName('li');
			$j = -1;

			while(++$j < $lis->length) {
				$resItem = $lis->item($j);
				if ('res_item' == $resItem->getAttribute('class')) {
					$resMain = $resItem->getElementsByTagName('div')->item(0);
					if ('res_main' == $resMain->getAttribute('class')) {
						$resMainTop = $resMain->getElementsByTagName('div')->item(0);
						if ('res_main_top' == $resMainTop->getAttribute('class')) {
							
							$resTitle = $resMainTop->getElementsByTagName('a')->item(0);
							array_push($similarsites, array('link' => $resTitle->getAttribute('href'), 'title' => $resTitle->nodeValue));

							if (count($similarsites) >= $this->showcount) {
								return $similarsites;
							}

						}
					}
				}
			}
			// Found lower than showcount similar sites
			return $similarsites;

		}

	}
}
else {
	throw new Exception('Cannot use SimilarsitesearchParser class. Make sure you have PHP5 and DOM-API installed');
}

if (isset($_GET['service'])) {

	$SimilarsitesearchPublisherRetrieved = SimilarsitesearchPublisher::get($_GET['service']);

	function updateRequired($date) {
		$publicatedDate = DateTime::createFromFormat('Y-m-d H:i:s', $date);
		$currentDate = new DateTime();
		return $currentDate->diff($publicatedDate)->days > 7;
	}

	function process($methodType) {
  	$similarsitesearchParserInstance = new SimilarsitesearchParser($_GET['service'], @$_GET['showcount']);

  	$similarsites = $similarsitesearchParserInstance->getSimilarsites();

  	$reflectionMethod = new ReflectionMethod('SimilarsitesearchPublisher', $methodType);

  	$reflectionMethod->invokeArgs(new SimilarsitesearchPublisher(), array(
  		$_GET['service'], 
  		$_SERVER['REMOTE_ADDR'],
  		count($similarsites) == 0 ? SimilarsitesearchParser::NA : SimilarsitesearchParser::toJSON($similarsites)
  	));

  	echo SimilarsitesearchParser::toJSON(array(
  		'similarsites' => $similarsites
		));
	}

	if (is_array($SimilarsitesearchPublisherRetrieved)) {
  	if (updateRequired($SimilarsitesearchPublisherRetrieved["date"])) {
  		process('update');
  	}
  	else {
  		if ($SimilarsitesearchPublisherRetrieved["similarsites"] == SimilarsitesearchParser::NA) {
				echo SimilarsitesearchParser::toJSON(array(
					'similarsites' => array()
				));
  		}
  		else {
	  		$similarsitesPrepared = array();
	  		$similarsites = json_decode($SimilarsitesearchPublisherRetrieved["similarsites"]);

	  		foreach($similarsites as $key => $value) {
	  			array_push($similarsitesPrepared, array('link' => $value->link, 'title' => $value->title));
	  		}

				echo SimilarsitesearchParser::toJSON(array('similarsites' => $similarsitesPrepared));
  		}
  	}
	}
	else {
		process('publish');
	}

}