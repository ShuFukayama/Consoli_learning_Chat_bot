/**
 * 連結決算学習チャットボット
 * モジュール化されたチャットインターフェース
 */

// チャットの状態管理
const chatState = {
    messages: [
        {
            role: 'ai',
            content: 'こんにちは！連結決算について質問があればお気軽にどうぞ。'
        }
    ],
    isProcessing: false,
    typingInterval: null
};

// DOM要素の取得
document.addEventListener('DOMContentLoaded', () => {
    ChatUI.initialize();
});

// ユーティリティ関数
const ChatUtils = {
    /**
     * メッセージのフォーマット（改行やリンクの処理）
     * @param {string} message - フォーマットするメッセージ
     * @returns {string} フォーマットされたメッセージ
     */
    formatMessage(message) {
        if (!message) return '';
        
        // 改行をHTMLの改行に変換
        let formattedMessage = message.replace(/\n/g, '<br>');
        
        // Mermaid図表の検出と処理
        formattedMessage = formattedMessage.replace(
            /```mermaid\s+([\s\S]*?)\s+```/g,
            '<div class="mermaid">$1</div>'
        );
        
        // URLをリンクに変換
        formattedMessage = formattedMessage.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );
        
        // マークダウン風の見出しを変換
        formattedMessage = formattedMessage.replace(
            /^##\s(.+)$/gm,
            '<h4>$1</h4>'
        );
        
        formattedMessage = formattedMessage.replace(
            /^#\s(.+)$/gm,
            '<h3>$1</h3>'
        );
        
        // マークダウン風のリストを変換
        formattedMessage = formattedMessage.replace(
            /^-\s(.+)$/gm,
            '<li>$1</li>'
        );
        
        formattedMessage = formattedMessage.replace(
            /(<li>.*<\/li>)/gs,
            '<ul>$1</ul>'
        );
        
        return formattedMessage;
    },
    
    /**
     * 全体の正解率を計算
     * @returns {number} 正解率（%）
     */
    calculateOverallCorrectRate() {
        if (!window.appState || !window.appState.currentUser) return 0;
        
        const userData = window.appState.currentUser;
        let totalQuestions = 0;
        let correctAnswers = 0;
        
        Object.keys(userData.quizResults || {}).forEach(chapterId => {
            const results = userData.quizResults[chapterId];
            totalQuestions += results.length;
            correctAnswers += results.filter(result => result.correct).length;
        });
        
        if (totalQuestions === 0) return 0;
        return Math.round((correctAnswers / totalQuestions) * 100);
    },
    
    /**
     * 最近学習した内容を取得する関数
     * @returns {string} 最近学習した内容
     */
    getRecentlyStudiedContent() {
        if (!window.appState || !window.curriculumData) return "なし";
        
        const currentChapterId = window.appState.currentChapter;
        if (!currentChapterId) return "なし";
        
        const chapter = window.curriculumData.find(c => c.id === currentChapterId);
        return chapter ? chapter.title : "なし";
    },
    
    /**
     * カリキュラムデータから概念オプションを取得
     * @returns {string} 概念オプションのHTML
     */
    getConceptOptions() {
        if (window.curriculumData) {
            return window.curriculumData.flatMap(chapter => 
                chapter.concepts.map(concept => 
                    `<option value="${concept.title}">${concept.title}</option>`
                )
            ).join('');
        } else {
            return `
                <option value="連結決算の基礎">連結決算の基礎</option>
                <option value="資本連結">資本連結</option>
                <option value="内部取引消去">内部取引消去</option>
                <option value="のれん">のれん</option>
                <option value="未実現利益">未実現利益</option>
            `;
        }
    }
};

