// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────
// Same Firebase project as the to-do app — Firebase handles authentication.
const firebaseConfig = {
  apiKey: "AIzaSyAFKHwUALHoy3tSsdJKHq7Rn8PpxpYtu6w",
  authDomain: "todo-app-487519.firebaseapp.com",
  projectId: "todo-app-487519",
  storageBucket: "todo-app-487519.firebasestorage.app",
  messagingSenderId: "111792919136",
  appId: "1:111792919136:web:25aea116a101e965cf6905",
};
firebase.initializeApp(firebaseConfig);
const firebaseAuth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Same Supabase project as the to-do app. Used as the database only.
const SUPABASE_URL = "https://bkssvocrrtsrvixsdips.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jTvQT_2bWNqjExhXJsgzwQ_6pZpbQZy";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── UI ELEMENTS ───────────────────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appDiv = document.getElementById("app");
const logoutButton = document.getElementById("logout-button");

const lcdDisplay = document.getElementById("lcd-display");
const lcdStatus = document.getElementById("lcd-status");

const startButton = document.getElementById("start-button");
const customStartButton = document.getElementById("custom-start-button");
const stopButton = document.getElementById("stop-button");

const customStartPanel = document.getElementById("custom-start-panel");
const customStartInput = document.getElementById("custom-start-input");
const customStartConfirm = document.getElementById("custom-start-confirm");
const customStartCancel = document.getElementById("custom-start-cancel");

const historyList = document.getElementById("history-list");

let currentUser = null;
let activeFast = null; // { id, start_time, ... } or null
let tickInterval = null;

// ── AUTH ──────────────────────────────────────────────────────────────────────
firebaseAuth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = { id: user.uid, email: user.email };
    showApp();
    await loadActiveFast();
    await loadHistory();
  } else {
    currentUser = null;
    stopTicking();
    showLogin();
  }
});

document
  .getElementById("google-login-button")
  .addEventListener("click", async () => {
    try {
      await firebaseAuth.signInWithPopup(googleProvider);
    } catch (e) {
      console.error("Google login error:", e);
    }
  });

logoutButton.addEventListener("click", async () => {
  await firebaseAuth.signOut();
});

function showApp() {
  loginScreen.classList.add("hidden");
  appDiv.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
}

function showLogin() {
  appDiv.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  logoutButton.classList.add("hidden");
}

// ── LOAD ACTIVE FAST ──────────────────────────────────────────────────────────
async function loadActiveFast() {
  const { data, error } = await supabaseClient
    .from("fasts")
    .select("*")
    .eq("firebase_uid", currentUser.id)
    .eq("status", "active")
    .order("start_time", { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  if (data && data.length > 0) {
    activeFast = data[0];
    enterActiveState();
  } else {
    activeFast = null;
    enterIdleState();
  }
}

// ── START ─────────────────────────────────────────────────────────────────────
startButton.addEventListener("click", async () => {
  await beginFast(new Date().toISOString());
});

async function beginFast(startTimeIso) {
  const { data, error } = await supabaseClient
    .from("fasts")
    .insert({
      firebase_uid: currentUser.id,
      start_time: startTimeIso,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  activeFast = data;
  enterActiveState();
}

// ── CUSTOM START ──────────────────────────────────────────────────────────────
customStartButton.addEventListener("click", () => {
  const now = new Date();
  now.setSeconds(0, 0);
  customStartInput.value = toLocalDatetimeInputValue(now);
  customStartPanel.classList.remove("hidden");
});

customStartCancel.addEventListener("click", () => {
  customStartPanel.classList.add("hidden");
});

customStartConfirm.addEventListener("click", async () => {
  const value = customStartInput.value;
  if (!value) return;

  const chosenDate = new Date(value);
  if (isNaN(chosenDate.getTime()) || chosenDate.getTime() > Date.now()) {
    alert("Please enter a valid start time that isn't in the future.");
    return;
  }

  customStartPanel.classList.add("hidden");
  await beginFast(chosenDate.toISOString());
});

function toLocalDatetimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

// ── STOP ──────────────────────────────────────────────────────────────────────
stopButton.addEventListener("click", async () => {
  if (!activeFast) return;

  const endTime = new Date();
  const startTime = new Date(activeFast.start_time);
  const durationSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  );

  const { error } = await supabaseClient
    .from("fasts")
    .update({
      end_time: endTime.toISOString(),
      duration_seconds: durationSeconds,
      status: "completed",
    })
    .eq("id", activeFast.id);

  if (error) {
    console.error(error);
    return;
  }

  activeFast = null;
  enterIdleState();
  await loadHistory();
});

// ── TIMER TICK ────────────────────────────────────────────────────────────────
function enterActiveState() {
  startButton.disabled = true;
  customStartButton.disabled = true;
  stopButton.disabled = false;
  lcdStatus.textContent = "FASTING";
  lcdStatus.classList.add("active");
  startTicking();
}

function enterIdleState() {
  startButton.disabled = false;
  customStartButton.disabled = false;
  stopButton.disabled = true;
  lcdStatus.textContent = "NOT FASTING";
  lcdStatus.classList.remove("active");
  stopTicking();
  lcdDisplay.textContent = "00:00:00:00";
}

function startTicking() {
  stopTicking();
  tick();
  tickInterval = setInterval(tick, 1000);
}

function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function tick() {
  if (!activeFast) return;
  const start = new Date(activeFast.start_time).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((now - start) / 1000));
  lcdDisplay.textContent = formatElapsed(elapsedSeconds);
}

function formatElapsed(totalSeconds) {
  const pad = (n) => String(n).padStart(2, "0");
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
async function loadHistory() {
  const { data, error } = await supabaseClient
    .from("fasts")
    .select("*")
    .eq("firebase_uid", currentUser.id)
    .eq("status", "completed")
    .order("start_time", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return;
  }

  renderHistory(data || []);
}

function renderHistory(fasts) {
  historyList.innerHTML = "";

  if (fasts.length === 0) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = "No completed fasts yet.";
    historyList.appendChild(li);
    return;
  }

  fasts.forEach((fast) => {
    const li = document.createElement("li");

    const durationSpan = document.createElement("span");
    durationSpan.className = "history-duration";
    durationSpan.textContent = formatDurationReadable(fast.duration_seconds);

    const rangeSpan = document.createElement("span");
    rangeSpan.className = "history-range";
    rangeSpan.textContent = `${formatDateTime(fast.start_time)} → ${formatDateTime(
      fast.end_time
    )}`;

    li.appendChild(durationSpan);
    li.appendChild(rangeSpan);
    historyList.appendChild(li);
  });
}

function formatDurationReadable(totalSeconds) {
  if (totalSeconds == null) return "—";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
