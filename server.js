// 必要なパッケージのインポート
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();
const port = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 現在のディレクトリを静的ファイルとして提供

// OpenAI互換APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://shrew.japaneast.cloudapp.azure.com'
});

// ユーティリティ関数: OpenAI APIを呼び出す
async function callOpenAI(systemContent, userContent, options = {}) {
  const defaultOptions = {
    model: process.env.OPENAI_MODEL || 'claude-sonnet',
    temperature: 0.7,
    max_tokens: 1000
  };

  const apiOptions = { ...defaultOptions, ...options };
  const messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ];

  try {
    return await openai.chat.completions.create({
      ...apiOptions,
      messages
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error(`AIの応答生成中にエラーが発生しました: ${error.message}`);
  }
}

// ユーティリティ関数: APIレスポンスからJSONを抽出
function extractJsonFromResponse(content) {
  let jsonString = null;

  // 1. Markdownコードブロック内のJSONを試す
  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // 2. 単純なJSONオブジェクトを試す
    const simpleJsonMatch = content.match(/\{[\s\S]*\}/);
    if (simpleJsonMatch && simpleJsonMatch[0]) {
      jsonString = simpleJsonMatch[0].trim();
    }
  }

  if (!jsonString) {
    console.error('Failed to extract JSON from AI response. Content:', content);
    throw new Error('AIからの応答形式が無効です。JSONを抽出できませんでした。');
  }

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('Failed to parse JSON from AI response. String:', jsonString, 'Original Content:', content, 'Error:', parseError);
    throw new Error('AIからの応答をJSONとして解析できませんでした。');
  }
}

// ユーティリティ関数: 保存された問題を読み込む
async function loadSavedQuestions() {
  const savedQuestionsPath = path.join(__dirname, 'data', 'saved_questions.json');
  try {
    const data = await fs.readFile(savedQuestionsPath, 'utf8');
    return JSON.parse(data);
  } catch (readError) {
    // ファイルが存在しない場合は空のオブジェクトを返す
    if (readError.code === 'ENOENT') {
      return {};
    }
    console.warn('Warning reading saved_questions.json:', readError.message);
    return {};
  }
}

// ユーティリティ関数: 問題を保存する
async function saveQuestion(chapterId, problem) {
  const savedQuestionsPath = path.join(__dirname, 'data', 'saved_questions.json');
  try {
    // 既存の問題を読み込む
    const savedQuestions = await loadSavedQuestions();
    
    // 章のIDに対応する配列がなければ作成
    if (!savedQuestions[chapterId]) {
      savedQuestions[chapterId] = [];
    }
    
    // 重複チェック
    const questionExists = savedQuestions[chapterId].some(q => q.question === problem.question);
    if (!questionExists) {
      savedQuestions[chapterId].push(problem);
      await fs.writeFile(savedQuestionsPath, JSON.stringify(savedQuestions, null, 2), 'utf8');
      console.log(`Saved new question for chapter ${chapterId} to ${savedQuestionsPath}`);
      return true;
    } else {
      console.log(`Question already exists for chapter ${chapterId}, not saving duplicate.`);
      return false;
    }
  } catch (saveError) {
    console.error('Error saving generated question:', saveError);
    return false;
  }
}

// APIエンドポイント: コンテキスト認識チャットメッセージの処理
app.post('/api/chat', async (req, res) => {
  try {
    console.log('チャットAPIリクエスト受信:', req.body);
    
    const { messages, userContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({
        error: '無効なメッセージ形式です。',
        details: 'messagesは配列である必要があります。'
      });
    }
    
    // ユーザーコンテキストを含むシステムメッセージ
    let systemContent = '連結決算の専門家として、ユーザーの質問に対して正確かつ詳細に回答してください。専門用語を適切に説明し、必要に応じて例を挙げて理解を助けてください。';
    
    // ユーザーコンテキストが提供されている場合、それを含める
    if (userContext) {
      systemContent += `\n\nユーザーの学習状況: ${userContext.completedChapters?.length || 0}/${userContext.totalChapters || 0}章完了
      弱点分野: ${userContext.weakPoints?.map(wp => wp.chapterTitle).join(', ') || 'なし'}
      正解率: ${userContext.correctRate || 0}%
      最近学習した内容: ${userContext.recentlyStudied || 'なし'}
      これらの情報を考慮して回答を調整してください。`;
    }
    
    console.log('OpenAI APIリクエスト準備:', {
      model: process.env.OPENAI_MODEL || 'claude-sonnet',
      messagesCount: messages.length,
      apiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...` : 'undefined',
      baseURL: process.env.OPENAI_BASE_URL
    });
    
    try {
      // 既存のメッセージ履歴を含めるため、callOpenAI関数を直接使わず、カスタムリクエストを作成
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'claude-sonnet',
        messages: [{ role: 'system', content: systemContent }, ...messages],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      console.log('OpenAI API応答成功:', {
        responseLength: response.choices[0].message.content.length,
        usage: response.usage
      });
      
      // レスポンスを返す
      res.json({
        response: response.choices[0].message.content,
        usage: response.usage
      });
    } catch (apiError) {
      console.error('OpenAI API Error:', apiError);
      res.status(500).json({
        error: 'OpenAI APIでエラーが発生しました。',
        details: apiError.message,
        apiInfo: {
          apiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...` : 'undefined',
          baseURL: process.env.OPENAI_BASE_URL,
          model: process.env.OPENAI_MODEL || 'claude-sonnet'
        }
      });
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      error: 'AIの応答生成中にエラーが発生しました。',
      details: error.message
    });
  }
});

