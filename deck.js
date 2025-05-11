class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        const values = Card.getValuesOrder();
        const suits = Card.getSuitsOrder();

        for (let suit of suits) {
            for (let value of values) {
                this.cards.push(new Card(value, suit));
            }
        }
    }

    shuffle() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numCards) {
        if (numCards <= 0 || this.cards.length === 0) return [];
        
        const dealtCards = [];
        for (let i = 0; i < Math.min(numCards, this.cards.length); i++) {
            dealtCards.push(this.cards.pop());
        }
        return dealtCards;
    }
}
