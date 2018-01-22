<?php

header('Content-Type: application/json;charset=utf-8');

/*
 * @author: Ivan P (hypotenuse)
 * @mail: hypotenuse@yandex.ru
 *
 *
 */

require_once '../common/DBConnectionLayer.php';
require_once '../common/SimilarwebPublisher.php';

const NA = 'n/a';

function updateRequired($date) {
	$publicatedDate = DateTime::createFromFormat('Y-m-d H:i:s', $date);
	$currentDate = new DateTime();
	return $currentDate->diff($publicatedDate)->days > 7;
}

function totalVisitsFull($totalVisitsShort) {
	if (is_null($totalVisitsShort)) {
		return -1;
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

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	$SimilarwebPublisherRetrieved = SimilarwebPublisher::get(urldecode($_GET['service']));
	if (is_array($SimilarwebPublisherRetrieved)) {
		if (updateRequired($SimilarwebPublisherRetrieved["date"])) {
			echo json_encode(array("data" => "update"));
		}
		else {
			echo json_encode(array(
				"data" => "yes", 
				"payload" => array(
					'category' => $SimilarwebPublisherRetrieved["category"] == NA ? NULL : $SimilarwebPublisherRetrieved["category"],
					'totalVisits' => $SimilarwebPublisherRetrieved["totalVisits"] == NA ? NULL : $SimilarwebPublisherRetrieved["totalVisits"],
					'pagesPerVisit' => $SimilarwebPublisherRetrieved["pagesPerVisit"] == -1 ? NULL : (string)$SimilarwebPublisherRetrieved["pagesPerVisit"],
					'bounceRate' => $SimilarwebPublisherRetrieved["bounceRate"] == -1 ? NULL : (string)$SimilarwebPublisherRetrieved["bounceRate"] . '%',
					'topReferringSites' => $SimilarwebPublisherRetrieved["topReferringSites"] == NA ? array() : split(',', $SimilarwebPublisherRetrieved["topReferringSites"]),
					'topOrganicKeywords' => $SimilarwebPublisherRetrieved["topOrganicKeywords"] == NA ? array() : split(',', $SimilarwebPublisherRetrieved["topOrganicKeywords"])
				)
			));
		}
	}
	else {
		echo json_encode(array("data" => "publish"));
	}
}
else if ($_SERVER['REQUEST_METHOD'] == 'POST') {

        $payload = trim(urldecode($_POST['payload']));
        $payload = stripslashes($payload);
	$payload = json_decode($payload);

	$method = $_POST['method'];
	$service = $_POST['service'];

	$category = $payload->category;
	$totalVisits = $payload->totalVisits;
	$pagesPerVisit = $payload->pagesPerVisit;
	$bounceRate = $payload->bounceRate;
	$topReferringSites = $payload->topReferringSites;
	$topOrganicKeywords = $payload->topOrganicKeywords;

	$reflectionMethod = new ReflectionMethod('SimilarwebPublisher', $method);

	$reflectionMethod->invokeArgs(new SimilarwebPublisher(), array(
		$service, 
		$_SERVER['REMOTE_ADDR'],
		is_null($category) ? NA : $category,
		is_null($totalVisits) ? NA : $totalVisits,
		(float)totalVisitsFull($totalVisits),
		is_null($pagesPerVisit) ? -1 : (float)$pagesPerVisit, 
		is_null($bounceRate) ? -1 : (float)$bounceRate,
		count($topReferringSites) == 0 ? NA : join($topReferringSites, ','),
		count($topOrganicKeywords) == 0 ? NA : join($topOrganicKeywords, ',')
	));

}