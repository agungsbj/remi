// Di bagian paling atas game.js

// Variabel global untuk state game
const gameState = {
    players: [],
    playerAfterAllPass: null, // Flag baru untuk menandai pemain yang mendapat giliran setelah semua pass
    currentPlayerIndex: 0, // Indeks pemain yang giliran saat ini
    currentPlay: null, // Kartu yang sedang dimainkan saat ini
    gameStarted: false,
    gameEnded: false,
    firstTurn: true, // Flag untuk menandai putaran pertama game
    firstGame: true, // Flag untuk menandai game pertama (memerlukan kartu 3 wajik)
    lastPlay: null, // Untuk menyimpan play terakhir yang valid
    lastPlayerWhoPlayed: null,
    winner: null,
    lastWinner: null, // Menyimpan pemain yang menang terakhir untuk memulai game berikutnya
    winCounts: {}, // Menyimpan jumlah kemenangan setiap pemain
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
    playerBannedFromPlayingBomb: null, // Pemain yang tidak boleh memainkan bom setelah memainkan kartu 2
    playedTwos: [] // Array untuk menyimpan semua kartu 2 yang dimainkan
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

// Definisi urutan nilai kartu dari terendah ke tertinggi (sesuai aturan Remi)
const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

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
    // Preserve winCounts & lastWinner
    const winCountsBackup = {...gameState.winCounts};
    const lastWinnerBackup = gameState.lastWinner;
    
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.currentPlay = null;
    gameState.gameStarted = false;
    gameState.gameEnded = false;
    gameState.lastPlayerWhoPlayed = null;
    gameState.twoCardPlayed = false;
    gameState.playerWhoPlayed2 = null;
    gameState.playerBannedFromPlayingBomb = null;
    gameState.firstTurn = true;
    gameState.cardHistory = [];
    gameState.playedTwos = []; // Reset array kartu 2 yang dimainkan
    
    // Restore win counts & lastWinner
    gameState.winCounts = winCountsBackup;
    gameState.lastWinner = lastWinnerBackup;
    
    console.log('Game state direset');
    
    // Buat deck baru
    const deck = new Deck();
    deck.shuffle();
    
    console.log('Deck dibuat');
    
    // Inisialisasi pemain - pemain 0 adalah pengguna (Anda)
    const humanPlayer = new Player('Anda', false);
    humanPlayer.index = 0; // Tambahkan properti index
    gameState.players.push(humanPlayer); // Pemain manusia (indeks 0)
    
    // Pemain AI mulai dari indeks 1
    for (let i = 1; i < numPlayers; i++) {
        const aiPlayer = new Player(`Pemain ${i}`, true);
        aiPlayer.index = i; // Tambahkan properti index
        gameState.players.push(aiPlayer); // AI
    }
    
    console.log('Pemain diinisialisasi:', gameState.players);
    
    // Bagikan kartu
    const cardsPerPlayer = Math.floor(52 / numPlayers);
    gameState.players.forEach(player => {
        player.addCards(deck.deal(cardsPerPlayer));
    });

    console.log('Kartu dibagikan');
    
    // Tentukan pemain pertama berdasarkan pemenang terakhir atau pemain dengan kartu 3 wajik jika game pertama
    let startingPlayerIndex = 0;
    
    if (gameState.lastWinner !== null) {
        // Mulai dari pemain yang menang di game sebelumnya
        startingPlayerIndex = gameState.lastWinner.index;
        console.log(`Game dimulai oleh pemain yang menang sebelumnya: ${startingPlayerIndex}`);
        
        // Set gameState.firstGame = false agar validateNextPlay tidak memeriksa kartu 3 wajik
        gameState.firstGame = false;
    } else {
        // Jika ini permainan pertama, cari pemain yang memiliki kartu 3 wajik
        startingPlayerIndex = findPlayerWithThreeOfDiamonds();
        console.log(`Game pertama, pemain pertama adalah yang memiliki 3 wajik: ${startingPlayerIndex}`);
        
        // Set gameState.firstGame = true agar validateNextPlay memeriksa kartu 3 wajik
        gameState.firstGame = true;
    }
    
    gameState.currentPlayerIndex = startingPlayerIndex;
    
    // Mulai game
    gameState.gameStarted = true;
    console.log(`Game dimulai, pemain pertama: ${gameState.currentPlayerIndex}`);
    
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
    
    // Reset kotak kartu 2 dan riwayat kartu
    const playedTwosArea = document.getElementById('played-twos');
    if (playedTwosArea && playedTwosArea.querySelector('div')) {
        playedTwosArea.querySelector('div').innerHTML = '';
    }
    
    // Update tampilan jumlah kemenangan di UI
    for (const playerIndex in gameState.winCounts) {
        const count = gameState.winCounts[playerIndex];
        const playerAreaId = playerIndex == 0 ? 'player-area' : `player-${playerIndex}-area`;
        const playerArea = document.getElementById(playerAreaId);
        if (playerArea) {
            const playerNameEl = playerArea.querySelector('.player-name');
            if (playerNameEl) {
                const trophySymbols = '🏆'.repeat(count);
                const playerName = playerIndex == 0 ? 'Anda' : `Pemain ${playerIndex}`;
                playerNameEl.innerHTML = `${playerName} ${trophySymbols}`;
            }
        }
    }
    
    // Update UI
    updateUI();
    
    // Mulai giliran AI jika bukan giliran pemain pertama
    if (gameState.currentPlayerIndex !== 0) {
        setTimeout(playAITurn, 1000);
    }
}

// Fungsi untuk memperbarui tampilan kartu 2 di sidebar
function updatePlayedTwosDisplay() {
    const playedTwosArea = document.getElementById('played-twos');
    if (!playedTwosArea) return;
    
    // Dapatkan container untuk kartu 2
    const twosContainer = playedTwosArea.querySelector('div');
    if (!twosContainer) return;
    
    // Kosongkan container (wajib untuk mencegah penumpukan kartu 2)
    twosContainer.innerHTML = '';
    
    // Jika ada kartu 2 yang sudah dimainkan
    if (gameState.playedTwos && gameState.playedTwos.length > 0) {
        // Tambahkan flex wrapper untuk menampilkan kartu secara horizontal
        const flexWrapper = document.createElement('div');
        flexWrapper.className = 'flex flex-row justify-center flex-wrap';
        
        // Iterasi setiap kartu 2 yang telah dimainkan dan tampilankan
        gameState.playedTwos.forEach(twoCard => {
            // Buat elemen kartu mini (ukuran lebih kecil)
            const miniCard = document.createElement('div');
            miniCard.className = 'mini-card bg-white rounded shadow-md m-1';
            miniCard.style.width = '25px'; // Lebih kecil
            miniCard.style.height = '35px'; // Lebih kecil
            
            // Tentukan suit yang akan ditampilkan
            let suit = twoCard.card.suit;
            let suitEmoji;
            
            // Konversi suit lama ke format baru jika perlu
            if (suit === '♦') {
                suit = 'wajik';
                suitEmoji = Card.getSuitEmoji('wajik');
            } else if (suit === '♣') {
                suit = 'keriting';
                suitEmoji = Card.getSuitEmoji('keriting');
            } else if (suit === '♥') {
                suit = 'love';
                suitEmoji = Card.getSuitEmoji('love');
            } else if (suit === '♠') {
                suit = 'skop';
                suitEmoji = Card.getSuitEmoji('skop');
            } else {
                // Jika sudah dalam format baru
                suitEmoji = Card.getSuitEmoji(suit);
            }
            
            // Tentukan warna berdasarkan suit
            const color = (suit === 'wajik' || suit === 'love') ? 'text-red-600' : 'text-black';
            
            // Isi konten kartu (lebih compact)
            miniCard.innerHTML = `
                <div class="p-0 text-center ${color}">
                    <div class="text-sm font-bold">2</div>
                    <div class="text-sm">${suitEmoji}</div>
                </div>
            `;
            
            // Tambahkan info pemain (lebih sederhana)
            const playerInfo = document.createElement('div');
            playerInfo.className = 'text-xs font-bold text-center text-white mt-1';
            // Hanya tampilkan nomor pemain saja
            playerInfo.textContent = twoCard.playerIndex === 0 ? '0' : `${twoCard.playerIndex}`;
            
            // Buat wrapper
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'flex flex-col items-center m-1';
            cardWrapper.appendChild(miniCard);
            cardWrapper.appendChild(playerInfo);
            
            // Tambahkan ke container
            flexWrapper.appendChild(cardWrapper);
        });
        
        // Tambahkan flexWrapper ke container
        twosContainer.appendChild(flexWrapper);
    }
}

