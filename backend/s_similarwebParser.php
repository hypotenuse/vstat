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
require_once '../../common/SimilarwebPublisher.php';


if (class_exists('DOMDocument')) {

	class SimilarwebParser {

                const NA = 'n/a';
		
		public function __construct($serviceName) {
			$this->loadedHTML = $this->getHTML($this->similarwebLink . (is_string($serviceName) ? $serviceName : ''));
		}
		
		public static function toJSON(array $array, $mask = NULL) {
			return json_encode($array);
		}

		protected $loadedHTML = NULL;
		protected $similarwebLink = 'https://www.similarweb.com/website/';
		protected $engagementInfoElements = NULL;
		
		protected function getEngagementInfoElements() {

			if (is_null($this->engagementInfoElements)) {
				
				$this->engagementInfoElements = array();

				$j = -1;
				$spans = $this->loadedHTML->getElementsByTagName('span');
				$match = NULL;

				while(++$j < $spans->length) {

					preg_match('/\s*engagementInfo\-valueNumber\s*/', $spans->item($j)->getAttribute('class'), $match);

					// Find engagementInfo-valueNumber span elements
					if (isset($match[0])) {
						array_push($this->engagementInfoElements, $spans->item($j));
					}
				}
			}

			return $this->engagementInfoElements;
		}

		private function getHTML($url) {
			$DOMDocument = new DOMDocument();
			
			$response = \Httpful\Request::get($url)
				->send();
//echo $response;

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

		public function getCategory() {

			$j = -1;
			$links = $this->loadedHTML->getElementsByTagName('a');
			$matchDataAnalyticsLabel = NULL;
			
			while(++$j < $links->length) {

				preg_match('/^\s*[Cc]ategory\s+[Rr]ank\s*\//', $links->item($j)->getAttribute('data-analytics-label'), $matchDataAnalyticsLabel);
				
				// Find a element with specific data-analytics-label attribute
				if (isset($matchDataAnalyticsLabel[0])) {
					return $links->item($j)->nodeValue;
				}
			}

			return NULL;
		}

		public function getTotalVisits() {
			$getEngagementInfoElements = $this->getEngagementInfoElements();
			return count($getEngagementInfoElements) != 0 && isset($getEngagementInfoElements[0]) ? $getEngagementInfoElements[0]->nodeValue : NULL;
		}

		public static function totalVisitsFull($totalVisitsShort) {
			if (is_null($totalVisitsShort)) {
				return -1; //self::NA;
			}
			else {
				if (is_numeric(stripos($totalVisitsShort, 'k'))) {
					return (string)((float)$totalVisitsShort * pow(10, 3));
				}
				else if (is_numeric(stripos($totalVisitsShort, 'm'))) {
					return (string)((float)$totalVisitsShort * pow(10, 6));
				}
				else if (is_numeric(stripos($totalVisitsShort, 'b'))) {
					return (string)((float)$totalVisitsShort * pow(10, 9));
				}
				else if (is_numeric(stripos($totalVisitsShort, 't'))) {
					return (string)((float)$totalVisitsShort * pow(10, 12));
				}
				else {
					return $totalVisitsShort;
				}
			}
		}
		
		public function getPagesPerVisit() {
			$getEngagementInfoElements = $this->getEngagementInfoElements();
			return count($getEngagementInfoElements) != 0 && isset($getEngagementInfoElements[2]) ? $getEngagementInfoElements[2]->nodeValue : NULL;
		}

		public function getBounceRate() {
			$getEngagementInfoElements = $this->getEngagementInfoElements();
			return count($getEngagementInfoElements) != 0 && isset($getEngagementInfoElements[3]) ? $getEngagementInfoElements[3]->nodeValue : NULL;
		}

		public function getTopReferringSites() {

			$j = -1;
			$links = $this->loadedHTML->getElementsByTagName('a');
			$matchDataAnalyticsLabel = NULL;
			$referringSiteLinks = array();

			while(++$j < $links->length) {

				preg_match('/^\s*[Rr]eferring\s+[Ss]ites\s*\//', $links->item($j)->getAttribute('data-analytics-label'), $matchDataAnalyticsLabel);
				
				// Find a element with specific data-analytics-label attribute
				if (isset($matchDataAnalyticsLabel[0]) && $links->item($j)->hasAttribute('data-shorturl')) {
					array_push($referringSiteLinks, $links->item($j)->getAttribute('data-shorturl'));
				}
			}

			return $referringSiteLinks;

		}

		public function getTopDestinationSites() {
			
			$j = -1;
			$links = $this->loadedHTML->getElementsByTagName('a');
			$matchDataAnalyticsLabel = NULL;
			$referringSiteLinks = array();

			while(++$j < $links->length) {

				preg_match('/^\s*[Dd]estination\s+[Ss]ites\s*\//', $links->item($j)->getAttribute('data-analytics-label'), $matchDataAnalyticsLabel);
				
				// Find a element with specific data-analytics-label attribute
				if (isset($matchDataAnalyticsLabel[0]) && $links->item($j)->hasAttribute('data-shorturl')) {
					array_push($referringSiteLinks, $links->item($j)->getAttribute('data-shorturl'));
				}
			}

			return $referringSiteLinks;

		}

		public function topOrganicKeywords() {

			$j = -1;
			$uls = $this->loadedHTML->getElementsByTagName('ul');
			$searchKeywordsList = NULL;
			$searchKeywords = array();

			while(++$j < $uls->length) {
				if ('searchKeywords-list' == $uls->item($j)->getAttribute('class')) {
					$searchKeywordsList = $uls->item($j);
					break;
				}
			}

			if (is_null($searchKeywordsList) == false) {
				$spans = $searchKeywordsList->getElementsByTagName('span');
				$j = -1;
				while(++$j < $spans->length) {
					if ('searchKeywords-words' == $spans->item($j)->getAttribute('class')) {
						array_push($searchKeywords, $spans->item($j)->nodeValue);
					}
				}
			}

			return $searchKeywords;
		}


	}
}
else {
	throw new Exception('Cannot use SimilarwebParser class. Make sure you have PHP5 and DOM-API installed');
}

if (isset($_GET['service'])) {

	$SimilarwebPublisherRetrieved = SimilarwebPublisher::get($_GET['service']); 
	
	function updateRequired($date) {
		$publicatedDate = DateTime::createFromFormat('Y-m-d H:i:s', $date);
		$currentDate = new DateTime();
		return $currentDate->diff($publicatedDate)->days > 7;
	}

	function process($methodType) {
  	$similarwebParserInstance = new SimilarwebParser($_GET['service']);

  	$category = $similarwebParserInstance->getCategory();
  	$totalVisits = $similarwebParserInstance->getTotalVisits();
  	$pagesPerVisit = $similarwebParserInstance->getPagesPerVisit();
  	$bounceRate = $similarwebParserInstance->getBounceRate();
  	$topReferringSites = $similarwebParserInstance->getTopReferringSites();
  	$topOrganicKeywords = $similarwebParserInstance->topOrganicKeywords();

  	$reflectionMethod = new ReflectionMethod('SimilarwebPublisher', $methodType);

  	$reflectionMethod->invokeArgs(new SimilarwebPublisher(), array(
  		$_GET['service'], 
  		$_SERVER['REMOTE_ADDR'], 
  		is_null($category) ? SimilarwebParser::NA : $category,
  		is_null($totalVisits) ? SimilarwebParser::NA : $totalVisits,
  		(float)$similarwebParserInstance::totalVisitsFull($totalVisits),
  		is_null($pagesPerVisit) ? -1 : (float)$pagesPerVisit, 
  		is_null($bounceRate) ? -1 : (float)$bounceRate,
  		count($topReferringSites) == 0 ? SimilarwebParser::NA : join($topReferringSites, ','),
  		count($topOrganicKeywords) == 0 ? SimilarwebParser::NA : join($topOrganicKeywords, ',')
  	));
 
  	echo SimilarwebParser::toJSON(array(
  		'category' => $category,
  		'totalVisits' => $totalVisits,
  		'pagesPerVisit' => $pagesPerVisit,
  		'bounceRate' => $bounceRate,
  		'topReferringSites' => $topReferringSites,
  		'topOrganicKeywords' => $topOrganicKeywords
		));
 
	}

  if (is_array($SimilarwebPublisherRetrieved)) {

       // echo updateRequired($SimilarwebPublisherRetrieved["date"]);

  	if (updateRequired($SimilarwebPublisherRetrieved["date"])) {
  		process('update');
  	}
  	else {
	  	echo SimilarwebParser::toJSON(array(
	  		'category' => $SimilarwebPublisherRetrieved["category"] == SimilarwebParser::NA ? NULL : $SimilarwebPublisherRetrieved["category"],
	  		'totalVisits' => $SimilarwebPublisherRetrieved["totalVisits"] == SimilarwebParser::NA ? NULL : $SimilarwebPublisherRetrieved["totalVisits"],
	  		'pagesPerVisit' => $SimilarwebPublisherRetrieved["pagesPerVisit"] == -1 ? NULL : (string)$SimilarwebPublisherRetrieved["pagesPerVisit"],
	  		'bounceRate' => $SimilarwebPublisherRetrieved["bounceRate"] == -1 ? NULL : (string)$SimilarwebPublisherRetrieved["bounceRate"] . '%',
	  		'topReferringSites' => $SimilarwebPublisherRetrieved["topReferringSites"] == SimilarwebParser::NA ? array() : split(',', $SimilarwebPublisherRetrieved["topReferringSites"]),
	  		'topOrganicKeywords' => $SimilarwebPublisherRetrieved["topOrganicKeywords"] == SimilarwebParser::NA ? array() : split(',', $SimilarwebPublisherRetrieved["topOrganicKeywords"])
			));
		}
  }
  else {
  	process('publish');
  }

}