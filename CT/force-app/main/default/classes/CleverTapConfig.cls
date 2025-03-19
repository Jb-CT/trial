public with sharing class CleverTapConfig {
    
    public static Map<String, String> getCredentials() {
        // Ensure the user has read access to Test2Clevertap__CleverTap_Config__c
        if (!Schema.sObjectType.Test2Clevertap__CleverTap_Config__c.isAccessible()) {
            return null;
        }
        
        List<Test2Clevertap__CleverTap_Config__c> configList = [
            SELECT Name, Test2Clevertap__CleverTap_API_URL__c, 
                   Test2Clevertap__CleverTap_Account_ID__c, Test2Clevertap__CleverTap_Passcode__c,
                   Test2Clevertap__Region__c
            FROM Test2Clevertap__CleverTap_Config__c 
            WHERE Name != '[Deleted]'
            LIMIT 1
        ];

        if (configList.isEmpty()) {
            return null;
        }

        Test2Clevertap__CleverTap_Config__c config = configList[0];

        Map<String, String> credentials = new Map<String, String>{
            'NAME'       => config.Name,
            'DEV_NAME'   => config.Name, // Custom objects don't have DeveloperName
            'API_URL'    => config.Test2Clevertap__CleverTap_API_URL__c,
            'ACCOUNT_ID' => config.Test2Clevertap__CleverTap_Account_ID__c,
            'PASSCODE'   => config.Test2Clevertap__CleverTap_Passcode__c,
            'REGION'     => config.Test2Clevertap__Region__c
        };
        
        return credentials;
    }
}