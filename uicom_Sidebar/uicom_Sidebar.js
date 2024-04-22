import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import getNavigationMenuItems from '@salesforce/apex/ARCD_UICOM_SideBarController.getNavigationMenuItems';
import getSalesforceUrl from '@salesforce/apex/ARCD_UICOM_SideBarController.getSalesforceUrl';
import isGuestUser from '@salesforce/user/isGuest';
import basePath from "@salesforce/community/basePath";
import UICOM_Dashboard from '@salesforce/label/c.ARCD_Dashboard';
import UICOM_Diamond from '@salesforce/label/c.ARCD_Diamond';
import UICOM_Client from '@salesforce/label/c.ARCD_Client';
import UICOM_Sidebar_ClientRelation from '@salesforce/label/c.ARCD_ClientRelation';
import UICOM_Sidebar_Logout from '@salesforce/label/c.ARCD_Logout';
import DIAMONDLOGO from "@salesforce/resourceUrl/ARCD_UICOM_DiamondClientLogo";

export default class Uicom_Sidebar extends NavigationMixin(LightningElement) {
    @api menuName;
    label={
        UICOM_Dashboard,
        UICOM_Diamond,
        UICOM_Client,
        UICOM_Sidebar_ClientRelation,
        UICOM_Sidebar_Logout
    }

    error;
    isLoaded;
    menuItems = [];
    homePageReference = {
        Type: 'Dashboard',
        Target: 'Home',
        AccessRestriction: 'None',
        Label: this.label.UICOM_Dashboard
    };
    publishedState;
    currentPage;
    salesforceURL;

    @wire(getSalesforceUrl, {})
    salesforceURL({ error, data }) {
        if (data) {
            this.salesforceURL = data;
        }else if (error) {
            console.log(error);
        }
    }

    @wire(getNavigationMenuItems, {
        menuName: '$menuName',
        publishedState: '$publishedState'
    })
    wiredMenuItems({ error, data }) {
        if (data && !this.isLoaded) {
            data = [this.homePageReference].concat(data);
            this.menuItems = data
                .map((item, index) => {
                    return {
                        target: item.Target,
                        id: index,
                        label: item.Label,
                        defaultListViewId: item.DefaultListViewId,
                        type: item.Type,
                        accessRestriction: item.AccessRestriction
                    };
                });
            this.error = undefined;
            this.isLoaded = true;
        } else if (error) {
            this.error = error;
            this.menuItems = [];
            this.isLoaded = true;
        }
    }

    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        const app =
            currentPageReference &&
            currentPageReference.state &&
            currentPageReference.state.app;
        if (app === 'commeditor') {
            this.publishedState = 'Draft';
        } else {
            this.publishedState = 'Live';
        }

        if (currentPageReference.type === 'comm__namedPage' && currentPageReference.attributes.name === 'Home') {
            this.currentPage = currentPageReference.attributes.name;
        }else if(currentPageReference.type === 'standard__objectPage'){
            this.currentPage = currentPageReference.attributes.objectApiName;
        }else{
            this.currentPage = 'Home';
        }
    }

    get processedMenuItems() {
        for (let index = 0; index < this.menuItems.length; index++) {
            this.menuItems[index].isSelected = this.menuItems[index].target === this.currentPage ? 'true'  : false;
        }
        return this.menuItems;
    }

    get logoutLink() {
        const sitePrefix = basePath.replace(/\/s$/i, ""); // site prefix is the site base path without the trailing "/s"
        return sitePrefix + "/secur/logout.jsp";
    }

    renderedCallback() {
        try {
            window.onscroll = () => {
                let stickysection = this.template.querySelector('.sticky-sidebar');
                let sticky2 = stickysection.offsetTop;
 
                if (window.pageYOffset > sticky2) {
                    stickysection.classList.add("slds-is-fixed");
                } else {
                    stickysection.classList.remove("slds-is-fixed");
                }
            }
        } catch (error) {
            console.log('error =>', error);
        }
    }

    get diamondLogo(){
        return DIAMONDLOGO;
    }
}