// APIエンドポイント: 図表生成
app.post('/api/generate-diagram', async (req, res) => {
  try {
    console.log('図表生成APIリクエスト受信:', req.body);
    
    const { concept, diagramType } = req.body;
    
    if (!concept || !diagramType) {
      console.error('Invalid request parameters:', { concept, diagramType });
      return res.status(400).json({
        error: '無効なリクエストパラメータです。',
        details: 'conceptとdiagramTypeは必須です。'
      });
    }
    
    const systemContent = 'あなたは図表生成の専門家です。Mermaid.js形式で図表を生成してください。';
    const userContent = `連結決算の概念「${concept}」について、${diagramType}図を作成してください。
    Mermaid.js形式で出力してください。コードのみを返してください。`;
    
    console.log('図表生成OpenAI APIリクエスト準備:', {
      systemContent,
      userContent,
      apiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...` : 'undefined',
      baseURL: process.env.OPENAI_BASE_URL
    });
    
    try {
      const response = await callOpenAI(systemContent, userContent);
      const diagramCode = response.choices[0].message.content.trim();
      
      console.log('図表生成OpenAI API応答成功:', {
        diagramCodeLength: diagramCode.length
      });
      
      res.json({ diagramCode });
    } catch (apiError) {
      console.error('OpenAI API Error in diagram generation:', apiError);
      res.status(500).json({
        error: 'OpenAI APIでエラーが発生しました。',
        details: apiError.message,
        apiInfo: {
          apiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...` : 'undefined',
          baseURL: process.env.OPENAI_BASE_URL,
          model: process.env.OPENAI_MODEL || 'claude-sonnet'
        }
      });
    }
  } catch (error) {
    console.error('Error generating diagram:', error);
    res.status(500).json({
      error: '図表の生成中にエラーが発生しました。',
      details: error.message
    });
  }
});

// APIエンドポイント: 動的問題生成
app.post('/api/generate-problem', async (req, res) => {
  try {
    const { chapterId, difficulty, userContext, excludeQuestions } = req.body;
    const chapter = req.body.chapterData;

    // 除外する問題のプロンプト部分を構築
    const exclusionPrompt = (excludeQuestions && excludeQuestions.length > 0)
      ? `\n\n以下の問題とは異なる内容の問題を生成してください:\n- ${excludeQuestions.join('\n- ')}`
      : '';

    const systemContent = 'あなたは連結決算の専門家で、教育的な問題を作成するエキスパートです。';
    const userContent = `連結決算の「${chapter.title}」に関する問題を生成してください。

    難易度: ${difficulty}（1-5のスケール、5が最も難しい）

    ユーザーの状況:
    - 正解率: ${userContext.correctRate}%
    - 弱点分野: ${userContext.weakPoints.map(wp => wp.chapterTitle).join(', ') || 'なし'}

    章の内容:
    ${chapter.concepts.map(c => `- ${c.title}: ${c.content}`).join('\n')}
    ${exclusionPrompt}

    以下の形式でJSON形式の問題を1つ生成してください (オプションは必ず4つ生成してください):
    {
      "question": "問題文をここに記述",
      "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
      "correctAnswer": 正解の選択肢のインデックス（0から始まる、0から3のいずれか）,
      "explanation": "解説文をここに記述"
    }

    問題は実務的で応用力を試すものにしてください。応答はJSONオブジェクトのみを含み、他のテキストは含めないでください。`;

    const response = await callOpenAI(systemContent, userContent, { temperature: 0.8 });
    const content = response.choices[0].message.content;
    
    // JSONを抽出して解析
    const problem = extractJsonFromResponse(content);
    
    // 問題の形式を検証
    if (!problem.question || !Array.isArray(problem.options) || problem.options.length !== 4 || 
        typeof problem.correctAnswer !== 'number' || !problem.explanation) {
      throw new Error('AIから受け取った問題の形式が無効です。');
    }
    
    // 問題を保存
    await saveQuestion(chapterId, problem);
    
    // 生成された問題をクライアントに返す
    res.json(problem);
  } catch (error) {
    console.error('Error in /api/generate-problem:', error.message, error.stack);
    res.status(500).json({
      error: '問題の生成中にサーバー内部でエラーが発生しました。',
      details: error.message
    });
  }
});

