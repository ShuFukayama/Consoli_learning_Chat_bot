// 定数
const NUM_FIXED_QUESTIONS = 3; // 1回のクイズで使用する固定問題の数
const NUM_AI_QUESTIONS = 2;    // 1回のクイズで生成するAI問題の数
const TOTAL_QUESTIONS = NUM_FIXED_QUESTIONS + NUM_AI_QUESTIONS;

// クイズの状態管理
const quizState = {
    currentChapter: null,
    questions: [],
    currentQuestionIndex: 0,
    selectedOption: null,
    results: []
};

/**
 * クイズの初期化
 * @param {Object} chapter - 章のデータ
 */
async function initializeQuiz(chapter) {
    resetQuizState(chapter.id);
    await prepareQuestions(chapter);
    setupQuizUI(chapter);
}

/**
 * クイズの状態をリセット
 * @param {string} chapterId - 章のID
 */
function resetQuizState(chapterId) {
    quizState.currentChapter = chapterId;
    quizState.questions = [];
    quizState.currentQuestionIndex = 0;
    quizState.selectedOption = null;
    quizState.results = [];
}

/**
 * クイズの問題を準備
 * @param {Object} chapter - 章のデータ
 */
async function prepareQuestions(chapter) {
    try {
        // 保存された問題を取得
        const savedQuestions = await fetchSavedQuestions(chapter.id);
        
        // 固定問題と保存された問題を組み合わせる
        const allQuestions = [...chapter.quiz, ...savedQuestions];
        shuffleArray(allQuestions);
        
        // 必要な数の問題を選択
        const selectedQuestions = allQuestions.slice(0, NUM_FIXED_QUESTIONS);
        quizState.questions = selectedQuestions;
        
        // バックグラウンドでAI問題を準備
        const excludeQuestions = selectedQuestions.map(q => q.question);
        prepareAIQuestionsInBackground(chapter, excludeQuestions);
    } catch (error) {
        console.error('Error preparing quiz questions:', error);
    }
}

/**
 * 保存された問題を取得
 * @param {string} chapterId - 章のID
 * @returns {Array} 保存された問題の配列
 */
