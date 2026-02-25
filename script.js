const liveVideo = document.getElementById('liveVideo');
const uploadCanvas = document.getElementById('uploadCanvas');
const adCanvas = document.getElementById('adCanvas');
const sourceLabel = document.getElementById('sourceLabel');
const startCameraBtn = document.getElementById('startCameraBtn');
const selfieUpload = document.getElementById('selfieUpload');
const captureBtn = document.getElementById('captureBtn');
const downloadBtn = document.getElementById('downloadBtn');
const promptForm = document.getElementById('promptForm');
const adPrompt = document.getElementById('adPrompt');

const uploadCtx = uploadCanvas.getContext('2d');
const adCtx = adCanvas.getContext('2d');

let mediaStream = null;
let sourceMode = 'none';

function setCanvasSizes(width = 1280, height = 720) {
  uploadCanvas.width = width;
  uploadCanvas.height = height;
  adCanvas.width = width;
  adCanvas.height = height;
}

setCanvasSizes();

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Camera access is not supported in this browser.');
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    });

    liveVideo.srcObject = mediaStream;
    sourceMode = 'camera';
    sourceLabel.textContent = 'Source: live camera';

    liveVideo.onloadedmetadata = () => {
      const width = liveVideo.videoWidth || 1280;
      const height = liveVideo.videoHeight || 720;
      setCanvasSizes(width, height);
    };
  } catch (error) {
    alert(`Could not start camera: ${error.message}`);
  }
}

function drawImageCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function loadUploadedSelfie(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      setCanvasSizes(img.width, img.height);
      uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
      drawImageCover(uploadCtx, img, uploadCanvas.width, uploadCanvas.height);
      sourceMode = 'upload';
      sourceLabel.textContent = 'Source: uploaded selfie';
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function captureFrame() {
  if (sourceMode === 'camera') {
    if (!liveVideo.videoWidth || !liveVideo.videoHeight) {
      alert('Camera stream is not ready yet.');
      return;
    }
    setCanvasSizes(liveVideo.videoWidth, liveVideo.videoHeight);
    uploadCtx.drawImage(liveVideo, 0, 0, uploadCanvas.width, uploadCanvas.height);
  }

  if (sourceMode === 'none') {
    alert('Please start camera or upload a selfie first.');
    return;
  }

  sourceLabel.textContent = sourceMode === 'camera'
    ? 'Source: live camera frame captured'
    : 'Source: uploaded selfie captured';
}

function renderAdPhoto(promptText) {
  if (sourceMode === 'none') {
    alert('Please provide a selfie source first.');
    return;
  }

  adCtx.clearRect(0, 0, adCanvas.width, adCanvas.height);
  adCtx.drawImage(uploadCanvas, 0, 0, adCanvas.width, adCanvas.height);

  const gradient = adCtx.createLinearGradient(0, adCanvas.height * 0.35, 0, adCanvas.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.80)');
  adCtx.fillStyle = gradient;
  adCtx.fillRect(0, 0, adCanvas.width, adCanvas.height);

  adCtx.fillStyle = '#ffffff';
  adCtx.textBaseline = 'bottom';
  adCtx.font = `bold ${Math.max(26, Math.floor(adCanvas.width * 0.04))}px sans-serif`;
  adCtx.fillText('LIVE AD', 28, adCanvas.height - 94);

  adCtx.fillStyle = '#ffd447';
  adCtx.font = `${Math.max(24, Math.floor(adCanvas.width * 0.032))}px sans-serif`;
  const maxWidth = adCanvas.width - 56;
  adCtx.fillText(promptText, 28, adCanvas.height - 40, maxWidth);

  downloadBtn.disabled = false;
}

function downloadAdPhoto() {
  const link = document.createElement('a');
  link.download = 'advertising-photo.png';
  link.href = adCanvas.toDataURL('image/png');
  link.click();
}

startCameraBtn.addEventListener('click', startCamera);

selfieUpload.addEventListener('change', (event) => {
  const [file] = event.target.files || [];
  if (file) {
    loadUploadedSelfie(file);
  }
});

captureBtn.addEventListener('click', captureFrame);

downloadBtn.addEventListener('click', downloadAdPhoto);

promptForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderAdPhoto(adPrompt.value.trim());
});
