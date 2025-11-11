// script.js - 3問ランダム出題 + 1問ごとの⭕❌表示 + 答え合わせ動画再生
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

// ランダムでn問を選ぶ
function getRandomQuestions(data, n = 3) {
  return [...data].sort(() => Math.random() - 0.5).slice(0, n);
}

// クイズを表示
function showQuestion() {
  const q = quizData[currentQuestion];
  if (!q) return showResult();

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesDiv = document.getElementById("choices");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  choicesDiv.innerHTML = "";

  // choice1 が正解
  const choices = [
    { text: q.choice1, img: q.choice1_img, correct: true },
    { text: q.choice2, img: q.choice2_img, correct: false },
    { text: q.choice3, img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  choices.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("choice-item");
    const img = document.createElement("img");
    img.src = c.img;
    img.alt = c.text;
    const label = document.createElement("p");
    label.textContent = c.text;
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

  // 一時的に⭕❌表示
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
  showScreen("answer-screen");
  const feedback = document.getElementById("feedback-area");
  feedback.textContent = ""; // ○×はすでに表示済み
  const video = document.getElementById("answer-video");
  const src = quiz.answer_video?.trim() || "video/default.mp4";
  video.src = src;
  video.load();
  video.play().catch(e => console.warn("再生ブロック:", e));

  video.onerror = () => alert("動画を再生できませんでした。ファイルを確認してください。");

  // 「次へ」ボタンをリセットして再設定
  const nextBtn = document.getElementById("next-btn");
  const newBtn = nextBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newBtn, nextBtn);
  newBtn.addEventListener("click", () => {
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

// スタートボタン
document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("select-screen");
});

// クイズ選択（3問ランダム）
document.getElementById("quiz-shape-btn").addEventListener("click", async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = getRandomQuestions(data, 3); // ✅ 3問だけランダム
    currentQuestion = 0;
    score = 0;
    showQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
});

// リスタート
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});
