const formatTime = (num) =>
  parseFloat(num).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const formatCount = (num) => parseInt(num).toLocaleString("en-US");

const sticker = document.getElementById("sticker");
const stickerBobWrapper = document.getElementById("sticker-bob-wrapper");
const rainbowTrail = document.getElementById("rainbow-trail");
const bgMusic = document.getElementById("bg-music");
const starContainer = document.getElementById("star-container");
const counterContainer = document.getElementById("counter-container");
const startContainer = document.getElementById("start-container");
const counterEl = document.getElementById("counter");

const usernameInput = document.getElementById("username-input");
const userHighScoreEl = document.getElementById("user-high-score-display");
const userTotalScoreEl = document.getElementById("user-total-score-display");
const globalHighScoreEl = document.getElementById("global-high-score-display");
const globalTotalScoreEl = document.getElementById(
  "global-total-score-display",
);
const userWigglesEl = document.getElementById("user-wiggles-display");
const userSpinsEl = document.getElementById("user-spins-display");
const globalWigglesEl = document.getElementById("global-wiggles-display");
const globalSpinsEl = document.getElementById("global-spins-display");

const volumeWrapper = document.getElementById("volume-wrapper");
const volumeSlider = document.getElementById("volume-slider");

// Load saved volume or default to 50%
let currentVolume = parseFloat(localStorage.getItem("nyanVolume"));
if (isNaN(currentVolume)) currentVolume = 0.5;

if (volumeSlider && volumeWrapper) {
  volumeSlider.value = currentVolume;
  // Paint the initial background fill
  volumeWrapper.style.setProperty("--vol-fill", `${currentVolume * 100}%`);

  volumeSlider.addEventListener("input", (e) => {
    currentVolume = parseFloat(e.target.value);

    // Update the audio
    if (bgMusic) bgMusic.volume = currentVolume;

    // Update the visual gauge fill
    volumeWrapper.style.setProperty("--vol-fill", `${currentVolume * 100}%`);

    // Save preference
    localStorage.setItem("nyanVolume", currentVolume.toString());
  });
}

let wiggles = parseInt(localStorage.getItem("nyanWiggles")) || 0;
let spins = parseInt(localStorage.getItem("nyanSpins")) || 0;
let lastSyncedWiggles = wiggles;
let lastSyncedSpins = spins;

if (userWigglesEl) userWigglesEl.innerText = wiggles;
if (userSpinsEl) userSpinsEl.innerText = spins;

const API_URL = "https://api.kovu.dog/nyan.php";

let isMemeActive = false;
let nyanStartTime = 0;
let lastSaveTime = 0;
let lastApiSyncElapsed = 0;
let lastApiSyncTime = 0;

let menuSyncInterval = null;

let username = localStorage.getItem("nyanUsername") || "";
if (usernameInput) usernameInput.value = username;

let highScore = parseFloat(localStorage.getItem("nyanHighScore")) || 0;
let baseTotalScore = parseFloat(localStorage.getItem("nyanTotalScore")) || 0;
let lastSyncedTotalScore = baseTotalScore;

if (userHighScoreEl) userHighScoreEl.innerText = formatTime(highScore);
if (userTotalScoreEl) userTotalScoreEl.innerText = formatTime(baseTotalScore);

fetchGlobalStats();

if (usernameInput) {
  usernameInput.addEventListener("input", (e) => {
    username = e.target.value.trim();
    localStorage.setItem("nyanUsername", username);
    fetchGlobalStats();
  });
}

async function fetchGlobalStats() {
  try {
    const url = username
      ? `${API_URL}?username=${encodeURIComponent(username)}`
      : API_URL;
    const response = await fetch(url);
    if (!response.ok) return;
    const data = await response.json();

    if (globalHighScoreEl && data.global_best !== undefined) {
      globalHighScoreEl.innerText = formatTime(data.global_best);
    }
    if (globalTotalScoreEl && data.global_total !== undefined) {
      globalTotalScoreEl.innerText = formatTime(data.global_total);
    }

    if (globalWigglesEl && data.global_wiggles !== undefined)
      globalWigglesEl.innerText = formatCount(data.global_wiggles);
    if (globalSpinsEl && data.global_spins !== undefined)
      globalSpinsEl.innerText = formatCount(data.global_spins);

    if (username !== "") {
      highScore = Math.max(highScore, data.user_best || 0);

      if (!isMemeActive) {
        baseTotalScore = Math.max(baseTotalScore, data.user_total || 0);
        wiggles = Math.max(wiggles, data.user_wiggles || 0);
        spins = Math.max(spins, data.user_spins || 0);

        lastSyncedTotalScore = baseTotalScore;
        lastSyncedWiggles = wiggles;
        lastSyncedSpins = spins;

        if (userTotalScoreEl)
          userTotalScoreEl.innerText = formatTime(baseTotalScore);
        if (userWigglesEl) userWigglesEl.innerText = formatCount(wiggles);
        if (userSpinsEl) userSpinsEl.innerText = formatCount(spins);
      }
      if (userHighScoreEl) userHighScoreEl.innerText = formatTime(highScore);
    }
  } catch (error) {
    console.error("Failed to fetch stats:", error);
  }
}

