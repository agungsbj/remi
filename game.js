// Di bagian paling atas game.js

// Variabel global untuk state game
const gameState = {
    players: [],
    currentPlayerIndex: 0,
    currentPlay: null,
    lastPlayerWhoPlayed: null,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    selectedCards: [],
    deck: [],
    timer: null,
    timerDuration: 30, // dalam detik
    timerInterval: null,
    difficulty: 'medium',
    sounds: true,
    cardHistory: [], // Riwayat kartu yang dibuang
    twoCardPlayed: false, // Flag untuk kartu 2 sudah dimainkan
    playerWhoPlayed2: null, // Menyimpan indeks pemain yang memainkan kartu 2
    playerBannedFromPlayingBomb: null // Pemain yang tidak boleh memainkan bom setelah memainkan kartu 2
};

// Gunakan CombinationTypes dari combinations.js

// Variabel global tambahan
let gameStats = {
    score: 0,
    cardsPlayed: 0,
    startTime: null,
    timerInterval: null
};

let selectedCards = [];

// Variabel untuk menyimpan badge pemain terakhir
let lastPlayerBadge = null;

// Helper untuk mendapatkan nama kombinasi
function getCombinationName(type) {
    switch(type) {
        case CombinationTypes.SINGLE: return 'Kartu Tunggal';
        case CombinationTypes.PAIR: return 'Pair';
        case CombinationTypes.TRIPLET: return 'Triplet';
        case CombinationTypes.QUARTET: return 'Quartet (Bom)';
        case CombinationTypes.STRAIGHT: return 'Straight';
        case CombinationTypes.FLUSH: return 'Flush';
        case CombinationTypes.FULL_HOUSE: return 'Full House';
        case CombinationTypes.STRAIGHT_FLUSH: return 'Straight Flush';
        default: return 'Tidak Diketahui';
    }
}

// Helper untuk mendapatkan nama suit dalam bahasa Indonesia
function getSuitName(suit) {
    switch (suit) {
        case 'hearts': return 'Hati (Merah)';
        case 'diamonds': return 'Wajik (Merah)';
        case 'clubs': return 'Keriting (Hitam)';
        case 'spades': return 'Sekop (Hitam)';
        default: return suit;
    }
}

// Inisialisasi game
function initGame(numPlayers = 2, difficulty = 'medium') {
    console.log(`Memulai game dengan ${numPlayers} pemain, level ${difficulty}`);
    
    // Reset game state
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.currentPlay = null;
    gameState.gameStarted = false;
    gameState.gameEnded = false;
    gameState.lastPlayerWhoPlayed = null;
    gameState.twoCardPlayed = false;
    gameState.playerWhoPlayed2 = null;
    gameState.playerBannedFromPlayingBomb = null;
    
    console.log('Game state direset');
    
    // Buat deck baru
    const deck = new Deck();
    deck.shuffle();
    
    console.log('Deck dibuat');
    
    // Inisialisasi pemain - pemain 0 adalah pengguna (Anda)
    gameState.players.push(new Player('Anda', false)); // Pemain manusia (indeks 0)
    
    // Pemain AI mulai dari indeks 1
    for (let i = 1; i < numPlayers; i++) {
        gameState.players.push(new Player(`Pemain ${i}`, true)); // AI
    }
    
    console.log('Pemain diinisialisasi:', gameState.players);
    
    // Bagikan kartu
    const cardsPerPlayer = Math.floor(52 / numPlayers);
    gameState.players.forEach(player => {
        player.addCards(deck.deal(cardsPerPlayer));
    });

    console.log('Kartu dibagikan');
    
    // Tentukan pemain pertama (yang memiliki 3 wajik)
    const startingPlayerIndex = findPlayerWithThreeOfDiamonds();
    gameState.currentPlayerIndex = startingPlayerIndex;
    
    // Mulai game
    gameState.gameStarted = true;
    console.log(`Game dimulai, pemain pertama: ${gameState.currentPlayerIndex} (memiliki 3 wajik)`);
    
    // Inisialisasi UI
    initUI();
    
    // Reset selected cards if it's the human player's turn
    if (gameState.currentPlayerIndex === 0) {
        selectedCards = [];
        
        // Also clear visual selection indicators
        const cardElements = document.querySelectorAll('#player-hand .card');
        cardElements.forEach(element => {
            element.classList.remove('selected');
        });
    }
    
    // Update UI
    updateUI();
    
    // Mulai giliran AI jika bukan giliran pemain pertama
    if (gameState.currentPlayerIndex !== 0) {
        setTimeout(playAITurn, 1000);
    }
}

// Fungsi timer
function startTimer() {
    if (gameStats.timerInterval) clearInterval(gameStats.timerInterval);
    
    const timeElement = document.getElementById('game-time');
    if (!timeElement) return;
    
    gameStats.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStats.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timeElement.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// Update tampilan UI
function updateUI() {
    // Update indikator giliran
    const turnIndicator = document.getElementById('turn-indicator');
    const currentPlayerName = document.getElementById('current-player-name');
    
    if (turnIndicator && currentPlayerName) {
        // Tentukan nama pemain yang sedang giliran
        let playerName = gameState.currentPlayerIndex === 0 ? 'Anda' : `Pemain ${gameState.currentPlayerIndex}`;
        currentPlayerName.textContent = playerName;
        
        // Ubah warna indikator berdasarkan giliran
        if (gameState.currentPlayerIndex === 0) {
            turnIndicator.className = 'text-center py-2 mb-2 bg-yellow-500 text-white font-bold rounded-lg';
        } else {
            turnIndicator.className = 'text-center py-2 mb-2 bg-blue-500 text-white font-bold rounded-lg';
        }
    }
    
    // Update indikator giliran di samping nama pemain
    // Sembunyikan semua indikator dulu
    for (let i = 0; i < 4; i++) {
        const turnIndicator = document.getElementById(`player-${i}-turn`);
        if (turnIndicator) {
            turnIndicator.classList.add('hidden');
        }
    }
    
    // Tampilkan indikator untuk pemain yang sedang giliran
    const currentPlayerTurn = document.getElementById(`player-${gameState.currentPlayerIndex}-turn`);
    if (currentPlayerTurn) {
        currentPlayerTurn.classList.remove('hidden');
    }
    
    // Tampilkan kartu yang sedang dimainkan
    const playedCardsArea = document.getElementById('played-cards');
    
    if (!playedCardsArea) {
        console.error('Area kartu yang dimainkan tidak ditemukan');
        return;
    }
    
    // Kosongkan area kartu yang dimainkan
    playedCardsArea.innerHTML = '<h3 class="text-white text-center mb-2">Kartu yang Dimainkan</h3>';
    
    // Tampilkan kartu yang sedang dimainkan jika ada
    if (gameState.currentPlay) {
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'flex flex-wrap justify-center gap-2';
        
        gameState.currentPlay.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card bg-white';
            cardElement.innerHTML = renderCard(card);
            cardsDiv.appendChild(cardElement);
        });
        
        playedCardsArea.appendChild(cardsDiv);
    }
    
    // Tampilkan tangan pemain (hanya untuk pemain manusia)
    if (!gameState.players[0].isAI) {
        const playerHand = document.createElement('div');
        playerHand.className = 'mt-4 p-4 bg-green-600 rounded-lg';
        playerHand.innerHTML = `<h3 class="text-white font-bold mb-2">Kartu Anda:</h3>`;
        
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'flex flex-wrap gap-2';
        gameState.players[0].hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card cursor-pointer hover:transform hover:-translate-y-2 transition-transform';
            cardElement.innerHTML = renderCard(card);
            cardElement.onclick = () => {
                console.log('Mencoba memilih kartu index:', index);
                
                // Pastikan game state valid
                if (!gameState?.players?.[0]?.hand) {
                    console.error('Game state tidak valid');
                    return;
                }
                
                const player = gameState.players[0];
                
                // Validasi index
                if (index < 0 || index >= player.hand.length) {
                    console.error('Index kartu tidak valid:', index, 'dari total', player.hand.length);
                    return;
                }
                
                const card = player.hand[index];
                
                // Cari elemen kartu dengan selector yang lebih spesifik
                const cardElement = document.querySelector(`#player-hand > .card:nth-child(${index + 1})`);
                
                if (!cardElement) {
                    console.error('Elemen kartu tidak ditemukan:', {
                        index: index,
                        selector: `#player-hand > .card:nth-child(${index + 1})`,
                        playerHand: player.hand,
                        container: document.getElementById('player-hand')?.innerHTML
                    });
                    return;
                }
                
                // Toggle seleksi
                const isSelected = cardElement.classList.contains('selected');
                
                if (!isSelected) {
                    selectedCards.push(card);
                    cardElement.classList.add('selected');
                } else {
                    const selectedIndex = selectedCards.findIndex(c => 
                        c.value === card.value && c.suit === card.suit);
                    if (selectedIndex !== -1) {
                        selectedCards.splice(selectedIndex, 1);
                    }
                    cardElement.classList.remove('selected');
                }
                
                updateActionButtons();
            };
            cardsDiv.appendChild(cardElement);
        });
        
        playerHand.appendChild(cardsDiv);
        // Tidak perlu menambahkan ke gameArea lagi karena kita menggunakan renderPlayerHand
    }
    
    // Tampilkan info pemain
    gameState.players.forEach((player, index) => {
        const playerInfo = document.createElement('div');
        playerInfo.className = `mt-2 p-2 rounded ${index === gameState.currentPlayerIndex ? 'bg-yellow-500' : 'bg-green-600'}`;
        playerInfo.innerHTML = `
            <p class="text-white">${player.name} (${player.hand.length} kartu)</p>
            ${player.isAI ? '<p class="text-xs text-gray-300">Komputer</p>' : ''}
        `;
        // Tidak perlu menambahkan info pemain ke gameArea karena kita sudah memiliki area pemain terpisah di HTML
    });
    
    // Tampilkan statistik jika ada area statistik
    const statsArea = document.getElementById('game-stats');
    if (statsArea) {
        statsArea.innerHTML = `
            <p>Skor: ${gameStats.score}</p>
            <p>Kartu dimainkan: ${gameStats.cardsPlayed}</p>
        `;
    }
}

// Inisialisasi UI
function initUI() {
    // Tombol aksi
    const actionPanel = document.createElement('div');
    actionPanel.className = 'action-panel';
    
    const playButton = document.createElement('button');
    playButton.id = 'play-button';
    playButton.textContent = 'Buang';
    playButton.onclick = () => playSelectedCards();
    
    const passButton = document.createElement('button');
    passButton.id = 'pass-button';
    passButton.textContent = 'Lewat';
    passButton.onclick = () => passTurn();
    
    const sortButton = document.createElement('button');
    sortButton.id = 'sort-button';
    sortButton.textContent = 'Urutkan';
    sortButton.onclick = () => sortHand();
    
    actionPanel.append(playButton, passButton, sortButton);
    document.body.appendChild(actionPanel);
}

// Render kartu ke HTML
function renderCard(card) {
    if (!card) return '';
    
    const suitSymbol = getSuitSymbol(card.suit);
    const colorClass = (card.suit === '♦' || card.suit === '♥') ? 'text-red-600' : 'text-black';
    
    return `
        <div class="relative w-full h-full">
            <div class="absolute top-1 left-1 ${colorClass} text-sm font-bold">${card.value}</div>
            <div class="absolute top-1 right-1 ${colorClass} text-sm">${suitSymbol}</div>
            <div class="absolute bottom-1 right-1 ${colorClass} text-sm font-bold transform rotate-180">${card.value}</div>
            <div class="absolute bottom-1 left-1 ${colorClass} text-sm transform rotate-180">${suitSymbol}</div>
            <div class="absolute inset-0 flex items-center justify-center ${colorClass} text-2xl">${suitSymbol}</div>
        </div>
    `;
}

// Fungsi untuk mendapatkan simbol suit kartu
function getSuitSymbol(suit) {
    const suitSymbols = {
        'Diamond': '♦',
        'Heart': '♥',
        'Club': '♣',
        'Spade': '♠'
    };
    return suitSymbols[suit] || suit;
}