// チャットUIモジュール
const ChatUI = {
    /**
     * チャットインターフェースの初期化
     */
    initialize() {
        this.setupEventListeners();
        this.displayChatHistory();
        this.addApiModeToggle();
        this.addDiagramButton();
        
        // Mermaid.jsの初期化（もし読み込まれていれば）
        if (window.mermaid) {
            window.mermaid.initialize({ startOnLoad: true });
        }
        
        // スタイルの追加
        this.addStyles();
    },
    
    /**
     * イベントリスナーのセットアップ
     */
    setupEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        
        sendBtn.addEventListener('click', ChatActions.sendMessage.bind(ChatActions));
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ChatActions.sendMessage();
            }
        });
    },
    
    /**
     * APIモード切替ボタンの追加
     */
    addApiModeToggle() {
        const chatContainer = document.querySelector('.chat-container');
        
        // APIモード切替ボタンの作成
        const apiModeToggle = document.createElement('div');
        apiModeToggle.className = 'api-mode-toggle';
        apiModeToggle.innerHTML = `
            <label for="api-mode-checkbox">APIモード:</label>
            <label class="switch">
                <input type="checkbox" id="api-mode-checkbox">
                <span class="slider"></span>
            </label>
            <span id="api-mode-label">オフ</span>
        `;
        
        // APIモード切替をDOMに追加
        chatContainer.parentNode.insertBefore(apiModeToggle, chatContainer);
        
        // チェックボックスのイベントリスナー
        const apiModeCheckbox = document.getElementById('api-mode-checkbox');
        const apiModeLabel = document.getElementById('api-mode-label');
        const slider = document.querySelector('.slider');
        
        apiModeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                apiModeLabel.textContent = 'オン';
                slider.classList.add('active');
            } else {
                apiModeLabel.textContent = 'オフ';
                slider.classList.remove('active');
            }
        });
        
        // デフォルトでAPIモードをオンにする
        apiModeCheckbox.checked = true;
        apiModeLabel.textContent = 'オン';
        slider.classList.add('active');
    },
    
    /**
     * 図表生成ボタンの追加
     */
    addDiagramButton() {
        const chatInput = document.querySelector('.chat-input');
        
        const diagramBtn = document.createElement('button');
        diagramBtn.id = 'diagram-btn';
        diagramBtn.innerHTML = '<i class="fas fa-chart-bar"></i>';
        diagramBtn.title = '図表を生成';
        diagramBtn.className = 'diagram-btn';
        
        diagramBtn.addEventListener('click', DiagramModule.showOptions);
        
        chatInput.insertBefore(diagramBtn, document.getElementById('send-btn'));
    },
    
    /**
     * チャット履歴の表示
     */
    displayChatHistory() {
        const chatMessages = document.getElementById('chat-messages');
        
        // チャット履歴をクリア
        chatMessages.innerHTML = '';
        
        // メッセージを表示
        chatState.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;
            
            messageElement.innerHTML = `
                <div class="message-content">
                    <p>${ChatUtils.formatMessage(message.content)}</p>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // スクロールを最下部に移動
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Mermaidの初期化
        if (window.mermaid) {
            window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        }
    },
    
    /**
     * 「入力中...」の表示
     */
    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message typing';
        typingElement.id = 'typing-indicator';
        
        typingElement.innerHTML = `
            <div class="message-content">
                <p>入力中<span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span></p>
            </div>
        `;
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // ドットのアニメーション
        let dotIndex = 0;
        const dots = typingElement.querySelectorAll('.typing-dot');
        
        chatState.typingInterval = setInterval(() => {
            dots.forEach((dot, index) => {
                dot.style.opacity = index === dotIndex ? '1' : '0.3';
            });
            
            dotIndex = (dotIndex + 1) % dots.length;
        }, 300);
    },
    
    /**
     * 「入力中...」の表示を削除
     */
    removeTypingIndicator() {
        clearInterval(chatState.typingInterval);
        
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    },
    
    /**
     * スタイルの追加
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .api-mode-toggle, .voice-output-toggle {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .api-mode-toggle label, .voice-output-toggle label {
                margin-right: 10px;
            }
            
            .switch {
                position: relative;
                display: inline-block;
                width: 60px;
                height: 34px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 34px;
            }
            
            .slider:before {
                position: absolute;
                content: '';
                height: 26px;
                width: 26px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            .slider.active {
                background-color: #2196F3;
            }
            
            .slider.active:before {
                transform: translateX(26px);
            }
            
            #api-mode-label {
                margin-left: 10px;
            }
            
            .diagram-btn, .voice-btn {
                background-color: var(--secondary-color, #2ecc71);
                color: white;
                padding: 15px;
                border-radius: var(--border-radius, 8px);
                margin-right: 5px;
                border: none;
                cursor: pointer;
            }
            
            .voice-btn {
                background-color: var(--accent-color, #f39c12);
            }
            
            .voice-btn.active {
                background-color: #e74c3c;
            }
            
            .diagram-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .diagram-modal-content {
                background-color: white;
                padding: 20px;
                border-radius: var(--border-radius, 8px);
                width: 80%;
                max-width: 500px;
            }
            
            .diagram-modal-buttons {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .diagram-modal-buttons button {
                margin-left: 10px;
            }
            
            .typing-dot {
                display: inline-block;
                opacity: 0.3;
                transition: opacity 0.3s;
            }
        `;
        document.head.appendChild(style);
    }
};

