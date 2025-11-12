let quizData = [];
let currentQuestion = 0;
let score = 0;

// 画面切り替え
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// CSV読み込み
async function loadCSV(path = "./data.csv") {
  const res = await fetch(path);
  if (!res.ok) throw new Error("CSV読み込みエラー");
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.trim());
  const header = rows.shift().split(",").map(h => h.trim());
  return rows.map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    header.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
}

// ランダムでn問選ぶ
function getRandomQuestions(data, n = 3) {
  return [...data].sort(() => Math.random() - 0.5).slice(0, n);
}

// クイズを表示
function showQuestion() {
  const q = quizData[currentQuestion];
  if (!q) return showResult();

  // 🔸ここを追加（要素が存在しないときは再構築する）
  const quizScreen = document.getElementById("quiz-screen");
  if (!document.getElementById("question-text")) {
    quizScreen.innerHTML = `
      <h2 id="question-text"></h2>
      <img id="question-image" src="" alt="クイズ画像" />
      <div id="choices"></div>
    `;
  }

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesDiv = document.getElementById("choices");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  choicesDiv.innerHTML = "";

  const choices = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  choices.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = c.img;
    img.alt = c.text;

    const label = document.createElement("p");
    label.textContent = c.text || ""; // textがundefined対策

    div.appendChild(img);
    div.appendChild(label);
    div.addEventListener("click", () => handleAnswer(c.correct, q));
    choicesDiv.appendChild(div);
  });

  showScreen("quiz-screen");
}


// 答えクリック時
function handleAnswer(isCorrect, quiz) {
  if (isCorrect) score++;

  const quizScreen = document.getElementById("quiz-screen");
  quizScreen.innerHTML = `
    <div class="feedback-screen">
      <h2 style="font-size:48px;">${isCorrect ? "⭕せいかい！" : "❌ざんねん！"}</h2>
    </div>
  `;

  setTimeout(() => {
    showAnswerVideo(quiz);
  }, 1000);
}

// 答えあわせ動画画面
function showAnswerVideo(quiz) {
  showScreen("quiz-screen"); // ← 元の画面構成に合わせてquiz-screenを再利用

  const quizScreen = document.getElementById("quiz-screen");
  const videoSrc = quiz.answer_video?.trim() || "video/default.mp4";

  quizScreen.innerHTML = `
    <div class="answer-video-screen">
      <h2>こたえあわせ！</h2>
      <video id="answer-video" src="${videoSrc}" muted autoplay playsinline controls></video>
      <button id="next-btn" class="next-btn">つぎのもんだいへ ▶️</button>
    </div>
  `;

  const video = document.getElementById("answer-video");
  video.onerror = () => alert("動画を再生できませんでした。パスを確認してください。");

  // ✅ 修正：イベントを確実に登録
  const nextBtn = document.getElementById("next-btn");
  nextBtn.addEventListener("click", () => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
      showQuestion();
    } else {
      showResult();
    }
  });
}

// 結果画面
function showResult() {
  showScreen("end-screen");
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;
}

// スタート
document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("select-screen");
});

// クイズ開始（3問ランダム）
document.getElementById("quiz-shape-btn").addEventListener("click", async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = getRandomQuestions(data, 3);
    currentQuestion = 0;
    score = 0;
    showQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
});

// はじめにもどる
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});
