let allQuestions = [];
let selectedQuestions = [];
let currentIndex = 0;

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const endScreen = document.getElementById("end-screen");
const startButton = document.getElementById("start-button");
const nextButton = document.getElementById("next-button");
const restartButton = document.getElementById("restart-button");
const homeButton = document.getElementById("home-button");

startButton.onclick = startGame;
nextButton.onclick = nextQuestion;
restartButton.onclick = startGame;
homeButton.onclick = goHome;

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

// ✅ CSVを読み込む
fetch("data.csv")
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();
    allQuestions = rows.map(row => {
      const q = {};
      headers.forEach((h, i) => q[h.trim()] = row[i]?.trim());
      return q;
    });
  });

// ✅ ゲームスタート
function startGame() {
  selectedQuestions = shuffle(allQuestions).slice(0, 3);
  currentIndex = 0;
  showScreen(quizScreen);
  showQuestion();
}

// ✅ 次の問題へ
function nextQuestion() {
  currentIndex++;
  if (currentIndex < selectedQuestions.length) {
    showQuestion();
  } else {
    showScreen(endScreen);
  }
}

// ✅ タイトルに戻る
function goHome() {
  showScreen(startScreen);
}

// ✅ 問題を表示
function showQuestion() {
  const q = selectedQuestions[currentIndex];
  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesContainer = document.getElementById("choices");
  const answerArea = document.getElementById("answer-area");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  answerArea.classList.add("hidden");
  choicesContainer.innerHTML = "";

  const choiceList = [
    { text: q.choice1, img: q.choice1_img, index: 1 },
    { text: q.choice2, img: q.choice2_img, index: 2 },
    { text: q.choice3, img: q.choice3_img, index: 3 },
  ].sort(() => 0.5 - Math.random());

  choiceList.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `<img src="${choice.img}" alt="${choice.text}" />`;
    btn.onclick = () => checkAnswer(q, choice);
    choicesContainer.appendChild(btn);
  });
}

// ✅ 答え合わせ
function checkAnswer(q, selected) {
  const answerArea = document.getElementById("answer-area");
  const yourAnswer = document.getElementById("your-answer");
  const correctAnswer = document.getElementById("correct-answer");
  const answerImage = document.getElementById("answer-image");
  const answerVideo = document.getElementById("answer-video");

  const correctIndex = Number(q.answer);
  const correctChoice = {
    text: q[`choice${correctIndex}`],
    img: q[`choice${correctIndex}_img`]
  };

  if (selected.index === correctIndex) {
    yourAnswer.textContent = `せいかい！${correctChoice.text}をきるとこんなかたち！`;
    correctAnswer.textContent = "";
  } else {
    yourAnswer.textContent = `おしい！きみが えらんだのは ${selected.text}`;
    correctAnswer.textContent = `こたえは ${correctChoice.text}！`;
  }

  answerImage.src = correctChoice.img;
  answerVideo.src = q.answer_video;
  answerVideo.autoplay = true;
  answerVideo.loop = false;
  answerVideo.muted = false;
  answerVideo.load();

  answerVideo.oncanplay = () => {
    answerVideo.play().catch(err => {
      console.warn("自動再生がブロックされました:", err);
    });
  };

  answerArea.classList.remove("hidden");
}

// ✅ 配列シャッフル
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
