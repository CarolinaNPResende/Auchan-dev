import { api, LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import printBarCodeForProfile from '@salesforce/apex/ARCD_LoyaltyMainController.printBarCodeForProfile';
import UICOM_AccNumber from '@salesforce/label/c.ARCD_LoyaltyAccountNumber';
import UICOM_Details from '@salesforce/label/c.ARCD_SeeDetails';
import UICOM_PrintCard from '@salesforce/label/c.ARCD_PrintCard';

export default class Uicom_AccountDetails_Transactions_LoyaltyCards extends NavigationMixin(LightningElement) {
    @api cards;
    @api loyaltynumber;
    @api olcasactive;
    @api accountid;
    label = {
        UICOM_AccNumber,
        UICOM_Details,
        UICOM_PrintCard
    }
    @track printBarcodeActive;

    connectedCallback(){
        printBarCodeForProfile({})
        .then((result) => {
            this.printBarcodeActive = result[0].FeatureActivated__c;
        })
    }

    printCard(event){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Print_Card__c',
            },
            state: {
                loyaltyCardExternalId: event.currentTarget.dataset.external,
                loyaltyCardId: event.currentTarget.dataset.id,
                account: this.accountid
            }
        });
    }

    seeDetails(event){
        const evt = new CustomEvent('seedetails', {
            detail: event.currentTarget.dataset.item
        });
        this.dispatchEvent(evt);   
    }
}