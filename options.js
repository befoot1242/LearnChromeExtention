// 設定のデフォルト値
const DEFAULT_SETTINGS = {
  triggerMode: 'selection'
};

// 設定を読み込む
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
    const triggerMode = result.triggerMode;
    
    // ラジオボタンを設定
    const radioButton = document.getElementById(`trigger-${triggerMode}`);
    if (radioButton) {
      radioButton.checked = true;
      updateRadioSelection(triggerMode);
    }
  });
}

// ラジオボタンの見た目を更新
function updateRadioSelection(selectedValue) {
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach(option => {
    option.classList.remove('selected');
  });
  
  const selectedOption = document.querySelector(`#trigger-${selectedValue}`).closest('.radio-option');
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
}

// 設定を保存する
function saveSettings() {
  const selectedTrigger = document.querySelector('input[name="trigger"]:checked');
  if (!selectedTrigger) {
    return;
  }
  
  const settings = {
    triggerMode: selectedTrigger.value
  };
  
  chrome.storage.sync.set(settings, () => {
    // 成功メッセージを表示
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // 3秒後にメッセージを隠す
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
    
    // 設定変更をcontent scriptに通知
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsChanged',
            settings: settings
          }).catch(() => {
            // エラーは無視（content scriptが読み込まれていないページもあるため）
          });
        }
      });
    });
  });
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // ラジオボタンの変更を監視
  const radioButtons = document.querySelectorAll('input[name="trigger"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (event) => {
      updateRadioSelection(event.target.value);
    });
  });
  
  // ラジオオプション全体をクリック可能にする
  const radioOptions = document.querySelectorAll('.radio-option');
  radioOptions.forEach(option => {
    option.addEventListener('click', (event) => {
      if (event.target.tagName !== 'INPUT') {
        const radio = option.querySelector('input[type="radio"]');
        radio.checked = true;
        updateRadioSelection(radio.value);
      }
    });
  });
  
  // 保存ボタンのイベント
  document.getElementById('saveButton').addEventListener('click', saveSettings);
});