async function fetchSavedQuestions(chapterId) {
    try {
        const response = await fetch(`/api/get-saved-questions?chapterId=${chapterId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch saved questions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch saved questions:', error);
        return [];
    }
}

/**
 * クイズUIのセットアップ
 * @param {Object} chapter - 章のデータ
 */
function setupQuizUI(chapter) {
    const quizContainer = document.getElementById('quiz-container');
    
    if (quizState.questions.length > 0) {
        quizContainer.innerHTML = `
            <h3 id="quiz-title"></h3>
            <div id="quiz-question"></div>
            <div id="quiz-options"></div>
            <div id="quiz-feedback" class="hidden"></div>
            <button id="quiz-next-btn" class="primary-btn"></button>
        `;
        
        displayQuestion();
        document.getElementById('quiz-title').textContent = `${chapter.title} - 理解度確認クイズ`;
        
        const nextBtn = document.getElementById('quiz-next-btn');
        nextBtn.textContent = '回答する';
        nextBtn.onclick = checkAnswer;
        nextBtn.disabled = true;
    } else {
        quizContainer.innerHTML = '<p>クイズの問題が見つかりません。</p>';
        console.error("No fixed questions available for the quiz.");
    }
}

/**
 * AI問題をバックグラウンドで準備する関数
 * @param {Object} chapter - 章のデータ
 * @param {Array} excludeQuestions - 除外する問題のリスト
 */
async function prepareAIQuestionsInBackground(chapter, excludeQuestions = []) {
    console.log("Starting background AI question preparation...");
    const fetchedAIQuestions = [];
    let currentExcludeQuestions = [...excludeQuestions];

    for (let i = 0; i < NUM_AI_QUESTIONS; i++) {
        try {
            const newQuestion = await fetchAIQuestion(chapter, currentExcludeQuestions);
            if (newQuestion) {
                fetchedAIQuestions.push(newQuestion);
                currentExcludeQuestions.push(newQuestion.question);
            } else {
                console.warn(`Background AI question ${i + 1} could not be generated.`);
            }
        } catch (error) {
            console.error(`Error fetching background AI question ${i + 1}:`, error);
        }
    }

    // 取得したAI問題を既存の問題リストに追加
    if (fetchedAIQuestions.length > 0) {
        quizState.questions.push(...fetchedAIQuestions);
        console.log("Background AI questions added:", fetchedAIQuestions);
    }
}

/**
 * 配列をシャッフルする関数
 * @param {Array} array - シャッフルする配列
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * 問題の表示
 */
function displayQuestion() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    const questionElement = document.getElementById('quiz-question');
    const optionsElement = document.getElementById('quiz-options');
    const feedbackElement = document.getElementById('quiz-feedback');
    
    // 問題文の設定 (問題数を毎回更新)
    questionElement.innerHTML = `
        <p>問題 ${quizState.currentQuestionIndex + 1}/${quizState.questions.length}</p>
        <h3>${question.question}</h3>
    `;
    
    // 選択肢の設定
    optionsElement.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'quiz-option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', () => selectOption(index));
        
        optionsElement.appendChild(optionElement);
    });
    
    // フィードバックをクリア
    feedbackElement.innerHTML = '';
    feedbackElement.className = 'hidden';
    
    // 次へボタンの設定
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.textContent = '回答する';
    nextBtn.onclick = checkAnswer;
    nextBtn.disabled = true;
    
    // 選択状態のリセット
    quizState.selectedOption = null;
}

/**
 * 選択肢の選択
 * @param {number} index - 選択肢のインデックス
 */
function selectOption(index) {
    // 前の選択をクリア
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => option.classList.remove('selected'));
    
    // 新しい選択を設定
    options[index].classList.add('selected');
    quizState.selectedOption = index;
    
    // 次へボタンを有効化
    document.getElementById('quiz-next-btn').disabled = false;
}

/**
 * 回答のチェック
 */
function checkAnswer() {
    if (quizState.selectedOption === null) return;
    
    const question = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = quizState.selectedOption === question.correctAnswer;
    
    // 結果を保存
    quizState.results.push({
        questionIndex: quizState.currentQuestionIndex,
        selectedOption: quizState.selectedOption,
        correct: isCorrect
    });
    
    // 選択肢の色を変更
    updateOptionStyles(question.correctAnswer, isCorrect);
    
    // フィードバックを表示
    displayFeedback(isCorrect, question.explanation);
    
    // 次へボタンの設定
    updateNextButton();
}

/**
 * 選択肢のスタイルを更新
 * @param {number} correctAnswer - 正解の選択肢のインデックス
 * @param {boolean} isCorrect - 回答が正解かどうか
 */
function updateOptionStyles(correctAnswer, isCorrect) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((option, index) => {
        if (index === correctAnswer) {
            option.classList.add('correct');
        } else if (index === quizState.selectedOption && !isCorrect) {
            option.classList.add('incorrect');
        }
    });
}

/**
 * フィードバックを表示
 * @param {boolean} isCorrect - 回答が正解かどうか
 * @param {string} explanation - 解説
 */
function displayFeedback(isCorrect, explanation) {
    const feedbackElement = document.getElementById('quiz-feedback');
    feedbackElement.innerHTML = `
        <h4>${isCorrect ? '正解です！' : '不正解です。'}</h4>
        <p>${explanation}</p>
    `;
    feedbackElement.className = isCorrect ? 'correct' : 'incorrect';
}

/**
 * 次へボタンの更新
 */
function updateNextButton() {
    const nextBtn = document.getElementById('quiz-next-btn');
    
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        nextBtn.textContent = '次の問題へ';
        nextBtn.onclick = nextQuestion;
    } else {
        nextBtn.textContent = '結果を見る';
        nextBtn.onclick = showResults;
    }
}

/**
 * 次の問題へ
 */
function nextQuestion() {
    quizState.currentQuestionIndex++;
    displayQuestion();
}

/**
 * 結果の表示
 */
function showResults() {
    const correctCount = quizState.results.filter(result => result.correct).length;
    const totalCount = quizState.questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);
    
    // クイズコンテナの内容を結果表示に変更
    const quizContainer = document.getElementById('quiz-container');
    
    let html = `
        <h3>クイズ結果</h3>
        <div class="quiz-result-summary">
            <p>正解数: ${correctCount}/${totalCount} (${percentage}%)</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
    
    // 弱点分析
    if (correctCount < totalCount) {
        html += generateWeakPointsAnalysisHTML();
    }
    
    // 追加学習リソース
    html += generateAdditionalResourcesHTML();
    
    // ボタン
    html += `
        <div class="quiz-result-actions">
            <button id="retry-quiz-btn" class="secondary-btn">もう一度挑戦する</button>
            <button id="back-to-chapter-btn" class="primary-btn">章に戻る</button>
        </div>
    `;
    
    quizContainer.innerHTML = html;
    
    // ボタンのイベントリスナー
    setupResultButtonListeners();
    
    // 学習進捗の更新
    updateLearningProgress();
}

/**
 * 弱点分析HTMLの生成
 * @returns {string} 弱点分析のHTML
 */
function generateWeakPointsAnalysisHTML() {
    let html = `
        <div class="weak-points-analysis">
            <h4>弱点分析</h4>
            <p>以下の問題で間違いがありました。復習しましょう。</p>
            <ul>
    `;
    
    quizState.results.forEach((result, index) => {
        if (!result.correct) {
            const question = quizState.questions[result.questionIndex];
            html += `
                <li>
                    <p><strong>問題:</strong> ${question.question}</p>
                    <p><strong>あなたの回答:</strong> ${question.options[result.selectedOption]}</p>
                    <p><strong>正解:</strong> ${question.options[question.correctAnswer]}</p>
                    <p><strong>解説:</strong> ${question.explanation}</p>
                </li>
            `;
        }
    });
    
    html += `
            </ul>
        </div>
    `;
    
    return html;
}

/**
 * 追加学習リソースHTMLの生成
 * @returns {string} 追加学習リソースのHTML
 */
function generateAdditionalResourcesHTML() {
    return `
        <div class="additional-resources">
            <h4>追加学習リソース</h4>
            <p>さらに理解を深めるために、以下のリソースを参照してください。</p>
            <ul>
                <li><a href="#" class="resource-link">この章の概念を詳しく解説した資料</a></li>
                <li><a href="#" class="resource-link">実務での応用例</a></li>
                <li><a href="#" class="resource-link">関連する会計基準</a></li>
            </ul>
        </div>
    `;
}

/**
 * 結果画面のボタンイベントリスナーのセットアップ
 */
function setupResultButtonListeners() {
    document.getElementById('retry-quiz-btn').addEventListener('click', () => {
        const chapter = curriculumData.find(chapter => chapter.id === quizState.currentChapter);
        initializeQuiz(chapter);
    });
    
    document.getElementById('back-to-chapter-btn').addEventListener('click', () => {
        window.openChapter(quizState.currentChapter);
    });
}

/**
 * AIによる問題生成の呼び出し
 * @param {Object} chapter - 章のデータ
 * @param {Array} excludeQuestions - 除外する問題のリスト
 * @returns {Object|null} 生成された問題またはnull
 */
async function fetchAIQuestion(chapter, excludeQuestions = []) {
    console.log("Attempting to fetch AI question...");

    try {
        const chapterId = chapter.id;
        const chapterData = chapter;

        // 難易度は固定で3
        const difficulty = 3;

        // ユーザーコンテキスト取得
        const currentUser = window.appState?.currentUser;
        const userContext = {
            correctRate: currentUser?.progress || 0,
            weakPoints: currentUser?.weakPoints || []
        };

        const response = await fetch('/api/generate-problem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chapterId,
                difficulty,
                userContext,
                chapterData,
                excludeQuestions
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
        }

        const newQuestion = await response.json();

        // 応答の検証
        if (!newQuestion || typeof newQuestion.question !== 'string' || 
            !Array.isArray(newQuestion.options) || newQuestion.options.length !== 4 || 
            typeof newQuestion.correctAnswer !== 'number' || 
            typeof newQuestion.explanation !== 'string') {
            throw new Error('Invalid question format received from AI.');
        }

        console.log("AI question fetched successfully:", newQuestion);
        return newQuestion;

    } catch (error) {
        console.error('Failed to fetch AI question:', error);
        return null;
    }
}

/**
 * 学習進捗の更新
 */
function updateLearningProgress() {
    const userData = window.appState.currentUser;
    const chapterId = quizState.currentChapter;
    
    // クイズ結果の保存
    if (!userData.quizResults[chapterId]) {
        userData.quizResults[chapterId] = [];
    }
    
    userData.quizResults[chapterId] = quizState.results;
    
    // 章の完了状態の更新
    updateChapterCompletion(userData, chapterId);
    
    // 弱点の分析
    analyzeWeakPoints();
    
    // 進捗率の更新
    updateProgressRate(userData);
    
    // レベルアップのチェック
    window.checkLevelUp();
    
    // 進捗表示の更新
    window.updateProgressDisplay();
    
    // ユーザーデータの保存
    window.saveUserData();
}

/**
 * 章の完了状態の更新
 * @param {Object} userData - ユーザーデータ
 * @param {string} chapterId - 章のID
 */
function updateChapterCompletion(userData, chapterId) {
    if (!userData.completedChapters.includes(chapterId)) {
        const correctCount = quizState.results.filter(result => result.correct).length;
        const totalCount = quizState.questions.length;
        const percentage = (correctCount / totalCount) * 100;
        
        // 70%以上正解で章を完了とみなす
        if (percentage >= 70) {
            userData.completedChapters.push(chapterId);
            
            // 全ての章を完了した場合のバッジ
            if (userData.completedChapters.length === curriculumData.length) {
                window.addBadge('全章制覇', 'fa-crown');
            }
        }
    }
}

/**
 * 進捗率の更新
 * @param {Object} userData - ユーザーデータ
 */
function updateProgressRate(userData) {
    const totalChapters = curriculumData.length;
    const completedChapters = userData.completedChapters.length;
    userData.progress = Math.round((completedChapters / totalChapters) * 100);
}

/**
 * 弱点の分析
 */
function analyzeWeakPoints() {
    const userData = window.appState.currentUser;
    const weakPoints = [];
    
    // 各章のクイズ結果から弱点を分析
    Object.keys(userData.quizResults).forEach(chapterId => {
        const results = userData.quizResults[chapterId];
        const chapter = curriculumData.find(chapter => chapter.id === chapterId);
        
        if (!chapter) return;
        
        // 不正解の問題を集計
        const incorrectResults = results.filter(result => !result.correct);
        
        if (incorrectResults.length > 0) {
            // 章ごとの弱点を追加
            weakPoints.push({
                chapterId,
                chapterTitle: chapter.title,
                incorrectCount: incorrectResults.length,
                totalCount: results.length
            });
        }
    });
    
    // 弱点を不正解率の高い順にソート
    weakPoints.sort((a, b) => {
        const rateA = a.incorrectCount / a.totalCount;
        const rateB = b.incorrectCount / b.totalCount;
        return rateB - rateA;
    });
    
    // 上位3つの弱点を保存
    userData.weakPoints = weakPoints.slice(0, 3);
}

// エクスポート
window.initializeQuiz = initializeQuiz;