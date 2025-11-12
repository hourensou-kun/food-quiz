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

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesDiv = document.getElementById("choices");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  choicesDiv.innerHTML = "";

  // ✅ choice1が正解・表示はランダム
  const choices = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  // ✅ 画像のみを表示
  choices.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = c.img;
    img.alt = "選択肢";

    div.appendChild(img);
    div.addEventListener("click", () => handleAnswer(c.correct, q));
    choicesDiv.appendChild(div);
  });

  showScreen("quiz-screen");
}

// 答えクリック時
function handleAnswer(isCorrect, q) {
  // ✅ まず答え画面を表示してから要素を取得
  showScreen("answer-screen");

  const video = document.getElementById("answer-video");
  const nextBtn = document.getElementById("next-btn");
  const feedbackArea = document.getElementById("feedback-area");

  // メッセージ表示
  feedbackArea.textContent = isCorrect ? "せいかい！🎉" : "ざんねん！💦";

  // 動画再生（CSVの answer_video を使用）
  video.src = q.answer_video;
  video.onerror = () => {
    feedbackArea.textContent += "（動画を再生できませんでした）";
  };

  video.currentTime = 0;
  video.play();

  // 最後の問題なら「けっかをみる」
  if (currentQuestion >= quizData.length - 1) {
    nextBtn.textContent = "けっかをみる ▶️";
  } else {
    nextBtn.textContent = "つぎのもんだいへ ▶️";
  }

  // ボタンクリックイベント
  nextBtn.onclick = () => {
    if (currentQuestion >= quizData.length - 1) {
      showResult();
    } else {
      currentQuestion++;
      showQuestion();
    }
  };

  // スコア加算
  if (isCorrect) score++;
}

// 結果画面
function showResult() {
  showScreen("end-screen");
  const scoreText = document.getElementById("score-text");
  scoreText.textContent = `せいかい：${score} / ${quizData.length}`;
}

// スタートボタン
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
