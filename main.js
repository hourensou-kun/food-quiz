// main.js
// あなたの data.csv の列構成に完全対応

let quizData = [];
let currentQuestion = 0;
let score = 0;

// CSVファイルを読み込む
async function loadCSV() {
  const response = await fetch("data.csv");
  const csvText = await response.text();
  const rows = csvText.trim().split("\n").map(row => row.split(","));
  const header = rows.shift();

  quizData = rows.map(cols => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = cols[i];
    });
    return obj;
  });

  showQuestion();
}

// クイズ表示
function showQuestion() {
  const q = quizData[currentQuestion];
  const container = document.getElementById("quiz");
  container.innerHTML = "";

  const questionEl = document.createElement("h2");
  questionEl.textContent = q.question;
  container.appendChild(questionEl);

  // 質問画像
  const img = document.createElement("img");
  img.src = q.image;
  img.className = "question-image";
  container.appendChild(img);

  // 選択肢ボタン
  const choices = [
    { text: q.choice1, img: q.choice1_img, id: 1 },
    { text: q.choice2, img: q.choice2_img, id: 2 },
    { text: q.choice3, img: q.choice3_img, id: 3 },
  ];

  const choiceContainer = document.createElement("div");
  choiceContainer.className = "choices";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";

    const choiceImg = document.createElement("img");
    choiceImg.src = choice.img;
    choiceImg.className = "choice-image";

    const label = document.createElement("span");
    label.textContent = choice.text;

    btn.appendChild(choiceImg);
    btn.appendChild(label);

    btn.addEventListener("click", () => checkAnswer(choice.id));
    choiceContainer.appendChild(btn);
  });

  container.appendChild(choiceContainer);
}

// 回答チェック
function checkAnswer(selected) {
  const q = quizData[currentQuestion];
  const container = document.getElementById("quiz");
  container.innerHTML = "";

  const correct = Number(q.answer);

  const result = document.createElement("h2");
  if (selected === correct) {
    result.textContent = "せいかい！ 🎉";
    score++;
  } else {
    result.textContent = "ざんねん...";
  }
  container.appendChild(result);

  // 答えの動画を表示
  const video = document.createElement("video");
  video.src = q.answer_video;
  video.controls = true;
  video.autoplay = true;
  video.className = "answer-video";
  container.appendChild(video);

  // 次へボタン
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "つぎへ ▶";
  nextBtn.className = "next-btn";
  nextBtn.addEventListener("click", nextQuestion);
  container.appendChild(nextBtn);
}

// 次の問題
function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// 結果表示
function showResult() {
  const container = document.getElementById("quiz");
  container.innerHTML = `
    <h2>けっかはっぴょう！</h2>
    <p>${score} もん せいかいしました！</p>
    <button class="restart-btn">さいしょから ▶</button>
  `;
  document.querySelector(".restart-btn").addEventListener("click", () => {
    currentQuestion = 0;
    score = 0;
    showQuestion();
  });
}

// ページ読み込み時に実行
window.addEventListener("DOMContentLoaded", loadCSV);