// Update tampilan tombol aksi
function updateActionButtons() {
    console.log('Memperbarui tombol aksi...');
    
    const actionButtonsArea = document.getElementById('action-buttons');
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    const sortButton = document.getElementById('sort-button');
    
    if (!playButton || !passButton || !sortButton || !actionButtonsArea) {
        console.error('Tombol aksi tidak ditemukan');
        return;
    }
    
    // Cek apakah sekarang giliran pemain (player 0)
    const isPlayersTurn = gameState.currentPlayerIndex === 0;
    
    // Sembunyikan atau tampilkan area tombol berdasarkan giliran
    if (!isPlayersTurn) {
        // Bukan giliran pemain - sembunyikan semua tombol
        actionButtonsArea.style.display = 'none';
        console.log('Menyembunyikan tombol aksi karena bukan giliran pemain');
        return;
    } else {
        // Giliran pemain - tampilkan tombol
        actionButtonsArea.style.display = 'flex';
    }
    
    // Cek apakah kartu 2 baru saja dimainkan dan pemain saat ini bukan yang memainkan kartu 2
    let canPlayCards = true;
    let warningMessage = '';
    
    if (gameState.twoCardPlayed && gameState.currentPlayerIndex !== gameState.playerWhoPlayed2) {
        // Pemain hanya bisa memainkan bom (quartet) jika kartu 2 dimainkan
        // Cek apakah pemain punya kartu bom
        const bombCards = findBombCards(gameState.players[gameState.currentPlayerIndex]);
        
        if (!bombCards) {
            canPlayCards = false;
            warningMessage = 'Kartu 2 telah dimainkan! Anda harus punya kartu bom (kuartet) atau lewat.';
        }
    }
    
    // Tombol Buang
    if (selectedCards.length > 0 && canPlayCards) {
        playButton.disabled = false;
        playButton.className = 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2';
        playButton.textContent = `Buang (${selectedCards.length})`;
    } else {
        playButton.disabled = true;
        playButton.className = 'bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded mr-2 cursor-not-allowed';
        playButton.textContent = warningMessage || 'Buang';
    }
    
    // Tombol Lewat
    passButton.disabled = false;
    passButton.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2';
    
    // Tombol Urutkan
    sortButton.disabled = false;
    sortButton.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded';
    
    console.log('Tombol aksi berhasil diperbarui');
}

// Pemain AI melakukan giliran
function playAITurn() {
    // Pastikan pemain 0 tidak pernah dianggap sebagai AI
    if (gameState.currentPlayerIndex === 0) {
        console.error('Error: Pemain 0 (manusia) tidak boleh dianggap sebagai AI');
        return;
    }
    
    console.log(`AI Pemain ${gameState.currentPlayerIndex} sedang berpikir...`);
    if (!gameState.gameStarted || gameState.gameEnded) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isAI) {
        console.error(`Error: Pemain ${gameState.currentPlayerIndex} bukan AI`);
        return;
    }
    
    // Debug: Tampilkan kartu di tangan AI
    console.log(`AI Pemain ${gameState.currentPlayerIndex} memiliki kartu:`, currentPlayer.hand);
    
    // Tunggu sebentar untuk efek berpikir
    setTimeout(() => {
        // Pastikan pemain masih AI saat timeout selesai
        if (gameState.currentPlayerIndex === 0 || !gameState.players[gameState.currentPlayerIndex].isAI) {
            console.error('Error: Giliran sudah berpindah ke pemain lain');
            return;
        }
        
        // Cari kombinasi kartu yang valid untuk dimainkan
        const validCombination = findValidCombinationForAI(currentPlayer);
        
        // Debug: Tampilkan kombinasi yang ditemukan
        console.log(`AI Pemain ${gameState.currentPlayerIndex} menemukan kombinasi:`, 
                   validCombination ? `${validCombination.type} dengan ${validCombination.cards.length} kartu` : 'tidak ada');
        
        if (validCombination) {
            console.log(`AI Pemain ${gameState.currentPlayerIndex} membuang kartu:`, validCombination.cards);
            playCards(currentPlayer, validCombination.cards, validCombination.type);
        } else {
            console.log(`AI Pemain ${gameState.currentPlayerIndex} lewat giliran`);
            passTurn(); // Gunakan passTurn untuk AI juga
        }
    }, 1000);
}

