import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const COLLECTION = "symptoms";
const LOCAL_KEY = "symptom-tracker-local";
const TIMEOUT_MS = 6000;

const form = document.getElementById("symptomForm");
const input = document.getElementById("symptomInput");
const saveBtn = document.getElementById("saveBtn");
const list = document.getElementById("symptomList");
const emptyState = document.getElementById("emptyState");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");

// Entries saved in Firestore, and entries saved only in this browser
// (used when Firestore cannot be reached, so Save always works).
let cloudItems = [];
let localItems = readLocal();

/* ---------- Helpers ---------- */

// Firestore can wait forever when the database does not exist or is offline.
// This turns that silent hang into an error we can show.
function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(
        "Firestore did not respond. Check that the database is created and your rules allow access."
      ));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localItems));
  } catch (error) {
    console.error("Could not write to local storage:", error);
  }
}

function setStatus(message, tone = "") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/* ---------- Rendering ---------- */

function render() {
  const items = [...cloudItems, ...localItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  list.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.className = "symptom-text";
    text.textContent = item.text;

    const meta = document.createElement("span");
    meta.className = "symptom-meta";
    meta.textContent = formatDate(item.createdAt);

    if (item.source === "local") {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "This device only";
      meta.appendChild(badge);
    }

    text.appendChild(meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete " + item.text);
    deleteBtn.addEventListener("click", () => deleteSymptom(item));

    li.append(text, deleteBtn);
    list.appendChild(li);
  });

  emptyState.hidden = items.length > 0;
  countEl.textContent = items.length ? "(" + items.length + ")" : "";
}

/* ---------- Loading ---------- */

async function loadFromCloud() {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, COLLECTION)));

    cloudItems = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        text: String(data.symptom ?? ""),
        createdAt: String(data.createdAt ?? ""),
        source: "cloud"
      };
    });

    return true;
  } catch (error) {
    console.error("Error loading symptoms:", error);
    setStatus(
      "Could not load saved symptoms from the cloud. " + error.message,
      "warn"
    );
    return false;
  }
}

/* ---------- Saving and deleting ---------- */

async function saveSymptom(text) {
  const createdAt = new Date().toISOString();

  saveBtn.disabled = true;
  setStatus("Saving...");

  try {
    const ref = await withTimeout(
      addDoc(collection(db, COLLECTION), { symptom: text, createdAt })
    );

    cloudItems.push({ id: ref.id, text, createdAt, source: "cloud" });
    setStatus("Saved.", "ok");
  } catch (error) {
    console.error("Error saving symptom:", error);

    // Keep the entry anyway so nothing the user typed is lost.
    localItems.push({
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      text,
      createdAt,
      source: "local"
    });
    writeLocal();

    setStatus(
      "Saved on this device only. The cloud save failed: " + error.message,
      "warn"
    );
  } finally {
    saveBtn.disabled = false;
  }

  input.value = "";
  input.focus();
  render();
}

async function deleteSymptom(item) {
  if (item.source === "local") {
    localItems = localItems.filter((i) => i.id !== item.id);
    writeLocal();
    render();
    setStatus("Deleted.", "ok");
    return;
  }

  try {
    await withTimeout(deleteDoc(doc(db, COLLECTION, item.id)));
    cloudItems = cloudItems.filter((i) => i.id !== item.id);
    render();
    setStatus("Deleted.", "ok");
  } catch (error) {
    console.error("Error deleting symptom:", error);
    setStatus("Could not delete that symptom. " + error.message, "warn");
  }
}

/* ---------- Events ---------- */

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    setStatus("Enter a symptom first.", "warn");
    input.focus();
    return;
  }

  saveSymptom(text);
});

/* ---------- Start ---------- */

render();
setStatus("Loading your symptoms...");

loadFromCloud().then((ok) => {
  render();
  if (ok) setStatus("");
});