const sticker = document.getElementById("sticker");
const stickerBobWrapper = document.getElementById("sticker-bob-wrapper");
const rainbowTrail = document.getElementById("rainbow-trail");
const bgMusic = document.getElementById("bg-music");
const starContainer = document.getElementById("star-container");
const counterContainer = document.getElementById("counter-container");
const counterEl = document.getElementById("counter");

let isMemeActive = false;
let nyanStartTime = 0;

function updateCounter() {
  const elapsed = (performance.now() - nyanStartTime) / 1000;
  counterEl.innerText = elapsed.toFixed(1);
  requestAnimationFrame(updateCounter);
}

const starCount = 40;
for (let i = 0; i < starCount; i++) {
  const star = document.createElement("div");
  star.className = "star";

  const layer = Math.floor(Math.random() * 3);

  let scale, duration;
  if (layer === 0) {
    scale = 0.5;
    duration = 5;
  } else if (layer === 1) {
    scale = 1;
    duration = 3.5;
  } else {
    scale = 1.5;
    duration = 2;
  }

  star.style.transform = `scale(${scale})`;
  star.style.top = `${Math.random() * 100}vh`;
  star.style.animationDuration = `${duration}s, 0.8s`;

  const delay = -(Math.random() * 5);
  star.style.animationDelay = `${delay}s, ${delay}s`;

  starContainer.appendChild(star);
}

const sliceCount = 60;
const taperCount = 5;

for (let i = 0; i < sliceCount; i++) {
  const slice = document.createElement("div");
  slice.className = "rainbow-slice";

  slice.style.animationDelay = `-${(sliceCount - i) * 0.05}s`;

  if (i < taperCount) {
    const heightPercentage = Math.max(5, (i / taperCount) * 100);
    slice.style.height = `${heightPercentage}%`;
  } else {
    slice.style.height = "100%";
  }

  rainbowTrail.appendChild(slice);
}

sticker.addEventListener("click", () => {
  if (!isMemeActive) {
    bgMusic.volume = 0.5;
    bgMusic.play().catch((error) => {
      console.log("Audio playback was blocked:", error);
    });

    rainbowTrail.classList.add("active");
    starContainer.classList.add("active");

    stickerBobWrapper.classList.add("playing");
    sticker.classList.add("playing");

    counterContainer.style.display = "block";

    nyanStartTime = performance.now();
    requestAnimationFrame(updateCounter);

    isMemeActive = true;
  } else {
    if (
      sticker.classList.contains("extra-seesaw") ||
      sticker.classList.contains("spin") ||
      sticker.classList.contains("spin-ccw")
    ) {
      return;
    }

    const isRareSpin = Math.random() < 0.25;
    let animationClass = "extra-seesaw";

    if (isRareSpin) {
      animationClass = Math.random() < 0.5 ? "spin" : "spin-ccw";
    }

    sticker.classList.add(animationClass);

    sticker.addEventListener("animationend", function handler() {
      sticker.classList.remove(animationClass);
      sticker.removeEventListener("animationend", handler);
    });
  }
});
