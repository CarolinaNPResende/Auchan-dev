import { api, LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAccountCases from '@salesforce/apex/ARCD_UICOM_Account_RelatedCasesControler.getAccountCases';
import getSalesforceUrl from '@salesforce/apex/ARCD_UICOM_SideBarController.getSalesforceUrl';
import opencaseLabel from '@salesforce/label/c.ARCD_OpenCase';

export default class Uicom_AccountDetails_RelatedCases extends NavigationMixin(LightningElement) {
    @api accountid;
    @track cases = [];
    caseSelected;
    @track renderCaseSelected = false;
    salesforceURL;

    label = {
        opencaseLabel     
    }

    connectedCallback(){
        getAccountCases({accountId: this.accountid})
        .then((result) => {
            for (let index = 0; index < result.length; index++) {
                if (result[index].Status === 'NEW') {
                    result[index].statusClass = 'open-case';
                } else if (result[index].Status === 'CANCELLED') {
                    result[index].statusClass = 'cancelled-case'; 
                }else if (result[index].Status == 'CLOSED' || result[index].Status == 'CLOSEDTRANSFER') {
                    result[index].statusClass = 'closed-case';
                } else {
                    result[index].statusClass = 'other-case';
                }
            }
            this.cases = result;
        })

        getSalesforceUrl({})
        .then((result) => {
            this.salesforceURL = result;
        })
    }

    handleClick(event){
        this.caseSelected = this.cases.find(item => item.Id === event.currentTarget.dataset.item);
        this.renderCaseSelected = true;
    }

    openCase(event){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: this.salesforceURL+'/lightning/r/Case/'+this.caseSelected.Id+'/view'
            },
        });
    }

}