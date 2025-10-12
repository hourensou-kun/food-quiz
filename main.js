let quizData = [];
let currentIndex = 0;

async function loadCSV() {
  const response = await fetch("data.csv");
  const text = await response.text();
  const rows = text.trim().split("\n").map(row => row.split(","));
  const headers = rows.shift();
  quizData = rows.map(row => Object.fromEntries(row.map((v, i) => [headers[i], v])));
}

function showQuestion() {
  const q = quizData[currentIndex];
  const container = document.getElementById("quiz-container");
  const title = document.getElementById("question-title");
  const img = document.getElementById("question-image");
  const options = document.getElementById("options");
  const result = document.getElementById("result");
  const nextBtn = document.getElementById("next-button");

  title.textContent = q.question;
  img.src = q.image;
  options.innerHTML = "";
  result.classList.add("hidden");

  // 選択肢作成
  ["option1", "option2", "option3", "option4"].forEach(key => {
    if (q[key]) {
      const btn = document.createElement("button");
      btn.textContent = q[key];
      btn.className = "option-btn";
      btn.onclick = () => checkAnswer(q, q[key]);
      options.appendChild(btn);
    }
  });

  nextBtn.classList.add("hidden");
}

function checkAnswer(q, selected) {
  const result = document.getElementById("result");
  const yourAnswer = document.getElementById("your-answer");
  const answerImage = document.getElementById("answer-image");
  const answerText = document.getElementById("answer-text");
  const answerVideo = document.getElementById("answer-video");
  const nextBtn = document.getElementById("next-button");

  // 表示更新
  result.classList.remove("hidden");
  yourAnswer.textContent = `あなたがえらんだのは ${selected}`;
  answerImage.src = q.answerImage;
  answerText.textContent = q.answerText;
  answerVideo.src = q.answerVideo;
  answerVideo.load();

  // 次へボタン表示
  nextBtn.classList.remove("hidden");
}

document.getElementById("next-button").addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < quizData.length) {
    showQuestion();
  } else {
    alert("全問終了しました！");
  }
});

loadCSV().then(showQuestion);
