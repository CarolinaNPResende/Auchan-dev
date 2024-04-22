import { api, LightningElement } from 'lwc';
import UICOM_History from '@salesforce/label/c.ARCD_SeeFullHistory';
import UICOM_Cagnotte from '@salesforce/label/c.ARCD_Cagnotte';

export default class Uicom_AccountDetails_Transactions_Balance extends LightningElement {
    @api balance;
    @api lasttransaction;
    label = {
        UICOM_History,
        UICOM_Cagnotte
    }

    seeHistory(event){
        const evt = new CustomEvent('seehistory', {});
        this.dispatchEvent(evt);    
    }
}