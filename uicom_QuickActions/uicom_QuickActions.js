import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import printBarCodeForProfile from '@salesforce/apex/ARCD_LoyaltyMainController.printBarCodeForProfile';
import quickActionsLabel from '@salesforce/label/c.ARCD_QuickActions';
import printCardLabel from '@salesforce/label/c.ARCD_PrintCard';

export default class Uicom_QuickActions extends NavigationMixin(LightningElement) {
    @api strtitle;
    @api profileimage;
    @track printBarcodeActive;
    label = {
        quickActionsLabel,
        printCardLabel
    }

    connectedCallback(){
        printBarCodeForProfile({})
        .then((result) => {
            if (result[0].FeatureActivated__c && result[0].ARCD_FeatureSelection__r.FeatureStatus__c == 'Activated') {
                this.printBarcodeActive = result[0].FeatureActivated__c;
            }
        })
    }

    navigatePrintCard(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Print_Card__c',
            },
        });
    }

    navigatePrintTicket(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Print_Ticket__c',
            },
        });
    }
}