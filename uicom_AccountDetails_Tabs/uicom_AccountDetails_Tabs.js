import { LightningElement, api, track } from 'lwc';
import ARCD_UICOM_AccountDetTabs_Cases from '@salesforce/label/c.ARCD_Cases';
import ARCD_UICOM_AccountDetTabs_LoyaltyCards from '@salesforce/label/c.ARCD_LoyaltyCards';

export default class Uicom_AccountDetails_Tabs extends LightningElement {
    @api accountid;
    @track showRelatedCases;
    label = {
        ARCD_UICOM_AccountDetTabs_Cases,
        ARCD_UICOM_AccountDetTabs_LoyaltyCards 
    }

    handleCasesActive(event) {
        this.showRelatedCases = true;
    }
}