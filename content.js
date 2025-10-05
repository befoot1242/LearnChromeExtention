let wordBookPopup = null;
let triggerMode = 'selection'; // デフォルト値
let selectedText = '';
let selectedRange = null;

function getSelectedText() {
  return window.getSelection().toString().trim();
}

function getSentenceContext(selectedText) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return '';
  
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
  
  let textContent = element.textContent || '';
  
  const sentences = textContent.split(/[.!?。！？]/);
  
  for (let sentence of sentences) {
    if (sentence.includes(selectedText)) {
      return sentence.trim();
    }
  }
  
  return textContent.substring(0, 200) + '...';
}

function createWordBookPopup(selectedText, sentence, x, y) {
  if (wordBookPopup) {
    wordBookPopup.remove();
  }
  
  wordBookPopup = document.createElement('div');
  wordBookPopup.id = 'wordbook-popup';
  wordBookPopup.innerHTML = `
    <div class="wordbook-popup-content">
      <h3>単語を登録</h3>
      <div class="wordbook-field">
        <label>単語:</label>
        <input type="text" id="wordbook-word" value="${selectedText}" />
      </div>
      <div class="wordbook-field">
        <label>文章:</label>
        <textarea id="wordbook-sentence" rows="3">${sentence}</textarea>
      </div>
      <div class="wordbook-field">
        <label>意味 (任意):</label>
        <input type="text" id="wordbook-meaning" placeholder="意味を入力" />
      </div>
      <div class="wordbook-buttons">
        <button id="wordbook-save">保存</button>
        <button id="wordbook-cancel">キャンセル</button>
      </div>
    </div>
  `;
  
  wordBookPopup.style.position = 'absolute';
  wordBookPopup.style.left = `${x}px`;
  wordBookPopup.style.top = `${y}px`;
  wordBookPopup.style.zIndex = '10000';
  
  document.body.appendChild(wordBookPopup);
  
  document.getElementById('wordbook-save').addEventListener('click', saveWord);
  document.getElementById('wordbook-cancel').addEventListener('click', closePopup);
  
  document.getElementById('wordbook-word').focus();
}

function saveWord() {
  const word = document.getElementById('wordbook-word').value.trim();
  const sentence = document.getElementById('wordbook-sentence').value.trim();
  const meaning = document.getElementById('wordbook-meaning').value.trim();
  
  if (!word) {
    alert('単語を入力してください');
    return;
  }
  
  const wordData = {
    word: word,
    sentence: sentence,
    meaning: meaning,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({
    action: 'saveWord',
    data: wordData
  }, (response) => {
    if (response && response.success) {
      closePopup();
      showNotification('単語を保存しました！');
    } else {
      alert('保存に失敗しました');
    }
  });
}

function closePopup() {
  if (wordBookPopup) {
    wordBookPopup.remove();
    wordBookPopup = null;
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10001;
    font-family: Arial, sans-serif;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 設定を読み込む
chrome.storage.sync.get({triggerMode: 'selection'}, (result) => {
  triggerMode = result.triggerMode;
});

// 設定変更の通知を受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'settingsChanged') {
    triggerMode = message.settings.triggerMode;
  }
});

// トリガー処理を統合
function handleTextSelection(event) {
  const text = getSelectedText();
  
  if (text.length > 0 && text.length < 100) {
    selectedText = text;
    selectedRange = window.getSelection().getRangeAt(0).cloneRange();
    
    if (triggerMode === 'selection') {
      // 選択するだけで表示
      setTimeout(() => {
        showWordBookPopup(event);
      }, 100);
    }
    // その他のモードでは待機状態
  } else {
    selectedText = '';
    selectedRange = null;
  }
}

function showWordBookPopup(event) {
  if (!selectedText) return;
  
  const sentence = getSentenceContext(selectedText);
  createWordBookPopup(selectedText, sentence, event.pageX + 10, event.pageY + 10);
}

// マウスイベント
document.addEventListener('mouseup', handleTextSelection);

document.addEventListener('mousedown', (event) => {
  // 既存のポップアップを閉じる処理
  if (wordBookPopup && !wordBookPopup.contains(event.target)) {
    closePopup();
    return;
  }
  
  // 選択+左クリックのトリガー処理
  if (selectedText && triggerMode === 'click' && event.button === 0) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selectedRange) {
      const rect = selectedRange.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;
      
      // 選択範囲内でマウスダウンした場合
      if (clickX >= rect.left && clickX <= rect.right && 
          clickY >= rect.top && clickY <= rect.bottom) {
        event.preventDefault();
        showWordBookPopup(event);
      }
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePopup();
  }
  
  // Enterキーでの登録トリガー
  if (event.key === 'Enter' && selectedText && triggerMode === 'key') {
    event.preventDefault();
    showWordBookPopup(event);
  }
});