// Fungsi untuk mencari kombinasi kartu valid untuk AI
function findValidCombinationForAI(player) {
    const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    
    // Jika kartu 2 sedang dimainkan, hanya pemain yang memainkan kartu 2 atau pemain dengan bom yang bisa main
    if (gameState.twoCardPlayed) {
        // Jika ini adalah pemain yang baru saja memainkan kartu 2 DAN memiliki flag dilarang memainkan bom
        if (player.index === gameState.playerWhoPlayed2 && gameState.playerBannedFromPlayingBomb === player.index) {
            console.log(`AI Pemain ${player.index} baru saja memainkan kartu 2, tidak boleh memainkan bom`);
            // Pemain yang baru saja memainkan kartu 2 boleh memainkan kartu apa saja KECUALI bom
            // Saring kartu bom dari potensi kombinasi
            const bombCards = findBombCards(player);
            if (bombCards) {
                console.log(`AI Pemain ${player.index} memiliki bom, tetapi tidak boleh memainkannya setelah memainkan kartu 2`);
            }
        }
        
        // Jika ini bukan pemain yang memainkan kartu 2, cari bom (quartet)
        if (player.index !== gameState.playerWhoPlayed2) {
            // Cari kartu bom (quartet)
            const bombCards = findBombCards(player);
            if (bombCards) {
                // Untuk AI, buat keputusan strategis apakah akan menggunakan bom
                // Di sini kita membuat AI menggunakan bom hanya jika mereka punya kartu <= 4
                // Ini membuat AI tidak selalu menggunakan bom untuk strategi
                if (player.hand.length <= 4) {
                    console.log(`AI Pemain ${player.index} memilih menggunakan bom karena hampir menang`);
                    return {
                        cards: bombCards,
                        type: CombinationTypes.QUARTET
                    };
                } else {
                    console.log(`AI Pemain ${player.index} memilih untuk TIDAK menggunakan bom (strategi)`);
                    // AI memilih untuk tidak gunakan bom, tetap harus lewat
                    return null;
                }
            }
            
            // Tidak punya bom, harus lewat
            console.log(`AI Pemain ${player.index} tidak punya bom, harus lewat`);
            return null;
        }
        
        // Jika ini adalah pemain yang memainkan kartu 2, dia bebas memainkan kombinasi baru kecuali bom
        if (player.index === gameState.playerWhoPlayed2) {
            // Cari kombinasi yang valid, tapi jangan pernah mainkan bom jika pemain dilarang
            if (gameState.playerBannedFromPlayingBomb === player.index) {
                // Jangan pernah mainkan bom
                console.log(`AI Pemain ${player.index} tidak boleh memainkan bom setelah memainkan kartu 2`);
            }
        }
    }
    
    // Jika tidak ada kartu yang dimainkan sebelumnya (awal permainan atau setelah semua pemain lewat)
    if (!gameState.currentPlay) {
        // Jika ini adalah giliran pertama, cari kartu 3 wajik
        if (gameState.firstTurn) {
            const threeDiamond = player.hand.find(card => card.value === '3' && card.suit === '♦');
            if (threeDiamond) {
                return {
                    cards: [threeDiamond],
                    type: CombinationTypes.SINGLE
                };
            }
        }
        
        // Coba cari kombinasi kartu yang bagus
        // 1. Cari Four of a Kind (Quartet)
        const valueCounts = {};
        player.hand.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        
        // Cek Four of a Kind
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 4) {
                const quartetCards = player.hand.filter(card => card.value === value);
                return {
                    cards: quartetCards,
                    type: CombinationTypes.QUARTET
                };
            }
        }
        
        // 2. Cari Straight (minimal 5 kartu berurutan)
        const sortedHand = [...player.hand].sort((a, b) => {
            return values.indexOf(a.value) - values.indexOf(b.value);
        });
        
        for (let i = 0; i <= sortedHand.length - 5; i++) {
            const potentialStraight = sortedHand.slice(i, i + 5);
            const cardValues = potentialStraight.map(card => values.indexOf(card.value));
            let isConsecutive = true;
            
            for (let j = 1; j < cardValues.length; j++) {
                if (cardValues[j] !== cardValues[j-1] + 1) {
                    isConsecutive = false;
                    break;
                }
            }
            
            if (isConsecutive) {
                return {
                    cards: potentialStraight,
                    type: CombinationTypes.STRAIGHT
                };
            }
        }
        
        // 3. Cari Three of a Kind (Triplet)
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 3) {
                const tripletCards = player.hand.filter(card => card.value === value);
                return {
                    cards: tripletCards,
                    type: CombinationTypes.TRIPLET
                };
            }
        }
        
        // 4. Jika tidak ada kombinasi khusus, gunakan kartu tunggal terendah
        if (player.hand.length > 0) {
            const lowestCard = player.hand.reduce((lowest, card) => 
                values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
            , player.hand[0]);
            
            return {
                cards: [lowestCard],
                type: CombinationTypes.SINGLE
            };
        }
        
        return null;
    }
    
    // Jika ada kartu yang dimainkan sebelumnya, cari kartu yang valid
    const currentType = gameState.currentPlay.type;
    const currentCards = gameState.currentPlay.cards;
    
    // Jika kartu 2 telah dimainkan, pemain berikutnya bebas memainkan kartu apa saja
    if (currentCards[0].value === '2') {
        // Gunakan strategi untuk memulai kombinasi baru
        // Coba cari kombinasi kartu yang bagus
        // 1. Cari Four of a Kind (Quartet)
        const valueCounts = {};
        player.hand.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        
        // Cek Four of a Kind
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 4) {
                const quartetCards = player.hand.filter(card => card.value === value);
                return {
                    cards: quartetCards,
                    type: CombinationTypes.QUARTET
                };
            }
        }
        
        // 2. Cari Straight (minimal 5 kartu berurutan)
        const sortedHand = [...player.hand].sort((a, b) => {
            return values.indexOf(a.value) - values.indexOf(b.value);
        });
        
        for (let i = 0; i <= sortedHand.length - 5; i++) {
            const potentialStraight = sortedHand.slice(i, i + 5);
            const cardValues = potentialStraight.map(card => values.indexOf(card.value));
            let isConsecutive = true;
            
            for (let j = 1; j < cardValues.length; j++) {
                if (cardValues[j] !== cardValues[j-1] + 1) {
                    isConsecutive = false;
                    break;
                }
            }
            
            if (isConsecutive) {
                return {
                    cards: potentialStraight,
                    type: CombinationTypes.STRAIGHT
                };
            }
        }
        
        // 3. Cari Three of a Kind (Triplet)
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 3) {
                const tripletCards = player.hand.filter(card => card.value === value);
                return {
                    cards: tripletCards,
                    type: CombinationTypes.TRIPLET
                };
            }
        }
        
        // 4. Jika tidak ada kombinasi khusus, gunakan kartu tunggal terendah
        if (player.hand.length > 0) {
            const lowestCard = player.hand.reduce((lowest, card) => 
                values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
            , player.hand[0]);
            
            return {
                cards: [lowestCard],
                type: CombinationTypes.SINGLE
            };
        }
        
        return null;
    }
    
    // Jika semua pemain lain telah lewat, pemain yang terakhir memainkan kartu bebas memainkan kombinasi baru
    // tetapi harus tetap mengikuti aturan kombinasi yang valid
    if (passedPlayers.length === gameState.players.length - 1) {
        console.log('AI: Semua pemain lain lewat, mencari kombinasi baru yang valid');
        
        // Coba cari kombinasi yang sama dengan yang terakhir dimainkan
        // Jika tidak bisa, cari kombinasi baru yang valid
        
        // Coba cari kombinasi yang sama dengan yang terakhir dimainkan
        if (currentType === CombinationTypes.SINGLE) {
            // Untuk single, cari kartu dengan nilai terendah
            if (player.hand.length > 0) {
                const lowestCard = player.hand.reduce((lowest, card) => 
                    values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
                , player.hand[0]);
                
                return {
                    cards: [lowestCard],
                    type: CombinationTypes.SINGLE
                };
            }
        } else if (currentType === CombinationTypes.TRIPLET) {
            // Cari triplet baru
            const valueCounts = {};
            player.hand.forEach(card => {
                valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
            });
            
            for (const [value, count] of Object.entries(valueCounts)) {
                if (count >= 3) {
                    const tripletCards = player.hand.filter(card => card.value === value).slice(0, 3);
                    return {
                        cards: tripletCards,
                        type: CombinationTypes.TRIPLET
                    };
                }
            }
        } else if (currentType === CombinationTypes.STRAIGHT) {
            // Cari straight dengan panjang yang sama
            const straightLength = currentCards.length;
            // Filter kartu 2 terlebih dahulu karena tidak valid dalam straight
            const handWithout2 = player.hand.filter(card => card.value !== '2');
            const sortedHand = [...handWithout2].sort((a, b) => {
                return values.indexOf(a.value) - values.indexOf(b.value);
            });
            
            for (let i = 0; i <= sortedHand.length - straightLength; i++) {
                const potentialStraight = sortedHand.slice(i, i + straightLength);
                const cardValues = potentialStraight.map(card => values.indexOf(card.value));
                let isConsecutive = true;
                
                for (let j = 1; j < cardValues.length; j++) {
                    if (cardValues[j] !== cardValues[j-1] + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive) {
                    return {
                        cards: potentialStraight,
                        type: CombinationTypes.STRAIGHT
                    };
                }
            }
        }
        
        // Jika tidak bisa menemukan kombinasi yang sama, coba cari kombinasi lain
        // 1. Cari Four of a Kind (Quartet)
        const valueCounts = {};
        player.hand.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 4) {
                const quartetCards = player.hand.filter(card => card.value === value);
                return {
                    cards: quartetCards,
                    type: CombinationTypes.QUARTET
                };
            }
        }
        
        // 2. Cari Triplet
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count >= 3) {
                const tripletCards = player.hand.filter(card => card.value === value).slice(0, 3);
                return {
                    cards: tripletCards,
                    type: CombinationTypes.TRIPLET
                };
            }
        }
        
        // 3. Cari Straight (minimal 3 kartu berurutan)
        // Filter kartu 2 terlebih dahulu karena tidak valid dalam straight
        const handWithout2 = player.hand.filter(card => card.value !== '2');
        const sortedHand = [...handWithout2].sort((a, b) => {
            return values.indexOf(a.value) - values.indexOf(b.value);
        });
        
        for (let len = 5; len >= 3; len--) {
            for (let i = 0; i <= sortedHand.length - len; i++) {
                const potentialStraight = sortedHand.slice(i, i + len);
                const cardValues = potentialStraight.map(card => values.indexOf(card.value));
                let isConsecutive = true;
                
                for (let j = 1; j < cardValues.length; j++) {
                    if (cardValues[j] !== cardValues[j-1] + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive) {
                    return {
                        cards: potentialStraight,
                        type: CombinationTypes.STRAIGHT
                    };
                }
            }
        }
        
        // 4. Jika tidak ada kombinasi khusus, gunakan kartu tunggal terendah
        if (player.hand.length > 0) {
            const lowestCard = player.hand.reduce((lowest, card) => 
                values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
            , player.hand[0]);
            
            return {
                cards: [lowestCard],
                type: CombinationTypes.SINGLE
            };
        }
        
        return null;
    }
    
    // Cari kombinasi yang sesuai dengan tipe saat ini
    switch (currentType) {
        case CombinationTypes.SINGLE:
            // Cari kartu tunggal yang lebih tinggi
            const lastCard = currentCards[0];
            
            // Pengecualian: Kartu 2 bisa dimainkan kapan saja tanpa memperhatikan jenis (suit)
            const twoCards = player.hand.filter(card => card.value === '2');
            if (twoCards.length > 0) {
                return {
                    cards: [twoCards[0]],
                    type: CombinationTypes.SINGLE
                };
            }
            
            // Pengecualian: Jika kartu terakhir adalah As, cari kartu 2 dari jenis apapun
            if (lastCard.value === 'A') {
                const twoCards = player.hand.filter(card => card.value === '2');
                if (twoCards.length > 0) {
                    return {
                        cards: [twoCards[0]],
                        type: CombinationTypes.SINGLE
                    };
                }
            }
            
            // Filter kartu dengan jenis yang sama dan nilai yang lebih tinggi
            const higherCards = player.hand.filter(card => 
                card.suit === lastCard.suit && values.indexOf(card.value) > values.indexOf(lastCard.value)
            );
            
            if (higherCards.length > 0) {
                // Pilih kartu dengan nilai terendah dari yang lebih tinggi
                const lowestHigherCard = higherCards.reduce((lowest, card) => 
                    values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
                , higherCards[0]);
                
                return {
                    cards: [lowestHigherCard],
                    type: CombinationTypes.SINGLE
                };
            }
            break;
            
        case CombinationTypes.TRIPLET:
            // Cari triplet yang lebih tinggi
            const lastTripletValue = currentCards[0].value;
            const triplets = [];
            
            // Hitung frekuensi nilai kartu
            const tripletCounts = {};
            player.hand.forEach(card => {
                tripletCounts[card.value] = (tripletCounts[card.value] || 0) + 1;
            });
            
            // Cari triplet yang lebih tinggi
            for (const [value, count] of Object.entries(tripletCounts)) {
                if (count >= 3 && values.indexOf(value) > values.indexOf(lastTripletValue)) {
                    const tripletCards = player.hand.filter(card => card.value === value).slice(0, 3);
                    triplets.push({
                        cards: tripletCards,
                        value: value
                    });
                }
            }
            
            if (triplets.length > 0) {
                // Pilih triplet dengan nilai terendah dari yang lebih tinggi
                const lowestTriplet = triplets.reduce((lowest, triplet) => 
                    values.indexOf(triplet.value) < values.indexOf(lowest.value) ? triplet : lowest
                , triplets[0]);
                
                return {
                    cards: lowestTriplet.cards,
                    type: CombinationTypes.TRIPLET
                };
            }
            break;
            
        case CombinationTypes.STRAIGHT:
            // Cari straight dengan panjang yang sama dan nilai lebih tinggi
            const straightLength = currentCards.length;
            const lastStraightHighCard = currentCards.reduce((highest, card) => 
                values.indexOf(card.value) > values.indexOf(highest.value) ? card : highest
            , currentCards[0]);
            
            // Cari semua kemungkinan straight dengan panjang yang sama
            const possibleStraights = [];
            
            // Urutkan kartu berdasarkan nilai
            const sortedCards = [...player.hand].sort((a, b) => 
                values.indexOf(a.value) - values.indexOf(b.value)
            );
            
            // Cari straight yang valid
            for (let i = 0; i <= sortedCards.length - straightLength; i++) {
                const potentialStraight = sortedCards.slice(i, i + straightLength);
                const cardValues = potentialStraight.map(card => values.indexOf(card.value));
                let isConsecutive = true;
                
                for (let j = 1; j < cardValues.length; j++) {
                    if (cardValues[j] !== cardValues[j-1] + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                
                if (isConsecutive) {
                    const highCard = potentialStraight[potentialStraight.length - 1];
                    if (values.indexOf(highCard.value) > values.indexOf(lastStraightHighCard.value)) {
                        possibleStraights.push({
                            cards: potentialStraight,
                            highValue: highCard.value
                        });
                    }
                }
            }
            
            if (possibleStraights.length > 0) {
                // Pilih straight dengan nilai tertinggi terendah dari yang lebih tinggi
                const lowestHighStraight = possibleStraights.reduce((lowest, straight) => 
                    values.indexOf(straight.highValue) < values.indexOf(lowest.highValue) ? straight : lowest
                , possibleStraights[0]);
                
                return {
                    cards: lowestHighStraight.cards,
                    type: CombinationTypes.STRAIGHT
                };
            }
            break;
    }
    
    // Jika tidak ada kartu yang valid, return null untuk lewat giliran
    return null;
}

// Fungsi untuk mencari kartu valid untuk AI (untuk kompatibilitas)
function findValidCardForAI(player) {
    const combination = findValidCombinationForAI(player);
    return combination ? combination.cards[0] : null;
}

// Fungsi untuk mencari pemain yang memiliki kartu 3 wajik
function findPlayerWithThreeOfDiamonds() {
    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        const hasThreeOfDiamonds = player.hand.some(card => card.value === '3' && card.suit === '♦');
        
        if (hasThreeOfDiamonds) {
            console.log(`Pemain ${i} memiliki kartu 3 wajik`);
            return i;
        }
    }
    
    // Jika tidak ada yang punya 3 wajik (sangat jarang terjadi), mulai dari pemain 0
    console.log('Tidak ada pemain yang memiliki kartu 3 wajik, pemain 0 mulai duluan');
    return 0;
}

// Helper untuk AI memilih kombinasi pembuka
function chooseAIOpeningCombination(player) {
    const combinations = [
        CombinationTypes.SINGLE,
        CombinationTypes.TRIPLET,
        CombinationTypes.STRAIGHT,
        CombinationTypes.FLUSH
    ];
    
    // Cari kombinasi terbaik yang dimiliki
    for (const combo of combinations) {
        if (getCardsForCombination(player, combo).length > 0) {
            return combo;
        }
    }
    
    return CombinationTypes.SINGLE;
}

// Helper untuk mendapatkan kartu sesuai kombinasi
function getCardsForCombination(player, combinationType) {
    // Implementasi sederhana - bisa dikembangkan lebih canggih
    switch(combinationType) {
        case CombinationTypes.SINGLE:
            return [player.hand[0]];
        case CombinationTypes.TRIPLET:
            return findTriplet(player.hand);
        case CombinationTypes.STRAIGHT:
            return findStraight(player.hand, 3);
        case CombinationTypes.FLUSH:
            return findFlush(player.hand, 3);
        default:
            return [];
    }
}

// Helper untuk menemukan triplet
function findTriplet(cards) {
    const valueCounts = {};
    cards.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count >= 3) {
            return cards.filter(card => card.value === value).slice(0, 3);
        }
    }
    
    return [];
}

// Helper untuk menemukan straight
function findStraight(cards, minLength = 3) {
    // Implementasi sederhana - bisa dikembangkan
    if (cards.length < minLength) return [];
    return cards.slice(0, minLength);
}

// Helper untuk menemukan flush
function findFlush(cards, minLength = 3) {
    const suitCounts = {};
    cards.forEach(card => {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });
    
    for (const [suit, count] of Object.entries(suitCounts)) {
        if (count >= minLength) {
            return cards.filter(card => card.suit === suit).slice(0, minLength);
        }
    }
    
    return [];
}

