const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const stopBtn = document.getElementById('stop-btn');
const restartBtn = document.getElementById('restart-btn');
const questionDiv = document.getElementById('question');
const choicesDiv = document.getElementById('choices');
const scoreDiv = document.getElementById('score');
const startArea = document.getElementById('start-area');
const gameArea = document.getElementById('game-area');
const endArea = document.getElementById('end-area');
const finalScoreDiv = document.getElementById('final-score');
const modeSelect = document.getElementById('mode-select');
const customRoundsDiv = document.getElementById('custom-rounds');
const roundsInput = document.getElementById('rounds-input');
const playerNameInput = document.getElementById('player-name');
const opAdd = document.getElementById('op-add');
const opSub = document.getElementById('op-sub');
const opMul = document.getElementById('op-mul');
const difficultySelect = document.getElementById('difficulty-select');
const mascot = document.getElementById('mascot');
const mascotGame = document.getElementById('mascot-game');

let score = 0;
let currentQuestion = 0;
let totalQuestions = 10;
let questions = [];
let mode = 'endless';
let lives = 3;
let timer = null;
let timeLeft = 60;
let streak = 0;
let maxStreak = 0;
let playerName = '';
let selectedOps = ['+', '-', '×'];
let difficulty = 'easy';

const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');
const music = new Audio('music.mp3');
music.loop = true;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDifficultyLevel() {
    switch(difficulty) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 1;
    }
}

function generateQuestion(difficultyOverride = null) {
    // Convert difficulty to numeric value
    let difficultyLevel = difficultyOverride || getDifficultyLevel();
    
    const ops = selectedOps;
    const op = ops[getRandomInt(0, ops.length - 1)];
    let a, b, answer;
    let maxNum = 10 + difficultyLevel * 15;
    if (op === '+') {
        a = getRandomInt(1, maxNum);
        b = getRandomInt(1, maxNum);
        answer = a + b;
    } else if (op === '-') {
        a = getRandomInt(5, maxNum);
        b = getRandomInt(1, a);
        answer = a - b;
    } else {
        let multMax = difficultyLevel === 1 ? 10 : difficultyLevel === 2 ? 15 : 20;
        a = getRandomInt(1, multMax);
        b = getRandomInt(1, multMax);
        answer = a * b;
    }
    // Generate choices
    let choices = [answer];
    let choiceCount = difficultyLevel === 1 ? 4 : difficultyLevel === 2 ? 5 : 6;
    while (choices.length < choiceCount) {
        let wrong;
        let range = difficultyLevel * 5;
        if (op === '+') wrong = answer + getRandomInt(-range, range);
        else if (op === '-') wrong = answer + getRandomInt(-range, range);
        else wrong = answer + getRandomInt(-range * 2, range * 2);
        if (wrong !== answer && !choices.includes(wrong) && wrong >= 0) choices.push(wrong);
    }
    choices = choices.sort(() => Math.random() - 0.5);
    return { a, b, op, answer, choices };
}

function setupQuestions() {
    questions = [];
    for (let i = 0; i < totalQuestions; i++) {
        questions.push(generateQuestion());
    }
}

function showQuestion() {
    nextBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    let q;
    if (mode === 'endless' || mode === 'timed' || mode === 'lives') {
        // Generate on the fly using selected difficulty
        q = generateQuestion();
        questions = [q];
        currentQuestion = 0;
    } else {
        q = questions[currentQuestion];
    }
    questionDiv.textContent = `${q.a} ${q.op} ${q.b} = ?`;
    choicesDiv.innerHTML = '';
    q.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice;
        btn.onclick = () => selectAnswer(choice);
        choicesDiv.appendChild(btn);
    });
    let info = `Score: ${score}`;
    if (mode === 'lives') info += ` | Lives: ${lives}`;
    if (mode === 'timed') info += ` | Time: ${timeLeft}s`;
    if (streak > 1) info += ` | Streak: ${streak}`;
    scoreDiv.textContent = info;
}

