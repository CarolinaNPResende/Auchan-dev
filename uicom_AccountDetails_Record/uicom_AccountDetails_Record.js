import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import BIRTHDATE_FIELD from '@salesforce/schema/Account.PersonBirthdate';
import getChannelAccounts from '@salesforce/apex/ARCD_UICOM_Account_RecordController.getChannelAccounts';
import getChannelFields from '@salesforce/apex/ARCD_UICOM_Account_RecordController.getChannelFields';
const fieldList = [NAME_FIELD, BIRTHDATE_FIELD];
import ID_FIELD from '@salesforce/schema/Account.Id';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import updateChannelAccounts from '@salesforce/apex/ARCD_UICOM_Account_RecordController.updateChannelAccounts';
import PICKLIST_COUNTRY_FIELD from '@salesforce/schema/Channel__c.Country__c'
import CHANNEL_TYPE_FIELD from '@salesforce/schema/Channel__c.Type__c'
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import accountLabel from '@salesforce/label/c.ARCD_Account';
import loadingLabel from '@salesforce/label/c.ARCD_Loading';
import birthdateLabel from '@salesforce/label/c.ARCD_Birthdate';
import closeLabel from '@salesforce/label/c.ARCD_Close';
import changeLabel from '@salesforce/label/c.ARCD_ChangeAddress';
import streetLabel from '@salesforce/label/c.ARCD_Street';
import cityLabel from '@salesforce/label/c.ARCD_CIAM_City';
import postalCodeLabel from '@salesforce/label/c.ARCD_CIAM_PostalCode';
import countryLabel from '@salesforce/label/c.ARCD_CIAM_Country';
import cancelLabel from '@salesforce/label/c.ARCD_CancelButton';
import saveLabel from '@salesforce/label/c.ARCD_Save';
import successLabel from '@salesforce/label/c.ARCD_CIAM_SuccessMessage';
import updatedLabel from '@salesforce/label/c.ARCD_RecordUpdated';
import errorLabel from '@salesforce/label/c.ARCD_UpdateError';
import wrongLabel from '@salesforce/label/c.ARCD_SomethingWrong';
import checkAgainLabel from '@salesforce/label/c.ARCD_CheckInputs';
import optinLabel from '@salesforce/label/c.ARCD_Optin';
import optoutLabel from '@salesforce/label/c.ARCD_Optout';

export default class Uicom_AccountDetails_Record extends LightningElement {

