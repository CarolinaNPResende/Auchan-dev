import { api, LightningElement, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import isOlcasActive from '@salesforce/apex/ARCD_UICOM_PrintCardController.isOlcasActive';
import getLoyaltyCards from '@salesforce/apex/ARCD_LoyaltyMainController.getLoyalties';
import getTransactions from '@salesforce/apex/ARCD_LoyaltyTransactions.getTransactions';
import getBalance from '@salesforce/apex/ARCD_LoyaltyBalance.getBalance';
import getOlcasBalance from '@salesforce/apex/ARCD_OlcasLoyaltyBalance.getBalance';
import UICOM_LastTransaction from '@salesforce/label/c.ARCD_LastTransaction';
import error3Label from '@salesforce/label/c.ARCD_LoyaltyNoExistMessage';

const FIELDS = ['Account.LoyaltyAccountNumber__pc'];

const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    maximumFractionDigits: 2, // (causes 2500.99 to be printed as $2,501)
  });

export default class Uicom_AccountDetails_Transactions extends LightningElement {
    @api accountid;
    @track showOlcasMessage;
    @track isLoading = true;
    olcasActive;
    account;
    loyaltyCards = [];
    @track transactions = [];
    @track firstTransactions = [];
    @track balance;
    @track lastTransaction;
    @track hasError = false;
    label = {
        UICOM_LastTransaction,
        error3Label
    }

    @wire(getRecord, { recordId: '$accountid', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            this.account = {Id: data.id, LoyaltyAccountNumber__pc: data.fields['LoyaltyAccountNumber__pc'].value};
        }
    }

    connectedCallback(){
        this.isLoading = true;
        getLoyaltyCards({accountId: this.accountid})
        .then((loyaltyCards) => {
            this.loyaltyCards = loyaltyCards;
        })
        isOlcasActive({})
        .then((olcasActive) => {
            this.olcasActive = olcasActive;
            if (!olcasActive) {
                setTimeout(() => {
                    getTransactions({loyaltyIdentifier: this.account.LoyaltyAccountNumber__pc, loyaltySystem: 'Comarch', comarchContext: 'Amount'})
                    .then((comarchTransactions) => {
                        this.transactions = comarchTransactions;
                        if (this.transactions.transactions) {
                            this.firstTransactions = this.transactions.transactions.slice(0, 5);
                        }
                        if (comarchTransactions.transactions && comarchTransactions.transactions.length > 0) {
                            this.lastTransaction = this.label.UICOM_LastTransaction+comarchTransactions.transactions[0].tDate;
                        }
                        getBalance({accountId: this.accountid, loyaltySystem: 'Comarch', action: 'Balance', updateLoyalty: false})
                        .then((comarchBalance) => {
                            if (!comarchBalance.success) {
                                const evt = new ShowToastEvent({
                                    message: this.label.error3Label,
                                    variant: 'error'
                                });
                                this.dispatchEvent(evt);
                                this.isLoading = false;
                                this.hasError = true;
                            }else{
                                this.balance = formatter.format(comarchBalance.totalPointBalance / comarchBalance.cagnotteStructure.ARCD_Ratio__c);
                                this.isLoading = false;
                                this.hasError = false;
                            }
                        })
                    })
                }, 1000);
            }else{
                this.showOlcasMessage = true;
                this.isLoading = false;
            }
        })
    }

    seeHistory(event){
        this.template.querySelector('c-uicom_-account-details_-transactions_-list').showFullHistory();
    }

    seeDetails(event){
        this.isLoading = true;
        this.showOlcasMessage = false;
        getTransactions({loyaltyIdentifier: event.detail, loyaltySystem: 'Olcas', comarchContext: ''})
            .then((olcasTransactions) => {
                this.transactions = olcasTransactions;
                if (this.transactions.transactionsOlcas) {
                    this.firstTransactions = this.transactions.transactionsOlcas.slice(0, 5);
                    for (let index = 0; index < this.firstTransactions.length; index++) {
                        this.firstTransactions[index] = this.createTransactionElement(this.firstTransactions[index]);
                    }
                }
                if (olcasTransactions.transactionsOlcas.length > 0) {
                    this.lastTransaction = this.label.UICOM_LastTransaction+olcasTransactions.transactionsOlcas[0].txnDate;
                }
                getOlcasBalance({loyaltyId: event.detail, accountId: this.account.Id})
                .then((olcasBalance) => {
                    if (olcasBalance.balanceExists) {
                        this.balance = formatter.format(olcasBalance.balanceMessage);
                    }
                    this.isLoading = false;
                })
            })
    }

    createTransactionElement(transaction){
        return {
            transactionId: transaction.txnID, 
            tDate: transaction.txnDate, 
            typeName: transaction.operation, 
            points: transaction.totalAmount < 0 ? '- '+formatter.format(transaction.totalAmount.toString().substring(1)) : '+ '+formatter.format(transaction.totalAmount),
            isNegative: transaction.totalAmount < 0 ? true : false
        };
    }
}