// チャットアクションモジュール
const ChatActions = {
    /**
     * メッセージの送信
     */
    sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (message === '' || chatState.isProcessing) return;
        
        // ユーザーメッセージをチャット履歴に追加
        this.addUserMessage(message);
        
        // 入力フィールドをクリア
        userInput.value = '';
        
        // AIの応答を生成
        this.generateAIResponse(message);
    },
    
    /**
     * ユーザーメッセージの追加
     * @param {string} message - ユーザーメッセージ
     */
    addUserMessage(message) {
        // メッセージをチャット状態に追加
        chatState.messages.push({
            role: 'user',
            content: message
        });
        
        // チャット履歴を更新
        ChatUI.displayChatHistory();
    },
    
    /**
     * AIメッセージの追加
     * @param {string} message - AIメッセージ
     */
    addAIMessage(message) {
        // メッセージをチャット状態に追加
        chatState.messages.push({
            role: 'ai',
            content: message
        });
        
        // チャット履歴を更新
        ChatUI.displayChatHistory();
    },
    
    /**
     * AIの応答生成
     * @param {string} userMessage - ユーザーメッセージ
     */
    async generateAIResponse(userMessage) {
        // 処理中フラグを設定
        chatState.isProcessing = true;
        
        // 「入力中...」の表示
        ChatUI.showTypingIndicator();
        
        // APIモードがオンかどうかを確認
        const apiModeCheckbox = document.getElementById('api-mode-checkbox');
        
        try {
            if (apiModeCheckbox && apiModeCheckbox.checked) {
                // バックエンドAPIを呼び出す
                const response = await this.callBackendAPI(userMessage);
                
                // 「入力中...」の表示を削除
                ChatUI.removeTypingIndicator();
                
                // AIメッセージを追加
                this.addAIMessage(response);
            } else {
                // 従来のキーワードベースの応答を生成
                setTimeout(() => {
                    // 「入力中...」の表示を削除
                    ChatUI.removeTypingIndicator();
                    
                    // AIの応答を生成
                    const aiResponse = this.generateSampleResponse(userMessage);
                    
                    // AIメッセージを追加
                    this.addAIMessage(aiResponse);
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating AI response:', error);
            
            // エラーメッセージを表示
            ChatUI.removeTypingIndicator();
            this.addAIMessage(`申し訳ありません。応答の生成中にエラーが発生しました。\n\nエラー詳細: ${error.message}\n\nサーバーが起動しているか、APIキーが正しく設定されているか確認してください。`);
            
            // フォールバックとしてキーワードベースの応答を生成
            setTimeout(() => {
                const aiResponse = this.generateSampleResponse(userMessage);
                this.addAIMessage('フォールバック応答: ' + aiResponse);
            }, 1000);
        } finally {
            // 処理中フラグを解除
            chatState.isProcessing = false;
        }
    },
    
    /**
     * バックエンドAPIを呼び出す関数
     * @param {string} userMessage - ユーザーメッセージ
     * @returns {Promise<string>} AIの応答
     */
    async callBackendAPI(userMessage) {
        try {
            console.log('APIリクエスト送信開始...');
            
            // チャット履歴をAPIの形式に変換
            const messages = chatState.messages.map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : 'user',
                content: msg.content
            }));
            
            // ユーザーコンテキストを収集
            const userContext = {
                completedChapters: window.appState?.currentUser?.completedChapters || [],
                totalChapters: window.curriculumData?.length || 0,
                weakPoints: window.appState?.currentUser?.weakPoints || [],
                correctRate: ChatUtils.calculateOverallCorrectRate(),
                recentlyStudied: ChatUtils.getRecentlyStudiedContent(),
                currentChapter: window.appState?.currentChapter
            };
            
            console.log('APIリクエスト内容:', { messages, userContext });
            
            // バックエンドAPIにリクエストを送信
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    userContext
                })
            });
            
            console.log('APIレスポンス受信:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorData = await response.json().catch(e => ({ error: 'JSONの解析に失敗しました' }));
                throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            console.log('APIレスポンスデータ:', data);
            return data.response;
        } catch (error) {
            console.error('APIリクエスト中のエラー:', error);
            throw new Error(`APIリクエスト失敗: ${error.message}`);
        }
    },
    
    /**
     * サンプルの応答生成（フォールバック用）
     * @param {string} userMessage - ユーザーメッセージ
     * @returns {string} サンプル応答
     */
    generateSampleResponse(userMessage) {
        // ユーザーメッセージを小文字に変換して検索しやすくする
        const lowerMessage = userMessage.toLowerCase();
        
        // キーワードに基づいて応答を生成
        if (lowerMessage.includes('連結決算') && lowerMessage.includes('とは')) {
            return '連結決算とは、親会社と子会社を経済的に一体とみなして作成する財務諸表です。企業グループ全体の経営成績や財政状態を把握するために重要です。';
        } else if (lowerMessage.includes('資本連結')) {
            return '資本連結とは、親会社の子会社に対する投資と、子会社の資本を相殺消去する手続きです。これにより、グループ内の資本関係を消去し、外部に対する純資産のみを表示します。';
        } else if (lowerMessage.includes('のれん')) {
            return 'のれんとは、企業買収時に支払った対価が、被買収企業の純資産の公正価値を超える部分のことです。日本の会計基準では、のれんは一定期間（通常20年以内）にわたって定額法で償却します。';
        } else if (lowerMessage.includes('内部取引')) {
            return '内部取引消去とは、グループ会社間で行われた取引を連結財務諸表から消去する処理です。これにより、グループ外部との取引のみを表示し、実質的な経済活動を適切に反映します。';
        } else if (lowerMessage.includes('未実現利益')) {
            return '未実現利益とは、グループ会社間の取引で生じた利益のうち、連結決算日時点でグループ外部に実現していない利益のことです。例えば、親会社が子会社に商品を販売し、その商品が連結決算日時点で子会社の在庫となっている場合、その販売益は消去されます。';
        } else {
            return 'ご質問ありがとうございます。より具体的な連結決算に関する質問をいただけると、詳しくお答えできます。例えば、「連結決算とは何ですか？」「資本連結の手続きを教えてください」などのように質問していただけると幸いです。';
        }
    }
};

