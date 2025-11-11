// script.js - CSV対応・答えあわせは動画再生（自動で次に行かない）
// 前提: data.csv は index.html と同じ階層にある
let quizData = [];
let currentQuestion = 0;
let score = 0;

// --- helper: show screen ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// --- CSV読み込み（簡易パース、CSVはカンマのみ使用想定） ---
async function loadCSV(path = './data.csv') {
  const res = await fetch(path);
  if (!res.ok) throw new Error('CSVを取得できませんでした: ' + res.status);
  const text = await res.text();
  // 行ごとに分割、ヘッダを取得
  const rows = text.trim().split('\n').map(r => r.trim());
  const header = rows.shift().split(',').map(h => h.trim());
  const data = rows.map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    header.forEach((h, i) => obj[h] = cols[i] ?? '');
    return obj;
  });
  return data;
}

// --- ランダムに3問抽出 ---
function getRandomQuestions(data, n = 3) {
  return [...data].sort(() => Math.random() - 0.5).slice(0, n);
}

// --- show question ---
function showQuestion() {
  const q = quizData[currentQuestion];
  if (!q) { console.warn('問題データがありません'); return; }

  // 表示初期化
  document.getElementById('feedback-area').textContent = '';
  const vid = document.getElementById('answer-video');
  vid.pause();
  vid.removeAttribute('src');
  vid.load();

  // 問題・画像
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('question-image').src = q.image;

  // 選択肢（choice1 が常に正解と仮定）
  const choices = [
    { text: q.choice1, img: q.choice1_img, correct: true },
    { text: q.choice2, img: q.choice2_img, correct: false },
    { text: q.choice3, img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  const choicesDiv = document.getElementById('choices');
  choicesDiv.innerHTML = '';
  choices.forEach((c) => {
    const wrap = document.createElement('div');
    wrap.className = 'choice-item';
    const img = document.createElement('img');
    img.src = c.img;
    img.alt = c.text || '選択肢';
    img.style.borderRadius = '10px';
    img.style.width = '100%';
    const label = document.createElement('div');
    label.textContent = c.text || '';
    label.style.fontSize = '14px';
    label.style.marginTop = '6px';
    wrap.appendChild(img);
    wrap.appendChild(label);
    // クリック時：1秒○×表示 → 答え合わせ動画へ（自動遷移なし）
    wrap.addEventListener('click', () => {
      // disable further clicks until flow ends
      Array.from(choicesDiv.querySelectorAll('.choice-item')).forEach(el => el.style.pointerEvents = 'none');

      const isCorrect = !!c.correct;
      if (isCorrect) score++;
      // 1秒フィードバック表示
      const feedback = document.getElementById('feedback-area');
      feedback.textContent = isCorrect ? '⭕ せいかい！' : '❌ ざんねん！';
      // small visual
      feedback.style.opacity = '1';
      setTimeout(() => {
        // 移行：答えあわせ画面（動画再生）
        playAnswerVideoFor(q);
      }, 1000);
    });
    choicesDiv.appendChild(wrap);
  });

  // show quiz screen
  showScreen('quiz-screen');
}

// --- 再生（答えあわせ動画） ---
function playAnswerVideoFor(q) {
  showScreen('answer-screen');
  const feedback = document.getElementById('feedback-area');
  // feedback remains visible (already set)
  const video = document.getElementById('answer-video');
  const src = (q.answer_video && q.answer_video.trim()) ? q.answer_video.trim() : 'video/default.mp4';

  // set src and try play (muted to allow autoplay on mobile); controls available
  video.pause();
  video.src = src;
  video.load();
  // try to play (may be blocked if not muted); we set muted attribute in HTML to help autoplay
  video.play().catch(e => {
    // 自動再生ブロックされた場合でも controls で操作可能
    console.warn('自動再生失敗:', e);
  });

  // 動画読み込みエラー処理
  video.onerror = (ev) => {
    console.error('動画読み込みエラー:', src, ev);
    alert('動画を読み込めませんでした。ファイルパスを確認してください。');
  };

  // next button: 手動で次へ（動画終了で自動遷移はしない）
  const nextBtn = document.getElementById('next-btn');
  // remove previous listener by cloning
  const newBtn = nextBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newBtn, nextBtn);
  newBtn.addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
      showQuestion();
    } else {
      showResult();
    }
  });
}

// --- 結果表示 ---
function showResult() {
  showScreen('end-screen');
  document.getElementById('score-text').textContent = `せいかい：${score} / ${quizData.length}`;
}

// --- イベント初期設定 ---
document.getElementById('start-btn').addEventListener('click', () => showScreen('select-screen'));

// かたちクイズ選択
document.getElementById('quiz-shape-btn').addEventListener('click', async () => {
  try {
    const data = await loadCSV('./data.csv');
    // CSVのヘッダ名が「id,question,image,choice1,choice1_img,...,answer,answer_video」に合っている前提
    // パース結果のキー名を実際のCSVヘッダに合わせている（文字列そのまま）
    quizData = getRandomQuestions(data, 3);
    currentQuestion = 0;
    score = 0;
    showQuestion();
  } catch (err) {
    console.error('CSV読み込み失敗', err);
    alert('データ読み込みに失敗しました。CSVファイルを確認してください。');
  }
});

// もういちど
document.getElementById('restart-btn').addEventListener('click', () => location.reload());
