let quizData = [];
let selectedQuestions = [];
let currentIndex = 0;

// CSV読み込み
async function loadCSV() {
  const response = await fetch("data.csv");
  const text = await response.text();
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows.shift();
  quizData = rows.map(r => Object.fromEntries(r.map((v, i) => [headers[i], v])));
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// スタートボタン
document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");

  selectedQuestions = shuffle([...quizData]).slice(0, 3);
  currentIndex = 0;
  showQuestion();
});

// 問題表示
function showQuestion() {
  const q = selectedQuestions[currentIndex];
  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");
  const answerArea = document.getElementById("answer-area");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  answerArea.classList.add("hidden");
  choices.innerHTML = "";

  const choiceList = [
    { id: 1, text: q.choice1, img: q.choice1_img },
    { id: 2, text: q.choice2, img: q.choice2_img },
    { id: 3, text: q.choice3, img: q.choice3_img }
  ];

  shuffle(choiceList).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `<img src="${choice.img}" alt="${choice.text}" />`;
    btn.onclick = () => checkAnswer(q, choice);
    choices.appendChild(btn);
  });
}

// 回答チェック
function checkAnswer(q, selected) {
  const answerArea = document.getElementById("answer-area");
  const yourAnswer = document.getElementById("your-answer");
  const correctAnswer = document.getElementById("correct-answer");
  const answerImage = document.getElementById("answer-image");
  const answerVideo = document.getElementById("answer-video");

  const correct = Number(q.answer);
  const correctChoice = {
    text: q[`choice${correct}`],
    img: q[`choice${correct}_img`]
  };

  if (selected.id === correct) {
    yourAnswer.textContent = ` せいかい！${correctChoice.text}はこれ！`;
  } else {
    yourAnswer.textContent = `おしい！あなたが えらんだのは ${selected.text}`;
    correctAnswer.textContent = ` ${correctChoice.text}　はこれ！`;
  }

  answerImage.src = correctChoice.img;
  answerVideo.src = q.answer_video;
  answerVideo.load();

  answerArea.classList.remove("hidden");
}

// 次の問題へ
document.getElementById("next-button").addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < selectedQuestions.length) {
    document.getElementById("your-answer").textContent = "";
    document.getElementById("correct-answer").textContent = "";
    showQuestion();
  } else {
    document.getElementById("quiz-screen").classList.add("hidden");
    document.getElementById("end-screen").classList.remove("hidden");
  }
});

// もう一度あそぶ
document.getElementById("restart-button").addEventListener("click", () => {
  document.getElementById("end-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");
  selectedQuestions = shuffle([...quizData]).slice(0, 3);
  currentIndex = 0;
  showQuestion();
});

// はじめにもどる
document.getElementById("home-button").addEventListener("click", () => {
  document.getElementById("end-screen").classList.add("hidden");
  document.getElementById("start-screen").classList.remove("hidden");
});

loadCSV();
