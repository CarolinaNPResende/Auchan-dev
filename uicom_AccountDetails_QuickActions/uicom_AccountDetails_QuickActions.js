import { LightningElement, api, track, wire} from 'lwc';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { NavigationMixin } from 'lightning/navigation';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getSalesforceUrl from '@salesforce/apex/ARCD_UICOM_SideBarController.getSalesforceUrl';
import printBarCodeForProfile from '@salesforce/apex/ARCD_LoyaltyMainController.printBarCodeForProfile';
import printCardLabel from '@salesforce/label/c.ARCD_PrintCard';
import quickActionLabel from '@salesforce/label/c.ARCD_QuickActions';
import createCaseLabel from '@salesforce/label/c.ARCD_CreateCase';
import editLabel from '@salesforce/label/c.ARCD_Edit';
import saveLabel from '@salesforce/label/c.ARCD_Save';
import cancelLabel from '@salesforce/label/c.ARCD_CancelButton';
import historyLabel from '@salesforce/label/c.ARCD_ViewHistory';
import CASE_OBJECT from '@salesforce/schema/Case';

export default class Uicom_AccountDetails_QuickActions extends NavigationMixin(LightningElement) {
  label = {
    printCardLabel,
    quickActionLabel,
    createCaseLabel,
    editLabel,
    saveLabel,
    cancelLabel,
    historyLabel
  }
    
      @api value;
      @track showSave = false;
      @api recordid;
      salesforceURL;
      recordTypeId;
      @track printBarcodeActive;
      @track loadedBarcodeActive = false;

      @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
      wiredObjectInfo({error, data}) {
          if (data) {
              const rtis = data.recordTypeInfos;
              this.recordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'Generic');
          }
      };
      
      connectedCallback(){
        getSalesforceUrl({})
        .then((result) => {
            this.salesforceURL = result;
        })

        printBarCodeForProfile({})
        .then((result) => {
            this.printBarcodeActive = result[0].FeatureActivated__c;
            this.loadedBarcodeActive = true;
        })
      }
    
      createCase() {
        const defaultValues = encodeDefaultFieldValues({
            AccountId:this.recordid
        });

        this[NavigationMixin.Navigate]({
            type: "standard__objectPage",
            attributes: {
                objectApiName: "Case",
                actionName: "new"
            },
            
            state: {
                defaultFieldValues: defaultValues,
                recordTypeId: this.recordTypeId,
                nooverride: "1"
            }
        });
      }

      handleChange(event) {
        if (event.detail.value === 'PrintCard') {
          this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Print_Card__c',
            },
            state: {
                accountId: this.recordid
            }
          });          
        }
      }

      editInfo(event){
        this.showSave = true;
        const evt = new CustomEvent('edit', {});
        this.dispatchEvent(evt);
      }

      handleSave(event){
        this.showSave = false;
        const evt = new CustomEvent('save', {});
        this.dispatchEvent(evt);
      }

      handleCancel(event){
        this.showSave = false;
        const evt = new CustomEvent('cancel', {});
        this.dispatchEvent(evt);
      }

      handleHistory(event){
        this[NavigationMixin.Navigate]({
          type: 'standard__webPage',
          attributes: {
              url: this.salesforceURL+'/lightning/r/Account/'+this.recordid+'/related/Histories/view'
          },
      });
      }

      get options(){
        if (this.printBarcodeActive) {
          return [{ label: this.label.printCardLabel, value: 'PrintCard' }];
        }else{
          return null;
        }
      }
    }