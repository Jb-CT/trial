/**
 * @class SyncConfigurationManager
 * @description Manager class for handling sync configuration operations.
 * Handles CRUD operations for Test2Clevertap__CleverTap_Sync_Configuration__c records.
 */
public with sharing class SyncConfigurationManager {
    
    /**
     * @class SyncConfigWrapper
     * @description Wrapper class for Test2Clevertap__CleverTap_Sync_Configuration__c objects
     */
    public class SyncConfigWrapper {
        /**
         * @description The ID of the sync configuration
         */
        @AuraEnabled public String id { get; set; }
        
        /**
         * @description The name of the sync configuration
         */
        @AuraEnabled public String name { get; set; }
        
        /**
         * @description The type of sync (e.g., salesforce_to_clevertap)
         */
        @AuraEnabled public String syncType { get; set; }
        
        /**
         * @description The source entity (e.g., Contact, Lead)
         */
        @AuraEnabled public String sourceEntity { get; set; }
        
        /**
         * @description The target entity (e.g., profile, event)
         */
        @AuraEnabled public String targetEntity { get; set; }
        
        /**
         * @description The status of the sync configuration (Active/Inactive)
         */
        @AuraEnabled public String status { get; set; }
        
        /**
         * @description Constructor to create a wrapper from a sync configuration
         * @param config The Test2Clevertap__CleverTap_Sync_Configuration__c record
         */
        public SyncConfigWrapper(Test2Clevertap__CleverTap_Sync_Configuration__c config) {
            this.id = config.Id;
            this.name = config.Name;
            this.syncType = config.Test2Clevertap__Sync_Type__c;
            this.sourceEntity = config.Test2Clevertap__Salesforce_Entity__c;
            this.targetEntity = config.Test2Clevertap__CleverTap_Entity__c;
            this.status = config.Test2Clevertap__Status__c;
        }
    }
    
    /**
     * @description Gets all sync configurations for a specific connection
     * @param connectionId The ID of the connection
     * @return List of sync configuration wrappers
     * @throws AuraHandledException If there is an error accessing the data
     */
    @AuraEnabled(cacheable=true)
    public static List<SyncConfigWrapper> getSyncConfigurations(String connectionId) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isAccessible()) {
                throw new AuraHandledException('You do not have access to sync configurations');
            }
            
            List<Test2Clevertap__CleverTap_Sync_Configuration__c> configs = [
                SELECT Id, Name, Test2Clevertap__Sync_Type__c, 
                       Test2Clevertap__Salesforce_Entity__c, Test2Clevertap__CleverTap_Entity__c, 
                       Test2Clevertap__Status__c, Test2Clevertap__ConnectionId__c
                FROM Test2Clevertap__CleverTap_Sync_Configuration__c
                WHERE Test2Clevertap__ConnectionId__c = :connectionId
                ORDER BY CreatedDate DESC
            ];
            
            return wrapConfigurations(configs);
            
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching sync configurations: ' + e.getMessage());
        }
    }
    
    /**
     * @description Helper method to convert configurations to wrappers
     * @param configs List of Test2Clevertap__CleverTap_Sync_Configuration__c records
     * @return List of sync configuration wrappers
     */
    private static List<SyncConfigWrapper> wrapConfigurations(List<Test2Clevertap__CleverTap_Sync_Configuration__c> configs) {
        List<SyncConfigWrapper> wrappers = new List<SyncConfigWrapper>();
        for (Test2Clevertap__CleverTap_Sync_Configuration__c config : configs) {
            wrappers.add(new SyncConfigWrapper(config));
        }
        return wrappers;
    }
    
    /**
     * @description Gets a sync configuration by ID
     * @param syncId The ID of the sync configuration
     * @return The sync configuration wrapper
     * @throws AuraHandledException If there is an error accessing the data
     */
    @AuraEnabled(cacheable=true)
    public static SyncConfigWrapper getSyncConfigurationById(String syncId) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isAccessible()) {
                throw new AuraHandledException('You do not have access to sync configurations');
            }
            
            Test2Clevertap__CleverTap_Sync_Configuration__c config = [
                SELECT Id, Name, Test2Clevertap__Sync_Type__c, 
                       Test2Clevertap__Salesforce_Entity__c, Test2Clevertap__CleverTap_Entity__c, 
                       Test2Clevertap__Status__c
                FROM Test2Clevertap__CleverTap_Sync_Configuration__c
                WHERE Id = :syncId
                LIMIT 1
            ];
            
            return new SyncConfigWrapper(config);
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching sync configuration: ' + e.getMessage());
        }
    }
    
    /**
     * @description Creates a new sync configuration
     * @param syncData JSON string containing sync configuration data
     * @return The ID of the newly created configuration
     * @throws AuraHandledException If there is an error creating the configuration
     */
    @AuraEnabled
    public static String createSyncConfiguration(String syncData) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isCreateable()) {
                throw new AuraHandledException('You do not have permission to create configurations');
            }
            
            Map<String, Object> syncMap = (Map<String, Object>) JSON.deserializeUntyped(syncData);
            
            Test2Clevertap__CleverTap_Sync_Configuration__c syncConfig = new Test2Clevertap__CleverTap_Sync_Configuration__c(
                Name = (String) syncMap.get('name'),
                Test2Clevertap__Sync_Type__c = (String) syncMap.get('syncType'),
                Test2Clevertap__Salesforce_Entity__c = (String) syncMap.get('sourceEntity'),
                Test2Clevertap__CleverTap_Entity__c = (String) syncMap.get('targetEntity'),
                Test2Clevertap__ConnectionId__c = (String) syncMap.get('connectionId'),
                Test2Clevertap__Status__c = 'Active'
            );
            
            insert syncConfig;
            return syncConfig.Id;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error creating sync configuration: ' + e.getMessage());
        }
    }
    
    /**
     * @description Updates a sync configuration
     * @param syncId The ID of the sync configuration to update
     * @param syncData JSON string containing updated sync configuration data
     * @return The updated sync configuration wrapper
     * @throws AuraHandledException If there is an error updating the configuration
     */
    @AuraEnabled
    public static SyncConfigWrapper updateSyncConfiguration(String syncId, String syncData) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isUpdateable()) {
                throw new AuraHandledException('You do not have permission to update configurations');
            }
            
            Map<String, Object> syncMap = (Map<String, Object>) JSON.deserializeUntyped(syncData);
            
            Test2Clevertap__CleverTap_Sync_Configuration__c syncConfig = [
                SELECT Id FROM Test2Clevertap__CleverTap_Sync_Configuration__c 
                WHERE Id = :syncId 
                LIMIT 1
            ];
            
            syncConfig.Name = (String) syncMap.get('name');
            syncConfig.Test2Clevertap__Sync_Type__c = (String) syncMap.get('syncType');
            syncConfig.Test2Clevertap__Salesforce_Entity__c = (String) syncMap.get('sourceEntity');
            syncConfig.Test2Clevertap__CleverTap_Entity__c = (String) syncMap.get('targetEntity');
            
            update syncConfig;
            
            // Return the updated record
            return getSyncConfigurationById(syncId);
        } catch (Exception e) {
            throw new AuraHandledException('Error updating sync configuration: ' + e.getMessage());
        }
    }
    
    /**
     * @description Updates the status of a sync configuration
     * @param syncId The ID of the sync configuration
     * @param status The new status (Active/Inactive)
     * @throws AuraHandledException If there is an error updating the status
     */
    @AuraEnabled
    public static void updateSyncStatus(String syncId, String status) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isUpdateable()) {
                throw new AuraHandledException('You do not have permission to update configurations');
            }
            
            Test2Clevertap__CleverTap_Sync_Configuration__c config = [
                SELECT Id, Test2Clevertap__Status__c FROM Test2Clevertap__CleverTap_Sync_Configuration__c WHERE Id = :syncId LIMIT 1
            ];
            config.Test2Clevertap__Status__c = status;
            update config;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating sync status: ' + e.getMessage());
        }
    }
    
    /**
     * @description Deletes a sync configuration
     * @param syncId The ID of the sync configuration to delete
     * @throws AuraHandledException If there is an error deleting the configuration
     */
    @AuraEnabled
    public static void deleteSyncConfiguration(String syncId) {
        try {
            if (!Test2Clevertap__CleverTap_Sync_Configuration__c.SObjectType.getDescribe(SObjectDescribeOptions.DEFERRED).isDeletable()) {
                throw new AuraHandledException('You do not have permission to delete configurations');
            }
            
            Test2Clevertap__CleverTap_Sync_Configuration__c config = [
                SELECT Id FROM Test2Clevertap__CleverTap_Sync_Configuration__c WHERE Id = :syncId LIMIT 1
            ];
            delete config;
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting sync configuration: ' + e.getMessage());
        }
    }
}