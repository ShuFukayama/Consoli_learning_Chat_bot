// カリキュラムデータ
let curriculumData = [];

// カリキュラムデータの読み込み
async function loadCurriculum() {
    // 通常はAPIやJSONファイルから読み込むが、ここではサンプルデータを直接定義
    const customSectionsPath = '/data/custom_sections.json';
    let customSections = [];
    try {
        const response = await fetch(customSectionsPath);
        customSections = await response.json();
    } catch (error) {
        console.error('Failed to load custom sections:', error);
    }

    curriculumData = [
        {
            id: 'chapter1',
            title: '連結決算の基礎',
            description: '連結決算の基本概念と目的について学びます。',
            concepts: [
                {
                    title: '連結決算とは',
                    content: '連結決算とは、親会社と子会社を経済的に一体とみなして作成する財務諸表です。企業グループ全体の経営成績や財政状態を把握するために重要です。',
                    icon: 'fa-building'
                },
                {
                    title: '連結決算の目的',
                    content: '連結決算の主な目的は、企業グループ全体の経済活動を適切に反映し、投資家や債権者などの利害関係者に有用な情報を提供することです。また、グループ内取引を相殺消去することで、実質的な経済活動を表示します。',
                    icon: 'fa-chart-pie'
                },
                {
                    title: '連結の範囲',
                    content: '連結の範囲とは、どの子会社を連結対象とするかを決定するルールです。一般的に、親会社が実質的に支配している会社（議決権の過半数を所有するなど）は連結対象となります。',
                    icon: 'fa-sitemap'
                }
            ],
            quiz: [
                {
                    question: '連結決算の主な目的は何ですか？',
                    options: [
                        '税金を最小化すること',
                        '企業グループ全体の経済活動を適切に反映すること',
                        '個別企業の業績を詳細に分析すること'
                    ],
                    correctAnswer: 1,
                    explanation: '連結決算の主な目的は、企業グループ全体の経済活動を適切に反映し、投資家や債権者などの利害関係者に有用な情報を提供することです。'
                },
                {
                    question: '一般的に、親会社が議決権の何%以上を所有している場合、その会社は連結対象となりますか？',
                    options: [
                        '20%以上',
                        '50%超',
                        '100%'
                    ],
                    correctAnswer: 1,
                    explanation: '一般的に、親会社が議決権の50%超を所有している場合、その会社は連結対象となります。これは、過半数の議決権を持つことで実質的な支配力を持つと判断されるためです。'
                },
                {
                    question: '連結決算では、グループ内取引はどのように処理されますか？',
                    options: [
                        '2倍に計上される',
                        '相殺消去される',
                        '親会社の取引のみが計上される'
                    ],
                    correctAnswer: 1,
                    explanation: '連結決算では、グループ内取引（内部取引）は相殺消去されます。これは、グループ外部との取引のみを表示し、実質的な経済活動を適切に反映するためです。'
                },
                {
                    question: '連結財務諸表に含まれるものはどれですか？',
                    options: [
                        '連結貸借対照表のみ',
                        '連結損益計算書と連結貸借対照表',
                        '連結貸借対照表、連結損益計算書、連結キャッシュフロー計算書など'
                    ],
                    correctAnswer: 2,
                    explanation: '連結財務諸表には、連結貸借対照表、連結損益計算書、連結包括利益計算書、連結キャッシュフロー計算書、連結株主資本等変動計算書などが含まれます。'
                },
                {
                    question: '次のうち、連結決算の特徴として正しいものはどれですか？',
                    options: [
                        '親会社と子会社の財務諸表を単純に合算したもの',
                        '親会社の財務諸表のみを詳細に分析したもの',
                        '親会社と子会社を経済的に一体とみなして作成したもの'
                    ],
                    correctAnswer: 2,
                    explanation: '連結決算は、親会社と子会社を経済的に一体とみなして作成する財務諸表です。単純な合算ではなく、内部取引の消去や非支配株主持分の調整など、様々な連結手続きが行われます。'
                }
            ]
        },
        {
            id: 'chapter2',
            title: '資本連結',
            description: '資本連結の基本的な考え方と処理方法について学びます。',
            concepts: [
                {
                    title: '資本連結とは',
                    content: '資本連結とは、親会社の子会社に対する投資と、子会社の資本を相殺消去する手続きです。これにより、グループ内の資本関係を消去し、外部に対する純資産のみを表示します。',
                    icon: 'fa-money-bill-transfer'
                },
                {
                    title: '投資と資本の相殺消去',
                    content: '親会社の投資勘定と、それに対応する子会社の資本勘定を相殺消去します。この際、投資額と資本額に差額が生じる場合があります。',
                    icon: 'fa-handshake'
                },
                {
                    title: '連結調整勘定（のれん）',
                    content: '投資額が子会社の資本額を上回る場合、その差額は「のれん」として計上されます。のれんは一定期間にわたって償却されます。逆に、投資額が資本額を下回る場合は「負ののれん」となり、一括して利益計上されます。',
                    icon: 'fa-gem'
                }
            ],
            quiz: [
                {
                    question: '資本連結とは何ですか？',
                    options: [
                        '親会社と子会社の資本金を合算すること',
                        '親会社の子会社に対する投資と、子会社の資本を相殺消去する手続き',
                        '子会社の資本を親会社の資本に置き換えること'
                    ],
                    correctAnswer: 1,
                    explanation: '資本連結とは、親会社の子会社に対する投資勘定と、それに対応する子会社の資本勘定を相殺消去する手続きです。これにより、グループ内の資本関係を消去し、外部に対する純資産のみを表示します。'
                },
                {
                    question: '親会社が子会社株式を1億円で取得し、子会社の純資産の公正価値が8000万円だった場合、のれんはいくらになりますか？',
                    options: [
                        '8000万円',
                        '2000万円',
                        '1億8000万円'
                    ],
                    correctAnswer: 1,
                    explanation: 'のれんは、投資額（1億円）から子会社の純資産の公正価値（8000万円）を差し引いた金額、つまり2000万円となります。'
                },
                {
                    question: 'のれんの会計処理として正しいものはどれですか？',
                    options: [
                        '即時に全額費用計上する',
                        '一定期間にわたって償却する',
                        '永久に資産として計上し続ける'
                    ],
                    correctAnswer: 1,
                    explanation: '日本の会計基準では、のれんは一定期間（通常20年以内）にわたって定額法で償却します。IFRSでは償却せず、毎期減損テストを行います。'
                },
                {
                    question: '負ののれんが発生した場合の会計処理として正しいものはどれですか？',
                    options: [
                        '一定期間にわたって償却する',
                        '即時に全額を利益として計上する',
                        '資本剰余金として計上する'
                    ],
                    correctAnswer: 1,
                    explanation: '日本の会計基準およびIFRSでは、負ののれんは発生した事業年度に一括して利益計上します。'
                },
                {
                    question: '次のうち、資本連結手続きとして正しいものはどれですか？',
                    options: [
                        '親会社と子会社の資本金を単純に合算する',
                        '子会社株式の取得原価と、子会社の資本のうち親会社持分相当額を相殺消去する',
                        '子会社の資本をすべて消去する'
                    ],
                    correctAnswer: 1,
                    explanation: '資本連結手続きでは、子会社株式の取得原価と、子会社の資本のうち親会社持分相当額を相殺消去します。差額はのれんまたは負ののれんとして処理します。'
                }
            ]
        },
        {
            id: 'chapter3',
            title: '内部取引の消去',
            description: 'グループ内部の取引を消去する方法について学びます。',
            concepts: [
                {
                    title: '内部取引消去の意義',
                    content: '内部取引消去とは、グループ会社間で行われた取引を連結財務諸表から消去する処理です。これにより、グループ外部との取引のみを表示し、実質的な経済活動を適切に反映します。',
                    icon: 'fa-arrows-rotate'
                },
                {
                    title: '債権債務の消去',
                    content: 'グループ会社間の債権と債務は、連結財務諸表上で相殺消去されます。例えば、親会社の子会社に対する売掛金と、子会社の親会社に対する買掛金は相殺されます。',
                    icon: 'fa-receipt'
                },
                {
                    title: '取引高の消去',
                    content: 'グループ会社間の売上と仕入は、連結損益計算書上で相殺消去されます。これにより、グループ外部との取引のみが売上高として計上されます。',
                    icon: 'fa-cash-register'
                },
                {
                    title: '未実現利益の消去',
                    content: 'グループ会社間の取引で生じた利益のうち、連結決算日時点でグループ外部に実現していない利益（未実現利益）は消去されます。例えば、親会社が子会社に商品を販売し、その商品が連結決算日時点で子会社の在庫となっている場合、その販売益は消去されます。',
                    icon: 'fa-box'
                }
            ],
            quiz: [
                {
                    question: '内部取引消去の目的は何ですか？',
                    options: [
                        'グループ会社間の取引を強調するため',
                        'グループ外部との取引のみを表示し、実質的な経済活動を適切に反映するため',
                        '税金を最小化するため'
                    ],
                    correctAnswer: 1,
                    explanation: '内部取引消去の目的は、グループ外部との取引のみを表示し、実質的な経済活動を適切に反映することです。グループ内部での取引は、経済的には単なる資金や資産の移動に過ぎないため、連結財務諸表からは消去されます。'
                },
                {
                    question: '親会社が子会社に1000万円の商品を販売し、そのうち600万円分が連結決算日時点で子会社の在庫となっている場合、連結上消去すべき未実現利益はどのように計算されますか？',
                    options: [
                        '1000万円の販売益をすべて消去する',
                        '600万円分の在庫に含まれる利益のみを消去する',
                        '未実現利益の消去は不要である'
                    ],
                    correctAnswer: 1,
                    explanation: '連結上消去すべき未実現利益は、連結決算日時点で子会社の在庫となっている商品に含まれる利益です。この場合、600万円分の商品に含まれる利益（例えば販売価格1000万円のうち原価が800万円であれば、利益率は20%なので、600万円×20%=120万円）を消去します。'
                },
                {
                    question: '親会社が子会社に対して100万円の売掛金を持っている場合、連結財務諸表上ではどのように処理されますか？',
                    options: [
                        '親会社の売掛金100万円と子会社の買掛金100万円を相殺消去する',
                        '親会社の売掛金のみを表示する',
                        '子会社の買掛金のみを表示する'
                    ],
                    correctAnswer: 0,
                    explanation: '親会社が子会社に対して持つ売掛金100万円と、子会社が親会社に対して持つ買掛金100万円は、連結財務諸表上で相殺消去されます。これにより、グループ外部に対する債権債務のみが表示されます。'
                },
                {
                    question: '親会社が子会社に固定資産を売却し、その固定資産が子会社で使用されている場合、未実現利益はどのように処理されますか？',
                    options: [
                        '一括して消去する',
                        '固定資産の残存耐用年数にわたって徐々に実現させる',
                        '未実現利益の消去は不要である'
                    ],
                    correctAnswer: 1,
                    explanation: '親会社が子会社に固定資産を売却した場合、その売却益は連結上の未実現利益となります。この未実現利益は、固定資産の残存耐用年数にわたって徐々に実現させます（減価償却に応じて戻し入れる）。'
                },
                {
                    question: '次のうち、内部取引消去の対象となるものはどれですか？',
                    options: [
                        'グループ会社間の配当金',
                        '親会社の第三者への売上',
                        '子会社の仕入先への支払い'
                    ],
                    correctAnswer: 0,
                    explanation: 'グループ会社間の配当金は内部取引として消去されます。親会社の第三者への売上や子会社の仕入先への支払いは、グループ外部との取引であるため、消去されません。'
                }
            ]
        }
    ];
    
    // カリキュラムの表示
    displayCurriculum();
}