// Fungsi untuk melacak dan menampilkan kartu yang sudah keluar berdasarkan jenis suit
function updatePlayedCardsSummary() {
    const playedCardsList = document.getElementById('cards-played-list');
    if (!playedCardsList) return;
    
    // Kosongkan area kartu yang sudah keluar
    playedCardsList.innerHTML = '';
    
    // Kelompokkan kartu berdasarkan suit
    const playedCards = {
        'wajik': [],
        'keriting': [],
        'love': [],
        'skop': []
    };
    
    // Scan riwayat kartu dan kelompokkan berdasarkan suit
    if (gameState.cardHistory && gameState.cardHistory.length > 0) {
        // gameState.cardHistory berisi objek {player, cards, combinationType, timestamp}
        gameState.cardHistory.forEach(historyItem => {
            // Pastikan historyItem.cards ada dan merupakan array
            if (historyItem.cards && Array.isArray(historyItem.cards)) {
                // Proses setiap kartu dalam array cards
                historyItem.cards.forEach(card => {
                    if (!card || typeof card !== 'object') return;
                    
                    // Konversi suit lama ke format baru jika diperlukan
                    let suitToUse = card.suit;
                    if (card.suit === '♦') suitToUse = 'wajik';
                    else if (card.suit === '♣') suitToUse = 'keriting';
                    else if (card.suit === '♥') suitToUse = 'love';
                    else if (card.suit === '♠') suitToUse = 'skop';
                    
                    // Tambahkan nilai kartu ke array suit yang sesuai jika belum ada
                    if (!playedCards[suitToUse]) {
                        playedCards[suitToUse] = [];
                    }
                    
                    if (!playedCards[suitToUse].includes(card.value)) {
                        playedCards[suitToUse].push(card.value);
                    }
                });
            }
        });
    }
    
    // Tampilkan kartu yang sudah keluar untuk setiap suit
    const suits = ['wajik', 'keriting', 'love', 'skop'];
    suits.forEach(suit => {
        // Buat baris untuk setiap jenis suit
        const suitRow = document.createElement('div');
        suitRow.className = 'mb-2';
        
        // Label suit dengan emoji
        const suitLabel = document.createElement('span');
        suitLabel.className = 'font-bold mr-2';
        
        // Tentukan warna berdasarkan suit
        const suitColor = (suit === 'wajik' || suit === 'love') ? 'text-red-500' : 'text-white';
        suitLabel.className += ` ${suitColor}`;
        
        // Tampilkan nama suit dengan emoji
        suitLabel.innerHTML = `${Card.getSuitEmoji(suit)}:`;
        suitRow.appendChild(suitLabel);
        
        // Sort nilai kartu berdasarkan urutan values jika ada
        const sortedValues = playedCards[suit] ? [...playedCards[suit]].sort((a, b) => {
            return values.indexOf(a) - values.indexOf(b);
        }) : [];
        
        // Isi atau kosong?
        if (sortedValues && sortedValues.length > 0) {
            // Tambahkan nilai untuk suit ini
            const valuesSpan = document.createElement('span');
            valuesSpan.className = 'text-white';
            valuesSpan.textContent = sortedValues.join(', ');
            suitRow.appendChild(valuesSpan);
        } else {
            // Jika tidak ada kartu yang keluar untuk suit ini
            const emptySpan = document.createElement('span');
            emptySpan.className = 'text-gray-400 italic';
            emptySpan.textContent = '-';
            suitRow.appendChild(emptySpan);
        }
        
        // Tambahkan ke daftar
        playedCardsList.appendChild(suitRow);
    });
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
        let playerName = gameState.currentPlayerIndex === 0 ? 'Anda' : `${gameState.currentPlayerIndex}`;
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
    
    // Gunakan emoji suit dari Card.getSuitEmoji (konversi suit jika masih menggunakan format lama)
    let suitSymbol;
    let suit = card.suit;
    
    // Konversi suit lama jika perlu
    if (card.suit === '♦') suit = 'wajik';
    if (card.suit === '♣') suit = 'keriting';
    if (card.suit === '♥') suit = 'love';
    if (card.suit === '♠') suit = 'skop';
    
    // Dapatkan emoji suit dari class Card
    suitSymbol = Card.getSuitEmoji(suit);
    
    // Tentukan warna berdasarkan suit
    const colorClass = (suit === 'wajik' || suit === 'love') ? 'text-red-600' : 'text-black';
    
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
        
        // PERBAIKAN: Cek apakah AI ini adalah pemain yang mendapat giliran setelah semua pass
        if (gameState.playerAfterAllPass === currentPlayer.index) {
            console.log(`AI Pemain ${currentPlayer.index} HARUS memainkan kartu karena semua pemain telah pass`);
            
            // Reset flag playerAfterAllPass
            gameState.playerAfterAllPass = null;
            
            // Jika semua sudah pass, maka bebas memainkan kartu apa saja
            // Reset currentPlay jika belum di-reset
            if (gameState.currentPlay) {
                gameState.currentPlay = null;
            }
            
            // Cari kombinasi kartu terbaik untuk dimainkan
            // Dalam kasus ini, AI lebih baik memainkan kartu tunggal dengan nilai rendah
            const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
            const sortedCards = [...currentPlayer.hand].sort((a, b) => {
                return values.indexOf(a.value) - values.indexOf(b.value);
            });
            
            // Pilih kartu terendah untuk dimainkan
            if (sortedCards.length > 0) {
                const lowestCard = sortedCards[0];
                console.log(`AI Pemain ${currentPlayer.index} memainkan kartu terendah:`, lowestCard);
                playCards(currentPlayer, [lowestCard], CombinationTypes.SINGLE);
                return;
            }
        }
        
        // PERBAIKAN: Cek jika kartu 2 telah dimainkan dan pemain ini bukan yang memainkan kartu 2
        // atau belum semua pemain mendapat giliran
        if (gameState.currentPlay && 
            gameState.currentPlay.type === CombinationTypes.SINGLE && 
            gameState.currentPlay.cards[0].value === '2' &&
            !(currentPlayer.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
            
            console.log(`AI Pemain ${currentPlayer.index} mencari bom setelah kartu 2 dimainkan`);
            
            // AI hanya bisa memainkan bom (quartet)
            const bombCards = findBombCards(currentPlayer);
            if (bombCards && bombCards.length > 0) {
                console.log(`AI Pemain ${currentPlayer.index} memainkan bom:`, bombCards);
                playCards(currentPlayer, bombCards, CombinationTypes.QUARTET);
            } else {
                console.log(`AI Pemain ${currentPlayer.index} tidak punya bom, harus pass`);
                passTurn(); // AI harus pass jika tidak punya bom
            }
            return;
        }
        
        // Logika normal AI untuk kasus lainnya
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
    
    // PERBAIKAN UTAMA: Cek jika kartu 2 telah dimainkan dan pemain ini bukan yang memainkan kartu 2
    // atau belum semua pemain mendapat giliran
    if (gameState.currentPlay && 
        gameState.currentPlay.type === CombinationTypes.SINGLE && 
        gameState.currentPlay.cards[0].value === '2' &&
        !(player.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
        
        console.log('Kartu 2 telah dimainkan. AI hanya bisa memainkan bom (quartet atau straight flush 5+ kartu) atau harus pass');
        
        // Cari quartet (bom - 4 kartu dengan nilai sama)
        const valueCounts = {};
        player.hand.forEach(card => {
            valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
        });
        
        // Cek quartet
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 4) {
                const quartetCards = player.hand.filter(card => card.value === value);
                console.log('AI menemukan quartet yang bisa dimainkan setelah kartu 2');
                return {
                    cards: quartetCards,
                    type: CombinationTypes.QUARTET
                };
            }
        }
        
        // Cek straight flush minimal 5 kartu
        // Implementasi cek straight flush 5+ kartu disini
        // ...
        
        // Jika tidak ada bom, AI harus pass
        console.log('AI tidak memiliki bom, harus pass setelah kartu 2');
        return null;
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
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
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
    
    // Jika kartu 2 tunggal telah dimainkan, pemain berikutnya bebas memainkan kartu apa saja
    // PENTING: hanya kartu 2 TUNGGAL yang punya aturan khusus
    if (currentType === CombinationTypes.SINGLE && currentCards[0].value === '2') {
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
    
    // Jika semua pemain lain telah lewat, pemain harus tetap memainkan jenis kombinasi yang sama
    // Pemeriksaan khusus: Jika semua pemain lain lewat DAN gameState.currentPlay adalah null,
    // artinya AI bisa memainkan kartu apapun
    if (passedPlayers.length === gameState.players.length - 1) {
        // Jika gameState.currentPlay adalah null, AI bisa memainkan kombinasi baru
        if (!gameState.currentPlay) {
            console.log('AI: Semua pemain lain lewat dan gameState.currentPlay null, AI bisa memainkan kombinasi baru');
            
            // Cari kartu tunggal terendah untuk dimainkan
            if (player.hand.length > 0) {
                // Urutkan kartu dari nilai terendah ke tertinggi
                const sortedCards = [...player.hand].sort((a, b) => 
                    values.indexOf(a.value) - values.indexOf(b.value)
                );
                
                // Mainkan kartu terendah
                console.log(`AI memilih kartu terendah: ${sortedCards[0].value}${sortedCards[0].suit}`);
                return {
                    cards: [sortedCards[0]],
                    type: CombinationTypes.SINGLE
                };
            }
            return null;
        }
        
        console.log('AI: Semua pemain lain lewat, mencari kombinasi dengan jenis yang sama: ' + currentType);
        
        // Coba cari kombinasi yang sama dengan yang terakhir dimainkan
        // Jika tidak bisa, cari kombinasi baru yang valid
        
        // Coba cari kombinasi yang sama dengan yang terakhir dimainkan
        if (currentType === CombinationTypes.SINGLE) {
            // PERBAIKAN: Untuk kartu tunggal, harus memperhatikan suit yang sama
            const lastCard = currentCards[0];
            
            // Pengecualian: Kartu 2 bisa dimainkan kapan saja tanpa memperhatikan jenis (suit)
            const twoCards = player.hand.filter(card => card.value === '2');
            if (twoCards.length > 0) {
                return {
                    cards: [twoCards[0]],
                    type: CombinationTypes.SINGLE
                };
            }
            
            // Filter kartu dengan jenis/suit yang sama
            const sameSuitCards = player.hand.filter(card => card.suit === lastCard.suit);
            
            // Jika ada kartu dengan suit yang sama, pilih yang terendah
            if (sameSuitCards.length > 0) {
                const lowestSameSuitCard = sameSuitCards.reduce((lowest, card) => 
                    values.indexOf(card.value) < values.indexOf(lowest.value) ? card : lowest
                , sameSuitCards[0]);
                
                console.log(`AI memilih kartu dengan suit yang sama: ${lowestSameSuitCard.value}${lowestSameSuitCard.suit}`);
                return {
                    cards: [lowestSameSuitCard],
                    type: CombinationTypes.SINGLE
                };
            }
            
            // Jika tidak ada kartu dengan suit yang sama, AI harus pass
            console.log(`AI tidak memiliki kartu dengan suit ${lastCard.suit}, harus pass`);
            return null;
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
    
    // PENTING: Kecuali setelah kartu 2 atau semua pemain pass, AI harus mengikuti tipe kombinasi yang sama
    // Jika tidak bisa mengikuti, AI harus pass
    console.log(`AI mencari kombinasi dengan tipe: ${currentType}`);
    
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
        // Cek kedua format (baru dan lama) untuk mendukung kompatibilitas
        const hasThreeOfDiamonds = player.hand.some(card => 
            card.value === '3' && (card.suit === 'wajik' || card.suit === '♦')
        );
        
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
    console.log('Pemain saat ini:', player.index);
    console.log('Current Play:', gameState.currentPlay ? `${gameState.currentPlay.type} - ${gameState.currentPlay.cards[0].toString()}` : 'null');
    console.log('twoCardPlayed status:', gameState.twoCardPlayed);
    console.log('playerWhoPlayed2:', gameState.playerWhoPlayed2);
    console.log('firstTurn:', gameState.firstTurn);
    console.log('firstGame:', gameState.firstGame);

    // PERBAIKAN: Hapus validasi kartu 3 wajik yang bermasalah
    // Jika kita masih di putaran pertama tapi sudah ada kartu yang dimainkan, lanjutkan saja
    // Validasi ini ternyata menyebabkan masalah dan menghalangi pemain memainkan kartunya
    if (gameState.firstTurn && gameState.firstGame) {
        // Pastikan firstTurn diatur ke false untuk menghindari validasi di masa mendatang
        gameState.firstTurn = false;
        console.log('Mengatur ulang flag firstTurn untuk menghindari validasi kartu 3 wajik');
    }
    
    console.log('DEBUG - Kondisi kartu 2:');
    console.log('- gameState.twoCardPlayed:', gameState.twoCardPlayed);
    console.log('- gameState.playerWhoPlayed2:', gameState.playerWhoPlayed2);
    console.log('- Kartu yang dimainkan sekarang:', cards.map(c => c.toString()));
    console.log('- Kombinasi:', combinationType);
    
    // PERBAIKAN UTAMA: Cek jika kartu 2 dimainkan - VALIDASI SANGAT KETAT
    if (gameState.twoCardPlayed === true || 
        (gameState.currentPlay && 
         gameState.currentPlay.type === CombinationTypes.SINGLE && 
         gameState.currentPlay.cards[0].value === '2')) {
        
        console.log('VALIDASI KARTU 2 AKTIF: Pemastian ketat untuk kartu 2');
        console.log('Pemain saat ini:', player.index);
        console.log('Pemain yang memainkan 2:', gameState.playerWhoPlayed2);
        console.log('Semua pemain sudah giliran?', gameState.allPlayersHaveHadTurn);
        
        // Pemain yang memainkan kartu 2 bebas memainkan kartu apapun di giliran berikutnya
        // tetapi hanya jika semua pemain sudah mendapat giliran
        if (player.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn) {
            console.log('Pemain yang memainkan kartu 2 bebas memainkan kombinasi baru');
            // Reset flag twoCardPlayed karena putaran kartu 2 sudah selesai
            gameState.twoCardPlayed = false;
            gameState.playerWhoPlayed2 = null; // Reset pemain yang memainkan kartu 2
            gameState.allPlayersHaveHadTurn = false; // Reset flag
            return true;
        } 
        
        // Cek apakah kartu yang dimainkan adalah bom (quartet atau straight flush min. 5 kartu)
        const isBomb = combinationType === CombinationTypes.QUARTET || 
                       (combinationType === CombinationTypes.STRAIGHT_FLUSH && cards.length >= 5);
        
        // Jika pemain saat ini BUKAN yang memainkan kartu 2 ATAU
        // jika pemain yang memainkan kartu 2 tapi belum semua pemain giliran,
        // maka hanya boleh memainkan bom
        if (isBomb) {
            const bombType = combinationType === CombinationTypes.QUARTET ? 'quartet' : 'straight flush';
            console.log(`Kartu bom (${bombType}) dimainkan untuk melawan kartu 2`);
            return true;
        } else {
            console.error('VALIDASI GAGAL: Setelah kartu 2, hanya bisa memainkan kartu bom atau harus lewat');
            showErrorMessage('Setelah kartu 2 dimainkan, Anda hanya bisa memainkan bom (quartet atau straight flush min. 5 kartu) atau harus lewat.');
            return false;
        }
    }
    
    // Jika belum ada kartu yang dimainkan (awal permainan atau setelah reset)
    if (!gameState.currentPlay) {
        if (gameState.firstTurn) {
            // Jika ini game pertama, pemain pertama harus memainkan kartu 3 wajik
            if (gameState.firstGame) {
                const has3Diamond = cards.some(card => card.value === '3' && card.suit === '♦');
                if (!has3Diamond) {
                    console.error('Pada game pertama, kartu pertama harus 3 wajik');
                    return false;
                }
            } else {
                // Jika ini bukan game pertama (sudah ada pemenang), pemain bebas memainkan kartu apa saja
                console.log('Permainan dimulai oleh pemenang sebelumnya, bebas membuang kartu apapun');
            }
            
            // Set firstTurn menjadi false agar permainan berlanjut dengan normal
            gameState.firstTurn = false;
            return true;
        }
        
        // Set firstTurn menjadi false agar permainan berlanjut dengan normal
        gameState.firstTurn = false;
        return true;
    }
    
    // TAMBAHAN: Validasi untuk kartu tunggal - harus sama jenis (suit) dan nilai lebih tinggi
    if (gameState.currentPlay && combinationType === CombinationTypes.SINGLE && 
        gameState.currentPlay.type === CombinationTypes.SINGLE) {
        
        const currentCard = gameState.currentPlay.cards[0];
        const newCard = cards[0];
        
        // Kartu harus sama jenisnya (suit)
        if (currentCard.suit !== newCard.suit) {
            console.error(`Kartu harus sama jenisnya: ${currentCard.suit}`);
            showErrorMessage(`Anda harus memainkan kartu jenis ${currentCard.suit}`);
            return false;
        }
        
        // Kartu harus bernilai lebih tinggi
        const currentValue = Card.getNumericValue(currentCard.value);
        const newValue = Card.getNumericValue(newCard.value);
        
        if (newValue <= currentValue) {
            console.error(`Kartu harus bernilai lebih tinggi dari ${currentCard.value}`);
            showErrorMessage(`Anda harus memainkan kartu bernilai lebih tinggi dari ${currentCard.value}`);
            return false;
        }
        
        console.log('Kartu tunggal valid: sama jenis dan nilai lebih tinggi');
        return true;
    }
        
    // Jika bukan giliran pertama dan bukan kartu tunggal, pemain bebas memainkan kartu apa saja
    return true;
}
    
// Mainkan kartu
function playCards(player, cards, combinationType) {
    console.log('Memainkan kartu:', cards);
    
    // SANGAT PENTING: Cek jika ini adalah kartu 2 tunggal
    if (cards.length === 1 && cards[0].value === '2' && combinationType === CombinationTypes.SINGLE) {
        console.log('PENTING: Kartu 2 tunggal dimainkan, mengaktifkan flag twoCardPlayed');
        gameState.twoCardPlayed = true;
        gameState.playerWhoPlayed2 = player.index;
        gameState.allPlayersHaveHadTurn = false; // Reset flag, akan diset ke true saat semua pemain mendapat giliran
    }
    
    // Simpan jika ini kartu AS tunggal
    if (cards.length === 1 && cards[0].value === 'A' && combinationType === CombinationTypes.SINGLE) {
        console.log('PENTING: Kartu A tunggal dimainkan, menyimpan informasi untuk validasi');
        gameState.playerWhoPlayedAce = player.index;
        gameState.allPlayersHaveHadTurn = false; // Reset flag, akan diset ke true saat semua pemain mendapat giliran
    }
    
    // Keluarkan kartu dari tangan pemain
    cards.forEach(card => {
        const index = player.hand.findIndex(c => c.equals(card));
        if (index !== -1) {
            player.hand.splice(index, 1);
        }
    });
    
    // Perbaharui currentPlay
    gameState.currentPlay = {
        player: player,
        cards: cards,
        type: combinationType
    };
    
    // Tambahkan ke riwayat
    addCardHistory(player, cards, combinationType);
    
    // Pindahkan ke pemain berikutnya
    moveToNextPlayer(player.index);
    
    // Periksa kondisi kemenangan
    checkWinCondition(player);
}
// Kode rusak telah dihapus sepenuhnya untuk mengatasi masalah sintaks

// Fungsi untuk memeriksa apakah tombol pass harus diaktifkan
function checkPassButton() {
    const passButton = document.getElementById('pass-button');
    if (!passButton) return;
    
    // PERBAIKAN: Selalu aktifkan tombol pass, bahkan ketika kartu 2 dimainkan
    // Ini memastikan pemain selalu bisa pass jika tidak memiliki kartu yang valid
    passButton.disabled = false;
    passButton.classList.remove('opacity-50', 'cursor-not-allowed');
    passButton.title = 'Lewati giliran Anda';
}

// Fungsi untuk validasi berikutnya
function validateCardPlay(player, cards, combinationType) {
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
            
            // Nilai kartu harus lebih tinggi
            const newCardValue = valueOrder.indexOf(newCard.value);
            const lastCardValue = valueOrder.indexOf(lastCard.value);
            console.log(`Membandingkan nilai kartu: ${newCard.value} (${newCardValue}) vs ${lastCard.value} (${lastCardValue})`);
            
            if (newCardValue <= lastCardValue) {
                console.error(`Nilai kartu harus lebih tinggi! ${newCard.value} tidak lebih tinggi dari ${lastCard.value}`);
                showErrorMessage(`Nilai kartu harus lebih tinggi dari ${lastCard.value}`);
                return false;
            }
            
            return true;
            
        case CombinationTypes.TRIPLET:
            // Triplet: nilai kartu harus lebih tinggi
            return compareHighestCards(cards, gameState.currentPlay.cards);
            
        case CombinationTypes.STRAIGHT:
        case CombinationTypes.STRAIGHT_FLUSH:
            // Straight/Straight Flush: nilai tertinggi harus lebih tinggi
            // Minimal harus punya 3 kartu untuk dianggap sebagai straight
            if (cards.length < 3) {
                console.error('Straight minimal harus memiliki 3 kartu');
                showErrorMessage('Straight minimal harus memiliki 3 kartu');
                return false;
            }
            
            // Pastikan straight yang dimainkan memiliki jumlah kartu yang sama
            if (cards.length !== gameState.currentPlay.cards.length) {
                console.error(`Jumlah kartu dalam straight harus sama: ${cards.length} vs ${gameState.currentPlay.cards.length}`);
                showErrorMessage(`Jumlah kartu dalam straight harus sama dengan straight sebelumnya (${gameState.currentPlay.cards.length} kartu)`);
                return false;
            }
            
            // Pastikan kartu tertingginya lebih tinggi
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
    // Urutan nilai kartu untuk kartu tunggal dan kombinasi normal: 3 < 4 < 5 < ... < K < A < 2
    // 3 adalah yang terendah, 2 adalah yang tertinggi
    const valueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    
    // Debug: Print definisi urutan nilai
    console.log('DEBUG - Urutan nilai kartu: ' + valueOrder.join(' < '));
    
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
        
        // PERBAIKAN: Memastikan perbandingan straight value bekerja dengan benar
        // Jika straight yang baru memiliki kartu tertinggi dengan nilai yang lebih tinggi, return true
        if (newHighVal > oldHighVal) {
            return true;
        }
        // Jika straight yang baru memiliki kartu tertinggi dengan nilai yang lebih rendah, return false
        if (newHighVal < oldHighVal) {
            return false;
        }
        
        // Jika nilai kartu tertinggi sama, bandingkan jenis kartu (suit)
        // PERBAIKAN: Menambahkan log untuk membantu debug
        const suitOrder = ['♦', '♣', '♥', '♠'];
        const newSuitRank = suitOrder.indexOf(newHighestCard.suit);
        const oldSuitRank = suitOrder.indexOf(oldHighestCard.suit);
        console.log(`Nilai sama, membandingkan suit: ${newHighestCard.suit} (${newSuitRank}) vs ${oldHighestCard.suit} (${oldSuitRank})`);
        return newSuitRank > oldSuitRank;
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
                playerBadge.className = 'bg-red-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
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
                    playerBadge.className = 'bg-red-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
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
    
    // Update tampilan riwayat dan kartu yang sudah keluar
    updateCardHistoryDisplay();
}

// Fungsi untuk memperbarui tampilan riwayat kartu dengan format yang sangat sederhana
function updateCardHistoryDisplay() {
    const historyList = document.getElementById('card-history-list');
    if (!historyList) return;
    
    // Kosongkan area riwayat
    historyList.innerHTML = '';
    
    // Jika game baru dimulai, bersihkan riwayat
    if (gameState.cardHistory.length === 0) {
        return;
    }
    
    // Tambahkan setiap item riwayat dalam format ultra-sederhana (satu baris per kartu)
    gameState.cardHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'flex items-center p-1 mb-1 bg-black bg-opacity-20 rounded text-xs';
        
        // Tambahkan nomor pemain dengan badge kecil
        const playerBadge = document.createElement('div');
        playerBadge.className = 'mr-2 bg-blue-600 text-white px-2 py-1 rounded-full';
        // Hanya tampilkan nomor pemain atau 'Anda'
        playerBadge.textContent = item.player.isAI ? `P${item.player.index}` : 'Anda';
        historyItem.appendChild(playerBadge);
        
        // Tambahkan tipe kombinasi
        const comboType = document.createElement('span');
        comboType.className = 'mr-2 text-yellow-300';
        comboType.textContent = getCombinationName(item.combinationType);
        historyItem.appendChild(comboType);
        
        // Tambahkan kartu-kartu yang dimainkan dalam format kompak
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'flex flex-wrap gap-1 ml-auto';
        
        // Tambahkan representasi visual kartu sama seperti di area utama
        item.cards.forEach(card => {
            const miniCard = document.createElement('div');
            miniCard.className = 'mini-card inline-block w-8 h-12 bg-white rounded border border-gray-300 relative';
            
            // Gunakan fungsi renderCard yang sama dengan kartu di area utama
            // tetapi dengan ukuran lebih kecil
            let suit = card.suit;
            
            // Konversi suit lama jika perlu
            if (card.suit === '♦') suit = 'wajik';
            if (card.suit === '♣') suit = 'keriting';
            if (card.suit === '♥') suit = 'love';
            if (card.suit === '♠') suit = 'skop';
            
            // Dapatkan emoji suit dari class Card
            const suitSymbol = Card.getSuitEmoji(suit);
            
            // Tentukan warna berdasarkan suit
            const colorClass = (suit === 'wajik' || suit === 'love') ? 'text-red-600' : 'text-black';
            
            miniCard.innerHTML = `
                <div class="relative w-full h-full">
                    <div class="absolute top-0 left-0 ${colorClass} text-xs font-bold">${card.value}</div>
                    <div class="absolute top-0 right-0 ${colorClass} text-xs">${suitSymbol}</div>
                    <div class="absolute bottom-0 right-0 ${colorClass} text-xs font-bold transform rotate-180">${card.value}</div>
                    <div class="absolute bottom-0 left-0 ${colorClass} text-xs transform rotate-180">${suitSymbol}</div>
                    <div class="absolute inset-0 flex items-center justify-center ${colorClass} text-sm">${suitSymbol}</div>
                </div>
            `;
            cardsContainer.appendChild(miniCard);
        });
        
        historyItem.appendChild(cardsContainer);
        
        // Tambahkan ke daftar riwayat
        historyList.appendChild(historyItem);
    });
    
    // Update tampilan kartu yang sudah keluar
    updatePlayedCardsSummary();
}

// Mainkan kartu
function playCards(player, cards, combinationType) {
    console.log('Memainkan kartu:', cards);
    
    // PENTING: Cek apakah kartu 2 tunggal sedang dimainkan
    if (cards.length === 1 && cards[0].value === '2' && combinationType === CombinationTypes.SINGLE) {
        console.log('KARTU 2 DIMAINKAN: Pemain akan mendapat giliran lagi setelah pemain lain punya kesempatan untuk memainkan bom');
        
        // Simpan informasi bahwa kartu 2 baru saja dimainkan
        gameState.twoCardPlayed = true;
        gameState.playerWhoPlayed2 = player.index;
        gameState.lastPlayType = CombinationTypes.SINGLE; // Simpan tipe kombinasi terakhir
        gameState.last2Card = {...cards[0]}; // Simpan kartu 2 yang dimainkan
        gameState.allPlayersHaveHadTurn = false; // Reset flag untuk memastikan semua pemain mendapat giliran
        
        // Reset currentPlay untuk mencegah kartu tunggal biasa dilawan dengan kartu 2
        // Ini penting untuk memastikan validasi ketat diterapkan
        gameState.currentPlay = {
            type: CombinationTypes.SINGLE,
            cards: [{...cards[0]}],
            player: player.index
        };
        
        // Tambahkan kartu 2 yang dimainkan ke array playedTwos
        gameState.playedTwos.push({
            card: {...cards[0]},
            playerIndex: player.index,
            timestamp: Date.now()
        });
        
        // Update tampilan kartu 2 di sidebar
        updatePlayedTwosDisplay();
    }
    
    // Pastikan currentPlay selalu diperbarui dengan benar
    if (!gameState.twoCardPlayed || (gameState.twoCardPlayed && player.index === gameState.playerWhoPlayed2)) {
        // Update currentPlay dengan kartu yang sedang dimainkan
        gameState.currentPlay = {
            type: combinationType,
            cards: [...cards],
            player: player.index
        };
    }
    
    // PERBAIKAN UTAMA: Validasi tambahan untuk kartu 2, tapi HANYA pada pemain berikutnya
    // Jika kartu 2 tunggal telah dimainkan, cek validasi ketat, tapi HINDARI validasi pada pemain yang baru saja memainkan kartu 2
    if (gameState.currentPlay && 
        gameState.currentPlay.type === CombinationTypes.SINGLE && 
        gameState.currentPlay.cards[0].value === '2' &&
        // PERBAIKAN: Pastikan player tidak sama dengan pemain yang baru saja memainkan kartu 2
        // Ini untuk menghindari validasi pada AI saat baru saja memainkan kartu 2
        player.index !== gameState.currentPlay.player) {
        
        console.log('VALIDASI KETAT: Kartu 2 telah dimainkan, hanya bom yang dapat dimainkan');
        console.log('Pemain saat ini:', player.index, 'vs pemain yang memainkan kartu 2:', gameState.playerWhoPlayed2);
        
        // Jika pemain BUKAN pemain yang memainkan kartu 2 atau belum semua pemain punya giliran
        if (!(player.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
            // Cek apakah ini adalah kartu bom
            const isBomb = combinationType === CombinationTypes.QUARTET || 
                          (combinationType === CombinationTypes.STRAIGHT_FLUSH && cards.length >= 5);
                          
            // Pastikan flag twoCardPlayed tetap true sampai semua pemain mendapat giliran
            gameState.twoCardPlayed = true;
            
            if (!isBomb) {
                console.error('VALIDASI GAGAL: Setelah kartu 2, hanya kartu bom yang bisa dimainkan');
                showErrorMessage('Setelah kartu 2, hanya kartu bom yang bisa dimainkan.');
                
                // PERBAIKAN: Paksa tombol menjadi tidak aktif melalui UI (jika pemain manusia)
                if (player.index === 0) {
                    const playButton = document.getElementById('play-button');
                    if (playButton) {
                        playButton.disabled = true;
                        playButton.classList.add('opacity-50', 'cursor-not-allowed');
                        playButton.title = 'Setelah kartu 2, hanya bom yang dapat dimainkan';
                    }
                }
                
                return false;
            } else {
                // PERBAIKAN: Jika ini kartu bom (quartet atau straight flush 5+ kartu), pemain langsung menang
                if (combinationType === CombinationTypes.QUARTET || 
                    (combinationType === CombinationTypes.STRAIGHT_FLUSH && cards.length >= 5)) {
                    
                    const bombType = combinationType === CombinationTypes.QUARTET ? 'Quartet' : 'Straight Flush';
                    console.log(`BOM! ${bombType} dimainkan setelah kartu 2, pemain langsung menang`);
                    
                    // Tampilkan konfirmasi kemenangan
                    showErrorMessage(`BOM! ${player.name} memainkan ${bombType} dan langsung menang!`, 3000);
                    
                    // Jalankan sound effect kemenangan
                    playSound('win');
                    
                    // Tunggu 2 detik agar efek sound dan visual terlihat
                    setTimeout(() => {
                        // Langsung menang
                        endGame(player);
                    }, 2000);
                }
            }
        }
    }
    
    // Pastikan elemen UI ada
    const playedCardsArea = document.getElementById('played-cards');
    if (!playedCardsArea) {
        console.error('Error: Area kartu yang dimainkan tidak ditemukan');
        return false;
    }
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
                playerLabel.textContent = player.isAI ? `${player.index + 1}` : 'Anda';
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
    playerBadge.className = 'bg-blue-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
    playerBadge.textContent = player.isAI ? `${player.index}` : 'Anda';
    
    // Simpan badge pemain saat ini untuk digunakan nanti
    lastPlayerBadge = {
        text: playerBadge.textContent,
        player: player.index
    };
    
    // Jika ada badge pemain sebelumnya, tampilkan juga
    if (lastPlayerBadge && lastPlayerBadge.text !== playerBadge.textContent) {
        const previousPlayerBadge = document.createElement('div');
        previousPlayerBadge.className = 'bg-gray-500 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
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
    
    // Hapus kartu yang dimainkan dari tangan pemain
    cards.forEach(cardToRemove => {
        const cardIndex = player.hand.findIndex(handCard => 
            handCard.value === cardToRemove.value && 
            handCard.suit === cardToRemove.suit
        );
        if (cardIndex !== -1) {
            player.hand.splice(cardIndex, 1);
        }
    });
    
    // Update tampilan tangan pemain setelah kartu dihapus
    if (player.index === 0) {
        renderPlayerHand(player);
    } else {
        renderOpponentHand(player, player.index);
    }
    
    // Reset passed players (selalu reset saat kartu dimainkan)
    passedPlayers = [];
    
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
            gameState.lastPlayType = CombinationTypes.SINGLE; // Simpan tipe kombinasi terakhir
            gameState.last2Card = {...cards[0]}; // Simpan kartu 2 yang dimainkan
            
            // Update tampilan kartu 2 di sidebar
            updatePlayedTwosDisplay();
            
            // Tandai pemain ini tidak boleh memainkan bom di giliran berikutnya
            // Flag ini akan digunakan untuk mencegah pemain memainkan bom setelah kartu 2
            gameState.playerBannedFromPlayingBomb = playerWhoPlayed2;
            
            // PERBAIKAN: JANGAN reset currentPlay untuk mencegah bug validasi
            // Sebelumnya: gameState.currentPlay = null;
            // Sekarang kita tetap mempertahankan currentPlay agar validasi tetap berjalan
        } 
        // Jika kartu yang dimainkan adalah kartu AS (Ace) TUNGGAL, simpan informasi untuk nanti
        else if (cards[0].value === 'A' && combinationType === CombinationTypes.SINGLE) {
            console.log('Kartu AS tunggal dimainkan, pemain akan mendapat giliran lagi setelah pemain lain punya kesempatan untuk memainkan kartu 2');
            
            // Simpan pemain yang membuang kartu AS
            const playerWhoPlayedAce = gameState.currentPlayerIndex;
            
            // Simpan informasi bahwa kartu AS baru saja dimainkan
            gameState.aceCardPlayed = true;
            gameState.playerWhoPlayedAce = playerWhoPlayedAce;
            gameState.allPlayersHaveHadTurn = false;
            gameState.playersAfterAce = 0;
            gameState.totalPlayers = gameState.players.length;
            gameState.lastPlayType = CombinationTypes.SINGLE; // Simpan tipe kombinasi terakhir
            gameState.lastAceCard = {...cards[0]}; // Simpan kartu AS yang dimainkan
            
            // Simpan bahwa kartu AS masih aktif - penting untuk validasi
            gameState.aceCardActive = true;
            
            // PERBAIKAN: JANGAN reset currentPlay untuk konsistensi dengan perbaikan kartu 2
            // Mempertahankan currentPlay agar validasi tetap berjalan
        } else {
            // Jika bukan kartu 2 atau AS, reset flag
            gameState.twoCardPlayed = false;
            gameState.playerWhoPlayed2 = null;
            gameState.aceCardPlayed = false;
            gameState.playerWhoPlayedAce = null;
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
    // Cek apakah kartu AS telah dimainkan dan pemain berikutnya perlu mendapat giliran
    if (gameState.aceCardPlayed) {
        // Hitung berapa pemain yang telah mendapat giliran sejak kartu AS dimainkan
        let playerCount = gameState.players.length;
        let playerWhoPlayedAce = gameState.playerWhoPlayedAce;
        let currentPlayer = gameState.currentPlayerIndex;
        
        // Hitung berapa pemain yang telah mendapat giliran sejak kartu AS dimainkan
        let playersAfterAce = (currentPlayer - playerWhoPlayedAce + playerCount) % playerCount;
        
        console.log(`Pemain setelah kartu AS dimainkan: ${playersAfterAce} dari ${playerCount-1}`);
        
        // Jika semua pemain lain telah mendapat giliran (kecuali pemain yang memainkan kartu AS)
        if (playersAfterAce >= playerCount - 1) {
            console.log(`Semua pemain telah mendapat giliran setelah kartu AS, kembali ke pemain ${playerWhoPlayedAce}`);
            
            // Set flag bahwa semua pemain telah mendapat giliran
            gameState.allPlayersHaveHadTurn = true;
            
            // Kembalikan giliran ke pemain yang memainkan kartu AS
            gameState.currentPlayerIndex = playerWhoPlayedAce;
            
            // Reset currentPlay untuk memungkinkan pemain memainkan kombinasi baru
            // Ini penting agar pemain yang memainkan AS bisa memainkan kartu baru
            gameState.currentPlay = null;
            
            // Reset daftar pemain yang lewat
            passedPlayers = [];
            
            console.log('Flag allPlayersHaveHadTurn diset ke true untuk kartu AS');
            
            // Update UI
            updateUI();
            
            // Jika pemain adalah AI, beri kesempatan untuk membuang kartu lagi
            if (gameState.players[gameState.currentPlayerIndex].isAI) {
                setTimeout(() => {
                    console.log(`AI Pemain ${gameState.currentPlayerIndex} mendapat giliran lagi setelah kartu AS dimainkan`);
                    playAITurn();
                }, 1500);
            }
            
            return; // Keluar dari fungsi
        }
    }

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
            
            // PERBAIKAN PENTING: Set flag bahwa semua pemain telah mendapat giliran
            gameState.allPlayersHaveHadTurn = true;
            
            // Kembalikan giliran ke pemain yang memainkan kartu 2
            gameState.currentPlayerIndex = playerWhoPlayed2;
            
            // Reset flag kartu 2, TAPI JANGAN reset twoCardPlayed dan playerWhoPlayed2
            // Ini penting untuk melacak bahwa kartu 2 masih aktif sampai pemain yang memainkannya memainkan kartu lain
            gameState.playerBannedFromPlayingBomb = null; // Reset flag larangan memainkan bom
            
            // JANGAN reset currentPlay untuk pemain yang memainkan kartu 2
            // Ini memastikan bahwa kartu 2 masih tercatat sebagai kartu terakhir dimainkan
            // sampai pemain yang memainkannya memainkan kartu baru
            
            // Reset daftar pemain yang lewat
            passedPlayers = [];
            
            console.log('PERBAIKAN KRUSIAL: Flag allPlayersHaveHadTurn diset ke true');
            
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
        
        // PERBAIKAN: Jangan reset currentPlay jika kartu terakhir adalah kartu tunggal
        // Ini untuk memastikan pemain tetap harus memainkan kartu dengan jenis (suit) yang sama
        if (gameState.currentPlay && gameState.currentPlay.type === CombinationTypes.SINGLE) {
            // Untuk kartu tunggal, simpan informasi suit yang harus dimainkan
            const lastCard = gameState.currentPlay.cards[0];
            
            // Simpan kartu terakhir di gameState.lastSingleCard untuk validasi mendatang
            gameState.lastSingleCard = {
                suit: lastCard.suit,
                value: lastCard.value,
                playerIndex: gameState.currentPlayerIndex
            };
            
            console.log(`PERBAIKAN: Kartu terakhir adalah ${lastCard.value} ${lastCard.suit}, pemain harus tetap memainkan kartu dengan jenis ${lastCard.suit}`);
            
            // Tambahkan flag untuk validasi suit
            gameState.requireSameSuit = true;
            gameState.requiredSuit = lastCard.suit;
        } else {
            // Reset currentPlay untuk kombinasi selain single
            gameState.currentPlay = null;
            gameState.requireSameSuit = false;
            gameState.requiredSuit = null;
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
    gameState.winner = winner;
    gameState.lastWinner = winner; // Simpan pemenang terakhir untuk memulai game berikutnya
    clearInterval(gameStats.timerInterval);
    
    // Tambah jumlah kemenangan pemain
    const winnerIndex = winner.index;
    if (!gameState.winCounts[winnerIndex]) {
        gameState.winCounts[winnerIndex] = 0;
    }
    gameState.winCounts[winnerIndex]++;
    
    // Update UI untuk menampilkan jumlah kemenangan
    const playerAreaId = winner.index === 0 ? 'player-area' : `player-${winner.index}-area`;
    const playerArea = document.getElementById(playerAreaId);
    if (playerArea) {
        // Tambahkan simbol kemenangan pada nama pemain
        const playerNameEl = playerArea.querySelector('.player-name');
        if (playerNameEl) {
            // Tampilkan nama pemain dengan jumlah kemenangan
            const winCount = gameState.winCounts[winnerIndex];
            const trophySymbols = '🏆'.repeat(winCount);
            playerNameEl.innerHTML = `${winner.name} ${trophySymbols}`;
        }
    }
    
    if (winner.name === 'Anda') {
        playSound('win');
        alert(`Selamat! Anda menang dengan skor ${gameStats.score}!`);
    } else {
        playSound('lose');
        alert(`${winner.name} menang! Skor Anda: ${gameStats.score}`);
    }
    
    // Buat tombol bermain lagi
    const actionButtons = document.getElementById('action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = '';
        
        const newGameButton = document.createElement('button');
        newGameButton.id = 'new-game-button';
        newGameButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
        newGameButton.textContent = 'Main Lagi';
        newGameButton.addEventListener('click', () => {
            // Mulai game baru dengan pemain terakhir yang menang mulai duluan
            document.getElementById('game-stats').classList.add('hidden');
            // Reset kotak kartu 2 dan riwayat kartu
            const playedTwosArea = document.getElementById('played-twos');
            if (playedTwosArea && playedTwosArea.querySelector('div')) {
                playedTwosArea.querySelector('div').innerHTML = '';
            }
            
            // Reset riwayat kartu
            const cardHistoryContainer = document.getElementById('card-history-container');
            if (cardHistoryContainer) {
                cardHistoryContainer.innerHTML = '';
            }
            
            // Reset gameState.cardHistory
            gameState.cardHistory = [];
            
            // Mulai game baru dengan pemain yang menang mulai duluan
            initGame(gameState.players.length, gameState.difficulty);
        });
        
        actionButtons.appendChild(newGameButton);
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

// Fungsi untuk menampilkan indikator kombinasi kartu yang dipilih
function updateSelectedCombinationIndicator(showPopups = true) {
    // Dapatkan atau buat elemen indikator kombinasi
    let combinationIndicator = document.getElementById('combination-indicator');
    
    if (!combinationIndicator) {
        combinationIndicator = document.createElement('div');
        combinationIndicator.id = 'combination-indicator';
        combinationIndicator.className = 'fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded-lg z-50';
        document.body.appendChild(combinationIndicator);
    }
    
    // Jika tidak ada kartu yang dipilih, sembunyikan indikator
    if (selectedCards.length === 0) {
        combinationIndicator.classList.add('hidden');
        return;
    }
    
    // Tampilkan indikator
    combinationIndicator.classList.remove('hidden');
    
    // Tentukan kombinasi kartu yang dipilih
    const combinationType = determineCombination(selectedCards);
    
    // Tampilkan teks sesuai kombinasi
    let combinationText = '';
    let bgColor = 'bg-opacity-80 bg-black';
    
    if (combinationType === CombinationTypes.NONE) {
        combinationText = 'Kombinasi tidak valid';
        bgColor = 'bg-opacity-80 bg-red-700';
        
        // Hanya tampilkan pesan error jika showPopups adalah true
        // Ini memastikan popup error hanya muncul saat tombol buang diklik, bukan saat kartu dipilih
        if (showPopups && combinationType === CombinationTypes.NONE) {
            // Log waktu untuk pengelolaan error yang lebih baik
            console.error(`[${new Date().toISOString()}] Validasi gagal: Kombinasi tidak valid`);
        }
    } else {
        combinationText = `${getCombinationName(combinationType)}`;
        
        // Hanya tampilkan informasi kombinasi tanpa validasi saat pemain sedang memilih kartu
        // Validasi penuh hanya dilakukan saat tombol Buang ditekan
        bgColor = 'bg-opacity-80 bg-green-700';
    }
    
    // Update teks dan warna indikator
    combinationIndicator.textContent = combinationText;
    combinationIndicator.className = `fixed bottom-4 left-4 ${bgColor} text-white p-2 rounded-lg z-50`;
}

// Update tombol aksi
function updateActionButtons() {
    // Dapatkan elemen tombol
    const playButton = document.getElementById('play-button');
    const passButton = document.getElementById('pass-button');
    const sortButton = document.getElementById('sort-button');
    
    // Sembunyikan semua tombol jika bukan giliran pemain
    const actionContainer = document.getElementById('action-buttons');
    if (actionContainer) {
        if (gameState.currentPlayerIndex !== 0) {
            // Jika bukan giliran pemain, sembunyikan semua tombol
            actionContainer.classList.add('hidden');
            return;
        } else {
            // Jika giliran pemain, tampilkan tombol
            actionContainer.classList.remove('hidden');
            
            // Tambahkan indikator visual untuk menunjukkan ini giliran pemain
            actionContainer.classList.add('active-turn');
            actionContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            actionContainer.style.border = '2px solid rgba(59, 130, 246, 0.5)';
            actionContainer.style.padding = '10px';
            actionContainer.style.borderRadius = '8px';
        }
    }
    
    // Status tombol main
    if (playButton) {
        // Nonaktifkan tombol main jika bukan giliran pemain atau tidak ada kartu yang dipilih
        if (gameState.currentPlayerIndex !== 0 || selectedCards.length === 0) {
            playButton.disabled = true;
            playButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            // Cek apakah kombinasi kartu yang dipilih valid
            const combinationType = determineCombination(selectedCards);
            const isValid = combinationType !== CombinationTypes.NONE;
            
            if (!isValid) {
                playButton.disabled = true;
                playButton.classList.add('opacity-50', 'cursor-not-allowed');
                playButton.title = 'Kombinasi kartu tidak valid';
            } else {
                // Cek validasi lebih lanjut jika ada kartu di tengah
                let validNextPlay = true;
                if (gameState.currentPlay) {
                    validNextPlay = validateNextPlay(gameState.players[0], selectedCards, combinationType);
                }
                
                // PENTING: Override khusus untuk kartu 2
                // Cek jika kartu 2 (tunggal) baru saja dimainkan dan ini bukan pemain yang memainkannya
                let card2Played = false;
                if (gameState.currentPlay && 
                    gameState.currentPlay.type === CombinationTypes.SINGLE && 
                    gameState.currentPlay.cards[0].value === '2' &&
                    !(gameState.players[0].index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
                    
                    // Verifikasi apakah kartu yang dipilih adalah kartu bom (quartet atau straight flush min. 5 kartu)
                    if (combinationType !== CombinationTypes.QUARTET && 
                        !(combinationType === CombinationTypes.STRAIGHT_FLUSH && selectedCards.length >= 5)) {
                        
                        console.log('OVERRIDE TOMBOL: Setelah kartu 2, tombol buang dinonaktifkan kecuali untuk bom');
                        validNextPlay = false;
                        card2Played = true;
                    }
                }
                
                if (!validNextPlay) {
                    playButton.disabled = true;
                    playButton.classList.add('opacity-50', 'cursor-not-allowed');
                    if (card2Played) {
                        playButton.title = 'Setelah kartu 2, hanya bom yang bisa dimainkan';
                    } else {
                        playButton.title = 'Kartu tidak dapat dimainkan berdasarkan aturan';
                    }
                } else {
                    playButton.disabled = false;
                    playButton.classList.remove('opacity-50', 'cursor-not-allowed');
                    playButton.title = 'Mainkan kartu yang dipilih';
                }
            }
        }
    }
    
    // Status tombol lewat - PERBAIKAN: Tombol pass dinonaktifkan untuk pemain yang mendapat giliran setelah semua pass
    if (passButton) {
        if (gameState.currentPlayerIndex !== 0) {
            // Nonaktifkan jika bukan giliran pemain
            passButton.disabled = true;
            passButton.classList.add('opacity-50', 'cursor-not-allowed');
        } 
        // PERBAIKAN: Khusus untuk kartu 2, tombol pass harus SELALU aktif kecuali untuk pemain yang memainkan kartu 2
        } else {
            // PERBAIKAN PENTING: Selalu aktifkan tombol pass
            // Pemain selalu bisa pass, bahkan setelah kartu 2 dimainkan
            // atau setelah semua pemain lain pass
            passButton.disabled = false;
            passButton.classList.remove('opacity-50', 'cursor-not-allowed');
            passButton.style.position = '';
            passButton.style.overflow = '';
            passButton.innerHTML = 'Lewat';
            passButton.title = 'Lewati giliran Anda';
            
            // Hapus pesan panduan jika ada
            const actionContainer = document.getElementById('action-buttons');
            if (actionContainer) {
                const existingHelper = actionContainer.querySelector('.text-red-500.text-xs');
                if (existingHelper) {
                    actionContainer.removeChild(existingHelper);
                }
            }
            
            // Jika ini adalah giliran setelah kartu 2 dimainkan, berikan visual cue
            if (gameState.twoCardPlayed && gameState.currentPlay && 
                gameState.currentPlay.type === CombinationTypes.SINGLE && 
                gameState.currentPlay.cards[0].value === '2') {
                    
                // Berikan visual cue untuk menunjukkan bahwa pemain bisa lewat
                passButton.classList.add('bg-green-500', 'hover:bg-green-600'); // Hijau untuk menarik perhatian
                passButton.title = 'LEWAT - Anda sebaiknya lewat jika tidak punya kartu bom';
                passButton.classList.add('animate-pulse');
                passButton.innerHTML = '<b>Lewat</b>';
            } else {
                passButton.classList.remove('animate-pulse');
                passButton.classList.remove('bg-green-500', 'hover:bg-green-600');
                passButton.title = 'Lewat giliran';
                passButton.innerHTML = 'Lewat';
            }
        }
    }
    
    // Status tombol urutkan
    const sortButton = document.getElementById('sort-button');
    if (sortButton) {
        // Nonaktifkan tombol urutkan jika bukan giliran pemain
        if (gameState.currentPlayerIndex !== 0) {
            sortButton.disabled = true;
            sortButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            sortButton.disabled = false;
            sortButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

// Fungsi untuk memainkan kartu yang dipilih
function playSelectedCards() {
    console.log('Mencoba memainkan kartu yang dipilih:', selectedCards);
    
    // Selalu aktifkan popup saat tombol buang diklik
    const showPopups = true;
    
    if (selectedCards.length === 0) {
        const errorMsg = 'Tidak ada kartu yang dipilih. Silakan pilih kartu terlebih dahulu.';
        console.log(errorMsg);
        showErrorMessage(errorMsg);
        return;
    }
    
    // Update indikator kombinasi untuk memperbarui visual dan memastikan popup ditampilkan
    updateSelectedCombinationIndicator(showPopups);
    
    // PERBAIKAN PENTING: Periksa apakah kartu 2 baru saja dimainkan
    if (gameState.currentPlay && 
        gameState.currentPlay.type === CombinationTypes.SINGLE && 
        gameState.currentPlay.cards[0].value === '2') {
        
        console.log('VALIDASI KRUSIAL: Kartu 2 baru saja dimainkan, pemeriksaan ketat diaktifkan');
        
        // Jika ini BUKAN pemain yang memainkan kartu 2 atau giliran belum kembali ke pemain tersebut
        if (!(gameState.currentPlayerIndex === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
            // Periksa apakah kartu yang dipilih adalah bom
            const combinationType = determineCombination(selectedCards);
            const isBomb = combinationType === CombinationTypes.QUARTET || 
                        (combinationType === CombinationTypes.STRAIGHT_FLUSH && selectedCards.length >= 5);
            
            if (!isBomb) {
                const errorMsg = 'PELANGGARAN ATURAN: Setelah kartu 2 dimainkan, hanya bom (quartet atau straight flush min. 5 kartu) yang dapat dimainkan!';
                console.error(errorMsg);
                showErrorMessage(errorMsg);
                playErrorSound();
                return;
            }
        }
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
    
    // PENTING: Tambahkan pemeriksaan khusus untuk kartu 2
    // Cek jika kartu 2 telah dimainkan dan pemain mencoba memainkan sesuatu selain bom
    if (gameState.currentPlay && 
        gameState.currentPlay.type === CombinationTypes.SINGLE && 
        gameState.currentPlay.cards[0].value === '2') {
        
        // Jika pemain saat ini BUKAN pemain yang memainkan kartu 2 atau belum semua pemain mendapat giliran
        if (!(currentPlayer.index === gameState.playerWhoPlayed2 && gameState.allPlayersHaveHadTurn)) {
            // Verifikasi jika ini adalah kartu bom (quartet atau straight flush min. 5 kartu)
            if (combinationType !== CombinationTypes.QUARTET && 
                !(combinationType === CombinationTypes.STRAIGHT_FLUSH && selectedCards.length >= 5)) {
                
                const errorMsg = 'Setelah kartu 2, Anda hanya bisa memainkan kartu bom (quartet atau straight flush min. 5 kartu) atau harus lewat.';
                console.error(errorMsg);
                showErrorMessage(errorMsg);
                return;
            }
        }
    }
    
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
                // Animasi sederhana saat kartu dipilih
                cardElement.style.transform = 'translateY(-15px)';
                cardElement.style.transition = 'transform 0.2s ease';
            } else {
                const selectedIndex = selectedCards.findIndex(c => 
                    c.value === card.value && c.suit === card.suit);
                if (selectedIndex !== -1) {
                    selectedCards.splice(selectedIndex, 1);
                }
                cardElement.classList.remove('selected');
                // Reset posisi
                cardElement.style.transform = 'translateY(0)';
            }
            
            // Simpan state popup sebelum memperbarui tampilan
            const showPopups = false; // Nonaktifkan popup saat klik kartu
            
            // Cek dan tampilkan jenis kombinasi yang dipilih secara real-time
            // Kirim flag untuk menentukan apakah popup harus ditampilkan
            updateSelectedCombinationIndicator(showPopups);
            
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
    
    // Update tombol aksi - PENTING: Sembunyikan/Tampilkan tombol berdasarkan giliran
    updateActionButtons();
    
    // PENTING: Paksa sembunyikan tombol jika bukan giliran pemain
    // Double-check untuk memastikan tombol tidak muncul
    const actionContainer = document.getElementById('action-buttons');
    if (actionContainer) {
        if (gameState.currentPlayerIndex !== 0) {
            actionContainer.style.display = 'none';
        } else {
            actionContainer.style.display = 'flex';
        }
    }
    
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
                playerBadge.className = 'bg-blue-700 text-white font-bold py-1 px-3 rounded-full inline-block mx-2';
                // Gunakan format sederhana untuk teks badge (hanya nomor pemain)
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
    
    // KHUSUS DEBUGGING: Selalu izinkan melewati giliran, bahkan untuk kasus khusus
    console.log('Pemain melewati giliran - fungsi ini selalu tersedia');
    
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
        // Hanya tampilkan nomor pemain, bukan nama lengkap
        const displayName = currentPlayer.isAI ? `${gameState.currentPlayerIndex}` : `Anda`;
        passedBadge.textContent = displayName;
        badgeContainer.appendChild(passedBadge);
    }
    
    // Cek apakah semua pemain sudah pass
    if (passedPlayers.length === gameState.players.length - 1) {
        // ATURAN DASAR REMI: Jika semua pemain pass, giliran kembali ke pemain yang terakhir membuang kartu
        console.log('Semua pemain telah pass, kembali ke pemain yang membuang kartu terakhir');
        
        // Dapatkan pemain yang terakhir membuang kartu
        let lastPlayerIndex = 0; // default
        
        // Kasus khusus kartu 2: Kembali ke pemain yang memainkan kartu 2
        if (gameState.twoCardPlayed && gameState.playerWhoPlayed2 !== null) {
            lastPlayerIndex = gameState.playerWhoPlayed2;
            console.log(`Kasus kartu 2: Kembali ke pemain ${lastPlayerIndex} yang memainkan kartu 2`);
            // Tandai bahwa semua pemain sudah mendapat giliran setelah kartu 2
            gameState.allPlayersHaveHadTurn = true;
        }
        // Kasus khusus kartu AS: Kembali ke pemain yang memainkan kartu AS
        else if (gameState.aceCardPlayed && gameState.playerWhoPlayedAce !== null) {
            lastPlayerIndex = gameState.playerWhoPlayedAce;
            console.log(`Kasus kartu AS: Kembali ke pemain ${lastPlayerIndex} yang memainkan kartu AS`);
            // Tandai bahwa semua pemain sudah mendapat giliran setelah kartu AS
            gameState.allPlayersHaveHadTurn = true;
        }
        // Kasus umum: Kembali ke pemain yang terakhir membuang kartu apapun
        else if (gameState.lastPlayerWhoPlayed) {
            lastPlayerIndex = gameState.lastPlayerWhoPlayed.index;
            console.log(`Kasus umum: Kembali ke pemain ${lastPlayerIndex} yang terakhir membuang kartu`);
        }
        
        // Operasi lanjutan dengan timeout
        setTimeout(() => {
            // Set currentPlayerIndex ke pemain yang terakhir membuang kartu
            gameState.currentPlayerIndex = lastPlayerIndex;
            
            // Tandai bahwa pemain ini mendapat giliran setelah semua pass
            // Hal ini penting untuk menonaktifkan tombol pass
            gameState.playerAfterAllPass = lastPlayerIndex;
            console.log(`Pemain ${lastPlayerIndex} ditandai sebagai pemain setelah semua pass, TIDAK BOLEH PASS`);
            
            // Reset currentPlay agar pemain bisa memainkan kartu apa saja
            gameState.currentPlay = null;
            
            // Reset daftar pemain yang pass
            passedPlayers = [];
            
            // Update UI
            updateUI();
            
            // Jika pemain adalah AI, jalankan giliran AI
            if (gameState.players[gameState.currentPlayerIndex].isAI) {
                setTimeout(playAITurn, 1000);
            }
        }, 1000);
    } else {
        // Pindah ke pemain berikutnya seperti biasa
        setTimeout(() => {
            nextPlayer();
        }, 1000);
    }
}

// Fungsi untuk mengurutkan kartu secara cerdas
function sortHand() {
console.log('Mengurutkan kartu secara cerdas...');
if (gameState.currentPlayerIndex !== 0) return;
    if (gameState.currentPlayerIndex !== 0) return;
    
    const player = gameState.players[0];
    const hand = [...player.hand]; // Buat salinan tangan pemain
    
    // Deteksi semua kemungkinan kombinasi
    const combinations = detectAllCombinations(hand);
    
    if (combinations.length > 0) {
        console.log('Kombinasi terdeteksi:', combinations);
        // Kelompokkan kartu berdasarkan kombinasi yang terdeteksi
        player.hand = arrangeByCombinations(hand, combinations);
    } else {
        // Jika tidak ada kombinasi, lakukan pengurutan normal
        console.log('Tidak ada kombinasi terdeteksi, mengurutkan secara normal');
        player.sortHand();
    }
    
    renderPlayerHand(player);
    playSound('sort');
}

// Fungsi untuk mendeteksi semua kemungkinan kombinasi di tangan pemain
function detectAllCombinations(cards) {
    const combinations = [];
    
    // Deteksi quartet (bom)
    const quartets = detectQuartets(cards);
    quartets.forEach(q => combinations.push({
        type: CombinationTypes.QUARTET,
        cards: q
    }));
    
    // Deteksi triplet
    const triplets = detectTriplets(cards);
    triplets.forEach(t => combinations.push({
        type: CombinationTypes.TRIPLET,
        cards: t
    }));
    
    // Deteksi straight (minimal 3 kartu)
    const straights = detectStraights(cards, 3);
    straights.forEach(s => combinations.push({
        type: CombinationTypes.STRAIGHT,
        cards: s
    }));
    
    // Deteksi flush (minimal 3 kartu)
    const flushes = detectFlushes(cards, 3);
    flushes.forEach(f => combinations.push({
        type: CombinationTypes.FLUSH,
        cards: f
    }));
    
    // Deteksi pair (pasangan)
    const pairs = detectPairs(cards);
    pairs.forEach(p => combinations.push({
        type: 'pair', // Bukan CombinationTypes karena pairs tidak ada di enum
        cards: p
    }));
    
    return combinations;
}

// Deteksi kartu quartet (4 kartu dengan nilai sama)
function detectQuartets(cards) {
    const valueGroups = {};
    cards.forEach(card => {
        if (!valueGroups[card.value]) valueGroups[card.value] = [];
        valueGroups[card.value].push(card);
    });
    
    return Object.values(valueGroups)
        .filter(group => group.length === 4)
        .map(group => [...group]);
}

// Deteksi kartu triplet (3 kartu dengan nilai sama)
function detectTriplets(cards) {
    const valueGroups = {};
    cards.forEach(card => {
        if (!valueGroups[card.value]) valueGroups[card.value] = [];
        valueGroups[card.value].push(card);
    });
    
    return Object.values(valueGroups)
        .filter(group => group.length >= 3)
        .map(group => group.slice(0, 3)); // Ambil hanya 3 kartu
}

// Deteksi kartu pair (2 kartu dengan nilai sama)
function detectPairs(cards) {
    const valueGroups = {};
    cards.forEach(card => {
        if (!valueGroups[card.value]) valueGroups[card.value] = [];
        valueGroups[card.value].push(card);
    });
    
    return Object.values(valueGroups)
        .filter(group => group.length >= 2)
        .map(group => group.slice(0, 2)); // Ambil hanya 2 kartu
}

// Deteksi straight (kartu berurutan)
function detectStraights(cards, minLength = 3) {
    // Urutkan kartu berdasarkan nilai
    const valueOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const sortedCards = [...cards].sort((a, b) => 
        valueOrder.indexOf(a.value) - valueOrder.indexOf(b.value)
    );
    
    const straights = [];
    const uniqueValues = [...new Set(sortedCards.map(c => c.value))];
    
    // Cari semua kemungkinan straight
    for (let i = 0; i <= uniqueValues.length - minLength; i++) {
        let straight = [];
        let isValid = true;
        
        for (let j = 0; j < minLength; j++) {
            const targetValue = uniqueValues[i + j];
            const targetIndex = valueOrder.indexOf(targetValue);
            
            // Cek apakah kartu berurutan
            if (j > 0 && targetIndex !== valueOrder.indexOf(uniqueValues[i + j - 1]) + 1) {
                isValid = false;
                break;
            }
            
            // Ambil satu kartu untuk setiap nilai
            const card = sortedCards.find(c => c.value === targetValue && !straight.includes(c));
            if (card) straight.push(card);
        }
        
        if (isValid && straight.length >= minLength) {
            straights.push(straight);
        }
    }
    
    return straights;
}

// Deteksi flush (kartu dengan jenis sama)
function detectFlushes(cards, minLength = 3) {
    const suitGroups = {};
    cards.forEach(card => {
        if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
        suitGroups[card.suit].push(card);
    });
    
    return Object.values(suitGroups)
        .filter(group => group.length >= minLength)
        .map(group => group.slice(0, Math.min(5, group.length))); // Maksimal 5 kartu
}

// Susun kartu berdasarkan kombinasi yang terdeteksi
function arrangeByCombinations(allCards, combinations) {
    const usedCards = new Set();
    const result = [];
    
    // Prioritaskan kombinasi berdasarkan kekuatan
    const priorityOrder = [
        CombinationTypes.QUARTET,         // Quartet (bom)
        CombinationTypes.STRAIGHT_FLUSH,  // Straight flush
        CombinationTypes.FULL_HOUSE,      // Full house
        CombinationTypes.FLUSH,           // Flush
        CombinationTypes.STRAIGHT,        // Straight
        CombinationTypes.TRIPLET,         // Triplet
        'pair'                            // Pair
    ];
    
    // Urutkan kombinasi berdasarkan prioritas
    combinations.sort((a, b) => {
        return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
    });
    
    // Tambahkan kartu dari kombinasi yang terdeteksi
    combinations.forEach(combo => {
        // Skip kartu yang sudah digunakan
        const unusedCards = combo.cards.filter(card => {
            const cardKey = `${card.value}-${card.suit}`;
            return !usedCards.has(cardKey);
        });
        
        if (unusedCards.length > 0) {
            // Tambahkan kartu yang belum digunakan
            unusedCards.forEach(card => {
                result.push(card);
                const cardKey = `${card.value}-${card.suit}`;
                usedCards.add(cardKey);
            });
        }
    });
    
    // Tambahkan kartu yang tersisa (tidak masuk kombinasi)
    const remainingCards = allCards.filter(card => {
        const cardKey = `${card.value}-${card.suit}`;
        return !usedCards.has(cardKey);
    });
    
    // Urutkan sisa kartu
    const valueOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    remainingCards.sort((a, b) => {
        const aVal = valueOrder.indexOf(a.value);
        const bVal = valueOrder.indexOf(b.value);
        if (aVal !== bVal) return aVal - bVal;
        
        // Jika nilai sama, urutkan berdasarkan jenis
        const suitOrder = ['♦', '♣', '♥', '♠'];
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    });
    
    // Gabungkan hasil
    return [...result, ...remainingCards];
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
        // Ganti event listener dengan versi yang always-active
        passButton.addEventListener('click', function() {
            // Tambahan pengecekkan untuk memastikan tombol lewat selalu berfungsi
            console.log('Tombol lewat diklik - fungsi ini selalu tersedia');
            // Panggil fungsi passTurn yang asli
            passTurn();
        });
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
