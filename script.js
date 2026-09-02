const textList = document.getElementById("textList");
const totalText = document.getElementById("totalText");
const toast = document.getElementById("toast");
const addForm = document.getElementById("addForm");
const newTextInput = document.getElementById("newTextInput");

let baseTexts = [];
let sessionTexts = [];
let allTexts = [];

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

function refreshTexts() {
    allTexts = [...baseTexts, ...sessionTexts];
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

    allTexts.forEach((text, index) => {
        const isSessionText = index >= baseTexts.length;
        const card = document.createElement("div");
        card.className = "text-card";

        const number = document.createElement("div");
        number.className = "number";
        number.textContent = index + 1;

        const content = document.createElement("div");
        content.className = "text-content";

        const paragraph = document.createElement("p");
        paragraph.textContent = text;

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "copy-btn";
        copyButton.textContent = "Salin";
        copyButton.addEventListener("click", () => {
            copyText(text, copyButton);
        });

        actions.appendChild(copyButton);

        if (isSessionText) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Hapus";
            deleteButton.addEventListener("click", () => {
                removeSessionText(index - baseTexts.length);
            });
            actions.appendChild(deleteButton);
        }

        content.appendChild(paragraph);

        card.appendChild(number);
        card.appendChild(content);
        card.appendChild(actions);

        textList.appendChild(card);
    });
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

function removeSessionText(sessionIndex) {
    sessionTexts.splice(sessionIndex, 1);
    refreshTexts();
    showToast("Teks dihapus");
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

async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        const oldText = button.textContent;

        button.textContent = "Tersalin";
        button.classList.add("copied");

        showToast("Teks berhasil disalin");

        setTimeout(() => {
            button.textContent = oldText;
            button.classList.remove("copied");
        }, 1500);
    } catch (error) {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        document.execCommand("copy");
        textarea.remove();

        button.textContent = "Tersalin";
        button.classList.add("copied");

        showToast("Teks berhasil disalin");

        setTimeout(() => {
            button.textContent = "Salin";
            button.classList.remove("copied");
        }, 1500);
    }
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
