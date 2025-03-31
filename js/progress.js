// 進捗画面の更新
function updateProgressDetails() {
    const userData = window.appState.currentUser;
    
    // 完了した章の数
    const completedChapters = userData.completedChapters.length;
    const totalChapters = curriculumData.length;
    document.getElementById('completed-chapters').textContent = `${completedChapters}/${totalChapters}`;
    
    // 正解率
    const correctRate = calculateOverallCorrectRate();
    document.getElementById('correct-rate').textContent = `${correctRate}%`;
    
    // 学習時間
    const studyHours = Math.floor(userData.studyTime / 60);
    const studyMinutes = userData.studyTime % 60;
    document.getElementById('study-time').textContent = `${studyHours}時間${studyMinutes}分`;
    
    // 章ごとの進捗
    updateChapterProgress();
    
    // 弱点分析
    updateWeakPoints();
}

// 全体の正解率を計算
function calculateOverallCorrectRate() {
    const userData = window.appState.currentUser;
    let totalQuestions = 0;
    let correctAnswers = 0;
    
    Object.keys(userData.quizResults).forEach(chapterId => {
        const results = userData.quizResults[chapterId];
        totalQuestions += results.length;
        correctAnswers += results.filter(result => result.correct).length;
    });
    
    if (totalQuestions === 0) return 0;
    return Math.round((correctAnswers / totalQuestions) * 100);
}

// 章ごとの進捗を更新
function updateChapterProgress() {
    const chapterProgressContainer = document.getElementById('chapter-progress-container');
    if (!chapterProgressContainer) return;
    
    chapterProgressContainer.innerHTML = '';
    
    curriculumData.forEach(chapter => {
        const progress = calculateChapterProgress(chapter.id);
        const isCompleted = window.appState.currentUser.completedChapters.includes(chapter.id);
        
        const chapterProgressItem = document.createElement('div');
        chapterProgressItem.className = 'chapter-progress-item';
        
        chapterProgressItem.innerHTML = `
            <div class="chapter-info">
                <h4>${chapter.title}</h4>
                <p>${isCompleted ? '完了' : '未完了'}</p>
            </div>
            <div class="chapter-progress-bar">
                <div class="chapter-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="chapter-progress-percentage">${progress}%</div>
        `;
        
        chapterProgressContainer.appendChild(chapterProgressItem);
        
        // クリックで章を開く
        chapterProgressItem.addEventListener('click', () => window.openChapter(chapter.id));
    });
}

