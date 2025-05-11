class Player {
    constructor(name, isAI, index) {
        this.name = name;
        this.isAI = isAI;
        this.index = index;
        this.hand = [];
        this.gameState = null;
    }

    addCards(cards) {
        if (!cards || cards.length === 0) return;
        
        // Filter kartu yang undefined/null
        const validCards = cards.filter(card => card !== undefined && card !== null);
        
        if (validCards.length > 0) {
            this.hand = this.hand.concat(validCards);
            this.sortHand();
            return true;
        }
        return false;
    }

    sortHand() {
        this.hand = this.hand.filter(card => card !== undefined && card !== null);
        
        if (this.hand.length === 0) return;
        
        this.hand.sort((a, b) => {
            if (!a || !b) return 0;
            const aRank = a.getRank().valueRank + (a.getRank().suitRank * 0.1);
            const bRank = b.getRank().valueRank + (b.getRank().suitRank * 0.1);
            return aRank - bRank;
        });
    }

    playCards(combinationType, cardsToPlay) {
        // Validasi kombinasi kartu
        if (!validateCombination(cardsToPlay, combinationType)) {
            console.error('Kombinasi kartu tidak valid');
            return false;
        }

        // Validasi kartu dimiliki pemain
        if (!this.hasCards(cardsToPlay)) {
            console.error('Pemain tidak memiliki kartu tersebut');
            return false;
        }

        // Hapus kartu dari tangan pemain
        this.removeCards(cardsToPlay);

        return true;
    }

    hasCards(cardsToCheck) {
        if (!cardsToCheck || !Array.isArray(cardsToCheck)) return false;
        
        const tempHand = [...this.hand];
        return cardsToCheck.every(card => {
            const index = tempHand.findIndex(c => 
                c.value === card.value && c.suit === card.suit);
            if (index !== -1) {
                tempHand.splice(index, 1);
                return true;
            }
            return false;
        });
    }

    removeCards(cardsToRemove) {
        if (!cardsToRemove || !Array.isArray(cardsToRemove)) return;
        
        cardsToRemove.forEach(card => {
            const index = this.hand.findIndex(c => 
                c.value === card.value && c.suit === card.suit);
            if (index !== -1) {
                this.hand.splice(index, 1);
            }
        });
        
        this.sortHand();
    }

    hasDiamondThree() {
        return this.hand.some(card => card.value === '3' && card.suit === '♦');
    }

    getHandSize() {
        return this.hand.length;
    }

    // Fungsi AI untuk memainkan turn
    playAITurn() {
        // Jika harus merespon As dengan 2
        if (this.gameState.currentPlay?.cards[0]?.value === 'A') {
            const twoCards = this.hand.filter(card => card.value === '2');
            if (twoCards.length > 0) {
                this.gameState.playCards(this, [twoCards[0]], 'single');
                return;
            }
            // Skip turn jika tidak punya 2
            this.gameState.nextPlayer();
            return;
        }
        
        // Jika pembukaan, harus mainkan 3 wajik
        if (!this.gameState.currentPlay && this.gameState.players[this.gameState.currentPlayerIndex] === this) {
            const diamondThree = this.hand.find(card => card.value === '3' && card.suit === '♦');
            if (diamondThree) {
                this.gameState.playCards(this, [diamondThree], 'single');
                return;
            }
        }
        
        // Untuk play normal (mengikuti suit yang sama dengan nilai lebih tinggi)
        if (this.gameState.currentPlay?.combinationType === 'single') {
            const currentSuit = this.gameState.currentPlay.cards[0].suit;
            const currentValueRank = this.gameState.currentPlay.cards[0].getRank().valueRank;
            
            // Cari kartu dengan suit yang sama dan nilai lebih tinggi
            const validCards = this.hand.filter(card => 
                card.suit === currentSuit && 
                card.getRank().valueRank > currentValueRank
            );
            
            if (validCards.length > 0) {
                // Mainkan kartu dengan nilai terendah yang valid
                validCards.sort((a, b) => a.getRank().valueRank - b.getRank().valueRank);
                this.gameState.playCards(this, [validCards[0]], 'single');
                return;
            }
        }
        
        // Jika tidak bisa memainkan kartu, skip turn
        this.gameState.nextPlayer();
    }

    // Cek apakah memiliki Four of a Kind (bom)
    hasBomb() {
        const valueCounts = {};
        this.hand.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        return Object.values(valueCounts).some(count => count === 4);
    }
}

function validateCombination(cards, combinationType) {
    // Implementasi validasi kombinasi kartu
    // Sesuai dengan aturan yang diberikan
    // ...
    return true; // Untuk sementara return true
}
