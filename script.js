let quizData = [];
let currentQuestion = 0;
let score = 0;

// 画面切り替え
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// CSV読み込み関数
async function loadCSV(path) {
  const response = await fetch(path);
  const text = await response.text();
  const rows = text.trim().split("\n").map(row => row.split(","));
  const [header, ...data] = rows;
  return data.map(row => Object.fromEntries(header.map((h, i) => [h, row[i]])));
}

// ランダムに3問取得
function getRandomQuestions(data, num = 3) {
  return [...data].sort(() => Math.random() - 0.5).slice(0, num);
}

// クイズ表示
function showQuestion() {
  const q = quizData[currentQuestion];

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  // choice1（正解）＋その他2つをランダムに並び替え
  const choices = [
    { text: q.choice1, img: q.choice1_img, correct: true },
    { text: q.choice2, img: q.choice2_img, correct: false },
    { text: q.choice3, img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  choices.forEach(choice => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = choice.img;
    img.alt = choice.text;
    img.addEventListener("click", () => checkAnswer(choice.correct, q));

    const label = document.createElement("p");
    label.textContent = choice.text;

    div.appendChild(img);
    div.appendChild(label);
    choicesDiv.appendChild(div);
  });
}

// 答えを処理（正解・不正解を1秒表示 → 動画）
function checkAnswer(isCorrect, quiz) {
  if (isCorrect) score++;

  const quizScreen = document.getElementById("quiz-screen");
  quizScreen.innerHTML = `
    <div class="feedback-screen">
      <h2>${isCorrect ? "⭕せいかい！" : "❌ざんねん！"}</h2>
    </div>`;

  setTimeout(() => {
    showAnswerVideo(quiz);
  }, 1000);
}

// 答え合わせ動画を表示
function showAnswerVideo(quiz) {
  const quizScreen = document.getElementById("quiz-screen");
  const videoSrc = quiz.answer_video || "video/default.mp4"; // 空欄でも動くように
  quizScreen.innerHTML = `
    <div class="answer-video-screen">
      <h2>こたえあわせ！</h2>
      <video id="answer-video" src="${videoSrc}" muted autoplay playsinline controls></video>
      <button id="next-btn">つぎのもんだいへ ▶️</button>
    </div>
  `;

  const video = document.getElementById("answer-video");
  video.addEventListener("error", (e) => {
    console.error("動画を読み込めませんでした:", quiz.answer_video, e);
    alert("動画を再生できませんでした。パスを確認してください。");
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
      showQuestion();
    } else {
      showResult();
    }
  });
}

// 結果画面表示
function showResult() {
  showScreen("end-screen");
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;
}

// スタート→選択画面
document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("select-screen");
});

// 「①かたちクイズ」を選択
document.getElementById("quiz-shape-btn").addEventListener("click", async () => {
  const data = await loadCSV("data.csv");
  quizData = getRandomQuestions(data);
  currentQuestion = 0;
  score = 0;
  showQuestion();
  showScreen("quiz-screen");
});

// もういちどボタン
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});