let missedQuestions = [];
function selectAnswer(choice) {
    const q = questions[currentQuestion];
    let correct = choice === q.answer;
    if (!correct) {
        missedQuestions.push(`${q.a} ${q.op} ${q.b} = ${q.answer}`);
    }
    if (correct) {
        score += 1;
        streak += 1;
        maxStreak = Math.max(maxStreak, streak);
        let bonus = streak > 1 ? ` (+${streak - 1} streak bonus!)` : '';
        score += streak > 1 ? streak - 1 : 0;
        correctSound.currentTime = 0;
        correctSound.play();
    } else {
        streak = 0;
        if (mode === 'lives') {
            lives -= 1;
        }
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
    Array.from(choicesDiv.children).forEach(btn => {
        btn.disabled = true;
        if (parseInt(btn.textContent) === q.answer) {
            btn.style.background = '#a0e060';
        } else if (parseInt(btn.textContent) === choice) {
            btn.style.background = '#ffb3b3';
        }
    });
    nextBtn.style.display = 'inline-block';
    let info = `Score: ${score}`;
    if (mode === 'lives') info += ` | Lives: ${lives}`;
    if (mode === 'timed') info += ` | Time: ${timeLeft}s`;
    if (streak > 1) info += ` | Streak: ${streak}`;
    scoreDiv.textContent = info;
}

function nextQuestion() {
    if (mode === 'endless') {
        showQuestion();
    } else if (mode === 'timed') {
        showQuestion();
    } else if (mode === 'lives') {
        if (lives <= 0) {
            endGame();
        } else {
            showQuestion();
        }
    } else {
        currentQuestion++;
        if (currentQuestion < totalQuestions) {
            showQuestion();
        } else {
            endGame();
        }
    }
}

function startGame() {
    score = 0;
    currentQuestion = 0;
    streak = 0;
    maxStreak = 0;
    mode = modeSelect.value;
    lives = 3;
    timeLeft = 60;
    
    // Update selected operations based on checkboxes
    selectedOps = [];
    if (opAdd.checked) selectedOps.push('+');
    if (opSub.checked) selectedOps.push('-');
    if (opMul.checked) selectedOps.push('×');
    
    // Ensure at least one operation is selected
    if (selectedOps.length === 0) {
        selectedOps = ['+'];
        opAdd.checked = true;
    }
    
    // Update difficulty based on selection
    difficulty = difficultySelect.value;
    if (mode === 'custom') {
        totalQuestions = parseInt(roundsInput.value) || 10;
        setupQuestions();
    }
    startArea.style.display = 'none';
    endArea.style.display = 'none';
    gameArea.style.display = 'block';
    if (mode === 'timed') {
        scoreDiv.textContent = `Score: 0 | Time: ${timeLeft}s`;
        timer = setInterval(() => {
            timeLeft--;
            scoreDiv.textContent = `Score: ${score} | Time: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                endGame();
            }
        }, 1000);
    }
    music.currentTime = 0;
    music.play();
    showQuestion();
}

function endGame() {
    gameArea.style.display = 'none';
    endArea.style.display = 'block';
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    let msg = '';
    if (mode === 'timed') {
        msg = `Your score: ${score} (in 60 seconds)`;
    } else if (mode === 'lives') {
        msg = `Your score: ${score} (lives left: ${lives})`;
    } else if (mode === 'endless') {
        msg = `Your score: ${score} (endless mode)`;
    } else {
        msg = `Your score: ${score} / ${totalQuestions}`;
    }
    msg += `<br>Max streak: ${maxStreak}`;
    finalScoreDiv.innerHTML = msg;
    music.pause();
    saveScore();
    showLeaderboard();
    showAchievements();
    showFactsReview();
    missedQuestions = [];
}

// Leaderboard and Achievements
function saveScore() {
    let scores = JSON.parse(localStorage.getItem('numberNinjaScores') || '[]');
    scores.push({ name: playerName, score, mode, date: new Date().toLocaleDateString() });
    scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('numberNinjaScores', JSON.stringify(scores));
}

function showLeaderboard() {
    let scores = JSON.parse(localStorage.getItem('numberNinjaScores') || '[]');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    scores.forEach((entry, i) => {
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${entry.name}: ${entry.score} (${entry.mode})`;
        list.appendChild(li);
    });
}

function showAchievements() {
    const area = document.getElementById('achievements-area');
    area.innerHTML = '';
    if (score >= 10) area.innerHTML += '<span class="badge">10+ Points!</span>';
    if (maxStreak >= 5) area.innerHTML += '<span class="badge">Streak Master!</span>';
    if (mode === 'timed' && score >= 15) area.innerHTML += '<span class="badge">Speed Ninja!</span>';
    if (mode === 'lives' && lives === 3) area.innerHTML += '<span class="badge">Flawless!</span>';
}

// Hints
const hintBtn = document.getElementById('hint-btn');
hintBtn.onclick = function() {
    const q = questions[currentQuestion];
};

// Progress Bar
function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    if (mode === 'custom') {
        bar.style.display = 'block';
        const percent = ((currentQuestion + 1) / totalQuestions) * 100;
        progress.style.width = percent + '%';
    } else if (mode === 'timed') {
        bar.style.display = 'block';
        progress.style.width = (timeLeft / 60) * 100 + '%';
    } else {
        bar.style.display = 'none';
    }
}

// Facts Review
function showFactsReview() {
    const factsDiv = document.getElementById('facts-review');
    if (missedQuestions.length) {
        factsDiv.innerHTML = '<b>Missed Questions:</b><br>' + missedQuestions.join('<br>');
    } else {
        factsDiv.innerHTML = '<b>Perfect!</b>';
    }
}

// Share Score
const shareBtn = document.getElementById('share-btn');
shareBtn.onclick = function() {
    const text = `I scored ${score} in Number Ninja! Try it: https://coderhearts.github.io/NumberNinja/`;
    if (navigator.share) {
        navigator.share({ text });
    } else {
        window.prompt('Copy and share your score:', text);
    }
};

startBtn.onclick = startGame;
nextBtn.onclick = nextQuestion;

startBtn.onclick = startGame;
nextBtn.onclick = nextQuestion;
restartBtn.onclick = function() {
    endArea.style.display = 'none';
    gameArea.style.display = 'none';
    startArea.style.display = 'block';
};

stopBtn.onclick = function() {
    endGame();
};

modeSelect.onchange = function() {
    if (modeSelect.value === 'custom') {
        customRoundsDiv.style.display = 'block';
    } else {
        customRoundsDiv.style.display = 'none';
    }
}
