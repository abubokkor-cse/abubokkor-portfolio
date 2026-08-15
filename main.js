const TOTAL_FRAMES = 199;
const FRAME_PATH = (index) =>
  `/Video_images/ezgif-frame-${String(index).padStart(3, '0')}.jpg`;

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const images = new Array(TOTAL_FRAMES);
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;

function getViewportDimensions() {
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || (window.innerHeight - 70);
  return { width, height };
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = getViewportDimensions();

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  lastRenderedFrame = -1;
  render();
}

function getBestFrame(index) {
  const safeIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, index));
  if (images[safeIdx] && images[safeIdx].complete && images[safeIdx].naturalWidth > 0) {
    return images[safeIdx];
  }

  // Find nearest loaded frame for zero flicker
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = safeIdx - offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = safeIdx + offset;
    if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }

  return null;
}

function render() {
  const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));
  const img = getBestFrame(frameIndex);

  if (!img) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // Clear background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);

  // Cover scaling with centered framing
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
  lastRenderedFrame = frameIndex;
}

function update() {
  const diff = targetFrame - currentFrame;

  if (Math.abs(diff) > 0.0005) {
    // Smooth lerp easing
    currentFrame += diff * 0.12;
    render();
  }

  requestAnimationFrame(update);
}

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const scrollFraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
  setTimeout(resizeCanvas, 100);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
}
window.addEventListener('scroll', onScroll, { passive: true });

// Initial setup
resizeCanvas();
onScroll();
currentFrame = targetFrame;

requestAnimationFrame(update);

// Preload high-res frames in background
for (let i = 1; i <= TOTAL_FRAMES; i++) {
  const idx = i - 1;
  const img = new Image();
  img.src = FRAME_PATH(i);
  img.onload = () => {
    images[idx] = img;
    if (idx === 0 || idx === Math.round(currentFrame)) {
      render();
    }
  };
}