// 図表モジュール
const DiagramModule = {
    /**
     * 図表オプションの表示
     */
    showOptions() {
        // Mermaid.jsが読み込まれているか確認
        if (!window.mermaid) {
            // Mermaid.jsを動的に読み込む
            DiagramModule.loadMermaidJS(() => DiagramModule.showModal());
        } else {
            DiagramModule.showModal();
        }
    },
    
    /**
     * Mermaid.jsの読み込み
     * @param {Function} callback - 読み込み完了後のコールバック
     */
    loadMermaidJS(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
        script.onload = () => {
            window.mermaid.initialize({ startOnLoad: true });
            callback();
        };
        document.head.appendChild(script);
    },
    
    /**
     * 図表モーダルの表示
     */
    showModal() {
        const modal = document.createElement('div');
        modal.className = 'diagram-modal';
        
        // カリキュラムデータから概念を取得
        const conceptOptions = ChatUtils.getConceptOptions();
        
        modal.innerHTML = `
            <div class="diagram-modal-content">
                <h3>図表の生成</h3>
                <p>説明してほしい概念を選択してください：</p>
                <select id="concept-select">
                    ${conceptOptions}
                </select>
                <p>図表の種類：</p>
                <select id="diagram-type">
                    <option value="フローチャート">フローチャート</option>
                    <option value="関係図">関係図</option>
                    <option value="プロセス">プロセス図</option>
                </select>
                <div class="diagram-modal-buttons">
                    <button id="cancel-diagram" class="secondary-btn">キャンセル</button>
                    <button id="generate-diagram" class="primary-btn">生成</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ボタンのイベントリスナー
        document.getElementById('cancel-diagram').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('generate-diagram').addEventListener('click', async () => {
            const concept = document.getElementById('concept-select').value;
            const diagramType = document.getElementById('diagram-type').value;
            modal.remove();
            
            // 図表生成リクエスト
            await DiagramModule.generateAndDisplay(concept, diagramType);
        });
    },
    
    /**
     * 図表の生成と表示
     * @param {string} concept - 概念
     * @param {string} diagramType - 図表の種類
     */
    async generateAndDisplay(concept, diagramType) {
        // 「生成中...」の表示
        ChatActions.addUserMessage(`「${concept}」の${diagramType}を生成してください`);
        ChatUI.showTypingIndicator();
        
        try {
            console.log('図表生成APIリクエスト送信開始...');
            console.log('リクエスト内容:', { concept, diagramType });
            
            const response = await fetch('/api/generate-diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ concept, diagramType })
            });
            
            console.log('図表生成APIレスポンス受信:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorData = await response.json().catch(e => ({ error: 'JSONの解析に失敗しました' }));
                throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            console.log('図表生成APIレスポンスデータ:', data);
            ChatUI.removeTypingIndicator();
            
            // 図表を含むメッセージを追加
            ChatActions.addAIMessage(`「${concept}」の${diagramType}です：\n\n\`\`\`mermaid\n${data.diagramCode}\n\`\`\``);
        } catch (error) {
            console.error('図表生成中のエラー:', error);
            ChatUI.removeTypingIndicator();
            ChatActions.addAIMessage(`申し訳ありません。図表の生成中にエラーが発生しました。\n\nエラー詳細: ${error.message}`);
        }
    }
};

