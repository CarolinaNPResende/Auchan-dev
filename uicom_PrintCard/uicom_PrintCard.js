import { LightningElement, track, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { loadScript } from "lightning/platformResourceLoader";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ARCD_Barcode from '@salesforce/resourceUrl/ARCD_Barcode';
import getLoyaltyCards from '@salesforce/apex/ARCD_LoyaltyMainController.getLoyalties';
import getBarCodeType from '@salesforce/apex/ARCD_LoyaltyNewAccount_WS.getBarCodeType';
import getLightningDefinition from '@salesforce/apex/ARCD_LoyaltyNewAccount_WS.getLightningDefinition';
import insertFile from '@salesforce/apex/ARCD_LoyaltyNewAccount_WS.insertFile';
import generatePdf from '@salesforce/apex/ARCD_LoyaltyNewAccount_WS.generatePdf';
import insertCase from '@salesforce/apex/ARCD_UICOM_PrintCardController.insertCase';
import isOlcasActive from '@salesforce/apex/ARCD_UICOM_PrintCardController.isOlcasActive';
import { getRecord } from 'lightning/uiRecordApi';
import getTransactions from '@salesforce/apex/ARCD_LoyaltyTransactions.getTransactions';
import getBalance from '@salesforce/apex/ARCD_LoyaltyBalance.getBalance';
import getOlcasBalance from '@salesforce/apex/ARCD_OlcasLoyaltyBalance.getBalance';
import UICOM_printcardCap from '@salesforce/label/c.ARCD_PrintCard';
import UICOM_close from '@salesforce/label/c.ARCD_Close';
import UICOM_taskComp from '@salesforce/label/c.ARCD_TaskCompleted';
import UICOM_printing from '@salesforce/label/c.ARCD_PrintingFinished';
import UICOM_returnDashboard from '@salesforce/label/c.ARCD_ReturnDashboard';
import UICOM_lastTransaction from '@salesforce/label/c.ARCD_LastTransaction';
import UICOM_title from '@salesforce/label/c.ARCD_LoyaltyCardSelection';
import UICOM_titleCustomer from '@salesforce/label/c.ARCD_CustomerResearch';
import ARCD_BarcodeTypeError from '@salesforce/label/c.ARCD_BarcodeTypeError';

import basepath from '@salesforce/community/basePath';

const FIELDS = [
    'Account.Id', 
    'Account.Name', 
    'Account.PersonMobilePhone', 
    'Account.PersonEmail', 
    'Account.LoyaltyAccountNumber__pc', 
    'Account.PersonMailingStreet',
    'Account.PersonMailingCity',
    'Account.PersonMailingPostalCode',
    'Account.PersonMailingCountry',
    'Account.PersonBirthdate'
];
const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    maximumFractionDigits: 2, // (causes 2500.99 to be printed as $2,501)
  });

