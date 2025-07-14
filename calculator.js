// Modular Calculator JS

// --- State Management ---
const state = {
  display: '0',
  operand1: null,
  operand2: null,
  operator: null,
  waitingForOperand: false,
  memory: 0,
  history: [],
  theme: 'light',
  sound: true,
  lastResult: null
};

// --- DOM Elements ---
const display = document.getElementById('display');
const memoryIndicator = document.getElementById('memory-indicator');
const historyPanel = document.getElementById('history-panel');
const historyBody = document.getElementById('history-body');
const clearHistoryBtn = document.getElementById('clear-history');
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');
const historyToggle = document.getElementById('history-toggle');
const themeIcon = document.getElementById('theme-icon');
const soundIcon = document.getElementById('sound-icon');
const buttonSound = document.getElementById('button-sound');
let historyPanelOpen = false;

// --- Theme Options ---
const themes = ['light', 'dark', 'blue'];
let themeIndex = 0;

// --- Utility Functions ---
function formatNumber(num) {
  if (num === '' || num === null) return '';
  if (Math.abs(num) < 1e-7) return '0';
  let str = num.toString();
  if (str.length > 12) {
    str = Number(num).toExponential(7).replace(/\.?0+e/, 'e');
  }
  return str.replace(/\.0+$/, '').replace(/(\.[1-9]*)0+$/, '$1');
}
function playSound() {
  if (state.sound) {
    buttonSound.currentTime = 0;
    buttonSound.play();
  }
}
function updateDisplay() {
  display.textContent = state.display;
  memoryIndicator.classList.toggle('visually-hidden', state.memory === 0);
}
function updateTheme() {
  document.body.classList.remove(...themes.map(t => t + "-theme"));
  document.body.classList.add(themes[themeIndex] + "-theme");
  state.theme = themes[themeIndex];
  themeIcon.className = themeIndex === 0 ? 'bi bi-moon' :
                        themeIndex === 1 ? 'bi bi-sun' : 'bi bi-palette';
}
function updateSoundIcon() {
  soundIcon.className = state.sound ? 'bi bi-volume-up' : 'bi bi-volume-mute';
}
function updateHistory() {
  historyBody.innerHTML = '';
  if (state.history.length === 0) {
    historyBody.innerHTML = '<div class="text-secondary text-center mt-3">No history</div>';
    return;
  }
  state.history.slice(-30).reverse().forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `<span class="history-exp">${item.expr}</span>
      <span class="history-result">${item.result}</span>`;
    historyBody.appendChild(div);
  });
}
function saveHistory(expr, result) {
  state.history.push({ expr, result });
  updateHistory();
}
function clearHistory() {
  state.history = [];
  updateHistory();
}
function toggleHistoryPanel() {
  if(historyPanelOpen) {
    historyPanel.classList.add('visually-hidden');
    historyPanel.classList.remove('visible');
    historyPanelOpen = false;
  } else {
    historyPanel.classList.remove('visually-hidden');
    setTimeout(() => historyPanel.classList.add('visible'), 10);
    historyPanelOpen = true;
    updateHistory();
    setTimeout(() => historyPanel.focus(), 100);
  }
}

