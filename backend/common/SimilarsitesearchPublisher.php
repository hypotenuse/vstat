<?php 
    # Provides the base Score-management
    class SimilarsitesearchPublisher {
        
        private static $DBCLayer = NULL;
        
        // Prepares before send
        private static function toJSON(array $scoreList) {
            // Return prepared JSON string
            return json_encode($scoreList);
        }
        
        // Setter for DBLayer property
        public static function setDBCLayer(DBConnectionLayer $DBCLayer) {
            if (empty(self::$DBCLayer)) {
                self::$DBCLayer = $DBCLayer;
            }
        }
        
        // Get DB Connection Layer
        public static function getDBCLayer() {
            return self::$DBCLayer;
        }
        
        // Publish result to the table
        public static function publish($host, $ip, $similarsites) {
            
            // Get PDO Instance
            $pdo = self::$DBCLayer->getPDO();
            
            // Prevent SQL-injections, so prepare
            $prpStatement = $pdo->prepare("INSERT INTO `f-vstat1`.`similarsitesearch` (host, date, ip, similarsites) VALUES (:host, NOW(), :ip, :similarsites)");
            
            // Execute prepared statement
            $prpStatement->execute(array(
                ":host" => $host,
                ":ip" => $ip,
                ":similarsites" => $similarsites
            ));
            
            // Return the ID of currently inserted record
            return $pdo->lastInsertId();
        }

        public static function update($host, $ip, $similarsites) {
            
            // Get PDO Instance
            $pdo = self::$DBCLayer->getPDO();

            // Prevent SQL-injections, so prepare
            $prpStatement = $pdo->prepare("UPDATE `f-vstat1`.`similarsitesearch` SET date = NOW(), ip = :ip, similarsites = :similarsites WHERE `similarsitesearch`.`host` = :host");

            $result = $prpStatement->execute(array(
                ":host" => $host,
                ":ip" => $ip,
                ":similarsites" => $similarsites
            ));

            return $result;
        }
        
        // Get score list for particular game
        public static function get($host) {

            // Get PDO Instance
            $pdo = self::$DBCLayer->getPDO();
            
            $prpStatement = $pdo->prepare("SELECT * FROM `f-vstat1`.`similarsitesearch` WHERE host = :host");
            $result = $prpStatement->execute(array(":host" => $host));
            
            return $prpStatement->fetch(PDO::FETCH_ASSOC);
        }
    }

    // Set DB Layer
    SimilarsitesearchPublisher::setDBCLayer(DBConnectionLayer::getLayer());

?>