    @track accountTitle;
    @track channelType;
    @api accountbirthdate;
    @track account;
    showEditField;
    @track channels;
    singleAccount;
    @api editmode;
    @api recordid;
    @track streetvalue;
    @track cityvalue;
    @track postalcodevalue;
    @track countryvalue;
    @api myElem;
    @track addressShowModalPopup = false;
    channelValues = [];
    @track isLoading = false;
    @track selectTargetValues = [];
    @track typeValues = [];
    label = {
        accountLabel,
        loadingLabel,
        birthdateLabel,
        closeLabel,
        changeLabel,
        streetLabel,
        cityLabel,
        postalCodeLabel,
        countryLabel,
        cancelLabel,
        saveLabel,
        successLabel,
        updatedLabel,
        errorLabel,
        wrongLabel,
        checkAgainLabel,
        optinLabel,
        optoutLabel     
    }
    addressChannelsTypes = ['CHT_01', 'CHT_02', 'CHT_03'];
    phonesChannelsTypes = ['CHT_05', 'CHT_06'];

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: PICKLIST_COUNTRY_FIELD }) compartmentValues({ data }) {
        if (data) {
            this.selectTargetValues = data.values;
        }
    }

    @wire(getPicklistValues, { recordTypeId: "012000000000000AAA", fieldApiName: CHANNEL_TYPE_FIELD }) typeValues({ data }) {
        if (data) {
            this.typeValues = data.values;
        }
    }

    customShowModalPopup = (event) => {
        this.myElem = this.channels.find(opt => event.target.id.includes(opt.Id)).Id;
        
        if (this.addressChannelsTypes.includes(event.currentTarget.dataset.item) && !this.editmode) {
            this.addressShowModalPopup = true;
            this.editmode = true;
            getChannelFields({ channelId: this.myElem })
                .then((result) => {
                    this.cityvalue = result.City__c;
                    this.countryvalue = result.Country__c;
                    this.postalcodevalue = result.PostalCode__c;
                    this.streetvalue = result.Street__c;
                })
        }
    }

    handleAddressStreetChange(event) {
        this.streetvalue = event.target.value;
    }

    handleAddressCityChange(event) {
        this.cityvalue = event.target.value;
    }

    handleAddressPostalCodeChange(event) {
        this.postalcodevalue = event.target.value;
    }

    handleAddressCountryChange(event) {
        this.countryvalue = event.target.value;
    }

    saveAddress(event) {
        let inp = this.template.querySelectorAll("lightning-input[data-id='channelInput']");

        inp.forEach(function (element) {
            if (element.id.includes(this.myElem)) {
                element.value = this.streetvalue + ', ' + this.cityvalue + ', ' + this.postalcodevalue + ', ' + this.countryvalue;
                this.channelValues.push({
                    typeAddress: true, 
                    channelId: this.channels.find(opt => element.id.includes(opt.Id)).Id,
                    streetAddress: this.streetvalue, 
                    channelOptin: false,
                    postalCodeAddress: this.postalcodevalue,
                    countryAddress: this.countryvalue, cityAddress: this.cityvalue
                });
            }

        }, this);
        this.addressShowModalPopup = false;
        this.editmode = false;
    }

    customHideModalPopup() {
        this.addressShowModalPopup = false;
        this.editmode = false;
    }

    connectedCallback() {
        this.isLoading = true;
        this.editmode = true;
        getChannelAccounts({ accountId: this.recordid })
            .then((result) => {
                for (let index = 0; index < result.length; index++) {
                    result[index].channelType = this.typeValues.find(opt => opt.value === result[index].Type__c).label;

                    if (this.phonesChannelsTypes.includes(result[index].Type__c)) {
                        result[index].phoneType = true;
                    }

                    if (result[index].IsOptin__c) {
                        result[index].toggleStyle = "background-color:green";
                    }
                    else {
                        result[index].toggleStyle = "background-color:#de6e1a";
                    }
                }
                result = this.formatResult(result);
                this.channels = result;
                this.isLoading = false;
            })
    }

    handleSuccess(event) {
        this.showEditField = false;
    }
    handleEdit() {
        this.showEditField = !this.showEditField;
    }

    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {

        this.recordId = currentPageReference.attributes.recordId;
    }

    @wire(getRecord, { recordId: "$recordid", fields: fieldList })
    getAccountFields({ error, data }) {
        this.isLoading = true;
        if (data) {
            this.isLoading = false;
            this.accountTitle = data.fields.Name.value;
            this.accountbirthdate = data.fields.PersonBirthdate.value;
            this.singleAccount = data;
        }
        else {
            this.isLoading = false;
            console.log('error: ' + JSON.stringify(error));
        }

    }

    formatResult(result) {
        for (let index = 0; index < result.length; index++) {
            this.channelType = result[index].Type__c.value;
        }
        return result;
    }

    @api updateRecord() {
        this.isLoading = true;
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputFields) => {
                inputFields.reportValidity();
                return validSoFar && inputFields.checkValidity();
            }, true);
        if (allValid) {
            let birthdate;
            let inp = this.template.querySelectorAll("lightning-input[data-id='channelInput']");
            var inputToggle = this.template.querySelectorAll("lightning-input[data-id='toggleInput']");

            inp.forEach(function (element) {
                if (element.name === 'Birthdate') {
                    birthdate = element.value;
                } else {
                    inputToggle.forEach(function (elem) {
                        let channelId = this.channels.find(opt => element.id.includes(opt.Id)).Id;

                        if (elem.id == element.id && !this.addressChannelsTypes.includes(element.name) && !this.phonesChannelsTypes.includes(element.name)) {
                            this.channelValues.push({ channelId: channelId, channelValue: element.value, channelOptin: elem.checked });
                        }else if (elem.id == element.id && this.addressChannelsTypes.includes(element.name)) {
                            if (this.channelValues.find(opt => element.id.includes(opt.channelId))) {
                                this.channelValues.find(opt => element.id.includes(opt.channelId)).channelOptin = elem.checked;
                            }else{
                                this.channelValues.push({
                                    typeAddress: true, 
                                    channelId: channelId, 
                                    channelOptin: elem.checked
                                });
                            }
                        }else if (elem.id == element.id && this.phonesChannelsTypes.includes(element.name)) {
                            this.channelValues.push({ channelId: channelId, channelValue: element.value, channelOptin: elem.checked, typePhone: true});
                        }
                    }, this);
                }
            }, this);

            // Create the recordInput object
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.recordid;
            fields[BIRTHDATE_FIELD.fieldApiName] = birthdate;
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {     
                    console.log(this.channelValues);              
                    updateChannelAccounts({ channelValues: this.channelValues })
                        .then((result) => {                            
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: this.label.successLabel,
                                    message: this.label.updatedLabel,
                                    variant: 'success'
                                })
                            );
                            this.channelValues = [];
                            this.isLoading = false;
                            return refreshApex(this.account);
                        }).catch(error => {
                            const evt = new ShowToastEvent({
                                message: error.body.message,
                                variant: 'error',
                            });
                            this.channelValues = [];
                            this.dispatchEvent(evt);                            
                            this.isLoading = false;
                            return refreshApex(this.account);
                        });

                    // Display fresh data in the form
                })
                .catch(error => {
                    // Error Handling
                    this.isLoading = false;
                    var errors = error.body.output.errors;
                    var fieldErrors = error.body.output.fieldErrors;
                    this.channelValues = [];
                    console.log('Generic Errors: ' + error.body.message);

                    if (error.body.output.errors != null) {
                        this.channelValues = [];
                        this.isLoading = false;
                        // Loop & Display Errors
                        for (let index = 0; index < error.body.output.errors.length; index++) {
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: this.label.errorLabel,
                                    message: error.body.output.errors[index].errorCode + '- ' + error.body.output.errors[index].message,
                                    variant: "error"
                                })
                            );
                        }
                    }
                    if (error.body.output.fieldErrors != null) {
                        this.channelValues = [];
                        this.isLoading = false;
                        console.log('Displaying Field Errors');
                        for (var prop in fieldErrors) {
                            console.log(Object.keys(fieldErrors));
                            var val = Object.values(fieldErrors);
                            console.log(val[0][0]["message"]);
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: this.label.errorLabel,
                                    message: val[0][0]["message"],
                                    variant: 'error'
                                })
                            );
                        }
                    } else {
                        this.channelValues = [];
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: this.label.errorLabel,
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                    }
                });
        }
        else {
            this.channelValues = [];
            this.isLoading = false;
            // The form is not valid
            this.dispatchEvent(
                new ShowToastEvent({
                    title: this.label.wrongLabel,
                    message: this.label.checkAgainLabel,
                    variant: 'error'
                })
            );
        }
    }

}