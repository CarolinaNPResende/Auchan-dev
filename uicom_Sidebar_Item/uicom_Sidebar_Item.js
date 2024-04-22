import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';

export default class Uicom_Sidebar_Item extends NavigationMixin(LightningElement) {
    @api item = {};
    @api salesforceurl;

    @track href = '#';

    pageReference;

    connectedCallback() {
        var hostname = window.location.hostname;
        var arr = hostname.split(".");
        var instance = arr[0];
        const { type, target, defaultListViewId } = this.item;

        // get the correct PageReference object for the menu item type
        if (type === 'SalesforceObject') {
            // aka "Salesforce Object" menu item
            this.pageReference = {
                type: 'standard__objectPage',
                attributes: {
                    objectApiName: target,
                    actionName: 'home'
                }
            };
        } else if (type === 'InternalLink') {
            // aka "Site Page" menu item
            this.pageReference = {
                type: 'standard__webPage',
                attributes: {
                    url: basePath + target
                }
            };
        } else if (type === 'ExternalLink') {
            var newTarget = target.replace('http://www.','/');
            newTarget = newTarget.replace('.com','');
            newTarget = this.salesforceurl+newTarget;
            // aka "External URL" menu item
            this.pageReference = {
                type: 'standard__webPage',
                attributes: {
                    url: newTarget
                }
            };
        }else if (type === 'SystemLink') {
            this.pageReference = {
                type: 'standard__webPage',
                attributes: {
                    url: instance
                }
            }
        }else if (type === 'Dashboard') {
            this.pageReference = {
                type: 'standard__namedPage',
                attributes: {
                    pageName: 'home'
                }
            }
        }

        // use the NavigationMixin from lightning/navigation to generate the URL for navigation.
        if (this.pageReference) {
            this[NavigationMixin.GenerateUrl](this.pageReference).then(
                (url) => {
                    this.href = url;
                }
            );
        }
    }

    handleNavigation() {
        this.dispatchEvent(new CustomEvent('navigation'));
    }

    handleClick(evt) {
        // use the NavigationMixin from lightning/navigation to perform the navigation.
        evt.stopPropagation();
        evt.preventDefault();
        this.handleNavigation();
        if (this.pageReference) {
            this[NavigationMixin.Navigate](this.pageReference);
        } else {
            console.log(
                `Navigation menu type "${
                    this.item.type
                }" not implemented for item ${JSON.stringify(this.item)}`
            );
        }
    }
}