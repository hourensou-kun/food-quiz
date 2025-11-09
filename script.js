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
  const response = await fetch('./data.csv'); // 同階層の data.csv を読み込む
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
// 問題を表示する関数
function showQuestion() {
  const quiz = quizzes[currentQuestion];
  const questionImage = document.getElementById("question-image");
  const choicesContainer = document.getElementById("choices");
  const questionText = document.getElementById("question-text");

  // 画像と問題文を設定
  questionImage.src = quiz.image;
  questionText.textContent = quiz.question;

  // 正解・不正解を含む選択肢を取得し、ランダムに並べ替え
  const choices = [
    { text: quiz.choice1, isCorrect: true },
    { text: quiz.choice2, isCorrect: false },
    { text: quiz.choice3, isCorrect: false }
  ].sort(() => Math.random() - 0.5);

  // 選択肢の表示を初期化
  choicesContainer.innerHTML = "";

  // ランダム順で選択肢を生成
  choices.forEach(choice => {
    const img = document.createElement("img");
    img.src = `image/${choice.text}.png`; // choice名と同じファイル名の画像を想定
    img.classList.add("choice");
    img.addEventListener("click", () => checkAnswer(choice.isCorrect));
    choicesContainer.appendChild(img);
  });
}


// 答えを処理（1秒だけ正解・不正解表示 → 動画）
function checkAnswer(selected, quiz) {
  const isCorrect = selected == quiz.answer;
  if (isCorrect) score++;

  const container = document.getElementById("game-container");
  container.innerHTML = `
    <div class="feedback-screen">
      <h2>${isCorrect ? "⭕せいかい！" : "❌ざんねん！"}</h2>
    </div>`;

  // 1秒後に動画再生画面へ
  setTimeout(() => {
    showAnswerVideo(quiz);
  }, 1000);
}

// 答え合わせ動画を表示（終了後は「つぎへ」ボタン）
function showAnswerVideo(quiz) {
  const container = document.getElementById("game-container");
  container.innerHTML = `
    <div class="answer-video-screen">
      <h2>こたえあわせ！</h2>
      <video id="answer-video" src="${quiz.answer_video}" muted autoplay playsinline controls></video>
      <button id="next-btn">つぎのもんだいへ ▶️</button>
    </div>
  `;

  const video = document.getElementById("answer-video");

  // 動画エラー時
  video.addEventListener("error", (e) => {
    console.error("動画を読み込めませんでした:", quiz.answer_video, e);
    alert("動画を再生できませんでした。パスを確認してください。");
  });

  // 「つぎへ」ボタン
  document.getElementById("next-btn").addEventListener("click", () => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
      showQuestion();
      showScreen("quiz-screen");
    } else {
      showScreen("end-screen");
      document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
    }
  });
}

// もういちどボタン
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});

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
