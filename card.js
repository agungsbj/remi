class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
    }

    // Urutan nilai kartu (3 terendah, 2 tertinggi)
    static getValuesOrder() {
        return ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    }

    // Urutan suit (Wajik terendah, Skop tertinggi)
    static getSuitsOrder() {
        return ['wajik', 'keriting', 'love', 'skop'];
    }
    
    // Mendapatkan nilai numerik kartu untuk perbandingan
    static getNumericValue(value) {
        return this.getValuesOrder().indexOf(value);
    }
    
    // Fungsi untuk mendapatkan emoji suit
    static getSuitEmoji(suit) {
        switch(suit) {
            case 'wajik': return '♦️';
            case 'keriting': return '♣️';
            case 'love': return '♥️';
            case 'skop': return '♠️';
            default: return suit;
        }
    }
    
    // Fungsi untuk mendapatkan warna suit
    static getSuitColor(suit) {
        switch(suit) {
            case 'wajik': return 'text-red-500';
            case 'love': return 'text-red-500';
            case 'keriting': return 'text-black';
            case 'skop': return 'text-black';
            default: return 'text-white';
        }
    }

    // Mendapatkan rank kartu untuk perbandingan
    getRank() {
        return {
            valueRank: Card.getValuesOrder().indexOf(this.value),
            suitRank: Card.getSuitsOrder().indexOf(this.suit)
        };
    }

    toString() {
        return `${this.value}${Card.getSuitEmoji(this.suit)}`;
    }
    
    // Method untuk menampilkan kartu dalam format pembacaan manusia
    toReadableString() {
        return `${this.value} ${this.suit}`;
    }

    isHigherThan(otherCard) {
        if (!otherCard) return true;
        const thisRank = this.getRank();
        const otherRank = otherCard.getRank();
        
        if (thisRank.valueRank > otherRank.valueRank) return true;
        if (thisRank.valueRank === otherRank.valueRank && thisRank.suitRank > otherRank.suitRank) return true;
        return false;
    }

    static isSameValue(cards) {
        return cards.every(card => card.value === cards[0].value);
    }

    static isSameSuit(cards) {
        return cards.every(card => card.suit === cards[0].suit);
    }

    static isConsecutive(cards) {
        const values = Card.getValuesOrder();
        const sorted = [...cards].sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
        
        for (let i = 1; i < sorted.length; i++) {
            if (values.indexOf(sorted[i].value) !== values.indexOf(sorted[i-1].value) + 1) {
                return false;
            }
        }
        return true;
    }
}

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
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numCards) {
        return this.cards.splice(0, numCards);
    }
}

const CombinationTypes = {
    SINGLE: 'single',
    TRIPLET: 'triplet',
    QUARTET: 'quartet',
    STRAIGHT: 'straight',
    STRAIGHT_FLUSH: 'straight_flush',
    FLUSH: 'flush',
    FULL_HOUSE: 'full_house'
};

function validateCombination(cards, combinationType) {
    if (!cards || cards.length === 0) return false;
    
    switch(combinationType) {
        case CombinationTypes.SINGLE:
            return cards.length === 1;
            
        case CombinationTypes.TRIPLET:
            return cards.length === 3 && Card.isSameValue(cards);
            
        case CombinationTypes.QUARTET:
            return cards.length === 4 && Card.isSameValue(cards);
            
        case CombinationTypes.STRAIGHT:
            return cards.length >= 3 && Card.isConsecutive(cards);
            
        case CombinationTypes.STRAIGHT_FLUSH:
            return cards.length >= 3 && Card.isConsecutive(cards) && Card.isSameSuit(cards);
            
        case CombinationTypes.FLUSH:
            return cards.length >= 3 && Card.isSameSuit(cards);
            
        case CombinationTypes.FULL_HOUSE:
            if (cards.length !== 5) return false;
            const values = cards.map(card => card.value);
            const valueCounts = {};
            values.forEach(value => {
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            });
            const counts = Object.values(valueCounts);
            return (counts.includes(3) && counts.includes(2));
            
        default:
            return false;
    }
}
