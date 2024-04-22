import { LightningElement, api } from 'lwc';

export default class Uicom_PageHeader extends LightningElement {

    @api strtitle;
    @api backbuttonlabel;
    @api backbuttonlink;

    handleChange(event){
        this.recordId = event.target.value;

        const searchEvent = new CustomEvent("getsearchvalue", {
            AccountId: this.recordId
        })

        this.dispatchEvent(searchEvent);
    }
}