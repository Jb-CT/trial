import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSalesforceFields from '@salesforce/apex/IntegrationSyncController.getSalesforceFields';
import saveFieldMappings from '@salesforce/apex/IntegrationSyncController.saveFieldMappings';
import getExistingMappings from '@salesforce/apex/IntegrationSyncController.getExistingMappings';

export default class IntegrationFieldMapping extends LightningElement {
    @api syncId;
    @api sourceEntity;
    @api targetEntity;

    @track sourceFields = [];
    @track mandatoryFieldMapping = { customer_id: '' };
    @track additionalMappings = [];
    @track isLoading = false;

    dataTypeOptions = [
        { label: 'Text', value: 'Text' },
        { label: 'Number', value: 'Number' },
        { label: 'Date', value: 'Date' },
        { label: 'Boolean', value: 'Boolean' }
    ];

    get showEmptyState() {
        return this.additionalMappings.length === 0;
    }

    connectedCallback() {
        if (this.sourceEntity) {
            this.loadSourceFields();
            this.loadExistingMappings();
        }
    }

    async loadSourceFields() {
        try {
            this.isLoading = true;
            const fields = await getSalesforceFields({ objectName: this.sourceEntity });
            if (fields) {
                this.sourceFields = fields.map(field => ({
                    label: field.label,
                    value: field.value
                }));
            }
        } catch (error) {
            this.showToast('Error', 'Failed to load source fields: ' + (error.body?.message || error.message || 'Unknown error'), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async loadExistingMappings() {
        if (!this.syncId) return;

        try {
            const existingMappings = await getExistingMappings({ syncId: this.syncId });
            if (existingMappings) {
                const mandatoryMapping = existingMappings.find(m => m.Test2Clevertap__Is_Mandatory__c);
                if (mandatoryMapping) {
                    this.mandatoryFieldMapping.customer_id = mandatoryMapping.Test2Clevertap__Salesforce_Field__c;
                }

                this.additionalMappings = existingMappings
                    .filter(m => !m.Test2Clevertap__Is_Mandatory__c)
                    .map(m => ({
                        id: Date.now() + Math.random(),
                        targetField: m.Test2Clevertap__CleverTap_Field__c,
                        sourceField: m.Test2Clevertap__Salesforce_Field__c,
                        dataType: m.Test2Clevertap__Data_Type__c || 'Text'
                    }));
            }
        } catch (error) {
            this.showToast('Error', 'Failed to load existing mappings: ' + (error.body?.message || error.message || 'Unknown error'), 'error');
        }
    }

    handleMandatoryFieldChange(event) {
        this.mandatoryFieldMapping.customer_id = event.detail.value;
    }

    handleTargetFieldChange(event) {
        const index = parseInt(event.target.dataset.index);
        if (this.additionalMappings[index]) {
            this.additionalMappings[index] = {
                ...this.additionalMappings[index],
                targetField: event.target.value
            };
        }
    }

    handleSourceFieldChange(event) {
        const index = parseInt(event.target.dataset.index);
        if (this.additionalMappings[index]) {
            this.additionalMappings[index] = {
                ...this.additionalMappings[index],
                sourceField: event.detail.value
            };
        }
    }

    handleDataTypeChange(event) {
        const index = parseInt(event.target.dataset.index);
        if (this.additionalMappings[index]) {
            this.additionalMappings[index] = {
                ...this.additionalMappings[index],
                dataType: event.detail.value
            };
        }
    }

    handleAddField() {
        this.additionalMappings.push({
            id: Date.now(),
            targetField: '',
            sourceField: '',
            dataType: 'Text'
        });
    }

    handleDeleteMapping(event) {
        const index = parseInt(event.target.dataset.index);
        this.additionalMappings = this.additionalMappings.filter((_, i) => i !== index);
    }

    async handleSave() {
        if (!this.validateMappings()) {
            return;
        }

        try {
            this.isLoading = true;

            const mappingData = {
                syncId: this.syncId,
                mappings: [
                    {
                        Test2Clevertap__CleverTap_Field__c: 'customer_id',
                        Test2Clevertap__Salesforce_Field__c: this.mandatoryFieldMapping.customer_id,
                        Test2Clevertap__Data_Type__c: 'Text',
                        Test2Clevertap__Is_Mandatory__c: true
                    },
                    ...this.additionalMappings
                        .filter(m => m.targetField && m.sourceField)
                        .map(m => ({
                            Test2Clevertap__CleverTap_Field__c: m.targetField,
                            Test2Clevertap__Salesforce_Field__c: m.sourceField,
                            Test2Clevertap__Data_Type__c: m.dataType || 'Text',
                            Test2Clevertap__Is_Mandatory__c: false
                        }))
                ]
            };

            await saveFieldMappings({ 
                mappingData: JSON.stringify(mappingData) 
            });

            this.showToast('Success', 'Field mappings saved successfully', 'success');

            // Instead of navigating, dispatch a save event
            this.dispatchEvent(new CustomEvent('save'));

        } catch (error) {
            this.showToast('Error', 'Failed to save mappings: ' + (error.body?.message || error.message || 'Unknown error'), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleBack() {
        // Just dispatch an event for the parent to handle
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    validateMappings() {
        if (!this.mandatoryFieldMapping.customer_id) {
            this.showToast('Error', 'Please map the mandatory identifier field', 'error');
            return false;
        }

        const allValid = [...this.template.querySelectorAll('lightning-input,lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        if (!allValid) {
            return false;
        }

        const targetFields = this.additionalMappings
            .filter(m => m.targetField)
            .map(m => m.targetField.toLowerCase());

        const hasDuplicates = targetFields.length !== new Set(targetFields).size;
        if (hasDuplicates) {
            this.showToast('Error', 'Duplicate target field names are not allowed', 'error');
            return false;
        }

        return true;
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