// Helper untuk menemukan kartu bom (Four of a Kind)
function findBombCards(player) {
    const valueCounts = {};
    player.hand.forEach(card => {
        valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    
    for (const [value, count] of Object.entries(valueCounts)) {
        if (count === 4) {
            return player.hand.filter(card => card.value === value);
        }
    }
    
    return null;
}

// Helper untuk mendapatkan counter move
function getCounterMove(player, currentPlay) {
    // Implementasi sederhana - hanya untuk single card
    if (currentPlay.combinationType === CombinationTypes.SINGLE) {
        const playableCards = player.hand.filter(card => 
            card.isHigherThan(currentPlay.cards[0])
        );
        
        if (playableCards.length > 0) {
            return [[playableCards[0]], CombinationTypes.SINGLE];
        }
    }
    
    return [[], null];
}

// Pemain manusia memilih kartu
function selectCard(card) {
    // Implementasi pemilihan kartu oleh pemain manusia
    console.log('Kartu dipilih:', card.toString());
    // Untuk sementara, langsung mainkan kartu yang dipilih
    playCards(gameState.players[0], [card], 'single');
}

// Fungsi untuk memvalidasi play berikutnya
function validateNextPlay(player, cards, combinationType) {
    console.log('Validasi kartu yang akan dimainkan:', cards);
    
    // Jika tidak ada kartu yang dimainkan, tidak valid
    if (!cards || cards.length === 0) {
        console.error('Tidak ada kartu yang dipilih');
        return false;
    }
    
    // Jika belum ada kartu yang dimainkan (awal permainan atau setelah reset)
    if (!gameState.currentPlay) {
        // Cek apakah ini giliran pertama dan pemain memiliki kartu 3 wajik
        if (gameState.firstTurn) {
            const has3Diamond = cards.some(card => card.value === '3' && card.suit === '♦');
            if (!has3Diamond) {
                console.error('Kartu pertama harus 3 wajik');
                return false;
            }
            return true;
        }
        
        // Jika bukan giliran pertama, pemain bebas memainkan kartu apa saja
        return true;
    }
    
    // Jika kartu 2 telah dimainkan, pemain berikutnya hanya bisa memainkan kartu bom (quartet) atau harus lewat
    // KECUALI jika ini adalah pemain yang memainkan kartu 2 dan sudah mendapat giliran lagi
    if (gameState.currentPlay && gameState.currentPlay.cards[0].value === '2') {
        // Pemain yang memainkan kartu 2 bebas memainkan kartu apapun di giliran berikutnya
        if (player.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn) {
            console.log('Pemain yang memainkan kartu 2 bebas memainkan kombinasi baru');
            showErrorMessage('');
            return true;
        }
        
        // Pemain lain hanya boleh memainkan kartu bom (quartet) atau harus lewat
        if (combinationType === CombinationTypes.QUARTET) {
            console.log('Kartu bom (quartet) dimainkan untuk melawan kartu 2');
            return true;
        } else {
            // Jika bukan kartu bom, tidak diperbolehkan
            const errorMsg = 'Setelah kartu 2, hanya kartu bom (quartet) yang bisa dimainkan atau pemain harus lewat.';
            console.error(errorMsg);
            showErrorMessage(errorMsg);
            playErrorSound();
            return false;
        }
    }
    
    // Cek jika kartu 2 baru saja dimainkan
    if (gameState.twoCardPlayed) {
        // Pemain yang baru saja memainkan kartu 2 tidak boleh memainkan bom di giliran berikutnya
        if (player.index === gameState.playerBannedFromPlayingBomb && combinationType === CombinationTypes.QUARTET) {
            console.error('Pemain tidak boleh memainkan bom (quartet) setelah sebelumnya memainkan kartu 2! Ini tidak adil.');
            return false;
        }
        
        // Cek kombinasi kartu yang akan dimainkan untuk pemain lain
        if (player.index !== gameState.playerWhoPlayed2 && combinationType === CombinationTypes.QUARTET) {
            return true; // Pemain lain boleh memainkan quartet (bom)
        }
        
        // Jika bukan pemain yang memainkan kartu 2, tidak boleh memainkan kartu apapun kecuali bom
        if (player.index !== gameState.playerWhoPlayed2) {
            console.error('Setelah kartu 2, hanya kartu bom (quartet) yang bisa dimainkan atau pemain yang memainkan kartu 2. Pemain harus lewat.');
            return false;
        }
        // Jika ini adalah pemain yang memainkan kartu 2, dia bisa memainkan kartu apa saja kecuali bom
        return true;
    }
    
    // Jika semua pemain lain telah lewat, pemain bebas memainkan kombinasi baru
    // Ini mencerminkan aturan Remi yang sebenarnya dimana setelah semua pemain lewat, putaran baru dimulai
    if (passedPlayers.length === gameState.players.length - 1) {
        // Pemain bebas memainkan kombinasi baru karena semua pemain lain telah lewat
        console.log('Semua pemain lain lewat, bebas memainkan kombinasi baru');
        
        // Validasi kombinasi internal (pastikan kombinasi valid)
        const actualCombination = determineCombination(cards);
        if (actualCombination === CombinationTypes.NONE) {
            console.error('Kombinasi kartu tidak valid');
            return false;
        }
        
        // Jika pemain mendeklarasikan kombinasi yang berbeda dari yang sebenarnya,
        // gunakan kombinasi yang sebenarnya
        if (actualCombination !== combinationType) {
            console.log(`Kombinasi yang dideklarasikan (${combinationType}) berbeda dengan yang sebenarnya (${actualCombination}). Menggunakan kombinasi yang sebenarnya.`);
            // Pastikan kombinationType diupdate agar konsisten
            combinationType = actualCombination;
        }
        
        // Setelah semua pemain lewat, putaran baru dimulai
        // Dalam aturan Remi yang benar, pemain bisa memulai kombinasi baru dengan kartu apa saja
        // Tidak perlu memeriksa kecocokan jenis (suit) karena ini putaran baru
        // Kartu 2 tetap selalu bisa dimainkan
        if (combinationType === CombinationTypes.SINGLE && gameState.currentPlay && gameState.currentPlay.type === CombinationTypes.SINGLE) {
            const newCard = cards[0];
            
            // Kartu 2 bisa dimainkan kapan saja tanpa memperhatikan jenis (suit)
            if (newCard.value === '2') {
                console.log('Kartu 2 dimainkan - diperbolehkan tanpa memperhatikan jenis');
                return true;
            }
            
            // Setelah semua pemain lewat, bebas memainkan kartu dengan jenis apa saja
            // Tidak ada validasi suit lagi karena ini putaran baru
        }
        
        // Kombinasi selain kartu tunggal bebas dimainkan setelah semua pemain lewat
        // Jika ini adalah kombinasi baru, reset daftar pemain yang lewat
        passedPlayers = [];
        return true;
    }
    
    // Cek Four of a Kind (Quartet) atau Straight Flush (5 kartu urut suit sama) - Bom
    if (combinationType === CombinationTypes.QUARTET || 
        (combinationType === CombinationTypes.STRAIGHT_FLUSH && cards.length === 5)) {
        // Quartet atau Straight Flush 5 kartu selalu valid sebagai bom
        console.log('Kartu bom dimainkan:', combinationType === CombinationTypes.QUARTET ? 'Quartet' : 'Straight Flush');
        return true;
    }
    
    // Kombinasi tunggal seharusnya tidak bisa melawan triplet atau sebaliknya
    // Berikut adalah pengecualian-pengecualian yang diperbolehkan
    
    // Cek apakah ini termasuk kombinasi yang tidak bisa saling melawan
    // Triplet dan Straight tidak bisa saling melawan kecuali untuk bom
    if ((combinationType === CombinationTypes.TRIPLET && gameState.currentPlay.type === CombinationTypes.STRAIGHT) ||
        (combinationType === CombinationTypes.STRAIGHT && gameState.currentPlay.type === CombinationTypes.TRIPLET)) {
        const errorMsg = `KOMBINASI TIDAK COCOK: ${getCombinationName(combinationType)} tidak bisa melawan ${getCombinationName(gameState.currentPlay.type)}. Dalam Remi, triplet dan straight tidak bisa saling melawan. Hanya bom yang bisa melawan kombinasi apapun.`;
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return false;
    }
    
    // Cek pengecualian untuk Flush yang bisa melawan Straight
    if (combinationType === CombinationTypes.FLUSH && gameState.currentPlay.type === CombinationTypes.STRAIGHT) {
        console.log('Flush bisa dimainkan untuk melawan Straight');
        return compareHighestCards(cards, gameState.currentPlay.cards);
    }
    
    // Cek pengecualian untuk Straight Flush yang bisa melawan Straight atau Flush
    if (combinationType === CombinationTypes.STRAIGHT_FLUSH && 
        (gameState.currentPlay.type === CombinationTypes.STRAIGHT || gameState.currentPlay.type === CombinationTypes.FLUSH)) {
        console.log('Straight Flush bisa dimainkan untuk melawan Straight atau Flush');
        return true;
    }
    

    
    // Validasi tipe kombinasi harus sama (triplet vs triplet, single vs single, dll)
    if (combinationType !== gameState.currentPlay.type) {
        const errorMsg = `Kombinasi tidak cocok: ${getCombinationName(combinationType)} vs ${getCombinationName(gameState.currentPlay.type)}. Dalam Remi, tipe kombinasi harus sama: triplet lawan triplet, single vs single, straight lawan straight, dsb.`;
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return false;
    }
    
    // Validasi berdasarkan tipe kombinasi
    switch (combinationType) {
        case CombinationTypes.SINGLE:
            // Validasi kartu tunggal
            const lastCard = gameState.currentPlay.cards[0];
            const newCard = cards[0];
            
            // Urutan nilai kartu: 3 < 4 < ... < K < A < 2
            const valueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
            
            // Pengecualian: Kartu 2 bisa dimainkan kapan saja tanpa memperhatikan jenis (suit)
            if (newCard.value === '2') {
                console.log('Kartu 2 dimainkan - diperbolehkan tanpa memperhatikan jenis');
                return true;
            }
            
            // VALIDASI WAJIB: Kartu harus memiliki jenis (suit) yang sama
            if (newCard.suit !== lastCard.suit) {
                const errorMsg = `Kartu harus memiliki jenis yang sama! Anda memainkan ${getSuitName(newCard.suit)} tetapi kartu sebelumnya adalah ${getSuitName(lastCard.suit)}. Dalam Remi, kartu tunggal harus memiliki suit yang sama dengan kartu sebelumnya.`;
                console.error(errorMsg);
                showErrorMessage(errorMsg);
                return false;
            }
            
            // Aturan khusus untuk Ace (kartu As)
            if (lastCard.value === 'A') {
                // Jika kartu terakhir adalah As, hanya kartu 2 yang bisa dimainkan
                // dan kartu 2 sudah ditangani di atas, jadi jika kita sampai di sini,
                // berarti ini bukan kartu 2 dan tidak boleh dimainkan
                const errorMsg = 'Setelah kartu As, pemain berikutnya harus memainkan kartu 2 atau lewat.';
                console.error(errorMsg);
                showErrorMessage(errorMsg);
                return false;
            }
            
            // Nilai kartu harus lebih tinggi
            const newCardValue = valueOrder.indexOf(newCard.value);
            const lastCardValue = valueOrder.indexOf(lastCard.value);
            console.log(`Membandingkan nilai kartu: ${newCard.value} (${newCardValue}) vs ${lastCard.value} (${lastCardValue})`);
            
            if (newCardValue <= lastCardValue) {
                console.error(`Nilai kartu harus lebih tinggi! ${newCard.value} tidak lebih tinggi dari ${lastCard.value}`);
                return false;
            }
            
            return true;
            
        case CombinationTypes.TRIPLET:
            // Triplet: nilai kartu harus lebih tinggi
            return compareHighestCards(cards, gameState.currentPlay.cards);
            
        case CombinationTypes.STRAIGHT:
        case CombinationTypes.STRAIGHT_FLUSH:
            // Straight/Straight Flush: nilai tertinggi harus lebih tinggi
            // Tidak perlu panjang yang sama, straight lebih panjang biasanya lebih kuat
            // Minimal harus punya 3 kartu untuk dianggap sebagai straight
            if (cards.length < 3) {
                console.error('Straight minimal harus memiliki 3 kartu');
                return false;
            }
            // Jika straight lebih pendek, pastikan kartu tertingginya lebih tinggi
            return compareHighestCards(cards, gameState.currentPlay.cards);
            
        case CombinationTypes.FLUSH:
            // Flush: panjang harus sama dan nilai tertinggi harus lebih tinggi
            if (cards.length !== gameState.currentPlay.cards.length) {
                console.error('Panjang flush harus sama');
                return false;
            }
            return compareHighestCards(cards, gameState.currentPlay.cards);
            
        case CombinationTypes.FULL_HOUSE:
            // Full House: nilai triplet harus lebih tinggi
            return compareFullHouse(cards, gameState.currentPlay.cards);
            
        default:
            console.error('Tipe kombinasi tidak dikenal:', combinationType);
            return false;
    }
}

// Fungsi untuk membandingkan kartu tertinggi dari dua set kartu
function compareHighestCards(newCards, oldCards) {
    // Urutan nilai kartu untuk kartu tunggal dan kombinasi normal: 3 < 4 < ... < K < A < 2
    const valueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    
    // Urutan nilai kartu untuk straight: 2 < 3 < 4 < ... < K < A
    const straightValueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    // Untuk straight, kita perlu mencari kartu tertinggi berdasarkan urutan nilai
    let newHighestCard, oldHighestCard;
    
    // Cek apakah ini straight
    const isStraight = newCards.length >= 3 && (() => {
        // Untuk straight, gunakan urutan khusus di mana 2 adalah kartu terkecil
        const sortedByValue = [...newCards].sort((a, b) => straightValueOrder.indexOf(a.value) - straightValueOrder.indexOf(b.value));
        for (let i = 1; i < sortedByValue.length; i++) {
            if (straightValueOrder.indexOf(sortedByValue[i].value) !== straightValueOrder.indexOf(sortedByValue[i-1].value) + 1) {
                return false;
            }
        }
        return true;
    })();
    
    if (isStraight) {
        // Untuk straight, kartu tertinggi adalah kartu dengan nilai tertinggi dalam urutan
        // Gunakan straightValueOrder di mana As adalah kartu tertinggi dan 2 adalah kartu terendah (jika di awal straight)
        const sortedNewByValue = [...newCards].sort((a, b) => straightValueOrder.indexOf(a.value) - straightValueOrder.indexOf(b.value));
        const sortedOldByValue = [...oldCards].sort((a, b) => straightValueOrder.indexOf(a.value) - straightValueOrder.indexOf(b.value));
        
        newHighestCard = sortedNewByValue[sortedNewByValue.length - 1];
        oldHighestCard = sortedOldByValue[sortedOldByValue.length - 1];
        
        // Saat membandingkan straight, kita menggunakan straightValueOrder
        // dan langsung membandingkan nilai kartu tertinggi saja
        const newHighVal = straightValueOrder.indexOf(newHighestCard.value);
        const oldHighVal = straightValueOrder.indexOf(oldHighestCard.value);
        console.log(`Membandingkan kartu tertinggi dalam straight: ${newHighestCard.value} (${newHighVal}) vs ${oldHighestCard.value} (${oldHighVal})`);
        
        // Jika straight yang baru memiliki kartu tertinggi dengan nilai yang lebih tinggi, return true
        if (newHighVal > oldHighVal) return true;
        // Jika straight yang baru memiliki kartu tertinggi dengan nilai yang lebih rendah, return false
        if (newHighVal < oldHighVal) return false;
        
        // Jika nilai kartu tertinggi sama, bandingkan jenis kartu (suit)
        const suitOrder = ['♦', '♣', '♥', '♠'];
        return suitOrder.indexOf(newHighestCard.suit) > suitOrder.indexOf(oldHighestCard.suit);
    } else {
        // Untuk kombinasi lain, urutkan kartu berdasarkan nilai
        const sortedNewCards = [...newCards].sort((a, b) => {
            return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
        });
        
        const sortedOldCards = [...oldCards].sort((a, b) => {
            return valueOrder.indexOf(b.value) - valueOrder.indexOf(a.value);
        });
        
        newHighestCard = sortedNewCards[0];
        oldHighestCard = sortedOldCards[0];
    }
    
    // Bandingkan nilai kartu tertinggi (untuk kombinasi selain straight)
    const newCardValue = valueOrder.indexOf(newHighestCard.value);
    const oldCardValue = valueOrder.indexOf(oldHighestCard.value);
    
    console.log(`Membandingkan kartu tertinggi: ${newHighestCard.value} ${newHighestCard.suit} (${newCardValue}) vs ${oldHighestCard.value} ${oldHighestCard.suit} (${oldCardValue})`);
    
    if (newHighestCard.value === oldHighestCard.value) {
        // Jika nilai sama, bandingkan jenis dari kartu tertinggi
        const suitOrder = ['♦', '♣', '♥', '♠'];
        const result = suitOrder.indexOf(newHighestCard.suit) > suitOrder.indexOf(oldHighestCard.suit);
        console.log(`Nilai sama, membandingkan jenis: ${newHighestCard.suit} vs ${oldHighestCard.suit}, hasil: ${result}`);
        return result;
    }
    
    // Bandingkan nilai kartu
    const result = newCardValue > oldCardValue;
    console.log(`Membandingkan nilai: ${newCardValue} vs ${oldCardValue}, hasil: ${result}`);
    return result;
}

// Fungsi untuk membandingkan Full House
function compareFullHouse(newCards, oldCards) {
    // Hitung frekuensi nilai kartu untuk newCards
    const newValueCounts = {};
    newCards.forEach(card => {
        newValueCounts[card.value] = (newValueCounts[card.value] || 0) + 1;
    });
    
    // Hitung frekuensi nilai kartu untuk oldCards
    const oldValueCounts = {};
    oldCards.forEach(card => {
        oldValueCounts[card.value] = (oldValueCounts[card.value] || 0) + 1;
    });
    
    // Temukan nilai triplet untuk newCards dan oldCards
    let newTripletValue;
    let oldTripletValue;
    
    for (const [value, count] of Object.entries(newValueCounts)) {
        if (count === 3) newTripletValue = value;
    }
    
    for (const [value, count] of Object.entries(oldValueCounts)) {
        if (count === 3) oldTripletValue = value;
    }
    
    // Bandingkan nilai triplet
    const valueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    return valueOrder.indexOf(newTripletValue) > valueOrder.indexOf(oldTripletValue);
}

// Fungsi untuk menemukan kartu bom (quartet atau straight flush 5 kartu) di tangan pemain
function findBombCards(player) {
    // Pastikan player valid dan memiliki properti hand
    if (!player || !player.hand) return null;
    
    // Pertama, cek quartet (4 kartu dengan nilai yang sama)
    // Hitung frekuensi nilai kartu
    const valueFrequency = {};
    player.hand.forEach(card => {
        valueFrequency[card.value] = (valueFrequency[card.value] || 0) + 1;
    });
    
    // Cari nilai kartu yang muncul 4 kali (quartet)
    for (const value in valueFrequency) {
        if (valueFrequency[value] === 4) {
            // Temukan keempat kartu tersebut
            const bombCards = player.hand.filter(card => card.value === value);
            console.log('Bom quartet ditemukan:', bombCards.map(c => c.value + c.suit).join(', '));
            return bombCards; // Kembalikan 4 kartu dengan nilai yang sama
        }
    }
    
    // Kedua, cek straight flush 5 kartu
    // Kelompokkan kartu berdasarkan suit
    const suitGroups = {};
    player.hand.forEach(card => {
        if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
        suitGroups[card.suit].push(card);
    });
    
    // Periksa setiap grup suit yang memiliki 5 kartu atau lebih
    for (const suit in suitGroups) {
        if (suitGroups[suit].length >= 5) {
            // Urutan untuk straight
            const straightValueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            
            // Urutkan kartu dalam suit
            const sortedSuitCards = suitGroups[suit].sort((a, b) => {
                return straightValueOrder.indexOf(a.value) - straightValueOrder.indexOf(b.value);
            });
            
            // Cari 5 kartu berurutan
            for (let i = 0; i <= sortedSuitCards.length - 5; i++) {
                const possibleStraightFlush = sortedSuitCards.slice(i, i + 5);
                
                // Cek apakah 5 kartu berurutan
                let isConsecutive = true;
                for (let j = 1; j < 5; j++) {
                    const prevIndex = straightValueOrder.indexOf(possibleStraightFlush[j-1].value);
                    const currIndex = straightValueOrder.indexOf(possibleStraightFlush[j].value);
                    if (currIndex !== prevIndex + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                
                // Jika menemukan straight flush 5 kartu
                if (isConsecutive) {
                    console.log('Bom straight flush ditemukan:', possibleStraightFlush.map(c => c.value + c.suit).join(', '));
                    return possibleStraightFlush;
                }
            }
        }
    }
    
    return null; // Tidak ada bom
}

// Fungsi untuk menentukan kombinasi kartu
function determineCombination(cards) {
    if (!cards || cards.length === 0) return CombinationTypes.NONE;
    
    // Kartu tunggal
    if (cards.length === 1) return CombinationTypes.SINGLE;
    
    // Urutkan kartu berdasarkan nilai
    const normalValueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    // Untuk straight, 2 hanya valid jika di awal straight (2-3-4...), tidak di akhir (Q-K-A-2)
    const straightValueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    // Gunakan urutan normal untuk kebanyakan kombinasi
    const sortedCards = [...cards].sort((a, b) => {
        return normalValueOrder.indexOf(a.value) - normalValueOrder.indexOf(b.value);
    });
    
    // Cek Four of a Kind (Quartet)
    if (cards.length === 4) {
        const allSameValue = cards.every(card => card.value === cards[0].value);
        if (allSameValue) return CombinationTypes.QUARTET;
    }
    
    // Cek Three of a Kind (Triplet)
    if (cards.length === 3) {
        const allSameValue = cards.every(card => card.value === cards[0].value);
        if (allSameValue) return CombinationTypes.TRIPLET;
    }
    
    // Cek Full House (3 kartu sama + 2 kartu sama)
    if (cards.length === 5) {
        // Hitung frekuensi nilai kartu
        const valueCounts = {};
        cards.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        
        const values = Object.keys(valueCounts);
        if (values.length === 2 && 
            ((valueCounts[values[0]] === 3 && valueCounts[values[1]] === 2) || 
             (valueCounts[values[0]] === 2 && valueCounts[values[1]] === 3))) {
            return CombinationTypes.FULL_HOUSE;
        }
    }
    
    // Cek apakah semua kartu memiliki jenis yang sama (untuk Flush dan Straight Flush)
    const sameSuit = cards.every(card => card.suit === cards[0].suit);
    
    // Cek apakah kartu berurutan (untuk Straight dan Straight Flush)
    // Dalam aturan Remi, 2 hanya valid di awal straight kecil (2-3-4-5...), tidak valid di akhir (Q-K-A-2)
    const isConsecutive = (() => {
        // Urutkan kartu menggunakan urutan straight (2 < 3 < 4 < ... < A)
        const straightSorted = [...cards].sort((a, b) => {
            return straightValueOrder.indexOf(a.value) - straightValueOrder.indexOf(b.value);
        });
        
        // Cek kartu 2 untuk memastikan posisinya valid (hanya di awal straight)
        const has2 = straightSorted.some(card => card.value === '2');
        if (has2) {
            // Kartu 2 hanya valid jika posisinya di awal straight
            if (straightSorted[0].value !== '2') {
                console.log('Kartu 2 hanya valid di awal straight (2-3-4...)');
                return false;
            }
            
            // Pastikan kartu berikutnya adalah 3 (untuk memastikan urutan 2-3-4...)
            if (straightSorted.length > 1 && straightSorted[1].value !== '3') {
                console.log('Setelah kartu 2, harus ada kartu 3 untuk membentuk straight valid');
                return false;
            }
        }
        
        // Cek apakah kartu berurutan
        const values = straightSorted.map(card => straightValueOrder.indexOf(card.value));
        console.log('Nilai kartu dalam straight:', straightSorted.map(c => c.value), values);
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i-1] + 1) {
                console.log(`Kartu tidak berurutan: ${values[i-1]} -> ${values[i]}`);
                return false;
            }
        }
        console.log('Kartu berurutan, ini adalah straight');
        return true;
    })();
    
    // Cek Straight Flush (minimal 3 kartu berurutan dengan jenis sama)
    if (cards.length >= 3 && sameSuit && isConsecutive) {
        return CombinationTypes.STRAIGHT_FLUSH;
    }
    
    // Cek Straight (minimal 3 kartu berurutan, jenis bebas)
    if (cards.length >= 3 && isConsecutive) {
        return CombinationTypes.STRAIGHT;
    }
    
    // Cek Flush (minimal 3 kartu jenis sama, tidak harus berurutan)
    if (cards.length >= 3 && sameSuit) {
        return CombinationTypes.FLUSH;
    }
    
    return CombinationTypes.NONE; // Default jika tidak ada kombinasi yang cocok
}

// Fungsi untuk menangani permainan kartu 2
function handleTwoCardPlay(player, card) {
    if (card.value !== '2') return false;
    
    // Set currentPlay ke null untuk memulai ronde baru
    gameState.currentPlay = null;
    gameState.lastPlayerWhoPlayed = player;
    
    // Update UI
    const playedCardsArea = document.getElementById('played-cards');
    if (playedCardsArea) playedCardsArea.innerHTML = '';
    
    // Cek apakah ada pemain yang memiliki quartet (bom)
    for (let i = 0; i < gameState.players.length; i++) {
        const currentPlayer = gameState.players[i];
        const bombCards = findBombCards(currentPlayer);
        
        if (bombCards) {
            console.log(`Pemain ${i} memiliki bom (quartet)!`);
            
            // Jika pemain adalah AI, langsung gunakan bom
            if (currentPlayer.isAI) {
                // Tampilkan bom
                playedCardsArea.innerHTML = '';
                
                // Buat container untuk kartu
                const cardsContainer = document.createElement('div');
                cardsContainer.className = 'flex flex-col items-center';
                
                // Buat container untuk kartu yang dimainkan
                const cardsDiv = document.createElement('div');
                cardsDiv.className = 'flex flex-wrap justify-center gap-2 mb-3';
                
                // Tambahkan kartu ke container
                bombCards.forEach(card => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card bg-white';
                    cardElement.innerHTML = renderCard(card);
                    cardsDiv.appendChild(cardElement);
                });
                
                cardsContainer.appendChild(cardsDiv);
                
                // Tambahkan badge pemain di bawah kartu
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'flex justify-center';
                
                // Tambahkan badge pemain yang memiliki bom
                const playerBadge = document.createElement('div');
                playerBadge.className = 'bg-red-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-auto';
                playerBadge.textContent = `${currentPlayer.name} - BOM!`;
                
                badgeContainer.appendChild(playerBadge);
                cardsContainer.appendChild(badgeContainer);
                
                // Tambahkan container ke area kartu yang dimainkan
                playedCardsArea.appendChild(cardsContainer);
                
                // Pemain dengan bom langsung menang
                setTimeout(() => endGame(currentPlayer), 1000);
                return true;
            } else if (i === 0) { // Pemain manusia
                // Tampilkan dialog konfirmasi
                const bombValue = bombCards[0].value;
                
                // Buat dialog konfirmasi
                const confirmDialog = document.createElement('div');
                confirmDialog.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
                confirmDialog.id = 'bomb-confirm-dialog';
                
                // Buat konten dialog
                const dialogContent = document.createElement('div');
                dialogContent.className = 'bg-white p-6 rounded-lg shadow-lg max-w-md w-full';
                
                // Tambahkan judul
                const dialogTitle = document.createElement('h2');
                dialogTitle.className = 'text-xl font-bold mb-4 text-center';
                dialogTitle.textContent = `Anda memiliki Bom (4 kartu ${bombValue})!`;
                dialogContent.appendChild(dialogTitle);
                
                // Tambahkan kartu
                const cardsDiv = document.createElement('div');
                cardsDiv.className = 'flex flex-wrap justify-center gap-2 mb-4';
                
                bombCards.forEach(card => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card bg-white';
                    cardElement.innerHTML = renderCard(card);
                    cardsDiv.appendChild(cardElement);
                });
                
                dialogContent.appendChild(cardsDiv);
                
                // Tambahkan pesan
                const dialogMessage = document.createElement('p');
                dialogMessage.className = 'mb-4 text-center';
                dialogMessage.textContent = 'Apa yang ingin Anda lakukan?';
                dialogContent.appendChild(dialogMessage);
                
                // Tambahkan tombol
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex justify-center gap-4';
                
                // Tombol gunakan bom
                const useBombButton = document.createElement('button');
                useBombButton.className = 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700';
                useBombButton.textContent = 'Gunakan Bom (Menang)';
                useBombButton.onclick = () => {
                    // Hapus dialog
                    document.body.removeChild(confirmDialog);
                    
                    // Tampilkan bom
                    playedCardsArea.innerHTML = '';
                    
                    // Buat container untuk kartu
                    const cardsContainer = document.createElement('div');
                    cardsContainer.className = 'flex flex-col items-center';
                    
                    // Buat container untuk kartu yang dimainkan
                    const cardsDiv = document.createElement('div');
                    cardsDiv.className = 'flex flex-wrap justify-center gap-2 mb-3';
                    
                    // Tambahkan kartu ke container
                    bombCards.forEach(card => {
                        const cardElement = document.createElement('div');
                        cardElement.className = 'card bg-white';
                        cardElement.innerHTML = renderCard(card);
                        cardsDiv.appendChild(cardElement);
                    });
                    
                    cardsContainer.appendChild(cardsDiv);
                    
                    // Tambahkan badge pemain di bawah kartu
                    const badgeContainer = document.createElement('div');
                    badgeContainer.className = 'flex justify-center';
                    
                    // Tambahkan badge pemain yang memiliki bom
                    const playerBadge = document.createElement('div');
                    playerBadge.className = 'bg-red-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-auto';
                    playerBadge.textContent = 'Anda - BOM!';
                    
                    badgeContainer.appendChild(playerBadge);
                    cardsContainer.appendChild(badgeContainer);
                    
                    // Tambahkan container ke area kartu yang dimainkan
                    playedCardsArea.appendChild(cardsContainer);
                    
                    // Pemain dengan bom langsung menang
                    setTimeout(() => endGame(currentPlayer), 1000);
                };
                
                // Tombol simpan untuk nanti
                const saveForLaterButton = document.createElement('button');
                saveForLaterButton.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';
                saveForLaterButton.textContent = 'Simpan untuk Nanti';
                saveForLaterButton.onclick = () => {
                    // Hapus dialog
                    document.body.removeChild(confirmDialog);
                };
                
                buttonContainer.appendChild(useBombButton);
                buttonContainer.appendChild(saveForLaterButton);
                dialogContent.appendChild(buttonContainer);
                
                confirmDialog.appendChild(dialogContent);
                document.body.appendChild(confirmDialog);
                
                // Dialog ditampilkan, tapi permainan tetap berlanjut
                return false;
            }
        }
    }
    
    return true;
}

