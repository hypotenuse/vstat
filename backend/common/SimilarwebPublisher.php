<?php 

    # Provides SimilarwebPublisher class
    class SimilarwebPublisher {
        
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

        public static function publish($host, $ip, $category, $totalVisits, $totalVisitsFull, $pagesPerVisit, $bounceRate, $topReferringSites, $topOrganicKeywords) {
            
            $pdo = self::$DBCLayer->getPDO();
            
            $prpStatement = $pdo->prepare("INSERT INTO `f-vstat1`.`similarweb` (host, date, ip, category, totalVisits, totalVisitsFull, pagesPerVisit, bounceRate, topReferringSites, topOrganicKeywords)
                VALUES (:host, NOW(), :ip, :category, :totalVisits, :totalVisitsFull, :pagesPerVisit, :bounceRate, :topReferringSites, :topOrganicKeywords)");
            
            $prpStatement->execute(array(
                ":host" => $host,
                ":ip" => $ip,
                ":category" => $category,
                ":totalVisits" => $totalVisits,
                ":totalVisitsFull" => $totalVisitsFull,
                ":pagesPerVisit" => $pagesPerVisit,
                ":bounceRate" => $bounceRate,
                ":topReferringSites" => $topReferringSites,
                ":topOrganicKeywords" => $topOrganicKeywords
            ));

            return $pdo->lastInsertId();
        }

        public static function update($host, $ip, $category, $totalVisits, $totalVisitsFull, $pagesPerVisit, $bounceRate, $topReferringSites, $topOrganicKeywords) {
            
            $pdo = self::$DBCLayer->getPDO();

            $prpStatement = $pdo->prepare("UPDATE `f-vstat1`.`similarweb` SET
                date = NOW(), 
                ip = :ip, 
                category = :category, 
                totalVisits = :totalVisits, 
                totalVisitsFull = :totalVisitsFull, 
                pagesPerVisit = :pagesPerVisit, 
                bounceRate = :bounceRate, 
                topReferringSites = :topReferringSites, 
                topOrganicKeywords = :topOrganicKeywords WHERE `similarweb`.`host` = :host
            ");

            $result = $prpStatement->execute(array(
                ":host" => $host,
                ":ip" => $ip,
                ":category" => $category,
                ":totalVisits" => $totalVisits,
                ":totalVisitsFull" => $totalVisitsFull,
                ":pagesPerVisit" => $pagesPerVisit,
                ":bounceRate" => $bounceRate,
                ":topReferringSites" => $topReferringSites,
                ":topOrganicKeywords" => $topOrganicKeywords
            ));
            
            return $result;
        }
        
        public static function get($host) {

            $pdo = self::$DBCLayer->getPDO();
            
            $prpStatement = $pdo->prepare("SELECT * FROM `f-vstat1`.`similarweb` WHERE host = :host");
            $result = $prpStatement->execute(array(":host" => $host));

            return  $prpStatement->fetch(PDO::FETCH_ASSOC);
        }
    }

    SimilarwebPublisher::setDBCLayer(DBConnectionLayer::getLayer());

?>