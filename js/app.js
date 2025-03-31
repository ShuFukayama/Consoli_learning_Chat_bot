// アプリケーションの状態管理
const appState = {
    currentUser: {
        level: 1,
        progress: 0,
        badges: [],
        completedChapters: [],
        quizResults: {},
        weakPoints: [],
        studyTime: 0
    },
    currentSection: 'home-section',
    currentChapter: null,
    startTime: null
};

// DOM要素の取得
document.addEventListener('DOMContentLoaded', () => {
    // フォーム送信ロジック
    const addSectionForm = document.getElementById('add-section-form');
    if (addSectionForm) {
        addSectionForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const theme = document.getElementById('section-theme').value;

            try {
                const response = await fetch('/api/create-section', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ theme }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create section');
                }

                const result = await response.json();
                alert(`テーマが追加されました: ${result.sectionId}`);
            } catch (error) {
                console.error('Error adding section:', error);
                alert('テーマの追加に失敗しました。');
            }
        });
    }
    // ナビゲーションボタン
    const homeBtn = document.getElementById('home-btn');
    const curriculumBtn = document.getElementById('curriculum-btn');
    const progressBtn = document.getElementById('progress-btn');
    const chatBtn = document.getElementById('chat-btn');
    
    // クイックスタートボタン
    const startLearningBtn = document.getElementById('start-learning-btn');
    const continueLearningBtn = document.getElementById('continue-learning-btn');
    
    // 戻るボタン
    const backToCurriculumBtn = document.getElementById('back-to-curriculum');
    const backToChapterBtn = document.getElementById('back-to-chapter');
    
    // イベントリスナーの設定
    homeBtn.addEventListener('click', () => switchSection('home-section'));
    curriculumBtn.addEventListener('click', () => switchSection('curriculum-section'));
    progressBtn.addEventListener('click', () => switchSection('progress-section'));
    chatBtn.addEventListener('click', () => switchSection('chat-section'));
    
    startLearningBtn.addEventListener('click', () => {
        switchSection('curriculum-section');
        startStudyTimer();
    });
    
    continueLearningBtn.addEventListener('click', () => {
        // 前回の続きから学習を再開する処理
        loadUserProgress();
        if (appState.currentChapter) {
            openChapter(appState.currentChapter);
        } else {
            switchSection('curriculum-section');
        }
        startStudyTimer();
    });
    
    backToCurriculumBtn.addEventListener('click', () => switchSection('curriculum-section'));
    backToChapterBtn.addEventListener('click', () => {
        if (appState.currentChapter) {
            openChapter(appState.currentChapter);
        } else {
            switchSection('curriculum-section');
        }
    });
    
    // アプリケーションの初期化
    initializeApp();
});

// アプリケーションの初期化
function initializeApp() {
    // ローカルストレージからユーザーデータを読み込む
    loadUserData();
    
    // カリキュラムデータの読み込み
    loadCurriculum();
    
    // 進捗表示の更新
    updateProgressDisplay();
    
    // バッジの表示
    displayBadges();
}

// セクション切り替え
function switchSection(sectionId) {
    // 現在のセクションを非表示
    document.getElementById(appState.currentSection).classList.remove('active-section');
    document.getElementById(appState.currentSection).classList.add('section');
    
    // 新しいセクションを表示
    document.getElementById(sectionId).classList.remove('section');
    document.getElementById(sectionId).classList.add('active-section');
    
    // 現在のセクションを更新
    appState.currentSection = sectionId;
    
    // ナビゲーションボタンのアクティブ状態を更新
    updateNavButtons(sectionId);
    
    // セクション固有の初期化処理
    if (sectionId === 'curriculum-section') {
        // カリキュラムセクションが表示されたときの処理
    } else if (sectionId === 'progress-section') {
        // 進捗セクションが表示されたときの処理
        updateProgressDetails();
    }
}

// ナビゲーションボタンのアクティブ状態を更新
function updateNavButtons(activeSectionId) {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (activeSectionId === 'home-section') {
        document.getElementById('home-btn').classList.add('active');
    } else if (activeSectionId === 'curriculum-section' || activeSectionId === 'chapter-detail-section' || activeSectionId === 'quiz-section') {
        document.getElementById('curriculum-btn').classList.add('active');
    } else if (activeSectionId === 'progress-section') {
        document.getElementById('progress-btn').classList.add('active');
    } else if (activeSectionId === 'chat-section') {
        document.getElementById('chat-btn').classList.add('active');
    }
}

// ユーザーデータの読み込み
function loadUserData() {
    const savedData = localStorage.getItem('consolidationMasterUserData');
    if (savedData) {
        appState.currentUser = JSON.parse(savedData);
        console.log('ユーザーデータを読み込みました:', appState.currentUser);
    }
}

// ユーザーデータの保存
function saveUserData() {
    localStorage.setItem('consolidationMasterUserData', JSON.stringify(appState.currentUser));
    console.log('ユーザーデータを保存しました:', appState.currentUser);
}

// 進捗表示の更新
function updateProgressDisplay() {
    // レベル表示
    document.getElementById('user-level').textContent = `レベル ${appState.currentUser.level}`;
    
    // プログレスバーの更新
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${appState.currentUser.progress}%`;
}

// バッジの表示
function displayBadges() {
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    
    appState.currentUser.badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge';
        badgeElement.innerHTML = `<i class="fas ${badge.icon}"></i>`;
        badgeElement.title = badge.name;
        badgesContainer.appendChild(badgeElement);
    });
}

// 学習時間の計測開始
function startStudyTimer() {
    if (!appState.startTime) {
        appState.startTime = new Date();
    }
}

// 学習時間の計測終了と保存
function stopStudyTimer() {
    if (appState.startTime) {
        const endTime = new Date();
        const studyTimeInMinutes = Math.round((endTime - appState.startTime) / (1000 * 60));
        appState.currentUser.studyTime += studyTimeInMinutes;
        appState.startTime = null;
        saveUserData();
    }
}

// ユーザーの進捗状況の読み込み
function loadUserProgress() {
    // 最後に学習していた章を取得
    const lastChapterId = localStorage.getItem('lastChapterId');
    if (lastChapterId) {
        appState.currentChapter = lastChapterId;
    }
}

// ウィンドウを閉じる前に学習時間を保存
window.addEventListener('beforeunload', () => {
    stopStudyTimer();
    saveUserData();
});

// レベルアップ処理
function checkLevelUp() {
    const currentLevel = appState.currentUser.level;
    const newLevel = Math.floor(appState.currentUser.progress / 10) + 1;
    
    if (newLevel > currentLevel) {
        appState.currentUser.level = newLevel;
        alert(`おめでとうございます！レベル${newLevel}になりました！`);
        
        // レベルアップに応じたバッジの付与
        if (newLevel === 5) {
            addBadge('初級マスター', 'fa-star');
        } else if (newLevel === 10) {
            addBadge('中級マスター', 'fa-award');
        } else if (newLevel === 15) {
            addBadge('上級マスター', 'fa-trophy');
        }
        
        updateProgressDisplay();
        saveUserData();
    }
}

// バッジの追加
function addBadge(name, icon) {
    const newBadge = { name, icon };
    appState.currentUser.badges.push(newBadge);
    displayBadges();
}

// エクスポート
window.appState = appState;
window.switchSection = switchSection;
window.saveUserData = saveUserData;
window.updateProgressDisplay = updateProgressDisplay;
window.checkLevelUp = checkLevelUp;
window.addBadge = addBadge;