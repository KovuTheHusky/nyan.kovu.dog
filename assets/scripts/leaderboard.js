const formatTime = (num) =>
  parseFloat(num).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const formatCount = (num) => parseInt(num).toLocaleString("en-US");

const API_URL = "https://api.kovu.dog/nyan.php?dump";
const leaderboardContent = document.getElementById("leaderboard-content");
const starContainer = document.getElementById("star-container");

const sortBestBtn = document.getElementById("sort-best");
const sortTotalBtn = document.getElementById("sort-total");
const sortWigglesBtn = document.getElementById("sort-wiggles");
const sortSpinsBtn = document.getElementById("sort-spins");

let allUsers = [];
let currentSort = "total_time"; // Defaults to total time

// 1. Generate the Starfield
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

// 2. Render the Leaderboard
function renderLeaderboard() {
  // NEW: Save the user's exact scroll position before we wipe the table
  const wrapper = document.getElementById("leaderboard-wrapper");
  const previousScroll = wrapper.scrollTop;

  leaderboardContent.innerHTML = "";

  if (allUsers.length === 0) {
    leaderboardContent.innerHTML =
      "<div style='text-align: center; padding: 40px;'>No scores yet!</div>";
    return;
  }

  // Sort the array based on the active criteria
  allUsers.sort((a, b) => b[currentSort] - a[currentSort]);

  // Update UI headers
  sortBestBtn.classList.remove("active-sort");
  sortTotalBtn.classList.remove("active-sort");
  sortWigglesBtn.classList.remove("active-sort");
  sortSpinsBtn.classList.remove("active-sort");

  if (currentSort === "best_time") sortBestBtn.classList.add("active-sort");
  else if (currentSort === "wiggles")
    sortWigglesBtn.classList.add("active-sort");
  else if (currentSort === "spins") sortSpinsBtn.classList.add("active-sort");
  else sortTotalBtn.classList.add("active-sort");

  // Build the rows
  allUsers.forEach((user, index) => {
    const safeUsername = user.username
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    let rankStr = `${index + 1}`;
    if (index === 0) rankStr = "🥇";
    if (index === 1) rankStr = "🥈";
    if (index === 2) rankStr = "🥉";

    const row = document.createElement("div");
    row.className = "lb-row";

    row.innerHTML = `
      <div class="lb-rank">${rankStr}</div>
      <div class="lb-name" title="${safeUsername}">${safeUsername}</div>
      <div class="lb-total">${formatTime(user.total_time)}</div>
      <div class="lb-best">${formatTime(user.best_time)}</div>
      <div class="lb-wiggles">${formatCount(user.wiggles || 0)}</div>
      <div class="lb-spins">${formatCount(user.spins || 0)}</div>
    `;

    leaderboardContent.appendChild(row);
  });

  wrapper.scrollTop = previousScroll;
}

// 3. Fetch Data from API
async function fetchLeaderboard() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    allUsers = data.users || [];
    renderLeaderboard();
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
    leaderboardContent.innerHTML =
      "<div style='text-align: center; padding: 40px; color: #ff5555;'>Error loading leaderboard.</div>";
  }
}

// 4. Event Listeners for Sorting
sortBestBtn.addEventListener("click", () => {
  if (currentSort !== "best_time") {
    currentSort = "best_time";
    renderLeaderboard();
  }
});

sortTotalBtn.addEventListener("click", () => {
  if (currentSort !== "total_time") {
    currentSort = "total_time";
    renderLeaderboard();
  }
});

sortWigglesBtn.addEventListener("click", () => {
  if (currentSort !== "wiggles") {
    currentSort = "wiggles";
    renderLeaderboard();
  }
});

sortSpinsBtn.addEventListener("click", () => {
  if (currentSort !== "spins") {
    currentSort = "spins";
    renderLeaderboard();
  }
});

// Kick off the initial fetch immediately
fetchLeaderboard();

// NEW: Silently fetch and redraw the leaderboard every 10 seconds
setInterval(fetchLeaderboard, 10000);
