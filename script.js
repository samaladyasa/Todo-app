let todos = JSON.parse(localStorage.getItem("todos"));
let audioContext = null;
const themeStorageKey = "todo-theme";
const defaultTheme = "sand";
const allowedThemes = [
    "sand",
    "forest",
    "ocean",
    "sunset",
    "rainforest",
    "arctic",
    "mono",
    "candy",
    "coffee",
    "midnight",
    "retro",
    "ember"
];

initializeTheme();

if (todos) {
    todos = normalizeTodos(todos);
    DisplayTodo();
} else {
    todos = [];
}

function initializeTheme() {
    const themeSelect = document.getElementById("theme-select");
    const savedTheme = localStorage.getItem(themeStorageKey);
    const themeToApply = allowedThemes.includes(savedTheme) ? savedTheme : defaultTheme;

    applyTheme(themeToApply);
    if (themeSelect) {
        themeSelect.value = themeToApply;
        themeSelect.addEventListener("change", (event) => {
            const selectedTheme = event.target.value;
            applyTheme(selectedTheme);
        });
    }
}

function applyTheme(themeName) {
    const safeTheme = allowedThemes.includes(themeName) ? themeName : defaultTheme;
    document.body.setAttribute("data-theme", safeTheme);
    localStorage.setItem(themeStorageKey, safeTheme);
}

function normalizeTodos(items) {
    return items
        .map((item) => {
            if (typeof item === "string") {
                return {
                    text: item,
                    completed: false
                };
            }

            if (item && typeof item.text === "string") {
                return {
                    text: item.text,
                    completed: Boolean(item.completed)
                };
            }

            return null;
        })
        .filter(Boolean);
}

function getAudioContext() {
    if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return null;
        }

        audioContext = new AudioCtx();
    }

    return audioContext;
}

function playSound(type) {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === "suspended") {
        ctx.resume();
    }

    const now = ctx.currentTime;

    function playPluck(startTime, frequency, duration, peakGain, panValue) {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const pan = ctx.createStereoPanner();

        osc.type = "sine";
        overtone.type = "triangle";

        osc.frequency.setValueAtTime(frequency, startTime);
        overtone.frequency.setValueAtTime(frequency * 2.02, startTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2600, startTime);
        filter.Q.setValueAtTime(0.9, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        pan.pan.setValueAtTime(panValue, startTime);

        osc.connect(filter);
        overtone.connect(filter);
        filter.connect(gain);
        gain.connect(pan);
        pan.connect(ctx.destination);

        osc.start(startTime);
        overtone.start(startTime + 0.002);
        osc.stop(startTime + duration);
        overtone.stop(startTime + duration * 0.82);
    }

    if (type === "add") {
        playPluck(now, 740, 0.14, 0.018, -0.05);
        playPluck(now + 0.06, 988, 0.15, 0.013, 0.08);
    } else if (type === "toggle") {
        playPluck(now, 660, 0.13, 0.015, -0.04);
        playPluck(now + 0.05, 830, 0.12, 0.011, 0.06);
    } else {
        playPluck(now, 520, 0.12, 0.012, 0);
        playPluck(now + 0.045, 430, 0.12, 0.008, -0.03);
    }
}

function getTodo() {
    const input = document.getElementById("todo");
    const value = input.value.trim();

    if (!value) {
        return false;
    }

    todos.push({
        text: value,
        completed: false
    });
    input.value = "";
    playSound("add");
    DisplayTodo();
    return false;
}

function DisplayTodo() {
    const container = document.getElementById("container");
    const todoCount = document.getElementById("todo-count");

    container.innerHTML = "";

    if (!todos.length) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.innerText = "No tasks yet. Add one above to get started.";
        container.appendChild(emptyState);
    }

    todos.forEach((todo, index) => {
        let card = document.createElement("div");
        card.className = "todo-card";
        if (todo.completed) {
            card.classList.add("completed");
        }

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "todo-checkbox";
        checkbox.checked = todo.completed;
        checkbox.setAttribute("aria-label", `Mark ${todo.text} as complete`);
        checkbox.addEventListener("change", () => {
            toggleTodo(index);
        });

        let title = document.createElement("h3");
        title.className = "todo-title";
        title.innerText = todo.text;

        let button = document.createElement("button");
        button.className = "todo-delete";
        button.innerText = "Remove";
        button.addEventListener("click", () =>{
            deleteTodo(index);
        });

        card.appendChild(checkbox);
        card.appendChild(title);
        card.appendChild(button);
        container.appendChild(card); 
    });

    const completedCount = todos.filter((todo) => todo.completed).length;
    todoCount.innerText = `${completedCount}/${todos.length} completed`;
    localStorage.setItem("todos", JSON.stringify(todos));
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    playSound("toggle");
    DisplayTodo();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    playSound("delete");
    DisplayTodo();
}