<?php

header('Content-Type: application/json;charset=utf-8');

/*
 * @author: Ivan P (hypotenuse)
 * @mail: hypotenuse@yandex.ru
 *
 *
 */

require_once '../common/DBConnectionLayer.php';

# Provides VisitsPublisher class
class VisitsPublisher {
    
    private static $DBCLayer = NULL;
    
    private static function toJSON(array $scoreList) {
        return json_encode($scoreList);
    }
    
    public static function setDBCLayer(DBConnectionLayer $DBCLayer) {
        if (empty(self::$DBCLayer)) {
            self::$DBCLayer = $DBCLayer;
        }
    }
    
    public static function getDBCLayer() {
        return self::$DBCLayer;
    }

    public static function writeNewVisit($useragent, $url, $domain) {
        
        $pdo = self::$DBCLayer->getPDO();
        
        $prpStatement = $pdo->prepare("INSERT INTO `f-vstat1`.`visits` (ip, date, domain, url, useragent)
            VALUES (:ip, NOW(), :domain, :url, :useragent)");
        
        $prpStatement->execute(array(
            ":ip" => $_SERVER['REMOTE_ADDR'],
            ":domain" => $domain,
            ":url" => $url,
            ":useragent" => $useragent
        ));

        return $pdo->lastInsertId();
    }
}

VisitsPublisher::setDBCLayer(DBConnectionLayer::getLayer());

echo VisitsPublisher::writeNewVisit(
	urldecode($_POST['useragent']), 
	urldecode($_POST['url']), 
	urldecode($_POST['domain'])
);

?>