let quizzes = [];
let currentQuestion = 0;
let score = 0;

// CSVのURL（またはローカル data.csv）
const CSV_URL = "data.csv";

// ======== 初期処理 =========
window.onload = async () => {
  await loadQuizzes();
  showTitleScreen();
};

// ======== クイズデータをロード =========
async function loadQuizzes() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();
  const rows = csvText.split("\n").map(row => row.split(","));
  const dataRows = rows.slice(1);

  quizzes = dataRows.map(cols => ({
    id: cols[0],
    question: cols[1],
    image: cols[2],
    choice1: cols[3],
    choice1_img: cols[4],
    choice2: cols[5],
    choice2_img: cols[6],
    choice3: cols[7],
    choice3_img: cols[8],
    answer: cols[9],
    answer_video: cols[10]
  })).filter(q => q.question);

  quizzes = shuffle(quizzes).slice(0, 3);
}

// ======== タイトル画面 =========
function showTitleScreen() {
  document.getElementById("app").innerHTML = `
    <div class="title-screen">
      <h1>やさいクイズゲーム🥕</h1>
      <button id="startBtn">スタート！</button>
    </div>
  `;

  document.getElementById("startBtn").onclick = () => {
    currentQuestion = 0;
    score = 0;
    showQuestion(currentQuestion);
  };
}

// ======== クイズ出題 =========
function showQuestion(index) {
  const q = quizzes[index];
  const choices = [1, 2, 3].map(i => ({
    index: i,
    text: q[`choice${i}`],
    img: q[`choice${i}_img`]
  }));
  const shuffled = shuffle(choices);

  document.getElementById("app").innerHTML = `
    <div class="question-screen">
      <h2>${q.question}</h2>
      <img src="${q.image}" class="question-img" />
      <div class="choices">
        ${shuffled.map(c => `
          <button class="choice" data-index="${c.index}">
            <img src="${c.img}" />
          </button>
        `).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".choice").forEach(btn => {
    btn.onclick = () => checkAnswer(index, btn.dataset.index);
  });
}

// ======== 答え合わせ =========
function checkAnswer(index, selectedIndex) {
  const q = quizzes[index];
  const isCorrect = Number(selectedIndex) === Number(q.answer);
  if (isCorrect) score++;
  showAnswerScreen(isCorrect, q);
}

// ======== 答え合わせ画面 =========
function showAnswerScreen(isCorrect, q) {
  document.getElementById("app").innerHTML = `
    <div class="answer-screen">
      <h2>${isCorrect ? "⭕ せいかい！" : "❌ ざんねん！"}</h2>
      <video src="${q.answer_video}" controls autoplay width="80%"></video>
      <button id="nextBtn">つぎへ</button>
    </div>
  `;

  document.getElementById("nextBtn").onclick = () => {
    currentQuestion++;
    if (currentQuestion < quizzes.length) {
      showQuestion(currentQuestion);
    } else {
      showResultScreen();
    }
  };
}

// ======== 結果画面 =========
function showResultScreen() {
  document.getElementById("app").innerHTML = `
    <div class="result-screen">
      <h2>けっかはっぴょう！</h2>
      <p>${quizzes.length}もんちゅう ${score}もんせいかい！</p>
      <button id="retryBtn">もういちどあそぶ</button>
    </div>
  `;

  document.getElementById("retryBtn").onclick = () => {
    loadQuizzes().then(() => showTitleScreen());
  };
}

// ======== 配列シャッフル =========
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