// Fungsi untuk menangani bom (quartet)
function handleBombPlay(player, cards) {
    if (cards.length !== 4 || !cards.every(c => c.value === cards[0].value)) {
        return false;
    }
    
    // Pemain langsung menang
    endGame(player);
    return true;
}

// Fungsi untuk menambahkan riwayat kartu yang dibuang
function addCardHistory(player, cards, combinationType) {
    // Tambahkan ke riwayat
    const historyItem = {
        player: player,
        cards: [...cards],
        combinationType: combinationType,
        timestamp: new Date().toLocaleTimeString()
    };
    
    // Tambahkan ke awal array (riwayat terbaru di atas)
    gameState.cardHistory.unshift(historyItem);
    
    // Batasi jumlah riwayat yang disimpan (opsional)
    if (gameState.cardHistory.length > 50) {
        gameState.cardHistory.pop();
    }
    
    // Update tampilan riwayat
    updateCardHistoryDisplay();
}

// Fungsi untuk memperbarui tampilan riwayat kartu
function updateCardHistoryDisplay() {
    const historyList = document.getElementById('card-history-list');
    if (!historyList) return;
    
    // Kosongkan area riwayat
    historyList.innerHTML = '';
    
    // Tambahkan setiap item riwayat
    gameState.cardHistory.forEach(item => {
        // Buat container untuk item riwayat
        const historyItem = document.createElement('div');
        historyItem.className = 'mb-3 p-2 bg-black bg-opacity-20 rounded';
        
        // Tambahkan informasi pemain
        const playerInfo = document.createElement('div');
        playerInfo.className = 'text-white text-xs mb-1';
        playerInfo.textContent = `${item.player.isAI ? item.player.name : 'Anda'} - ${item.timestamp}`;
        historyItem.appendChild(playerInfo);
        
        // Tambahkan informasi kombinasi
        const combinationInfo = document.createElement('div');
        combinationInfo.className = 'text-yellow-300 text-xs mb-1';
        combinationInfo.textContent = `${getCombinationName(item.combinationType)}`;
        historyItem.appendChild(combinationInfo);
        
        // Tambahkan kartu-kartu
        const cardDisplayContainer = document.createElement('div');
        cardDisplayContainer.className = 'flex flex-wrap gap-1';
        
        item.cards.forEach(card => {
            const miniCard = document.createElement('div');
            miniCard.className = 'mini-card bg-white rounded text-center text-xs p-1';
            miniCard.style.width = '20px';
            miniCard.style.height = '30px';
            
            // Tentukan warna berdasarkan jenis kartu
            const color = (card.suit === '♥' || card.suit === '♦') ? 'text-red-600' : 'text-black';
            miniCard.innerHTML = `<span class="${color}">${card.value}${card.suit}</span>`;
            
            cardDisplayContainer.appendChild(miniCard);
        });
        
        historyItem.appendChild(cardDisplayContainer);
        historyList.appendChild(historyItem);
    });
}

