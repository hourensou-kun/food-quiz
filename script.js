let quizData = [];
let current = 0;
let score = 0;

// 画面切り替え
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// CSV読み込み
async function loadCSV(path = "./data.csv") {
  const res = await fetch(path);
  if (!res.ok) throw new Error("CSV読み込みエラー");
  const text = await res.text();
  const [header, ...lines] = text.trim().split("\n");
  const keys = header.split(",");
  return lines.map(line => {
    const cols = line.split(",");
    return Object.fromEntries(keys.map((k, i) => [k, cols[i]?.trim() || ""]));
  });
}

// クイズを表示
function showQuestion() {
  const q = quizData[current];
  if (!q) return showResult();

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  choices.forEach(c => {
    const img = document.createElement("img");
    img.src = c.img;
    img.alt = "選択肢";
    img.className = "choice";
    img.addEventListener("click", () => handleAnswer(c.correct, q));
    choicesDiv.appendChild(img);
  });

  show("quiz-screen");
}

// 答えクリック時
function handleAnswer(isCorrect, q) {
  const feedback = document.getElementById("feedback-area");
  const video = document.getElementById("answer-video");
  const nextBtn = document.getElementById("next-btn");

  feedback.textContent = isCorrect ? "せいかい！" : "ざんねん！";
  if (isCorrect) score++;

  video.src = q.answer_video || "";
  video.currentTime = 0;
  video.play().catch(() => console.warn("動画再生エラー"));

  show("answer-screen");

  nextBtn.textContent =
    current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  nextBtn.onclick = () => {
    current++;
    current >= quizData.length ? showResult() : showQuestion();
  };
}

// 結果画面
function showResult() {
  show("end-screen");
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;
}

// スタート画面
document.getElementById("start-btn").addEventListener("click", () => {
  show("select-screen");
});

// クイズ開始
document.getElementById("quiz-shape-btn").addEventListener("click", async () => {
  try {
    const data = await loadCSV();
    quizData = [...data].sort(() => Math.random() - 0.5).slice(0, 3);
    current = 0;
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
