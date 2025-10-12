// main.js
// あなたの data.csv に完全対応
// 画像・動画パスはCSV通り（image/ と video/）

let quizData = [];
let currentQuestion = 0;
let score = 0;

// --- CSV読み込み ---
async function loadCSV() {
  try {
    const response = await fetch("data.csv");
    if (!response.ok) throw new Error("CSVが見つかりません");
    const text = await response.text();

    const rows = text.trim().split("\n").map(r => r.split(","));
    const header = rows.shift();

    quizData = rows.map(cols => {
      const obj = {};
      header.forEach((key, i) => (obj[key] = cols[i]));
      return obj;
    });

    showQuestion();
  } catch (e) {
    document.getElementById("quiz").innerHTML = `<p style="color:red;">CSVの読み込みに失敗しました。(${e.message})</p>`;
  }
}

// --- クイズを表示 ---
function showQuestion() {
  const q = quizData[currentQuestion];
  const container = document.getElementById("quiz");
  container.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `Q${currentQuestion + 1}. ${q.question}`;
  container.appendChild(title);

  // 問題画像
  const img = document.createElement("img");
  img.src = q.image;
  img.alt = "question";
  img.className = "question-image";
  container.appendChild(img);

  // 選択肢エリア
  const choices = [
    { id: 1, text: q.choice1, img: q.choice1_img },
    { id: 2, text: q.choice2, img: q.choice2_img },
    { id: 3, text: q.choice3, img: q.choice3_img },
  ];

  const choiceContainer = document.createElement("div");
  choiceContainer.className = "choices";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";

    const cImg = document.createElement("img");
    cImg.src = choice.img;
    cImg.alt = choice.text;
    cImg.className = "choice-image";

    const label = document.createElement("p");
    label.textContent = choice.text;

    btn.appendChild(cImg);
    btn.appendChild(label);
    btn.addEventListener("click", () => checkAnswer(choice.id));
    choiceContainer.appendChild(btn);
  });

  container.appendChild(choiceContainer);
}

// --- 答え合わせ ---
function checkAnswer(selected) {
  const q = quizData[currentQuestion];
  const correct = Number(q.answer);
  const container = document.getElementById("quiz");
  container.innerHTML = "";

  const result = document.createElement("h2");
  if (selected === correct) {
    result.textContent = "せいかい！🎉";
    score++;
  } else {
    result.textContent = "ざんねん...";
  }
  container.appendChild(result);

  // 正解動画を表示
  const video = document.createElement("video");
  video.src = q.answer_video;
  video.controls = true;
  video.autoplay = true;
  video.className = "answer-video";
  container.appendChild(video);

  // 次へボタン
  const next = document.createElement("button");
  next.textContent = "つぎへ ▶";
  next.className = "next-btn";
  next.addEventListener("click", nextQuestion);
  container.appendChild(next);
}

// --- 次の問題へ ---
function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// --- 結果表示 ---
function showResult() {
  const container = document.getElementById("quiz");
  container.innerHTML = `
    <h2>けっかはっぴょう 🎉</h2>
    <p>${score} もん せいかい！</p>
    <button id="restart" class="restart-btn">さいしょから ▶</button>
  `;
  document.getElementById("restart").addEventListener("click", restartQuiz);
}

function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  showQuestion();
}

// --- ページロード時 ---
window.addEventListener("DOMContentLoaded", loadCSV);