// Mainkan kartu
function playCards(player, cards, combinationType) {
    console.log('Memainkan kartu:', cards);
    
    // Pastikan elemen UI ada
    const playedCardsArea = document.getElementById('played-cards');
    if (!playedCardsArea) {
        console.error('Error: Area kartu yang dimainkan tidak ditemukan');
        return false;
    }
    
    // Validasi kepemilikan kartu
    if (!player.hasCards(cards)) {
        console.error('Pemain tidak memiliki kartu yang dipilih');
        return false;
    }
    
    // Validasi: Pemain yang baru saja memainkan kartu 2 tidak boleh memainkan bom di giliran berikutnya
    if (gameState.playerBannedFromPlayingBomb === player.index && combinationType === CombinationTypes.QUARTET) {
        console.error(`Pemain ${player.index} baru saja memainkan kartu 2 dan tidak boleh memainkan bom sekarang!`);
        return false;
    }
    
    // Catatan: Aturan bom (quartet) ditangani di fungsi handleTwoCardPlay
    
    // Validasi aturan permainan (disederhanakan)
    if (!validateNextPlay(player, cards, combinationType)) {
        console.error('Kombinasi kartu tidak valid');
        return false;
    }
    
    // Hapus pemain dari daftar pemain yang lewat jika ada
    const playerIndex = gameState.players.indexOf(player);
    const passedIndex = passedPlayers.indexOf(playerIndex);
    
    // Cek apakah ini adalah awal kombinasi baru
    const isNewCombination = !gameState.currentPlay || // Awal permainan
                             gameState.currentPlay.cards[0].value === '2' || // Setelah kartu 2
                             passedPlayers.length === gameState.players.length - 1; // Semua pemain lain lewat
    
    if (isNewCombination) {
        // Jika ini adalah kombinasi baru, reset daftar pemain yang lewat
        console.log('Memulai kombinasi baru, reset daftar pemain yang lewat');
        passedPlayers = [];
    } else if (passedIndex !== -1) {
        // Jika tidak, hanya hapus pemain saat ini dari daftar yang lewat
        passedPlayers.splice(passedIndex, 1);
        console.log(`Pemain ${playerIndex} dihapus dari daftar pemain yang lewat`);
    }

    // Hapus kartu dari tangan pemain
    player.removeCards(cards);

    // Dapatkan container yang tepat untuk area kartu yang dimainkan
    const playAreaContainer = playedCardsArea.querySelector('div') || playedCardsArea;
    
    // Buat container untuk kartu
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'flex flex-col items-center';
    
    // Buat container untuk kartu yang dimainkan
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'flex flex-wrap justify-center gap-2 mb-3';
    
    // Tambahkan kartu ke container
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card bg-white';
        cardElement.innerHTML = renderCard(card);
        cardsDiv.appendChild(cardElement);
        
        // Jika kartu adalah 2, tambahkan ke area kartu 2 yang telah dimainkan
        if (card.value === '2') {
            const playedTwosArea = document.getElementById('played-twos').querySelector('div');
            if (playedTwosArea) {
                const twoCardElement = document.createElement('div');
                twoCardElement.className = 'mini-card bg-white relative';
                
                // Tentukan warna berdasarkan jenis kartu
                const color = (card.suit === '♥' || card.suit === '♦') ? 'text-red-600' : 'text-black';
                twoCardElement.innerHTML = `<span class="${color}">${card.value}${card.suit}</span>`;
                
                // Tambahkan nama pemain yang membuang kartu 2
                const playerLabel = document.createElement('div');
                playerLabel.className = 'absolute -bottom-5 left-0 right-0 text-center text-xs text-white bg-black bg-opacity-70 p-1';
                playerLabel.textContent = player.isAI ? player.name : 'Anda';
                twoCardElement.appendChild(playerLabel);
                
                playedTwosArea.appendChild(twoCardElement);
            }
        }
    });
    
    cardsContainer.appendChild(cardsDiv);
    
    // Tambahkan badge pemain di bawah kartu
    const badgeContainer = document.createElement('div');
    badgeContainer.id = 'badge-container';
    badgeContainer.className = 'flex justify-center';
    
    // Tambahkan badge pemain yang membuang kartu
    const playerBadge = document.createElement('div');
    playerBadge.id = 'current-player-badge';
    playerBadge.className = 'bg-blue-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-auto';
    playerBadge.textContent = player.isAI ? player.name : 'Anda';
    
    // Simpan badge pemain saat ini untuk digunakan nanti
    lastPlayerBadge = {
        text: playerBadge.textContent,
        player: playerIndex
    };
    
    // Jika ada badge pemain sebelumnya, tampilkan juga
    if (lastPlayerBadge && lastPlayerBadge.text !== playerBadge.textContent) {
        const previousPlayerBadge = document.createElement('div');
        previousPlayerBadge.className = 'bg-gray-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
        previousPlayerBadge.textContent = lastPlayerBadge.text;
        badgeContainer.appendChild(previousPlayerBadge);
    }
    
    badgeContainer.appendChild(playerBadge);
    cardsContainer.appendChild(badgeContainer);
    
    // Kosongkan dan tambahkan container ke area kartu yang dimainkan
    const playAreaInner = playedCardsArea.querySelector('div');
    if (playAreaInner) {
        playAreaInner.innerHTML = '';
        playAreaInner.appendChild(cardsContainer);
    } else {
        playedCardsArea.innerHTML = '';
        playedCardsArea.appendChild(cardsContainer);
    }

    // Update game state
    gameState.currentPlay = {
        player: player,
        cards: cards,
        playerIndex: gameState.players.indexOf(player),
        type: combinationType
    };
    gameState.lastPlayerWhoPlayed = player;
    
    // Reset passed players jika ini adalah kombinasi baru
    if (isNewCombination) {
        passedPlayers = [];
    }
    
    // Tambahkan ke riwayat kartu
    addCardHistory(player, cards, combinationType);

    // Reset seleksi kartu
    selectedCards = [];
    document.querySelectorAll('.card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    updateActionButtons();
    
    // Mainkan suara
    if (typeof playSound === 'function') {
        playSound('cardPlay');
    }
    
    // Cek apakah pemain telah menghabiskan semua kartunya (menang)
    if (player.hand.length === 0) {
        console.log(`Pemain ${gameState.players.indexOf(player)} telah menghabiskan semua kartunya!`);
        endGame(player);
        return true;
    }

    // Pindah ke pemain berikutnya
    // Gunakan setTimeout agar UI diperbarui terlebih dahulu
    setTimeout(() => {
        console.log('Pindah ke pemain berikutnya setelah membuang kartu');
        
        // Jika kartu yang dimainkan adalah kartu 2 TUNGGAL (bukan triplet), simpan informasi untuk nanti
        if (cards[0].value === '2' && combinationType === CombinationTypes.SINGLE) {
            console.log('Kartu 2 tunggal dimainkan, pemain akan mendapat giliran lagi setelah pemain lain punya kesempatan untuk memainkan bom');
            
            // Simpan pemain yang membuang kartu 2
            const playerWhoPlayed2 = gameState.currentPlayerIndex;
            
            // Simpan informasi bahwa kartu 2 baru saja dimainkan
            gameState.twoCardPlayed = true;
            gameState.playerWhoPlayed2 = playerWhoPlayed2;
            
            // Tandai pemain ini tidak boleh memainkan bom di giliran berikutnya
            // Flag ini akan digunakan untuk mencegah pemain memainkan bom setelah kartu 2
            gameState.playerBannedFromPlayingBomb = playerWhoPlayed2;
            
            // Reset currentPlay agar pemain bisa membuang kartu apa saja saat gilirannya kembali
            gameState.lastPlay = {...gameState.currentPlay};
            gameState.currentPlay = null;
        } else {
            // Jika bukan kartu 2, reset flag
            gameState.twoCardPlayed = false;
            gameState.playerWhoPlayed2 = null;
        }
        
        // Pindah ke pemain berikutnya
        nextPlayer();
    }, 1000);

    return true;
}

