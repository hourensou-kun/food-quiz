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
  const response = await fetch('./data.csv'); // ← ここを修正！
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

  const choices = [
    { text: q.choice1, img: q.choice1_img },
    { text: q.choice2, img: q.choice2_img },
    { text: q.choice3, img: q.choice3_img }
  ];

  choices.forEach((choice, index) => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = choice.img;
    img.alt = choice.text;
    img.addEventListener("click", () => checkAnswer(index + 1, q.answer, q.answer_video));

    const label = document.createElement("p");
    label.textContent = choice.text;

    div.appendChild(img);
    div.appendChild(label);
    choicesDiv.appendChild(div);
  });
}

// 答え合わせ処理
function checkAnswer(selected, correct, videoPath) {
  const resultText = document.getElementById("result-text");
  const video = document.getElementById("answer-video");

  if (selected.toString() === correct.toString()) {
    score++;
    resultText.textContent = "せいかい！🎉";
  } else {
    resultText.textContent = "ざんねん💦";
  }

  // 答え合わせ動画を再生
  video.src = videoPath;
  video.currentTime = 0;
  video.play();

  showScreen("result-screen");
}

// 次の問題へ
document.getElementById("next-btn").addEventListener("click", () => {
  currentQuestion++;
  if (currentQuestion < quizData.length) {
    document.getElementById("answer-video").pause();
    showQuestion();
    showScreen("quiz-screen");
  } else {
    showScreen("end-screen");
    document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
  }
});

// もういちど
document.getElementById("restart-btn").addEventListener("click", () => {
  location.reload();
});

// スタート→選択画面
document.getElementById("start-btn").addEventListener("click", () => {
  showScreen("select-screen");
});

// 「①かたちクイズ」を選択
document.getElementById("quiz-shape-btn").addEventListener("click", async () => {
  const data = await loadCSV("data/data.csv");
  quizData = getRandomQuestions(data);
  currentQuestion = 0;
  score = 0;
  showQuestion();
  showScreen("quiz-screen");
});
