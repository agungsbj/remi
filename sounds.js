// Variabel global untuk suara
let sounds = null;
let audioInitialized = false;

// Fungsi untuk inisialisasi suara
function initSounds() {
    if (audioInitialized) return;
    
    // Tunggu sampai ada interaksi pengguna
    document.addEventListener('click', function initOnInteraction() {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
        }
        
        // Gunakan URL eksternal untuk menghindari CORS
        sounds = {
            cardPlay: new Howl({
                src: ['https://assets.mixkit.co/active_storage/sfx/1129/1129-preview.mp3'],
                volume: 0.5
            }),
            win: new Howl({
                src: ['https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3'],
                volume: 0.7
            }),
            lose: new Howl({
                src: ['https://assets.mixkit.co/active_storage/sfx/2027/2027-preview.mp3'],
                volume: 0.5,
                preload: true
            }),
            shuffle: new Howl({
                src: ['https://assets.mixkit.co/active_storage/sfx/2222/2222-preview.mp3'],
                volume: 0.5,
                preload: true
            }),
            error: new Howl({
                src: ['https://assets.mixkit.co/active_storage/sfx/2182/2182-preview.mp3'],
                volume: 0.6,
                preload: true
            })
        };
        
        audioInitialized = true;
        document.removeEventListener('click', initOnInteraction);
    }, { once: true });
}

// Fungsi untuk memainkan suara
function playSound(soundName) {
    if (!sounds || !sounds[soundName]) return;
    // Coba mainkan suara, jika gagal karena autoplay policy,
    // resume AudioContext terlebih dahulu
    try {
        sounds[soundName].play();
    } catch (e) {
        Howler.ctx.resume().then(() => {
            sounds[soundName].play();
        });
    }
}