// カリキュラムの表示
function displayCurriculum() {
    const chaptersContainer = document.getElementById('chapters-container');
    if (!chaptersContainer) return;
    
    chaptersContainer.innerHTML = '';
    
    curriculumData.forEach(chapter => {
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        
        // 進捗率の計算
        const progress = calculateChapterProgress(chapter.id);
        
        chapterCard.innerHTML = `
            <h3>${chapter.title}</h3>
            <p>${chapter.description}</p>
            <div class="chapter-progress">${progress}%</div>
            <button class="primary-btn start-btn" data-chapter-id="${chapter.id}">学習する</button>
        `;
        
        chaptersContainer.appendChild(chapterCard);
        
        // 学習ボタンのイベントリスナー
        const startBtn = chapterCard.querySelector('.start-btn');
        startBtn.addEventListener('click', () => openChapter(chapter.id));
    });
}

// 章の進捗率の計算
function calculateChapterProgress(chapterId) {
    const userData = window.appState.currentUser;
    const chapterResults = userData.quizResults[chapterId];
    
    if (!chapterResults) return 0;
    
    const totalQuestions = curriculumData.find(chapter => chapter.id === chapterId).quiz.length;
    const correctAnswers = chapterResults.filter(result => result.correct).length;
    
    return Math.round((correctAnswers / totalQuestions) * 100);
}

