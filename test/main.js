const screens = {
    welcome: document.getElementById('screen-welcome'),
    register: document.getElementById('screen-register'),
    login: document.getElementById('screen-login'),
    start: document.getElementById('screen-start'),
    quiz: document.getElementById('screen-quiz'),
    end: document.getElementById('screen-end'),
};
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hide'));
    screens[name].classList.remove('hide');
}

function getUsers() { return JSON.parse(localStorage.getItem('quiz_users') || '{}'); }
function saveUsers(u) { localStorage.setItem('quiz_users', JSON.stringify(u)); }

let currentUser = null;

document.getElementById('btn-go-register').addEventListener('click', () => showScreen('register'));
document.getElementById('btn-go-login').addEventListener('click', () => showScreen('login'));

document.getElementById('btn-register').addEventListener('click', () => {
    const u = document.getElementById('reg-username').value.trim();
    const p = document.getElementById('reg-password').value.trim();
    const err = document.getElementById('reg-error');
    if (!u || !p) { err.textContent = 'Please fill in both fields'; err.classList.remove('hide'); return; }
    const users = getUsers();
    if (users[u]) { err.textContent = 'Your username/password has already been used'; err.classList.remove('hide'); return; }
    users[u] = { password: p, stats: { correct: 0, wrong: 0, total: 0 } };
    saveUsers(users);
    err.classList.add('hide');
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    showScreen('welcome');
});
document.getElementById('btn-reg-return').addEventListener('click', () => {
    document.getElementById('reg-error').classList.add('hide');
    showScreen('welcome');
});

document.getElementById('btn-login').addEventListener('click', () => {
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    const err = document.getElementById('login-error');
    const users = getUsers();
    if (!users[u] || users[u].password !== p) { err.classList.remove('hide'); return; }
    err.classList.add('hide');
    currentUser = u;
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    enterStartScreen();
});
document.getElementById('btn-login-return').addEventListener('click', () => {
    document.getElementById('login-error').classList.add('hide');
    showScreen('welcome');
});

function enterStartScreen() {
    loadNotes();
    renderStats();
    showScreen('start');
}

function renderStats() {
    const users = getUsers();
    const content = document.getElementById('stats-content');
    const entries = Object.entries(users).filter(([, v]) => v.stats && v.stats.total > 0);
    if (entries.length === 0) {
        content.innerHTML = '<p style="color:#a2aace;font-size:13px;text-align:center;margin-top:10px;">No data yet. Play a game!</p>';
        return;
    }
    content.innerHTML = entries.map(([name, data]) => {
        const s = data.stats;
        const pct = Math.round((s.correct / s.total) * 100);
        return `
        <div class="stat-item">
            <div class="stat-username">${name}</div>
            <div class="stat-bar-track">
                <div class="stat-bar-correct" style="width:${pct}%"></div>
                <div class="stat-bar-wrong" style="width:${100 - pct}%"></div>
            </div>
            <div class="stat-pct">${pct}% correct</div>
            <div class="stat-total">${s.total} questions answered</div>
        </div>`;
    }).join('');
}

function loadNotes() {
    const val = localStorage.getItem('quiz_note') || '';
    document.getElementById('note-text').value = val;
    document.getElementById('note-text-quiz').value = val;
}
document.getElementById('save-note').addEventListener('click', () => {
    localStorage.setItem('quiz_note', document.getElementById('note-text').value);
});
document.getElementById('hide-note').addEventListener('click', () => {
    const t = document.getElementById('note-text'), btn = document.getElementById('hide-note');
    if (t.style.display === 'none') { t.style.display = 'block'; btn.textContent = 'Hide'; }
    else { t.style.display = 'none'; btn.textContent = 'Show'; }
});
document.getElementById('save-note-quiz').addEventListener('click', () => {
    localStorage.setItem('quiz_note', document.getElementById('note-text-quiz').value);
});
document.getElementById('hide-note-quiz').addEventListener('click', () => {
    const t = document.getElementById('note-text-quiz'), btn = document.getElementById('hide-note-quiz');
    if (t.style.display === 'none') { t.style.display = 'block'; btn.textContent = 'Hide'; }
    else { t.style.display = 'none'; btn.textContent = 'Show'; }
});

const progressBar = document.querySelector('.progress-bar');
const progressText = document.querySelector('.progress-text');
const submitBtn = document.querySelector('.submit');
const nextBtn = document.querySelector('.next');

let questions = [], timePerQ = 30, score = 0, currentQuestion = 0, timer;

const numQEl = document.getElementById('num-questions');
const categoryEl = document.getElementById('category');
const diffEl = document.getElementById('difficulty');
const timeEl = document.getElementById('time');

const progress = (value) => {
    const pct = (value / timePerQ) * 100;
    progressBar.style.width = pct + '%';
    progressText.innerHTML = value;
};

document.getElementById('btn-start').addEventListener('click', startQuiz);

async function startQuiz() {
    const num = numQEl.value;
    const cat = categoryEl.value;
    const diff = diffEl.value;
    timePerQ = parseInt(timeEl.value) || 30;
    score = 0;
    currentQuestion = 0;

    if (+cat < '9' && cat !== '') {
        const data = await loadPreparedQuestions();
        questions = data.slice(0, num);
    } else {
        try {
            const api = `https://opentdb.com/api.php?amount=${num}${cat ? '&category=' + cat : ''}${diff ? '&difficulty=' + diff : ''}&type=multiple`;
            const res = await fetch(api);
            const json = await res.json();
            questions = json.results;
        } catch {
            alert('Failed to load questions. Check your connection or try a different category.');
            return;
        }
    }

    if (!questions || questions.length === 0) {
        alert('No questions available. Try different settings.');
        return;
    }

    document.getElementById('note-text-quiz').value = document.getElementById('note-text').value;
    loadLeaderboard();
    showScreen('quiz');
    showQuestion(questions[0]);
}

