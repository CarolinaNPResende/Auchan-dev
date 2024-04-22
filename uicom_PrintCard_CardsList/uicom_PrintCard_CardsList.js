import { LightningElement, api, track } from 'lwc';

export default class Uicom_PrintCard_CardsList extends LightningElement {
    @api cards;
    @track noCardsRetreived = false;

    connectedCallback(){
        if (this.cards.length <= 0) {
            this.noCardsRetreived = true;
        }
    }
    
    handleClick(event){
        let isSelected = false;
        let selectedCard;
        let inp=this.template.querySelectorAll("input");
        inp.forEach(function(element){
            if (element.checked) {
                isSelected = true;
                selectedCard = element.value;
            }
        },this);

        if (isSelected) {
            const event = new CustomEvent('selected', {
                detail: selectedCard
            });
            this.dispatchEvent(event);
        }
    }
}