async function updateGlobalStats(currentHighScore, addedTime) {
  const addedWiggles = wiggles - lastSyncedWiggles;
  const addedSpins = spins - lastSyncedSpins;

  if (addedTime <= 0 && addedWiggles <= 0 && addedSpins <= 0) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        best: currentHighScore,
        addedTime: addedTime,
        addedWiggles: addedWiggles,
        addedSpins: addedSpins,
      }),
    });

    // Lock in the synced interaction state
    lastSyncedWiggles += addedWiggles;
    lastSyncedSpins += addedSpins;
  } catch (error) {
    console.error("Failed to update stats:", error);
  }
}

function updateCounter() {
  const now = performance.now();
  const elapsed = (now - nyanStartTime) / 1000;

  counterEl.innerText = formatTime(elapsed);

  if (elapsed > highScore) {
    highScore = elapsed;
    if (userHighScoreEl) userHighScoreEl.innerText = formatTime(highScore);
  }

  const currentTotal = baseTotalScore + elapsed;
  if (userTotalScoreEl) userTotalScoreEl.innerText = formatTime(currentTotal);

  // 1. Local Storage Sync (Every 1 second)
  if (now - lastSaveTime > 1000) {
    localStorage.setItem("nyanHighScore", highScore.toString());
    localStorage.setItem("nyanTotalScore", currentTotal.toString());
    lastSaveTime = now;

    // 2. Global Server Sync (Every 10 seconds)
    if (now - lastApiSyncTime > 10000) {
      const addedSinceLastSync = elapsed - lastApiSyncElapsed;
      updateGlobalStats(highScore, addedSinceLastSync);

      lastApiSyncElapsed = elapsed;
      lastApiSyncTime = now;
    }
  }

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
    bgMusic.volume = currentVolume;
    bgMusic.play().catch((error) => {
      console.log("Audio playback was blocked:", error);
    });

    rainbowTrail.classList.add("active");
    starContainer.classList.add("active");

    stickerBobWrapper.classList.add("playing");
    sticker.classList.add("playing");

    startContainer.style.display = "none";
    counterContainer.style.display = "block";

    nyanStartTime = performance.now();
    lastSaveTime = performance.now();
    lastApiSyncElapsed = 0;
    lastApiSyncTime = performance.now();
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

      // Increase spins and save
      spins++;
      if (userSpinsEl) userSpinsEl.innerText = spins;
      localStorage.setItem("nyanSpins", spins.toString());
    } else {
      animationClass = "extra-seesaw";

      // Increase wiggles and save
      wiggles++;
      if (userWigglesEl) userWigglesEl.innerText = wiggles;
      localStorage.setItem("nyanWiggles", wiggles.toString());
    }

    sticker.classList.add(animationClass);

    sticker.addEventListener("animationend", function handler() {
      sticker.classList.remove(animationClass);
      sticker.removeEventListener("animationend", handler);
    });
  }
});

function toggleMenu() {
  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");
  const isOpen = menu.classList.contains("open");

  if (isOpen) {
    menu.classList.remove("open");
    overlay.classList.remove("visible");

    if (menuSyncInterval) {
      clearInterval(menuSyncInterval);
      menuSyncInterval = null;
    }
  } else {
    if (isMemeActive) {
      const elapsed = (performance.now() - nyanStartTime) / 1000;
      const addedSinceLastSync = Math.max(0, elapsed - lastApiSyncElapsed);

      updateGlobalStats(highScore, addedSinceLastSync);

      lastApiSyncElapsed = elapsed;
      lastApiSyncTime = performance.now();
    }
    fetchGlobalStats();

    menu.classList.add("open");
    overlay.classList.add("visible");

    menuSyncInterval = setInterval(fetchGlobalStats, 5000);
  }
}
