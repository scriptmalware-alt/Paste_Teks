const textList = document.getElementById("textList");
const totalText = document.getElementById("totalText");
const toast = document.getElementById("toast");
const addForm = document.getElementById("addForm");
const newTextInput = document.getElementById("newTextInput");
const copyTimerBar = document.getElementById("copyTimerBar");
const copyTimerValue = document.getElementById("copyTimerValue");

const COPY_COOLDOWN_SECONDS = 15;

let baseTexts = [];
let sessionTexts = [];
let allTexts = [];
let removedBaseIndexes = new Set();
let copyCooldownRemaining = 0;
let copyCooldownInterval = null;

async function init() {
    baseTexts = await loadTexts();
    refreshTexts();
}

async function loadTexts() {
    try {
        const response = await fetch("texts.json");

        if (!response.ok) {
            throw new Error("Gagal memuat texts.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Format texts.json tidak valid");
        }

        return data.filter(Boolean);
    } catch (error) {
        showToast("Buka lewat Live Server agar texts.json terbaca");
        return [];
    }
}

function getAllTextItems() {
    const items = [];

    baseTexts.forEach((text, index) => {
        if (!removedBaseIndexes.has(index)) {
            items.push({ text, source: "base", sourceIndex: index });
        }
    });

    sessionTexts.forEach((text, index) => {
        items.push({ text, source: "session", sourceIndex: index });
    });

    return items;
}

function refreshTexts() {
    allTexts = getAllTextItems();
    totalText.textContent = allTexts.length;
    renderTexts();
}

function renderTexts() {
    textList.innerHTML = "";

    if (allTexts.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Belum ada teks. Tambahkan lewat form di atas";
        textList.appendChild(empty);
        return;
    }

    allTexts.forEach((item, index) => {
        const isSessionText = item.source === "session";
        const card = document.createElement("div");
        card.className = "text-card";

        const number = document.createElement("div");
        number.className = "number";
        number.textContent = index + 1;

        const content = document.createElement("div");
        content.className = "text-content";

        const paragraph = document.createElement("p");
        paragraph.textContent = item.text;

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "copy-btn";
        copyButton.textContent = "Salin";
        copyButton.addEventListener("click", () => {
            copyText(item);
        });

        actions.appendChild(copyButton);

        if (isSessionText) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Hapus";
            deleteButton.addEventListener("click", () => {
                removeTextItem(item);
                showToast("Teks dihapus");
            });
            actions.appendChild(deleteButton);
        }

        content.appendChild(paragraph);

        card.appendChild(number);
        card.appendChild(content);
        card.appendChild(actions);

        textList.appendChild(card);
    });

    updateCopyButtonsState();
}

function isCopyCooldownActive() {
    return copyCooldownRemaining > 0;
}

function updateCopyCooldownUI() {
    copyTimerValue.textContent = copyCooldownRemaining;
}

function updateCopyButtonsState() {
    const disabled = isCopyCooldownActive();

    document.querySelectorAll(".copy-btn").forEach((button) => {
        button.disabled = disabled;
        button.classList.toggle("disabled", disabled);
    });
}

function startCopyCooldown() {
    copyCooldownRemaining = COPY_COOLDOWN_SECONDS;
    copyTimerBar.classList.add("active");
    updateCopyCooldownUI();
    updateCopyButtonsState();

    clearInterval(copyCooldownInterval);

    copyCooldownInterval = setInterval(() => {
        copyCooldownRemaining -= 1;
        updateCopyCooldownUI();

        if (copyCooldownRemaining <= 0) {
            clearInterval(copyCooldownInterval);
            copyCooldownInterval = null;
            copyTimerBar.classList.remove("active");
            updateCopyButtonsState();
        }
    }, 1000);
}

function cleanInputLine(line) {
    return line
        .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
        .replace(/^\s*\d+\.\s*/, "")
        .trim();
}

function parseInputTexts(rawInput) {
    return rawInput
        .split(/\r?\n/)
        .map(cleanInputLine)
        .filter(Boolean);
}

function removeTextItem(item) {
    if (item.source === "base") {
        removedBaseIndexes.add(item.sourceIndex);
    } else {
        sessionTexts.splice(item.sourceIndex, 1);
    }

    refreshTexts();
}

addForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const rawInput = newTextInput.value.trim();

    if (!rawInput) {
        showToast("Tulis teks dulu");
        return;
    }

    const newTexts = parseInputTexts(rawInput);

    if (newTexts.length === 0) {
        showToast("Teks tidak valid");
        return;
    }

    sessionTexts.push(...newTexts);
    newTextInput.value = "";
    refreshTexts();
    showToast(`${newTexts.length} teks ditambahkan`);
});

async function copyText(item) {
    if (isCopyCooldownActive()) {
        showToast("Tunggu timer selesai dulu");
        return;
    }

    const text = item.text;

    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        document.execCommand("copy");
        textarea.remove();
    }

    removeTextItem(item);
    startCopyCooldown();
    showToast("Teks disalin dan dihapus");
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

init();