// Fungsi update skor
function updateScore(player, cards, combinationType) {
    let points = 0;
    
    switch(combinationType) {
        case CombinationTypes.SINGLE: points = 1; break;
        case CombinationTypes.TRIPLET: points = 5; break;
        case CombinationTypes.QUARTET: points = 20; break;
        case CombinationTypes.STRAIGHT: points = 10; break;
        case CombinationTypes.FLUSH: points = 15; break;
        case CombinationTypes.STRAIGHT_FLUSH: points = 30; break;
        case CombinationTypes.FULL_HOUSE: points = 25; break;
    }
    
    if (player.name === 'Anda') {
        gameStats.score += points;
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = gameStats.score;
        }
    }
}

// Variabel untuk melacak pemain yang lewat
let passedPlayers = [];

// Fungsi untuk pindah ke pemain berikutnya
function nextPlayer() {
    // Cek apakah kartu 2 telah dimainkan dan satu putaran telah selesai
    if (gameState.twoCardPlayed) {
        // Hitung berapa pemain yang telah mendapat giliran sejak kartu 2 dimainkan
        let playerCount = gameState.players.length;
        let playerWhoPlayed2 = gameState.playerWhoPlayed2;
        let currentPlayer = gameState.currentPlayerIndex;
        
        // Hitung berapa pemain yang telah mendapat giliran sejak kartu 2 dimainkan
        let playersAfter2 = (currentPlayer - playerWhoPlayed2 + playerCount) % playerCount;
        
        console.log(`Pemain setelah kartu 2 dimainkan: ${playersAfter2} dari ${playerCount-1}`);
        
        // Jika semua pemain lain telah mendapat giliran (kecuali pemain yang memainkan kartu 2)
        if (playersAfter2 >= playerCount - 1) {
            console.log(`Semua pemain telah mendapat giliran setelah kartu 2, kembali ke pemain ${playerWhoPlayed2}`);
            
            // Kembalikan giliran ke pemain yang memainkan kartu 2
            gameState.currentPlayerIndex = playerWhoPlayed2;
            
            // Reset flag kartu 2
            gameState.twoCardPlayed = false;
            gameState.playerWhoPlayed2 = null;
            gameState.playerBannedFromPlayingBomb = null; // Reset flag larangan memainkan bom
            
            // Reset currentPlay agar pemain bisa membuang kartu apa saja
            gameState.lastPlay = gameState.currentPlay;
            gameState.currentPlay = null;
            
            // Reset daftar pemain yang lewat
            passedPlayers = [];
            
            // Update UI
            updateUI();
            
            // Jika pemain adalah AI, beri kesempatan untuk membuang kartu lagi
            if (gameState.players[gameState.currentPlayerIndex].isAI) {
                setTimeout(() => {
                    console.log(`AI Pemain ${gameState.currentPlayerIndex} mendapat giliran lagi setelah semua pemain mendapat giliran`);
                    playAITurn();
                }, 1500);
            }
            
            return; // Keluar dari fungsi
        }
    }
    
    // Simpan indeks pemain saat ini
    const currentIndex = gameState.currentPlayerIndex;
    
    // Pindah ke pemain berikutnya (searah jarum jam)
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Cek apakah sudah kembali ke pemain yang terakhir membuang kartu dan ada pemain yang lewat
    if (gameState.lastPlay && 
        gameState.currentPlayerIndex === gameState.players.indexOf(gameState.lastPlay.player) && 
        passedPlayers.length > 0) {
        
        console.log(`Semua pemain lewat (${passedPlayers.length} pemain), kembali ke pemain yang terakhir membuang kartu`);
        
        // Jika pemain terakhir yang membuang kartu adalah AI dan kartu terakhir adalah As
        if (gameState.players[gameState.currentPlayerIndex].isAI && 
            gameState.currentPlay && 
            gameState.currentPlay.cards[0].value === 'A') {
            
            // Biarkan AI membuang kartu apa saja
            console.log('AI dapat membuang kartu apa saja setelah semua pemain lewat');
            gameState.currentPlay = null;
        } else {
            // Reset currentPlay agar pemain bisa membuang kartu apa saja
            gameState.currentPlay = null;
        }
        
        // Reset daftar pemain yang lewat
        passedPlayers = [];
    }
    
    console.log(`Giliran berpindah dari Pemain ${currentIndex} ke Pemain ${gameState.currentPlayerIndex}`);
    
    // Reset selected cards if it's the human player's turn
    if (gameState.currentPlayerIndex === 0) {
        selectedCards = [];
        
        // Also clear visual selection indicators
        const cardElements = document.querySelectorAll('#player-hand .card');
        cardElements.forEach(element => {
            element.classList.remove('selected');
        });
    }
    
    // Update UI
    updateUI();
    
    // Jika pemain berikutnya adalah AI, jalankan giliran AI
    // Pastikan pemain 0 tidak pernah dianggap sebagai AI
    if (gameState.currentPlayerIndex !== 0 && gameState.players[gameState.currentPlayerIndex].isAI) {
        setTimeout(playAITurn, 1000);
    }
}

// Akhiri permainan
function endGame(winner) {
    gameState.gameEnded = true;
    clearInterval(gameStats.timerInterval);
    
    if (winner.name === 'Anda') {
        playSound('win');
        alert(`Selamat! Anda menang dengan skor ${gameStats.score}!`);
    } else {
        playSound('lose');
        alert(`${winner.name} menang! Skor Anda: ${gameStats.score}`);
    }
    
    // Tampilkan statistik
    document.getElementById('game-stats').classList.remove('hidden');
}

// Fungsi untuk menampilkan pesan error di UI sebagai popup
function showErrorMessage(message, duration = 3000) {
    if (!message) {
        hideErrorMessage();
        return;
    }
    
    const errorPopup = document.getElementById('error-message');
    const errorText = document.getElementById('error-message-text');
    if (!errorPopup || !errorText) return;
    
    // Set pesan error
    errorText.textContent = message;
    
    // Tampilkan popup
    errorPopup.classList.remove('hidden');
    
    // Animasi masuk
    setTimeout(() => {
        const popupContent = errorPopup.querySelector('div');
        if (popupContent) {
            popupContent.classList.add('scale-100');
            popupContent.classList.remove('scale-95');
        }
    }, 10);
    
    // Tambahkan event listener untuk tombol tutup jika belum ada
    const closeButton = document.getElementById('error-close-button');
    if (closeButton) {
        // Remove existing listener first to prevent duplicates
        closeButton.removeEventListener('click', hideErrorMessage);
        closeButton.addEventListener('click', hideErrorMessage);
    }
    
    // Sembunyikan pesan setelah beberapa detik jika durasi lebih dari 0
    if (duration > 0) {
        setTimeout(() => {
            hideErrorMessage();
        }, duration);
    }
    
    // Mainkan suara error jika tersedia
    playSound('error');
}

// Fungsi untuk menyembunyikan pesan error
function hideErrorMessage() {
    const errorPopup = document.getElementById('error-message');
    if (!errorPopup) return;
    
    // Animasi keluar
    const popupContent = errorPopup.querySelector('div');
    if (popupContent) {
        popupContent.classList.remove('scale-100');
        popupContent.classList.add('scale-95');
    }
    
    // Sembunyikan popup setelah animasi
    setTimeout(() => {
        errorPopup.classList.add('hidden');
    }, 200);
}

// Event listener untuk tombol aksi
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi tombol aksi
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    const sortButton = document.getElementById('sort-button');
    
    if (playButton) {
        playButton.addEventListener('click', playSelectedCards);
    }
    
    if (passButton) {
        passButton.addEventListener('click', passTurn);
    }
    
    if (sortButton) {
        sortButton.addEventListener('click', sortHand);
    }
    
    // Inisialisasi suara
    initSounds();
});

// Mulai game saat halaman dimuat
window.onload = () => {
    initGame(4, 'easy');
};

