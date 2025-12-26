'use strict';
//1
document.addEventListener('DOMContentLoaded', () => {
  //2
  const time = document.getElementById('time');
  let timeoutID;
  let phase = 0; // 0→開始前、１→開始待機、２→ゲーム中、３→終了
  let startTime;
  let missTypeCount = 0;
  let typeCount = 0;
  let current = 0;
  let letterCount = 0;
  let textTyped;
  let textUntyped;
  const wordObjectList = [];
  const lengthOfWordObjectList = 20;

  const panelContainer = document.getElementsByClassName('panel-container')[0];
  const infoBox = document.getElementById('info');
  const wordCount = document.getElementById('wordCount');
  document.getElementById('wordLength').textContent = lengthOfWordObjectList;
  const missCount = document.getElementById('missCount');
  const resultSection = document.getElementById('results');
  const scoreText = document.getElementById('score');
  const otherResult = document.getElementById('other-result');

  //3
  const clearSound = document.getElementById('type_clear');
  const missSound = document.getElementById('type_miss');
  const countSound = document.getElementById('count_down');
  const startSound = document.getElementById('start_sound');

  //4
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      // 0からiまでのランダムなインデックスを生成
      const j = Math.floor(Math.random() * (i + 1));
      // array[i] と array[j] を入れ替える
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function makeWordObjectList(data) {
    const lines = data.split('\n');
    shuffleArray(lines);
    for (let i = 0; i < lengthOfWordObjectList; i++) {
      let word = lines[i].split(',');
      wordObjectList.push({
        letterUntyped: word[0],
        letterTyped: '',
        word: word[0],
        wordLength: word[0].length,
      });
    }
  }

  function displayTime() {
    const currentTime = Date.now() - startTime;
    const second = String(Math.floor(currentTime / 1000)).padStart(2, '0');
    const millisecond = String(currentTime % 1000).padStart(3, '0');
    time.textContent = `${second}.${millisecond}`;
    timeoutID = setTimeout(displayTime, 10);
  }

  function createPanels() {
    panelContainer.innerHTML = '';
    for (let i = 0; i < lengthOfWordObjectList; i++) {
      const panel = document.createElement('div');
      const spanTyped = document.createElement('span');
      const spanUntyped = document.createElement('span');

      panel.id = `panel-${i}`;
      panel.className = 'panel';
      spanTyped.id = `typed-${i}`;
      spanTyped.className = 'typed';
      spanUntyped.id = `untyped-${i}`;
      spanUntyped.className = 'untyped';

      spanUntyped.textContent = wordObjectList[i].letterUntyped;
      letterCount += wordObjectList[i].wordLength;

      panel.appendChild(spanTyped);
      panel.appendChild(spanUntyped);
      panelContainer.appendChild(panel);
    }
    panelContainer.classList.add('panel-container-play');
    document.getElementById('panel-0').classList.add('active');
  }

  function startGame() {
    for (let i = 3, j = 0; i >= 1; i--, j++) {
      setTimeout(() => {
        infoBox.textContent = i;
        countSound.currentTime = 0;
        countSound.play();
      }, j * 1000);
    }
    setTimeout(async () => {
      phase = 2;
      infoBox.textContent = '';
      await fetch(`csv/word-${level}.csv`)
        .then((response) => response.text())
        .then((data) => makeWordObjectList(data));
      createPanels();
      startTime = Date.now();
      displayTime();
      textTyped = document.getElementById(`typed-${current}`);
      textUntyped = document.getElementById(`untyped-${current}`);
    }, 3000);
  }

  function highlightCurrentPanel() {
    let currentPanel = document.getElementById(`panel-${current - 1}`);
    let nextPanel = document.getElementById(`panel-${current}`);

    currentPanel.classList.remove('active');
    currentPanel.classList.add('faded');
    nextPanel.classList.add('active');
  }

  function checkInput(key) {
    typeCount += 1;

    if (key === wordObjectList[current].letterUntyped.charAt(0)) {
      clearSound.currentTime = 0;
      clearSound.play();

      wordObjectList[current].letterTyped =
        wordObjectList[current].letterTyped +
        wordObjectList[current].letterTyped.charAt(0);
      wordObjectList[current].letterUntyped =
        wordObjectList[current].letterUntyped.substring(1);

      textTyped.textContent = wordObjectList[current].letterTyped;
      textUntyped.textContent = wordObjectList[current].letterUntyped;

      if (wordObjectList[current].letterUntyped.length === 0) {
        current += 1;
        wordCount.textContent = current;
        if (current === lengthOfWordObjectList) {
          endGame();
        } else {
          highlightCurrentPanel();
          textTyped = document.getElementById(`typed-${current}`);
          textUntyped = document.getElementById(`untyped-${current}`);
        }
      }
    } else {
      missSound.currentTime = 0;
      missSound.play();
      missTypeCount += 1;
      missCount.textContent = missTypeCount;
    }
  }

  function endGame() {
    clearTimeout(timeoutID);
    const stopTime = Date.now() - startTime;
    const score = parseInt(
      (typeCount / stopTime) * 60000 * (letterCount / typeCount) ** 3
    );
    scoreText.textContent = `SCORE : ${score}`;
    otherResult.textContent = `合計入力文字数(ミス含む) : ${typeCount}`;
    resultSection.style.display = 'flex';

    for (let i = 0; i < lengthOfWordObjectList; i++) {
      document.getElementById(`panel-${i}`).classList.remove('active', 'faded');
    }

    phase = 3;
    window.scrollTo({
      top: 100,
      left: 0,
      behavior: 'smooth',
    });
  }

  const levelBtns = document.querySelectorAll('.level-btn');
  let radioInput = document.querySelector('.selected-level input');
  let level = radioInput.value;

  function changeLevel(newRadioInput) {
    if (radioInput !== newRadioInput) {
      level = newRadioInput.value;
      newRadioInput.parentElement.classList.add('selected-level');
      radioInput.parentElement.classList.remove('selected-level');
      radioInput = newRadioInput;
    }
  }

  levelBtns.forEach((element) => {
    element.querySelector('input').addEventListener('click', (event) => {
      changeLevel(event.target);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (phase === 0 && event.key === ' ') {
      phase = 1;
      startGame();
    } else if (
      phase === 2 &&
      event.key.length === 1 &&
      event.key.match(/^[a-zA-Z0-9!-/:-@\[-`{-~\s]*$/)
    ) {
      checkInput(event.key);
    } else if (
      phase === 3 &&
      (event.key === 'Enter' || event.key === 'Escape')
    ) {
      this.location.reload();
    }
  });
});