const loadPreparedQuestions = async () => {
    const cat = categoryEl.value;
    if (cat === '1') {
        const res = await fetch('questions.txt');
    } else {
        alert('Failed to load questions. Check your connection or try a different category.');
        return;
    }
    const text = await res.text();
    const lines = text.split('\n');
    let parsed = [], cur = null;
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        if (line.startsWith('Câu')) {
            if (cur) parsed.push(cur);
            cur = { question: line.replace('Câu', '').trim(), correct_answer: '', incorrect_answers: [] };
        } else if (line.includes(':)))')) {
            cur.correct_answer = line.replace(':)))', '').trim();
        } else if (line.includes(':(((')) {
            cur.incorrect_answers.push(line.replace(':(((', '').trim());
        }
    });
    if (cur) parsed.push(cur);
    return parsed.sort(() => Math.random() - 0.5);
};

const showQuestion = (question) => {
    const questionText = document.querySelector('.question');
    const answersWapper = document.querySelector('.answer-wapper');
    const questionNumber = document.querySelector('.number');

    questionText.innerHTML = question.question;

    const answers = [...question.incorrect_answers, question.correct_answer.toString()]
        .sort(() => Math.random() - 0.5);

    answersWapper.innerHTML = '';
    answers.forEach(answer => {
        answersWapper.innerHTML += `
            <div class="answer">
                <span class="text">${answer}</span>
                <span class="checkbox"><span class="icon">✓</span></span>
            </div>`;
    });

    questionNumber.innerHTML = `Question <span class="current">${questions.indexOf(question) + 1}</span><span class="total">/${questions.length}</span>`;

    document.querySelectorAll('.answer').forEach(ans => {
        ans.addEventListener('click', () => {
            if (!ans.classList.contains('checked')) {
                document.querySelectorAll('.answer').forEach(a => a.classList.remove('selected'));
                ans.classList.add('selected');
                submitBtn.disabled = false;
            }
        });
    });

    submitBtn.disabled = true;
    submitBtn.style.display = 'block';
    nextBtn.style.display = 'none';

    startTimer(timePerQ);
};

const startTimer = (t) => {
    clearInterval(timer);
    let remaining = t;
    progress(remaining);
    timer = setInterval(() => {
        remaining--;
        if (remaining >= 0) { progress(remaining); }
        else { clearInterval(timer); checkAnswer(); }
    }, 1000);
};

submitBtn.addEventListener('click', () => { checkAnswer(); });

const checkAnswer = () => {
    clearInterval(timer);
    const selectedAnswer = document.querySelector('.answer.selected');
    const correct = questions[currentQuestion].correct_answer;

    if (selectedAnswer) {
        const txt = selectedAnswer.querySelector('.text').textContent;
        if (txt === correct) { score++; selectedAnswer.classList.add('correct'); }
        else {
            selectedAnswer.classList.add('wrong');
            document.querySelectorAll('.answer').forEach(a => {
                if (a.querySelector('.text').textContent === correct) a.classList.add('correct');
            });
        }
    } else {
        document.querySelectorAll('.answer').forEach(a => {
            if (a.querySelector('.text').textContent === correct) a.classList.add('correct');
        });
    }

    document.querySelectorAll('.answer').forEach(a => a.classList.add('checked'));
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'block';
};

nextBtn.addEventListener('click', () => {
    currentQuestion++;
    submitBtn.style.display = 'block';
    nextBtn.style.display = 'none';
    if (currentQuestion < questions.length) {
        showQuestion(questions[currentQuestion]);
    } else {
        showScore();
    }
});

function lbKey() {
    return `leaderboard_${numQEl.value}_${categoryEl.value}_${diffEl.value}_${timeEl.value}`;
}
function saveToLeaderboard() {
    const key = lbKey();
    let scores = JSON.parse(localStorage.getItem(key)) || [];
    scores.push(score);
    scores.sort((a, b) => b - a);
    scores = scores.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(scores));
}
function loadLeaderboard() {
    const scores = JSON.parse(localStorage.getItem(lbKey())) || [];
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    if (scores.length === 0) {
        list.innerHTML = '<li style="color:#576081;font-size:13px;border:none;">No scores yet</li>';
        return;
    }
    scores.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${i + 1}</span><span>${s}</span>`;
        list.appendChild(li);
    });
}

const showScore = () => {
    clearInterval(timer);
    const total = questions.length;

    document.querySelector('.final-score').innerHTML = score;
    document.querySelector('.total-score').innerHTML = `/ ${total}`;

    saveToLeaderboard();

    if (currentUser) {
        const users = getUsers();
        if (users[currentUser]) {
            users[currentUser].stats.correct += score;
            users[currentUser].stats.wrong += (total - score);
            users[currentUser].stats.total += total;
            saveUsers(users);
        }
    }

    showScreen('end');
};

document.querySelector('.restart').addEventListener('click', () => {
    clearInterval(timer);
    score = 0; currentQuestion = 0; questions = [];
    enterStartScreen();
});

showScreen('welcome');