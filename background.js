chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveWord') {
    saveWordToStorage(request.data, sendResponse);
    return true;
  } else if (request.action === 'getWords') {
    getWordsFromStorage(sendResponse);
    return true;
  } else if (request.action === 'deleteWord') {
    deleteWordFromStorage(request.wordId, sendResponse);
    return true;
  } else if (request.action === 'updateWord') {
    updateWordInStorage(request.wordId, request.data, sendResponse);
    return true;
  }
});

async function saveWordToStorage(wordData, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['wordBook']);
    const wordBook = result.wordBook || [];
    
    const wordId = Date.now().toString();
    const newWord = {
      id: wordId,
      ...wordData
    };
    
    wordBook.push(newWord);
    
    await chrome.storage.local.set({ wordBook: wordBook });
    
    sendResponse({ success: true, wordId: wordId });
  } catch (error) {
    console.error('Error saving word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getWordsFromStorage(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['wordBook']);
    const wordBook = result.wordBook || [];
    
    sendResponse({ success: true, words: wordBook });
  } catch (error) {
    console.error('Error getting words:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function deleteWordFromStorage(wordId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['wordBook']);
    const wordBook = result.wordBook || [];
    
    const updatedWordBook = wordBook.filter(word => word.id !== wordId);
    
    await chrome.storage.local.set({ wordBook: updatedWordBook });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function updateWordInStorage(wordId, updatedData, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['wordBook']);
    const wordBook = result.wordBook || [];
    
    const wordIndex = wordBook.findIndex(word => word.id === wordId);
    if (wordIndex !== -1) {
      wordBook[wordIndex] = { ...wordBook[wordIndex], ...updatedData };
      await chrome.storage.local.set({ wordBook: wordBook });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Word not found' });
    }
  } catch (error) {
    console.error('Error updating word:', error);
    sendResponse({ success: false, error: error.message });
  }
}