// --- Calculator Logic ---
function inputDigit(digit) {
  playSound();
  if (state.waitingForOperand) {
    state.display = digit;
    state.waitingForOperand = false;
  } else {
    if (state.display.length >= 14) return;
    state.display = state.display === '0' ? digit : state.display + digit;
  }
  updateDisplay();
}
function inputDecimal() {
  playSound();
  if (state.waitingForOperand) {
    state.display = '0.';
    state.waitingForOperand = false;
  } else if (!state.display.includes('.')) {
    state.display += '.';
  }
  updateDisplay();
}
function toggleSign() {
  playSound();
  if (state.display !== '0') {
    state.display = state.display.startsWith('-')
      ? state.display.slice(1)
      : '-' + state.display;
    updateDisplay();
  }
}
function inputPercent() {
  playSound();
  if (state.display !== '0') {
    state.display = formatNumber(parseFloat(state.display) / 100);
    updateDisplay();
  }
}
function clearAll() {
  playSound();
  state.display = '0';
  state.operand1 = null;
  state.operand2 = null;
  state.operator = null;
  state.waitingForOperand = false;
  updateDisplay();
}
function backspace() {
  playSound();
  if (state.waitingForOperand) return;
  if (state.display.length > 1) {
    state.display = state.display.slice(0, -1);
  } else {
    state.display = '0';
  }
  updateDisplay();
}
function handleOperator(nextOperator) {
  playSound();
  const inputValue = parseFloat(state.display);

  if (state.operator && state.waitingForOperand) {
    state.operator = nextOperator;
    return;
  }

  if (state.operand1 == null) {
    state.operand1 = inputValue;
  } else if (state.operator) {
    const result = performCalculation(state.operand1, inputValue, state.operator);
    state.display = formatNumber(result);
    state.operand1 = result;
    saveHistory(`${formatNumber(state.operand1)} ${getOperatorSymbol(state.operator)} ${formatNumber(inputValue)}`, formatNumber(result));
  }
  state.operator = nextOperator;
  state.waitingForOperand = true;
  updateDisplay();
}
function getOperatorSymbol(op) {
  return {
    plus: '+',
    minus: '−',
    multiply: '×',
    divide: '÷'
  }[op] || op;
}
function performCalculation(a, b, op) {
  switch(op) {
    case 'plus':      return a + b;
    case 'minus':     return a - b;
    case 'multiply':  return a * b;
    case 'divide':    return b === 0 ? 'Error' : a / b;
    default:          return b;
  }
}
function inputEquals() {
  playSound();
  const inputValue = parseFloat(state.display);
  if (state.operator && state.operand1 != null && !state.waitingForOperand) {
    const result = performCalculation(state.operand1, inputValue, state.operator);
    if (result === 'Error') {
      state.display = 'Error';
      state.operand1 = null;
    } else {
      saveHistory(`${formatNumber(state.operand1)} ${getOperatorSymbol(state.operator)} ${formatNumber(inputValue)}`, formatNumber(result));
      state.display = formatNumber(result);
      state.operand1 = result;
      state.lastResult = result;
    }
    state.operator = null;
    state.waitingForOperand = true;
    updateDisplay();
  }
}

// --- Memory Logic ---
function handleMemory(action) {
  playSound();
  switch(action) {
    case 'MC':
      state.memory = 0;
      break;
    case 'MR':
      state.display = formatNumber(state.memory);
      state.waitingForOperand = true;
      break;
    case 'M+':
      state.memory += parseFloat(state.display) || 0;
      break;
    case 'M-':
      state.memory -= parseFloat(state.display) || 0;
      break;
  }
  updateDisplay();
}

// --- Event Listeners ---
document.querySelectorAll('button[data-action]').forEach(btn => {
  btn.addEventListener('click', e => {
    const action = btn.getAttribute('data-action');
    if (!isNaN(action)) {
      inputDigit(action);
    } else {
      switch(action) {
        case 'decimal': inputDecimal(); break;
        case 'plus-minus': toggleSign(); break;
        case 'percent': inputPercent(); break;
        case 'clear': clearAll(); break;
        case 'backspace': backspace(); break;
        case 'plus': handleOperator('plus'); break;
        case 'minus': handleOperator('minus'); break;
        case 'multiply': handleOperator('multiply'); break;
        case 'divide': handleOperator('divide'); break;
        case 'equals': inputEquals(); break;
        case 'MC': case 'MR': case 'M+': case 'M-':
          handleMemory(action); break;
      }
    }
  });
});

// --- Keyboard Support ---
document.addEventListener('keydown', function(event) {
  if(historyPanelOpen && (event.key === 'Escape' || event.key === 'h')) {
    toggleHistoryPanel();
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  let key = event.key;
  if (/\d/.test(key)) {
    inputDigit(key);
  } else if (key === '.') {
    inputDecimal();
  } else if (key === '+' || key === 'Add') {
    handleOperator('plus');
  } else if (key === '-' || key === 'Subtract') {
    handleOperator('minus');
  } else if (key === '*' || key === 'x' || key === 'X') {
    handleOperator('multiply');
  } else if (key === '/' || key === '÷') {
    handleOperator('divide');
  } else if (key === 'Enter' || key === '=') {
    inputEquals();
  } else if (key === '%') {
    inputPercent();
  } else if (key === 'Backspace') {
    backspace();
  } else if (key === 'Delete' || key === 'c' || key === 'C') {
    clearAll();
  } else if (key === 'm' || key === 'M') {
    // memory shortcut: MR
    handleMemory('MR');
  } else if (key === 'h' || key === 'H') {
    toggleHistoryPanel();
  }
});

// --- Theme & Sound Toggles ---
themeToggle.addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % themes.length;
  updateTheme();
});
soundToggle.addEventListener('click', () => {
  state.sound = !state.sound;
  updateSoundIcon();
});
historyToggle.addEventListener('click', toggleHistoryPanel);
if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

// --- Accessibility (ARIA) Enhancements ---
display.addEventListener('focus', () => display.setAttribute('aria-live', 'assertive'));
display.addEventListener('blur', () => display.setAttribute('aria-live', 'polite'));

// --- Init ---
function init() {
  updateDisplay();
  updateTheme();
  updateSoundIcon();
  updateHistory();
}
init();