// 章を開く
function openChapter(chapterId) {
    const chapter = curriculumData.find(chapter => chapter.id === chapterId);
    if (!chapter) return;
    
    // 現在の章を保存
    window.appState.currentChapter = chapterId;
    localStorage.setItem('lastChapterId', chapterId);
    
    // 章の詳細セクションに切り替え
    window.switchSection('chapter-detail-section');
    
    // 章の内容を表示
    displayChapterContent(chapter);
}

// 章の内容を表示
function displayChapterContent(chapter) {
    const chapterContent = document.getElementById('chapter-content');
    if (!chapterContent) return;
    
    let html = `
        <h2>${chapter.title}</h2>
        <div class="chapter-description">
            <p>${chapter.description}</p>
        </div>
    `;
    
    // 概念解説
    html += '<div class="concepts-section">';
    chapter.concepts.forEach(concept => {
        html += `
            <div class="concept-explanation">
                <h3>${concept.title}</h3>
                <p>${concept.content}</p>
                ${concept.icon ? `<div class="concept-icon"><i class="fas ${concept.icon}"></i></div>` : ''}
            </div>
        `;
    });
    html += '</div>';
    
    // クイズボタン
    html += `
        <div class="quiz-section">
            <h3>理解度確認クイズ</h3>
            <p>この章の内容をどれだけ理解できたか確認しましょう。</p>
            <button id="start-quiz-btn" class="primary-btn start-quiz-btn" data-chapter-id="${chapter.id}">クイズを開始</button>
        </div>
    `;
    
    chapterContent.innerHTML = html;
    
    // クイズボタンのイベントリスナー
    const startQuizBtn = document.getElementById('start-quiz-btn');
    startQuizBtn.addEventListener('click', () => startQuiz(chapter.id));
}

// クイズを開始
function startQuiz(chapterId) {
    const chapter = curriculumData.find(chapter => chapter.id === chapterId);
    if (!chapter) return;
    
    // クイズセクションに切り替え
    window.switchSection('quiz-section');
    
    // クイズの初期化
    initializeQuiz(chapter);
}

// エクスポート
window.loadCurriculum = loadCurriculum;
window.openChapter = openChapter;
window.startQuiz = startQuiz;