// Fungsi untuk memainkan kartu yang dipilih
function playSelectedCards() {
    console.log('Mencoba memainkan kartu yang dipilih:', selectedCards);
    
    if (selectedCards.length === 0) {
        const errorMsg = 'Tidak ada kartu yang dipilih. Silakan pilih kartu terlebih dahulu.';
        console.log(errorMsg);
        showErrorMessage(errorMsg);
        return;
    }
    
    const currentPlayer = gameState.players[0]; // Selalu gunakan pemain utama (player 0)
    const combinationType = determineCombination(selectedCards);
    
    // Cek validitas kombinasi
    if (combinationType === CombinationTypes.NONE) {
        const errorMsg = 'Kombinasi kartu tidak valid. Pastikan kartu membentuk kombinasi yang benar (kartu tunggal, triplet, straight, dll).';
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return;
    }
    
    console.log('Kombinasi kartu:', combinationType);
    console.log('Kartu pemain:', currentPlayer.hand);
    
    // Verifikasi kartu ada di tangan pemain
    const allCardsInHand = selectedCards.every(selectedCard => 
        currentPlayer.hand.some(handCard => 
            handCard.value === selectedCard.value && 
            handCard.suit === selectedCard.suit
        )
    );
    
    if (!allCardsInHand) {
        const errorMsg = 'Beberapa kartu yang dipilih tidak ada di tangan pemain';
        console.error(errorMsg);
        showErrorMessage(errorMsg);
        return;
    }
    
    // Salin kartu yang dipilih dengan referensi yang benar dari tangan pemain
    const cardsToPlay = selectedCards.map(selectedCard => {
        const cardIndex = currentPlayer.hand.findIndex(handCard => 
            handCard.value === selectedCard.value && 
            handCard.suit === selectedCard.suit
        );
        return cardIndex !== -1 ? currentPlayer.hand[cardIndex] : null;
    }).filter(card => card !== null);
    
    console.log('Kartu yang akan dimainkan:', cardsToPlay);
    
    if (playCards(currentPlayer, cardsToPlay, combinationType)) {
        console.log('Kartu berhasil dimainkan');
        
        // Update tampilan tangan pemain
        renderPlayerHand(currentPlayer);
        
        // Reset seleksi
        selectedCards = [];
        updateActionButtons();
        
        // Cek jika pemain menang
        if (currentPlayer.hand.length === 0) {
            endGame(currentPlayer);
            return;
        }
        
        // Jangan pindah ke pemain berikutnya jika kartu yang dimainkan adalah kartu 2
        // Perpindahan giliran sudah ditangani di fungsi playCards
        // nextPlayer(); -- Komentar baris ini untuk mencegah perpindahan giliran ganda
    } else {
        console.error('Gagal memainkan kartu');
    }
}

// Render tangan pemain
function renderPlayerHand(player) {
    console.log('Memulai render tangan pemain');
    
    const handContainer = document.getElementById('player-hand');
    if (!handContainer) {
        console.error('Player hand container tidak ditemukan');
        return;
    }
    
    // Kosongkan container
    handContainer.innerHTML = '';
    
    // Render setiap kartu
    player.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = renderCard(card);
        
        // Tambahkan event listener langsung
        cardElement.addEventListener('click', () => {
            console.log(`Kartu index ${index} diklik`);
            
            // Pastikan game state valid
            if (!gameState?.players?.[0]?.hand) {
                console.error('Game state tidak valid');
                return;
            }
            
            const player = gameState.players[0];
            
            // Validasi index
            if (index < 0 || index >= player.hand.length) {
                console.error('Index kartu tidak valid:', index, 'dari total', player.hand.length);
                return;
            }
            
            const card = player.hand[index];
            
            // Cari elemen kartu dengan selector yang lebih spesifik
            const cardElement = document.querySelector(`#player-hand > .card:nth-child(${index + 1})`);
            
            if (!cardElement) {
                console.error('Elemen kartu tidak ditemukan:', {
                    index: index,
                    selector: `#player-hand > .card:nth-child(${index + 1})`,
                    playerHand: player.hand,
                    container: document.getElementById('player-hand')?.innerHTML
                });
                return;
            }
            
            // Toggle seleksi
            const isSelected = cardElement.classList.contains('selected');
            
            if (!isSelected) {
                selectedCards.push(card);
                cardElement.classList.add('selected');
            } else {
                const selectedIndex = selectedCards.findIndex(c => 
                    c.value === card.value && c.suit === card.suit);
                if (selectedIndex !== -1) {
                    selectedCards.splice(selectedIndex, 1);
                }
                cardElement.classList.remove('selected');
            }
            
            updateActionButtons();
        });
        
        handContainer.appendChild(cardElement);
    });
    
    console.log('Render tangan pemain selesai. Total kartu:', player.hand.length);
}

// Inisialisasi UI
function initUI() {
    console.log('Inisialisasi UI...');
    
    // Render tangan pemain utama
    renderPlayerHand(gameState.players[0]);
    
    // Render tangan pemain lawan
    for (let i = 1; i < gameState.players.length; i++) {
        renderOpponentHand(gameState.players[i], i);
    }
    
    // Update tombol aksi
    updateActionButtons();
}

// Fungsi untuk memperbarui indikator giliran pemain
function updateTurnIndicator() {
    console.log('Memperbarui indikator giliran...');
    
    // Reset semua indikator giliran ke warna standby (abu-abu)
    for (let i = 0; i < gameState.players.length; i++) {
        const indicator = document.getElementById(`player-${i}-turn`);
        if (indicator) {
            // Reset ke warna abu-abu standby
            indicator.classList.remove('bg-yellow-500');
            indicator.classList.add('bg-gray-600');
        }
    }
    
    // Ubah indikator pemain yang sedang giliran menjadi kuning
    const currentPlayerTurn = document.getElementById(`player-${gameState.currentPlayerIndex}-turn`);
    if (currentPlayerTurn) {
        // Set ke warna kuning untuk giliran aktif
        currentPlayerTurn.classList.remove('bg-gray-600');
        currentPlayerTurn.classList.add('bg-yellow-500');
    }
}

// Update UI game
function updateUI() {
    console.log('Memperbarui UI...');
    
    // Update tangan pemain
    renderPlayerHand(gameState.players[0]);
    
    // Update tangan lawan
    for (let i = 1; i < gameState.players.length; i++) {
        renderOpponentHand(gameState.players[i], i);
    }
    
    // Update indikator giliran
    updateTurnIndicator();
    
    // Update tombol aksi
    updateActionButtons();
    
    // Pertahankan badge pemain jika ada kartu yang dimainkan
    if (gameState.currentPlay && gameState.currentPlay.cards.length > 0) {
        const playedCardsArea = document.getElementById('played-cards');
        if (playedCardsArea && !document.getElementById('badge-container')) {
            // Buat container untuk badge
            const badgeContainer = document.createElement('div');
            badgeContainer.id = 'badge-container';
            badgeContainer.className = 'flex justify-center';
            
            // Tambahkan badge pemain terakhir jika ada
            if (lastPlayerBadge) {
                const playerBadge = document.createElement('div');
                playerBadge.id = 'current-player-badge';
                playerBadge.className = 'bg-blue-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-auto';
                playerBadge.textContent = lastPlayerBadge.text;
                badgeContainer.appendChild(playerBadge);
            }
            
            // Tambahkan container ke area kartu yang dimainkan
            const cardsContainer = document.querySelector('#played-cards > div');
            if (cardsContainer) {
                cardsContainer.appendChild(badgeContainer);
            } else {
                // Jika tidak ada container, buat container baru
                const newCardsContainer = document.createElement('div');
                newCardsContainer.className = 'flex flex-col items-center';
                newCardsContainer.appendChild(badgeContainer);
                playedCardsArea.appendChild(newCardsContainer);
            }
        }
    }
}

// Render tangan lawan
function renderOpponentHand(player, playerIndex) {
    console.log(`Merender tangan pemain ${playerIndex}...`);
    
    const opponentContainer = document.getElementById(`player-${playerIndex}-cards`);
    if (!opponentContainer) {
        console.error(`Container untuk pemain ${playerIndex} tidak ditemukan`);
        return;
    }
    
    opponentContainer.innerHTML = '';
    
    // Tampilkan kartu tertutup untuk lawan dengan motif poker klasik
    for (let i = 0; i < player.hand.length; i++) {
        // Container kartu
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card';
        cardContainer.style.margin = '0 -25px 0 0'; // Sedikit lebih tumpuk agar muat banyak kartu
        
        // Tambahkan belakang kartu dengan motif poker
        const cardBackDesign = document.createElement('div');
        cardBackDesign.className = 'card-back';
        
        // Tambahkan ke DOM
        cardContainer.appendChild(cardBackDesign);
        opponentContainer.appendChild(cardContainer);
    }
}

// Fungsi untuk mengakhiri permainan
function endGame(winner) {
    console.log(`Game berakhir! Pemenang: ${winner.name}`);
    gameState.gameEnded = true;
    
    // Tampilkan pop-up pemenang
    const winnerPopup = document.getElementById('winner-popup');
    const winnerMessage = document.getElementById('winner-message');
    
    if (winnerPopup && winnerMessage) {
        // Set pesan pemenang
        winnerMessage.textContent = `${winner.isAI ? winner.name : 'Anda'} memenangkan permainan!`;
        
        // Tampilkan pop-up
        winnerPopup.classList.remove('hidden');
        
        // Tambahkan event listener untuk tombol main lagi
        const newGameButton = document.getElementById('new-game-button');
        if (newGameButton) {
            // Hapus event listener lama jika ada
            newGameButton.replaceWith(newGameButton.cloneNode(true));
            
            // Tambahkan event listener baru
            document.getElementById('new-game-button').addEventListener('click', () => {
                // Sembunyikan pop-up
                winnerPopup.classList.add('hidden');
                
                // Mulai permainan baru
                initGame(gameState.players.length, 'medium');
            });
        }
    }
}

// Fungsi untuk lewat giliran
function passTurn() {
    console.log(`Pemain ${gameState.currentPlayerIndex} melewati giliran`);
    
    // Tambahkan pemain saat ini ke daftar pemain yang lewat
    if (!passedPlayers.includes(gameState.currentPlayerIndex)) {
        passedPlayers.push(gameState.currentPlayerIndex);
    }
    
    // Mainkan suara hanya untuk pemain manusia
    if (gameState.currentPlayerIndex === 0) {
        playSound('pass');
        selectedCards = [];
        updateActionButtons();
    }
    
    // Tampilkan pesan pemain lewat
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerName = currentPlayer.isAI ? currentPlayer.name : 'Anda';
    
    // Tambahkan indikator visual untuk pemain yang lewat
    const playedCardsArea = document.getElementById('played-cards');
    if (playedCardsArea) {
        // Cari badge container yang sudah ada
        let badgeContainer = document.getElementById('badge-container');
        
        // Jika tidak ada badge container, buat baru
        if (!badgeContainer) {
            // Cari container untuk kartu yang dimainkan
            let cardsContainer = document.querySelector('#played-cards > div');
            
            // Jika tidak ada container, buat container baru
            if (!cardsContainer) {
                cardsContainer = document.createElement('div');
                cardsContainer.className = 'flex flex-col items-center';
                playedCardsArea.appendChild(cardsContainer);
            }
            
            // Buat badge container
            badgeContainer = document.createElement('div');
            badgeContainer.id = 'badge-container';
            badgeContainer.className = 'flex justify-center';
            cardsContainer.appendChild(badgeContainer);
        }
        
        // Tambahkan badge pemain yang lewat
        const passedBadge = document.createElement('div');
        passedBadge.className = 'bg-gray-500 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
        passedBadge.textContent = `${playerName} (Lewat)`;
        badgeContainer.appendChild(passedBadge);
    }
    
    // Pindah ke pemain berikutnya
    setTimeout(() => {
        nextPlayer();
    }, 500);
}

// Fungsi untuk mengurutkan kartu
function sortHand() {
    console.log('Mengurutkan kartu...');
    if (gameState.currentPlayerIndex !== 0) return;
    
    const player = gameState.players[0];
    player.sortHand();
    renderPlayerHand(player);
    playSound('sort');
}
