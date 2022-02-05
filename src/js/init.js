const TOGGLE_BTN = document.getElementById('tfJsHp-insert-canvas');
const TOGGLE_TARGET = document.getElementById('tfJsHp-target-toggle');
const CALIBRATE = document.getElementById('tfJsHp-calibrate-btn');
const OPEN_INSTRUCTIONS = document.getElementById('tfJsHp-inst-btn');
const OPEN_OPTIONS = document.getElementById('tfJsHp-options-btn');

TOGGLE_BTN.addEventListener('click', function() {
  if (TOGGLE_TARGET.classList[1] === 'unEnable') {
    TOGGLE_TARGET.classList.remove('unEnable');
    TOGGLE_TARGET.classList.add('enable');

    injectCanvas();
  } else {
    TOGGLE_TARGET.classList.remove('enable');
    TOGGLE_TARGET.classList.add('unEnable');
    removeCanvas();
  }
});
// get the current active tab set by ES6 destructuring assignment
// and inject the canvas
async function injectCanvas() {
  const [TAB] = await chrome.tabs.query({active: true,
    currentWindow: true});
  chrome.scripting.executeScript({
    target: {tabId: TAB.id},
    files: ['js/content-script.js'],
  });
};
// communicate to the content-script that user has toggled off
async function removeCanvas() {
  await chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {onToggle: true});
  });
}

// send if calibration done already and if canvas is set
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   chrome.tabs.sendMessage(tabs[0].id,
//       {isCalibrated: isCalibrated, canvasSetup: canvasSetup});
// });

CALIBRATE.addEventListener('click', ()=>{
  chrome.tabs.create({url: chrome.runtime.getURL('src/calibrate.html')});
});

OPEN_INSTRUCTIONS.addEventListener('click', ()=>{
  chrome.tabs.create({url: chrome.runtime.getURL('src/instructions.html')});
});

OPEN_OPTIONS.addEventListener('click', ()=>{
  chrome.tabs.create({url: chrome.runtime.getURL('src/options.html')});
});
