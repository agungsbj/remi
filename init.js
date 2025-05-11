// Inisialisasi CombinationTypes dengan cara yang lebih robust
(function() {
    if (typeof window.CombinationTypes !== 'undefined') return;
    
    window.CombinationTypes = {
        SINGLE: 'single',
        TRIPLET: 'triplet',
        QUARTET: 'quartet',
        STRAIGHT: 'straight',
        STRAIGHT_FLUSH: 'straight_flush',
        FLUSH: 'flush',
        FULL_HOUSE: 'full_house',

        validate: function(combinationType, cards) {
            if (!cards || !Array.isArray(cards)) return false;
            
            switch(combinationType) {
                case this.SINGLE: return cards.length === 1;
                case this.TRIPLET: return cards.length === 3 && cards.every(c => c.value === cards[0].value);
                case this.QUARTET: return cards.length === 4 && cards.every(c => c.value === cards[0].value);
                case this.STRAIGHT: return validateStraight(cards);
                case this.STRAIGHT_FLUSH: return validateStraight(cards) && cards.every(c => c.suit === cards[0].suit);
                case this.FLUSH: return cards.length >= 3 && cards.every(c => c.suit === cards[0].suit);
                case this.FULL_HOUSE: return validateFullHouse(cards);
                default: return false;
            }
        }
    };

    function validateStraight(cards) {
        if (cards.length < 3) return false;
        const values = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
        const sorted = [...cards].sort((a, b) => values.indexOf(a.value) - values.indexOf(b.value));
        
        for (let i = 1; i < sorted.length; i++) {
            if (values.indexOf(sorted[i].value) !== values.indexOf(sorted[i-1].value) + 1) {
                return false;
            }
        }
        return true;
    }

    function validateFullHouse(cards) {
        if (cards.length !== 5) return false;
        const valuesCount = {};
        cards.forEach(card => {
            valuesCount[card.value] = (valuesCount[card.value] || 0) + 1;
        });
        const counts = Object.values(valuesCount);
        return (counts.includes(3) && counts.includes(2));
    }
})();