export default class Uicom_PrintCard extends NavigationMixin(LightningElement) {
    @track headerIcon = 'utility:user';
    @track headerTitle = 'Customer Research';
    @track showCardList = false;
    @track showSearchEngine = true;
    @track renderCardSelected = false;
    @track renderAccountSelected = false;
    @track isLoading = false;
    @track barcodeLink;
    @track isModalOpen = false;
    @track isOlcasActive;
    lastTransaction;
    balance;
    loyaltyCards = [];
    loyaltyCard;
    account;
    backURL;
    concatenedValues;
    cardSelected;
    file;
    fileName;
    lightningDefinition;
    caseId;
    accountSelector;
    accountId;
    transactions;
    label = {
        UICOM_printcardCap,
        UICOM_close,
        UICOM_taskComp,
        UICOM_printing,
        UICOM_returnDashboard,
        UICOM_lastTransaction,
        UICOM_title,
        UICOM_titleCustomer,
        ARCD_BarcodeTypeError
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference) {
            if (currentPageReference.state?.accountId) {
                this.accountId = currentPageReference.state?.accountId;
                this.accountSelector = 'QuickAction';
            }
            if (currentPageReference.state?.loyaltyCardId) {
                this.accountSelector = 'LoyaltyCard';
                this.loyaltyCard = {Id: currentPageReference.state?.loyaltyCardId, ExternalId__c: currentPageReference.state?.loyaltyCardExternalId};
                this.accountId = currentPageReference.state?.account;
            }
       }
    }

    @wire(getRecord, { recordId: '$accountId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            this.showSearchEngine = false;
            let account = {
                Id: data.id, 
                Name: data.fields['Name'].value, 
                PersonMobilePhone: data.fields['PersonMobilePhone'].value, 
                PersonEmail: data.fields['PersonEmail'].value, 
                PersonBirthdate: data.fields['PersonBirthdate'].value,
                LoyaltyAccountNumber__pc: data.fields['LoyaltyAccountNumber__pc'].value,
                PersonMailingAddress:   (data.fields['PersonMailingStreet'].value != null ? data.fields['PersonMailingStreet'].value+', ' : '') + 
                                        (data.fields['PersonMailingCity'].value != null ? data.fields['PersonMailingCity'].value+', ' : '') +
                                        (data.fields['PersonMailingPostalCode'].value != null ? data.fields['PersonMailingPostalCode'].value+', ' : '') + 
                                        (data.fields['PersonMailingCountry'].value != null ? data.fields['PersonMailingCountry'].value : '')
            };
            if (this.accountSelector === 'QuickAction') {
                this.renderCardsList(account);
            }else if (this.accountSelector === 'LoyaltyCard') {
                this.isLoading = true;
                this.account = account;
                this.concatenedValues = (account.PersonMobilePhone!= null ? account.PersonMobilePhone : '') + ' - ' + (account.PersonEmail!= null ? account.PersonEmail : '');
                setTimeout(() => {
                    if (this.isOlcasActive) {
                        this.getOlcasInformation();
                    }else{
                        this.getComarchInformation();
                    }
                }, 1000);
            }
        }
    }

    connectedCallback(){
        isOlcasActive({})
        .then((olcasActive) => {
            this.isOlcasActive = olcasActive;
        })
        
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'home'
            },
        }).then((url) => {
            this.backURL = url;
        });
    }

    handleSearchEngineSelected(event){
        this.renderCardsList(event.detail);
    }

    renderCardsList(account){
        this.showSearchEngine = false;
        this.isLoading = true;
        this.headerTitle = this.label.UICOM_title;
        this.headerIcon = 'utility:copy_to_clipboard';
        this.concatenedValues = (account.PersonMobilePhone!= null ? account.PersonMobilePhone : '') + ' - ' + (account.PersonEmail!= null ? account.PersonEmail : '');
        this.account = account;
        getLoyaltyCards({accountId: account.Id})
        .then((loyaltyCards) => {
            if (!this.isOlcasActive) {
                this.getComarchInformation(loyaltyCards);
            }else{
                this.processLoyaltyCards(loyaltyCards, null);
            }
        })
    }

    processLoyaltyCards(loyaltyCards, transactions){
        if (loyaltyCards) {
            for (let index = 0; index < loyaltyCards.length; index++) {
                if (transactions != null && transactions.transactions !=null && transactions.transactions.length > 0) {
                    this.lastTransaction = this.label.UICOM_lastTransaction+transactions.transactions[0].tDate;
                    loyaltyCards[index].lastTransaction = transactions.transactions[0].tDate;
                }
                if (loyaltyCards[index].Status__c != 'LOS_01') {
                    loyaltyCards[index].isClosed = true;
                }else{
                    loyaltyCards[index].isClosed = false;
                }
            }
        }else{
            if (!this.isOlcasActive && this.transactions.transactions !=null && this.transactions.transactions.length > 0) {
                this.lastTransaction = this.label.UICOM_lastTransaction+this.transactions.transactions[0].tDate;
            }
        }
        this.showSearchEngine = false;
        this.isLoading = false;
        this.loyaltyCards = loyaltyCards;
        this.showCardList = true;
        this.renderAccountSelected = true;
    }
    
    handleEditAccount(event){
        this.headerTitle = this.label.UICOM_titleCustomer;
        this.headerIcon = 'utility:user';
        this.showCardList = false;
        this.renderCardSelected = false;
        this.showSearchEngine = true;
        this.renderAccountSelected = false;
    }

    handleEditCard(event){
        this.showCardList = true;
        this.renderCardSelected = false;
    }

    handleCardSelected(event){
        this.isLoading = true;
        this.showCardList = false;
        if (this.loyaltyCard) {
            this.cardSelected = this.loyaltyCard;
        }else{
            this.cardSelected = this.loyaltyCards.find(opt  => opt.ExternalId__c === event.detail);
        }
        if (this.isOlcasActive) {
            getTransactions({loyaltyIdentifier: this.cardSelected.Id, loyaltySystem: 'Olcas', comarchContext: ''})
            .then((olcasTransactions) => {
                if (olcasTransactions.transactionsOlcas.length > 0) {
                    this.lastTransaction = this.label.UICOM_lastTransaction+olcasTransactions.transactionsOlcas[0].txnDate;
                }
                getOlcasBalance({loyaltyId: this.cardSelected.Id, accountId: this.account.Id})
                .then((olcasBalance) => {
                    if (olcasBalance.balanceExists) {
                        this.balance = formatter.format(olcasBalance.balanceMessage);
                    }
                    this.renderCardSelected = true;
                })
            })
        }else{
            this.renderCardSelected = true;
        }

        loadScript(this, ARCD_Barcode)
            .then(() => {
                let hasError = false;
                getBarCodeType({})
                .then((result) => {
                    var canvas = document.createElement("canvas");
                    try{
                        JsBarcode(canvas, this.cardSelected.ExternalId__c, { format: result });
                        this.file = canvas.toDataURL("image/png"); 
                        this.fileName = 'barcode_image';
                    }catch(e){
                        const evt = new ShowToastEvent({
                            message: this.label.ARCD_BarcodeTypeError,
                            variant: 'error',
                        });
                        this.dispatchEvent(evt); 
                        hasError = true;
                        this.isLoading = false;
                    }

                    if (!hasError) {
                        getLightningDefinition({olcasMenuValue: 'PrintBarcode', accountId: this.account.Id})
                            .then((result) => {
                                let params = [this.account.Id, this.cardSelected.ExternalId__c];
                                this.lightningDefinition = result.unitLightningDef[0].ARCD_CaseFieldsStructure__c;
                                this.lightningDefinition = this.lightningDefinition.replace(/(\r\n|\n|\r)/gm, "");
                                for (var cont = 0; cont < params.length; cont++) {
                                    var base = "{" + cont + "}";
                                    this.lightningDefinition = this.lightningDefinition.replace(base, params[cont]);
                                }
                                var lstStringFields = this.lightningDefinition.split(',');
                                var lstFields = [];
                            
                                for (var cont = 0; cont < lstStringFields.length; cont++) {
                                    var objectBase = lstStringFields[cont].split(':');
                                    lstFields.push({ "ApiName": objectBase[0].replace(/\s/g, ""), "Value": objectBase.length == 2 ? objectBase[1] : objectBase[1] + ' :' + objectBase[2] });
                                }
                                
                                insertCase({fieldValues: lstFields})
                                    .then((result) => {
                                        this.caseId = result;
                                        insertFile({file: this.file, fileName: this.fileName, itemId: this.caseId})
                                        .then((result) => {
                                            generatePdf({barcodeId: result, caseId: this.caseId, loyaltyCard: this.cardSelected.ExternalId__c, fileName: this.fileName})
                                            .then((result2) => {
                                                this.isLoading = false;
                                                this[NavigationMixin.Navigate]({
                                                    type: 'standard__webPage',
                                                    attributes: {
                                                        url: result2
                                                    }
                                                });
                                                this.isModalOpen = true;
                                            })
                                        })
                                    })
                            })
                    }
                })                  

            })
            .catch((error) => {
                this.isLoading = false;
            });
    }

    getComarchInformation(loyaltyCards){
        getTransactions({loyaltyIdentifier: this.account.LoyaltyAccountNumber__pc, loyaltySystem: 'Comarch', comarchContext: 'Amount'})
            .then((comarchTransactions) => {
                this.transactions = comarchTransactions;
                getBalance({accountId: this.account.Id, loyaltySystem: 'Comarch', action: 'Balance', updateLoyalty: false})
                .then((comarchBalance) => {
                    this.balance = formatter.format(comarchBalance.totalPointBalance / comarchBalance.cagnotteStructure.ARCD_Ratio__c);
                })
                if (loyaltyCards) {
                    this.processLoyaltyCards(loyaltyCards, comarchTransactions);
                }else{
                    this.processLoyaltyCards();
                    this.handleCardSelected();
                }
            })
    }

    getOlcasInformation(){
        getTransactions({loyaltyIdentifier: this.loyaltyCard.Id, loyaltySystem: 'Olcas', comarchContext: ''})
            .then((olcasTransactions) => {
                if (olcasTransactions.transactionsOlcas.length > 0) {
                    this.lastTransaction = this.label.UICOM_lastTransaction+olcasTransactions.transactionsOlcas[0].txnDate;
                }
                getOlcasBalance({loyaltyId: this.loyaltyCard.Id, accountId: this.account.Id})
                .then((olcasBalance) => {
                    if (olcasBalance.balanceExists) {
                        this.balance = formatter.format(olcasBalance.balanceMessage);
                    }
                    this.renderCardSelected = true;
                    this.processLoyaltyCards();
                    this.handleCardSelected();
                })
            })
    }

    closeModal(event){
        this.isModalOpen = false;
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'home'
            },
        });
    }
}