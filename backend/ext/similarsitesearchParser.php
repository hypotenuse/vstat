<?php

header('Content-Type: application/json;charset=utf-8');

/*
 * @author: Ivan P (hypotenuse)
 * @mail: hypotenuse@yandex.ru
 *
 *
 */

require_once '../common/DBConnectionLayer.php';
require_once '../common/SimilarsitesearchPublisher.php';

const NA = 'n/a';
	
function updateRequired($date) {
	$publicatedDate = DateTime::createFromFormat('Y-m-d H:i:s', $date);
	$currentDate = new DateTime();
	return $currentDate->diff($publicatedDate)->days > 7;
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
	$SimilarsitesearchPublisherRetrieved = SimilarsitesearchPublisher::get(urldecode($_GET['service']));
	if (is_array($SimilarsitesearchPublisherRetrieved)) {
		if (updateRequired($SimilarsitesearchPublisherRetrieved["date"])) {
			echo json_encode(array("data" => "update"));
		}
		else {
			if ($SimilarsitesearchPublisherRetrieved["similarsites"] == NA) {
				echo json_encode(array(
					"data" => "yes",
					"payload" => array('similarsites' => array())
				));
			}
			else {
				$similarsitesPrepared = array();
				$similarsites = json_decode($SimilarsitesearchPublisherRetrieved["similarsites"]);
	  		foreach($similarsites as $key => $value) {
	  			array_push($similarsitesPrepared, array('link' => $value->link, 'title' => $value->title));
	  		}
	  		echo json_encode(array(
	  			"data" => "yes",
	  			"payload" => array('similarsites' => $similarsitesPrepared)
	  		));
			}
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

	$method = urldecode($_POST['method']);
	$service = urldecode($_POST['service']);

	$reflectionMethod = new ReflectionMethod('SimilarsitesearchPublisher', $method);
	
	$reflectionMethod->invokeArgs(new SimilarsitesearchPublisher(), array(
		$service,
		$_SERVER['REMOTE_ADDR'],
		count($payload->similarsites) == 0 ? NA : json_encode($payload->similarsites)
	));

}