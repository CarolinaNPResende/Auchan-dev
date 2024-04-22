import { LightningElement,api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import accDetailsLabel from '@salesforce/label/c.ARCD_AccountDetails';

export default class Uicom_AccountDetails extends NavigationMixin(LightningElement) {

    @api accountId;
    @track editMode = true;
    backURL;
    label = {
        accDetailsLabel
    }

    connectedCallback(){
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Account',
                actionName: 'list'
            },
        }).then((url) => {
            this.backURL = url;
        });
    }

    handleEdit(event){
        this.editMode = false;
    }

    handleSave(event){
        this.editMode = true;
        this.template.querySelector('c-uicom_-account-details_-record').updateRecord();
    }

    handleCancel(event){
        this.editMode = true;
        this.template.querySelector('c-uicom_-account-details_-record').cancelAction();
    }
}