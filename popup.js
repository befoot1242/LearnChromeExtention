let allWords = [];
let filteredWords = [];

document.addEventListener('DOMContentLoaded', function() {
  loadWords();
  
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('export-btn').addEventListener('click', exportWords);
  document.getElementById('clear-all-btn').addEventListener('click', clearAllWords);
});

function loadWords() {
  chrome.runtime.sendMessage({ action: 'getWords' }, (response) => {
    if (response && response.success) {
      allWords = response.words.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      filteredWords = [...allWords];
      displayWords();
      updateStats();
    }
  });
}

function displayWords() {
  const wordList = document.getElementById('word-list');
  const noWords = document.getElementById('no-words');
  
  if (filteredWords.length === 0) {
    wordList.innerHTML = '';
    wordList.appendChild(noWords);
    return;
  }
  
  noWords.style.display = 'none';
  
  wordList.innerHTML = filteredWords.map(word => `
    <div class="word-item" data-word-id="${word.id}">
      <div class="word-header">
        <div class="word-text">${escapeHtml(word.word)}</div>
        <div class="word-actions">
          <button class="edit-btn" data-word-id="${word.id}" data-action="edit">編集</button>
          <button class="delete-btn" data-word-id="${word.id}" data-action="delete">削除</button>
        </div>
      </div>
      ${word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
      <div class="word-sentence">${escapeHtml(word.sentence)}</div>
      <div class="word-meta">
        <div class="word-url" title="${escapeHtml(word.url)}">${escapeHtml(getDomainFromUrl(word.url))}</div>
        <div class="word-date">${formatDate(word.timestamp)}</div>
      </div>
      <div class="edit-form" id="edit-form-${word.id}">
        <input type="text" id="edit-word-${word.id}" value="${escapeHtml(word.word)}" placeholder="単語">
        <input type="text" id="edit-meaning-${word.id}" value="${escapeHtml(word.meaning || '')}" placeholder="意味">
        <textarea id="edit-sentence-${word.id}" placeholder="文章">${escapeHtml(word.sentence)}</textarea>
        <div class="edit-form-buttons">
          <button class="save-btn" data-word-id="${word.id}" data-action="save">保存</button>
          <button class="cancel-btn" data-word-id="${word.id}" data-action="cancel">キャンセル</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // イベントリスナーを追加
  addWordItemEventListeners();
}

function updateStats() {
  document.getElementById('word-count').textContent = allWords.length;
}

function addWordItemEventListeners() {
  // 編集・削除ボタンのイベントリスナー
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wordId = e.target.getAttribute('data-word-id');
      toggleEdit(wordId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wordId = e.target.getAttribute('data-word-id');
      deleteWord(wordId);
    });
  });
  
  // 保存・キャンセルボタンのイベントリスナー
  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wordId = e.target.getAttribute('data-word-id');
      saveEdit(wordId);
    });
  });
  
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wordId = e.target.getAttribute('data-word-id');
      cancelEdit(wordId);
    });
  });
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  
  if (searchTerm === '') {
    filteredWords = [...allWords];
  } else {
    filteredWords = allWords.filter(word => 
      word.word.toLowerCase().includes(searchTerm) ||
      (word.meaning && word.meaning.toLowerCase().includes(searchTerm)) ||
      word.sentence.toLowerCase().includes(searchTerm)
    );
  }
  
  displayWords();
}

function toggleEdit(wordId) {
  const editForm = document.getElementById(`edit-form-${wordId}`);
  editForm.classList.toggle('active');
}

function cancelEdit(wordId) {
  const editForm = document.getElementById(`edit-form-${wordId}`);
  editForm.classList.remove('active');
  
  const word = allWords.find(w => w.id === wordId);
  if (word) {
    document.getElementById(`edit-word-${wordId}`).value = word.word;
    document.getElementById(`edit-meaning-${wordId}`).value = word.meaning || '';
    document.getElementById(`edit-sentence-${wordId}`).value = word.sentence;
  }
}

function saveEdit(wordId) {
  const word = document.getElementById(`edit-word-${wordId}`).value.trim();
  const meaning = document.getElementById(`edit-meaning-${wordId}`).value.trim();
  const sentence = document.getElementById(`edit-sentence-${wordId}`).value.trim();
  
  if (!word) {
    alert('単語を入力してください');
    return;
  }
  
  const updatedData = { word, meaning, sentence };
  
  chrome.runtime.sendMessage({
    action: 'updateWord',
    wordId: wordId,
    data: updatedData
  }, (response) => {
    if (response && response.success) {
      const wordIndex = allWords.findIndex(w => w.id === wordId);
      if (wordIndex !== -1) {
        allWords[wordIndex] = { ...allWords[wordIndex], ...updatedData };
        filteredWords = allWords.filter(w => 
          filteredWords.some(fw => fw.id === w.id)
        );
        displayWords();
      }
      toggleEdit(wordId);
    } else {
      alert('更新に失敗しました');
    }
  });
}

function deleteWord(wordId) {
  if (!confirm('この単語を削除しますか？')) {
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'deleteWord',
    wordId: wordId
  }, (response) => {
    if (response && response.success) {
      allWords = allWords.filter(word => word.id !== wordId);
      filteredWords = filteredWords.filter(word => word.id !== wordId);
      displayWords();
      updateStats();
    } else {
      alert('削除に失敗しました');
    }
  });
}

function exportWords() {
  if (allWords.length === 0) {
    alert('エクスポートする単語がありません');
    return;
  }
  
  const csvContent = [
    ['単語', '意味', '文章', 'URL', '登録日時'],
    ...allWords.map(word => [
      word.word,
      word.meaning || '',
      word.sentence,
      word.url,
      formatDate(word.timestamp)
    ])
  ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `単語帳_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function clearAllWords() {
  if (!confirm('すべての単語を削除しますか？この操作は取り消せません。')) {
    return;
  }
  
  chrome.storage.local.set({ wordBook: [] }, () => {
    allWords = [];
    filteredWords = [];
    displayWords();
    updateStats();
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url.substring(0, 30) + '...';
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}