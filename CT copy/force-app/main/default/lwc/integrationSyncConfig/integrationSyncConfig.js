import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createSyncConfiguration from '@salesforce/apex/IntegrationSyncController.createSyncConfiguration';
import getSyncConfigurationById from '@salesforce/apex/IntegrationSyncController.getSyncConfigurationById';
import updateSyncConfiguration from '@salesforce/apex/IntegrationSyncController.updateSyncConfiguration';

export default class IntegrationSyncConfig extends LightningElement {
    @api recordId;
    @api mode = 'new';
    @api objectName = 'CleverTap_Mapping__c';
    @api fieldName = 'Test2Clevertap__Data_Type__c';
    @api connectionId;
    @api connectionName;
    
    @track picklistOptions = [];
    @track isLoading = false;
    @track syncData = {
        name: '',
        syncType: '',
        sourceEntity: '',
        targetEntity: '',
        status: 'Active', // default status for new configurations
        connectionId: ''
    };
    
    @track showBasicConfig = true;
    @track showFieldMapping = false;
    @track syncId;

    connectedCallback() {
        // Set the connection ID from the API property
        if (this.connectionId) {
            this.syncData.connectionId = this.connectionId;
        }
        
        if (this.mode === 'edit' && this.recordId) {
            this.syncId = this.recordId;
            this.loadSyncConfiguration();
        }
    }

    async loadSyncConfiguration() {
        if (!this.recordId) {
            return;
        }
        
        try {
            this.isLoading = true;
            
            const result = await getSyncConfigurationById({ syncId: this.recordId });
            
            if (result) {
                this.syncData = {
                    name: result.name || '',
                    syncType: result.syncType || '',
                    sourceEntity: result.sourceEntity || '',
                    targetEntity: result.targetEntity || '',
                    status: result.status || 'Inactive',
                    connectionId: this.syncData.connectionId // Preserve connection ID
                };
                
                // Force a re-render
                this.template.querySelectorAll('lightning-input, lightning-combobox').forEach(element => {
                    if (element.name && this.syncData[element.name] !== undefined) {
                        setTimeout(() => {
                            element.value = this.syncData[element.name];
                        }, 0);
                    }
                });
                
                this.syncId = this.recordId;
            } else {
                this.showToast('Warning', 'No data found for this configuration', 'warning');
            }
        } catch (error) {
            this.showToast('Error', 'Error loading sync configuration: ' + (error.message || error.body?.message || 'Unknown error'), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    get syncTypeOptions() {
        return [
            { label: 'Salesforce to CleverTap', value: 'salesforce_to_clevertap' }
        ];
    }

    get sourceEntityOptions() {
        return [
            { label: 'Contact', value: 'Contact' },
            { label: 'Lead', value: 'Lead' },
            { label: 'Account', value: 'Account' },
            { label: 'Opportunity', value: 'Opportunity' }
        ];
    }

    get targetEntityOptions() {
        return [
            { label: 'Profile', value: 'profile' },
            { label: 'Event', value: 'event' }
        ];
    }

    handleNameChange(event) {
        this.syncData.name = event.target.value;
    }

    handleSyncTypeChange(event) {
        this.syncData.syncType = event.target.value;
    }

    handleSourceEntityChange(event) {
        this.syncData.sourceEntity = event.target.value;
    }

    handleTargetEntityChange(event) {
        this.syncData.targetEntity = event.target.value;
    }

    // Modified to dispatch cancel event instead of navigating
    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    // Modified to dispatch cancel event instead of navigating
    handleBack() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    async handleNext() {
        if (this.validateForm()) {
            try {
                this.isLoading = true;
                
                // Ensure status is set for new configurations
                if (this.mode === 'new') {
                    this.syncData.status = 'Active';
                }
                
                if (this.mode === 'edit') {
                    await updateSyncConfiguration({
                        syncId: this.recordId,
                        syncData: JSON.stringify(this.syncData)
                    });
                    this.syncId = this.recordId;
                    this.showToast('Success', 'Sync configuration updated successfully', 'success');
                } else {
                    const result = await createSyncConfiguration({
                        syncData: JSON.stringify(this.syncData)
                    });
                    this.syncId = result;
                    this.recordId = result;
                    this.showToast('Success', 'Sync configuration created successfully', 'success');
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
                
                this.showBasicConfig = false;
                this.showFieldMapping = true;

                const fieldMappingComponent = this.template.querySelector('c-integration-field-mapping');
                if (fieldMappingComponent) {
                    fieldMappingComponent.syncId = this.syncId;
                }
            } catch (error) {
                const action = this.mode === 'edit' ? 'update' : 'create';
                this.showToast('Error', `Failed to ${action} sync configuration: ${error.message || error.body?.message || 'Unknown error'}`, 'error');
            } finally {
                this.isLoading = false;
            }
        }
    }

    validateForm() {
        const inputFields = this.template.querySelectorAll('lightning-input,lightning-combobox');
        let isValid = true;

        inputFields.forEach(field => {
            if (!field.checkValidity()) {
                field.reportValidity();
                isValid = false;
            }
        });

        if (isValid) {
            if (!this.syncData.name || !this.syncData.syncType || 
                !this.syncData.sourceEntity || !this.syncData.targetEntity) {
                this.showToast('Error', 'Please fill in all required fields', 'error');
                return false;
            }
        }

        return isValid;
    }
    
    // Modified to dispatch save event instead of navigating
    handleMappingSave() {
        this.showToast('Success', 'Field mappings saved successfully', 'success');
        this.dispatchEvent(new CustomEvent('save'));
    }

    handleMappingCancel() {
        this.showBasicConfig = true;
        this.showFieldMapping = false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}