let quizData = [];
let currentQuestion = 0;
let score = 0;

// CSVを読み込む
fetch("data.csv")
  .then(response => response.text())
  .then(text => {
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();
    quizData = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => (obj[h.trim()] = row[i].trim()));
      return obj;
    });
  });

document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("title-screen").classList.remove("active");
  document.getElementById("select-screen").classList.add("active");
});

document.getElementById("quiz-shape-btn").addEventListener("click", startQuiz);

document.getElementById("restart-btn").addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  showScreen("title-screen");
});

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function startQuiz() {
  showScreen("quiz-screen");
  showQuestion();
}

function showQuestion() {
  const q = quizData[currentQuestion];
  if (!q) return;

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image; // ← 修正済み！

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  const choices = [
    { image: q.choice1_img, correct: true },
    { image: q.choice2_img, correct: false },
    { image: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  choices.forEach(choice => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = choice.image;
    img.addEventListener("click", () => checkAnswer(choice.correct));

    div.appendChild(img);
    choicesDiv.appendChild(div);
  });
}

function checkAnswer(isCorrect) {
  if (isCorrect) score++;

  currentQuestion++;
  if (currentQuestion < quizData.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  showScreen("end-screen");
  document.getElementById("score-text").textContent =
    `せいかいは ${score} / ${quizData.length} でした！`;
}