// 弱点分析を更新
function updateWeakPoints() {
    const weakPointsContainer = document.getElementById('weak-points-container');
    if (!weakPointsContainer) return;
    
    const userData = window.appState.currentUser;
    
    if (!userData.weakPoints || userData.weakPoints.length === 0) {
        weakPointsContainer.innerHTML = '<p>まだ弱点は分析されていません。クイズに挑戦して学習を進めましょう。</p>';
        return;
    }
    
    weakPointsContainer.innerHTML = '';
    
    userData.weakPoints.forEach(weakPoint => {
        const incorrectRate = Math.round((weakPoint.incorrectCount / weakPoint.totalCount) * 100);
        
        const weakPointItem = document.createElement('div');
        weakPointItem.className = 'weak-point-item';
        
        weakPointItem.innerHTML = `
            <h4>${weakPoint.chapterTitle}</h4>
            <p>正解率: ${100 - incorrectRate}% (${weakPoint.totalCount - weakPoint.incorrectCount}/${weakPoint.totalCount}問正解)</p>
            <button class="secondary-btn review-btn" data-chapter-id="${weakPoint.chapterId}">復習する</button>
        `;
        
        weakPointsContainer.appendChild(weakPointItem);
        
        // 復習ボタンのイベントリスナー
        const reviewBtn = weakPointItem.querySelector('.review-btn');
        reviewBtn.addEventListener('click', () => window.openChapter(weakPoint.chapterId));
    });
    
    // 追加の学習推奨
    if (userData.weakPoints.length > 0) {
        const recommendationsElement = document.createElement('div');
        recommendationsElement.className = 'learning-recommendations';
        
        recommendationsElement.innerHTML = `
            <h4>学習推奨</h4>
            <p>弱点に基づいて、以下の学習を推奨します：</p>
            <ul>
                <li><strong>${userData.weakPoints[0].chapterTitle}</strong>の概念を再確認し、関連する実務例を学びましょう。</li>
                ${userData.weakPoints.length > 1 ? `<li><strong>${userData.weakPoints[1].chapterTitle}</strong>の演習問題に再挑戦しましょう。</li>` : ''}
            </ul>
        `;
        
        weakPointsContainer.appendChild(recommendationsElement);
    }
    
    // 学習計画の提案
    const learningPlanElement = document.createElement('div');
    learningPlanElement.className = 'learning-plan';
    
    learningPlanElement.innerHTML = `
        <h4>個別学習計画</h4>
        <p>あなたの弱点に合わせた学習計画を作成しました：</p>
        <ol>
            ${userData.weakPoints.map(wp => `<li><strong>${wp.chapterTitle}</strong>を復習する</li>`).join('')}
            <li>未完了の章を学習する</li>
            <li>全体の復習を行う</li>
        </ol>
        <button id="generate-plan-btn" class="primary-btn">詳細な学習計画を作成</button>
    `;
    
    weakPointsContainer.appendChild(learningPlanElement);
    
    // 詳細な学習計画ボタンのイベントリスナー
    document.getElementById('generate-plan-btn').addEventListener('click', generateDetailedLearningPlan);
}

// 詳細な学習計画の生成
function generateDetailedLearningPlan() {
    const userData = window.appState.currentUser;
    
    // AIチャットセクションに切り替え
    window.switchSection('chat-section');
    
    // AIチャットに学習計画の生成を依頼するメッセージを追加
    const weakPointTitles = userData.weakPoints.map(wp => wp.chapterTitle).join('、');
    const message = `私の弱点は「${weakPointTitles}」の分野です。これらを重点的に学習するための詳細な学習計画を作成してください。`;
    
    // チャットにメッセージを追加
    addUserMessageToChat(message);
    
    // AIの応答をシミュレート
    setTimeout(() => {
        const response = generateAILearningPlanResponse(userData.weakPoints);
        addAIMessageToChat(response);
    }, 1000);
}

// AIの学習計画応答を生成
function generateAILearningPlanResponse(weakPoints) {
    let response = '以下にあなたの弱点に合わせた学習計画を作成しました：\n\n';
    
    response += '## 1週間の学習計画\n\n';
    
    weakPoints.forEach((wp, index) => {
        response += `### ${index + 1}日目: ${wp.chapterTitle}\n`;
        response += '- 朝：基本概念の復習（30分）\n';
        response += '- 昼：演習問題の解き直し（30分）\n';
        response += '- 夜：関連する実務例の学習（30分）\n\n';
    });
    
    response += '### 週末：総復習\n';
    response += '- 全ての弱点分野を横断的に復習\n';
    response += '- 新しい演習問題に挑戦\n\n';
    
    response += '## 学習のポイント\n\n';
    response += '1. 単に暗記するのではなく、概念の理解に重点を置く\n';
    response += '2. 実務での応用例を常に意識する\n';
    response += '3. 学習した内容を自分の言葉で説明できるようにする\n\n';
    
    response += 'この学習計画に沿って進めることで、弱点を効率的に克服できるでしょう。何か質問があればいつでも聞いてください！';
    
    return response;
}

// チャットにユーザーメッセージを追加
function addUserMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// チャットにAIメッセージを追加
function addAIMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    
    // 改行をHTMLの改行に変換
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${formattedMessage}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// エクスポート
window.updateProgressDetails = updateProgressDetails;