// APIエンドポイント: 実務ケース生成
app.post('/api/generate-case-study', async (req, res) => {
  try {
    const { chapterId, industry } = req.body;
    const chapter = req.body.chapterData;
    
    const systemContent = 'あなたは連結決算の専門家で、実務的なケーススタディを作成するエキスパートです。';
    const userContent = `連結決算の「${chapter.title}」に関する実務的なケーススタディを生成してください。
    
    業界: ${industry}
    
    以下の形式でJSON形式のケーススタディを生成してください:
    {
      "title": "ケーススタディのタイトル",
      "companyName": "架空の企業名",
      "background": "企業の背景情報",
      "situation": "直面している連結決算の状況や課題",
      "data": {
        "親会社": { "資産": "XXX億円", "負債": "XXX億円", "売上": "XXX億円" },
        "子会社A": { "資産": "XXX億円", "負債": "XXX億円", "売上": "XXX億円" },
        "子会社B": { "資産": "XXX億円", "負債": "XXX億円", "売上": "XXX億円" }
      },
      "questions": [
        {
          "question": "問題文",
          "answer": "解答と解説"
        }
      ],
      "solution": "ケースの解決策と学ぶべきポイント"
    }`;
    
    const response = await callOpenAI(systemContent, userContent, { temperature: 0.8, max_tokens: 2000 });
    const content = response.choices[0].message.content;
    
    // JSONを抽出して解析
    const caseStudy = extractJsonFromResponse(content);
    
    res.json(caseStudy);
  } catch (error) {
    console.error('Error generating case study:', error);
    res.status(500).json({ 
      error: 'ケーススタディの生成中にエラーが発生しました。',
      details: error.message
    });
  }
});

// APIエンドポイント: エラー分析
app.post('/api/analyze-errors', async (req, res) => {
  try {
    const { quizResults, chapterData } = req.body;
    
    // 誤答のみを抽出
    const incorrectAnswers = quizResults.filter(result => !result.correct);
    
    if (incorrectAnswers.length === 0) {
      return res.json({ 
        analysis: "誤答がありません。素晴らしい理解度です！",
        misconceptions: [],
        recommendations: []
      });
    }
    
    const systemContent = 'あなたは連結決算の専門家で、学習分析のエキスパートです。';
    const userContent = `連結決算の学習における以下の誤答パターンを分析し、概念の誤解を特定してください。
    
    章のタイトル: ${chapterData.title}
    章の概念:
    ${chapterData.concepts.map(c => `- ${c.title}: ${c.content}`).join('\n')}
    
    誤答:
    ${incorrectAnswers.map((result, i) => {
      const question = chapterData.quiz[result.questionIndex];
      return `${i+1}. 問題: ${question.question}
      - 正解: ${question.options[question.correctAnswer]}
      - 選択した答え: ${question.options[result.selectedOption]}
      - 解説: ${question.explanation}`;
    }).join('\n\n')}
    
    以下の形式でJSON形式の分析結果を生成してください:
    {
      "analysis": "全体的な分析結果の説明",
      "misconceptions": [
        {
          "concept": "誤解している概念",
          "description": "どのように誤解しているかの説明",
          "correction": "正しい理解の説明"
        }
      ],
      "recommendations": [
        "学習推奨事項1",
        "学習推奨事項2"
      ]
    }`;
    
    const response = await callOpenAI(systemContent, userContent, { temperature: 0.7, max_tokens: 1500 });
    const content = response.choices[0].message.content;
    
    // JSONを抽出して解析
    const analysis = extractJsonFromResponse(content);
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing errors:', error);
    res.status(500).json({ 
      error: 'エラー分析中にエラーが発生しました。',
      details: error.message
    });
  }
});

// APIエンドポイント: 保存された問題を取得
app.get('/api/get-saved-questions', async (req, res) => {
  const { chapterId } = req.query;
  if (!chapterId) {
    return res.status(400).json({ error: 'Chapter ID is required' });
  }

  try {
    const savedQuestions = await loadSavedQuestions();
    const chapterQuestions = savedQuestions[chapterId] || [];
    res.json(chapterQuestions);
  } catch (error) {
    console.error(`Error getting saved questions for chapter ${chapterId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve saved questions' });
  }
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Access the app at http://localhost:${port}/index.html`);
});