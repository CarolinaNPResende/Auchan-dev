import { LightningElement, api, track } from 'lwc';
import UICOM_Datetime from '@salesforce/label/c.ARCD_Datetime';
import UICOM_Type from '@salesforce/label/c.ARCD_LoyaltyType';
import UICOM_Site from '@salesforce/label/c.ARCD_TransactionsLocationFieldLabel';
import UICOM_SiteName from '@salesforce/label/c.ARCD_TransactionsLocationNameFieldLabel';
import UICOM_Amount from '@salesforce/label/c.ARCD_AmountLabel';
import UICOM_Total from '@salesforce/label/c.ARCD_TotalValue';
import UICOM_History from '@salesforce/label/c.ARCD_TransactionHistory';
import UICOM_NoTransaction from '@salesforce/label/c.ARCD_NoTransactionMessage';
import UICOM_Select from '@salesforce/label/c.ARCD_SelectLoyaltyMessage';
import UICOM_Close from '@salesforce/label/c.ARCD_Close';
import UICOM_Fullhist from '@salesforce/label/c.ARCD_FullHistory';

const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    maximumFractionDigits: 2, // (causes 2500.99 to be printed as $2,501)
});

export default class Uicom_AccountDetails_Transactions_List extends LightningElement {

    label = {
        UICOM_Datetime,
        UICOM_Type,
        UICOM_Site,
        UICOM_SiteName,
        UICOM_Amount,
        UICOM_Total,
        UICOM_History,
        UICOM_NoTransaction,
        UICOM_Select,
        UICOM_Close,
        UICOM_Fullhist
    }
    comarchColumns = [
        { label: this.UICOM_Datetime, fieldName: 'tDate' },
        { label: this.label.UICOM_Type, fieldName: 'typeName'},
        { label: this.label.UICOM_Site, fieldName: 'location'},
        { label: this.label.UICOM_SiteName, fieldName: 'locationName'},
        { label: this.label.UICOM_Amount, fieldName: 'points'},
        { label: this.label.UICOM_Total, fieldName: 'totalValue'},
    ];

    olcasColumns = [
        { label: this.UICOM_Datetime, fieldName: 'txnDate' },
        { label: this.label.UICOM_Type, fieldName: 'operation'},
        { label: this.label.UICOM_Amount, fieldName: 'partialAmount'},
        { label: this.label.UICOM_Total, fieldName: 'totalAmount'},
    ];

    @api transactions;
    @api olcasactive;
    @api fristtransactions;
    firstTransactions;
    @track showFirstTransactions = true;
    @api showolcasmessage;
    @track noTransactions;
    @track isModalOpen = false;

    connectedCallback(){
        if(!this.olcasactive){
            if (this.transactions.transactions.length <= 0) {
                this.noTransactions = true;
            }else if (this.transactions.transactions.length > 5) {
                this.noTransactions = false;
                this.firstTransactions = this.transactions.transactions.slice(0, 5);
            }else{
                this.noTransactions = false;
            }
        }
    }

    @api showFullHistory(event){
        this.isModalOpen = true;
    }

    get newTransactions(){
        let newTransactions = [];
        if (!this.noTransactions && !this.olcasactive) {
            for (let index = 0; index < this.firstTransactions.length; index++) {
                newTransactions.push(this.createComarchTransactionElement(this.firstTransactions[index]));
            }
        }        

        return newTransactions;
    }

    createComarchTransactionElement(transaction){
        return {
            transactionId: transaction.transactionId, 
            tDate: transaction.tDate, 
            typeName: transaction.typeName, 
            points: transaction.points < 0 ? '- '+formatter.format(transaction.points.toString().substring(1)) : '+ '+formatter.format(transaction.points),
            isNegative: transaction.points < 0 ? true : false
        };
    }

    closeModal(event){
        this.isModalOpen = false;
    }
}