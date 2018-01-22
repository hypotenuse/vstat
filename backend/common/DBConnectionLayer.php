<?php 

    # Provides DB connection layer on particular database
    # To get instance use DBConnectionLayer::getLayer();
    class DBConnectionLayer {
        
        // Store PDO instance
        private $pdo = NULL;
        
        // Store DBConnectionLayer instance
        private static $instance = NULL;
        
        // Default parameters
        private static $host = "localhost", $dbname = "f-vstat1", $charset = "UTF8", 
                $username = "f-vstat1", $password = "tw4X9PHU", $once = false;
        
        private function __construct() {
            try {
                
                $this->pdo = new PDO("mysql:host=". self::$host .";dbname=". self::$dbname, self::$username, self::$password, 
                                     /* Connection charset */
                                     array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES '. self::$charset));
                
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            }
                catch (PDOException $e) {
                    // Notify about exception
                    echo $e->getMessage();
                }
        }
        
        // Prevent instantiation via unserialize
        private function __wakeup() {
            
        }
        
        // Prevent instantiation via clone
        private function __clone() {
            
        }
        
        // You able to use setParameters to set connection parameters before you call getLayer
        public static function setParameters($host, $dbname, $username, $password, $charset) {
            if (self::$once === false) {
                // Set used host
                self::$host = $host;
            
                // Set used database-name
                self::$dbname = $dbname;
            
                // Set used username of the database
                self::$username = $username;
            
                // Set used password of the database
                self::$password = $password;
            
                // Set connection charset
                self::$charset = $charset;
            }
            
            return $this;
        }
        
        public static function getLayer() {
            
            $currentClassName = __CLASS__;
            if (empty(self::$instance)) {
                self::$instance = new $currentClassName;
            }
            
            // There is no need to use setParameters
            self::$once = true;
            
            return self::$instance;
        }

        // Get PDO object itself
        public function getPDO() {
            // Just return PDO object
            return $this->pdo;
        }
    }


?>