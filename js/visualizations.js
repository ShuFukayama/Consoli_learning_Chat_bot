/**
 * 連結決算学習用インタラクティブ可視化モジュール
 * 連結決算の概念を視覚的に表現するためのインタラクティブな図を提供します
 */

// 可視化モジュール
const ConsolidationVisualizations = {
    // キャンバスの初期化
    initCanvas(canvasId, width, height) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        return { canvas, ctx };
    },
    
    /**
     * 企業グループ構造の可視化
     * 親会社と子会社の関係を示すインタラクティブな図
     * @param {string} canvasId - キャンバス要素のID
     */
    renderGroupStructure(canvasId) {
        const width = 600;
        const height = 400;
        const { canvas, ctx } = this.initCanvas(canvasId, width, height) || {};
        if (!ctx) return;
        
        // 会社のデータ
        const companies = [
            { id: 'parent', name: '親会社', x: width / 2, y: 80, radius: 50, color: '#ff9999', ownership: 100 },
            { id: 'sub1', name: '子会社A', x: width / 4, y: 220, radius: 40, color: '#99ccff', ownership: 100 },
            { id: 'sub2', name: '子会社B', x: width / 2, y: 220, radius: 40, color: '#99ccff', ownership: 60 },
            { id: 'sub3', name: '関連会社', x: 3 * width / 4, y: 220, radius: 40, color: '#ccccff', ownership: 30 }
        ];
        
        // 接続線の描画
        const drawConnections = () => {
            ctx.lineWidth = 2;
            
            // 親会社から子会社Aへの線
            ctx.beginPath();
            ctx.moveTo(companies[0].x, companies[0].y + companies[0].radius);
            ctx.lineTo(companies[1].x, companies[1].y - companies[1].radius);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
            
            // 親会社から子会社Bへの線
            ctx.beginPath();
            ctx.moveTo(companies[0].x, companies[0].y + companies[0].radius);
            ctx.lineTo(companies[2].x, companies[2].y - companies[2].radius);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
            
            // 親会社から関連会社への線
            ctx.beginPath();
            ctx.moveTo(companies[0].x, companies[0].y + companies[0].radius);
            ctx.lineTo(companies[3].x, companies[3].y - companies[3].radius);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 所有率の表示
            ctx.font = '14px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            
            ctx.fillText(`${companies[1].ownership}%`, (companies[0].x + companies[1].x) / 2, (companies[0].y + companies[1].y) / 2);
            ctx.fillText(`${companies[2].ownership}%`, (companies[0].x + companies[2].x) / 2, (companies[0].y + companies[2].y) / 2);
            ctx.fillText(`${companies[3].ownership}%`, (companies[0].x + companies[3].x) / 2, (companies[0].y + companies[3].y) / 2);
        };
        
        // 会社の描画
        const drawCompanies = () => {
            companies.forEach(company => {
                // 円の描画
                ctx.beginPath();
                ctx.arc(company.x, company.y, company.radius, 0, Math.PI * 2);
                ctx.fillStyle = company.color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#333333';
                if (company.id === 'sub3') {
                    ctx.setLineDash([5, 5]);
                } else {
                    ctx.setLineDash([]);
                }
                ctx.stroke();
                
                // テキストの描画
                ctx.font = '16px Arial';
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                ctx.fillText(company.name, company.x, company.y);
            });
        };
        
        // 凡例の描画
        const drawLegend = () => {
            const legendX = 20;
            const legendY = height - 80;
            
            // 連結対象
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#99ccff';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333333';
            ctx.setLineDash([]);
            ctx.stroke();
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'left';
            ctx.fillText('連結対象（子会社）', legendX + 25, legendY + 5);
            
            // 持分法適用
            ctx.beginPath();
            ctx.arc(legendX + 10, legendY + 30, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ccccff';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333333';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'left';
            ctx.fillText('持分法適用（関連会社）', legendX + 25, legendY + 35);
        };
        
        // 説明テキストの描画
        const drawDescription = () => {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText('企業グループ構造と連結の範囲', width / 2, 30);
            
            ctx.font = '14px Arial';
            ctx.fillText('※議決権所有割合に基づく支配関係を表示', width / 2, height - 20);
        };
        
        // 全体の描画
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            drawConnections();
            drawCompanies();
            drawLegend();
            drawDescription();
        };
        
        // 初回描画
        render();
        
        // インタラクティブ機能の追加
        let isDragging = false;
        let selectedCompany = null;
        
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // クリックした会社を特定
            companies.forEach(company => {
                const distance = Math.sqrt((mouseX - company.x) ** 2 + (mouseY - company.y) ** 2);
                if (distance <= company.radius) {
                    isDragging = true;
                    selectedCompany = company;
                }
            });
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && selectedCompany) {
                const rect = canvas.getBoundingClientRect();
                selectedCompany.x = e.clientX - rect.left;
                selectedCompany.y = e.clientY - rect.top;
                render();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            selectedCompany = null;
        });
        
        // ツールチップの表示
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let tooltipShown = false;
            
            companies.forEach(company => {
                const distance = Math.sqrt((mouseX - company.x) ** 2 + (mouseY - company.y) ** 2);
                if (distance <= company.radius) {
                    canvas.title = `${company.name}: 所有率 ${company.ownership}%`;
                    tooltipShown = true;
                }
            });
            
            if (!tooltipShown) {
                canvas.title = '';
            }
        });
    },
    
    /**
     * 連結財務諸表の構造可視化
     * 連結B/S、P/Lの関係性を示すインタラクティブな図
     * @param {string} canvasId - キャンバス要素のID
     */
    renderFinancialStatements(canvasId) {
        const width = 600;
        const height = 500;
        const { canvas, ctx } = this.initCanvas(canvasId, width, height) || {};
        if (!ctx) return;
        
        // 財務諸表のデータ
        const statements = [
            { id: 'bs', name: '連結貸借対照表', x: width / 4, y: 100, width: 180, height: 220, color: '#ffeecc' },
            { id: 'pl', name: '連結損益計算書', x: 3 * width / 4, y: 100, width: 180, height: 220, color: '#ccffcc' },
            { id: 'cf', name: '連結CF計算書', x: width / 4, y: 350, width: 180, height: 100, color: '#ccecff' },
            { id: 'ci', name: '連結包括利益計算書', x: 3 * width / 4, y: 350, width: 180, height: 100, color: '#ffccff' }
        ];
        
        // 財務諸表の項目
        const bsItems = [
            { name: '資産', y: 140 },
            { name: '負債', y: 180 },
            { name: '純資産', y: 220 }
        ];
        
        const plItems = [
            { name: '売上高', y: 140 },
            { name: '費用', y: 180 },
            { name: '当期純利益', y: 220 }
        ];
        
        const cfItems = [
            { name: '営業CF', y: 370 },
            { name: '投資CF', y: 390 },
            { name: '財務CF', y: 410 }
        ];
        
        const ciItems = [
            { name: '当期純利益', y: 370 },
            { name: 'その他の包括利益', y: 390 },
            { name: '包括利益', y: 410 }
        ];
        
        // 接続線の描画
        const drawConnections = () => {
            ctx.lineWidth = 2;
            
            // B/SとP/Lの接続
            ctx.beginPath();
            ctx.moveTo(statements[0].x + statements[0].width, statements[0].y + 120);
            ctx.lineTo(statements[1].x, statements[1].y + 120);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
            
            // P/LとB/Sの接続（当期純利益→純資産）
            ctx.beginPath();
            ctx.moveTo(statements[1].x, plItems[2].y);
            ctx.lineTo(statements[0].x + statements[0].width, bsItems[2].y);
            ctx.strokeStyle = '#ff6666';
            ctx.stroke();
            
            // P/LとCIの接続
            ctx.beginPath();
            ctx.moveTo(statements[1].x + statements[1].width / 2, statements[1].y + statements[1].height);
            ctx.lineTo(statements[3].x + statements[3].width / 2, statements[3].y);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
            
            // B/SとCFの接続
            ctx.beginPath();
            ctx.moveTo(statements[0].x + statements[0].width / 2, statements[0].y + statements[0].height);
            ctx.lineTo(statements[2].x + statements[2].width / 2, statements[2].y);
            ctx.strokeStyle = '#666666';
            ctx.stroke();
        };
        
        // 財務諸表の描画
        const drawStatements = () => {
            statements.forEach(statement => {
                // 長方形の描画
                ctx.beginPath();
                ctx.rect(statement.x, statement.y, statement.width, statement.height);
                ctx.fillStyle = statement.color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#333333';
                ctx.stroke();
                
                // タイトルの描画
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                ctx.fillText(statement.name, statement.x + statement.width / 2, statement.y + 25);
            });
            
            // B/Sの項目
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#333333';
            bsItems.forEach(item => {
                ctx.fillText(item.name, statements[0].x + 20, item.y);
            });
            
            // P/Lの項目
            plItems.forEach(item => {
                ctx.fillText(item.name, statements[1].x + 20, item.y);
            });
            
            // CFの項目
            cfItems.forEach(item => {
                ctx.fillText(item.name, statements[2].x + 20, item.y);
            });
            
            // CIの項目
            ciItems.forEach(item => {
                ctx.fillText(item.name, statements[3].x + 20, item.y);
            });
        };
        
        // 説明テキストの描画
        const drawDescription = () => {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText('連結財務諸表の構造と関連性', width / 2, 30);
            
            ctx.font = '14px Arial';
            ctx.fillText('※各財務諸表をクリックすると詳細が表示されます', width / 2, height - 20);
        };
        
        // 全体の描画
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            drawConnections();
            drawStatements();
            drawDescription();
        };
        
        // 初回描画
        render();
        
        // インタラクティブ機能の追加
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // クリックした財務諸表を特定
            statements.forEach(statement => {
                if (mouseX >= statement.x && mouseX <= statement.x + statement.width &&
                    mouseY >= statement.y && mouseY <= statement.y + statement.height) {
                    
                    // モーダルで詳細表示（実際のアプリケーションに合わせて実装）
                    alert(`${statement.name}の詳細:\n\n${getStatementDetails(statement.id)}`);
                }
            });
        });
        
        // 財務諸表の詳細情報を取得
        function getStatementDetails(statementId) {
            switch (statementId) {
                case 'bs':
                    return '連結貸借対照表（B/S）は、企業グループ全体の資産、負債、純資産の状況を表します。\n' +
                           '・資産：グループ全体が保有する経済的資源\n' +
                           '・負債：グループ全体が負う債務\n' +
                           '・純資産：資産から負債を差し引いた価値';
                case 'pl':
                    return '連結損益計算書（P/L）は、企業グループ全体の収益、費用、利益の状況を表します。\n' +
                           '・売上高：グループ外部への売上（内部取引は消去）\n' +
                           '・費用：売上原価、販管費など\n' +
                           '・当期純利益：最終的な利益';
                case 'cf':
                    return '連結キャッシュフロー計算書（C/F）は、企業グループ全体の現金の流れを表します。\n' +
                           '・営業CF：事業活動によるキャッシュフロー\n' +
                           '・投資CF：設備投資や資産売却などによるキャッシュフロー\n' +
                           '・財務CF：借入や返済、配当などによるキャッシュフロー';
                case 'ci':
                    return '連結包括利益計算書は、当期純利益に加えてその他の包括利益を含めた包括的な利益を表します。\n' +
                           '・当期純利益：P/Lの最終利益\n' +
                           '・その他の包括利益：為替換算調整勘定、有価証券評価差額金など\n' +
                           '・包括利益：当期純利益とその他の包括利益の合計';
                default:
                    return '';
            }
        }
    },
    
    /**
     * 内部取引消去のインタラクティブ可視化
     * 内部取引の消去プロセスを示すインタラクティブな図
     * @param {string} canvasId - キャンバス要素のID
     */
    renderInternalTransactions(canvasId) {
        const width = 600;
        const height = 400;
        const { canvas, ctx } = this.initCanvas(canvasId, width, height) || {};
        if (!ctx) return;
        
        // 会社のデータ
        const companies = [
            { id: 'parent', name: '親会社', x: width / 4, y: height / 2, radius: 50, color: '#ff9999' },
            { id: 'sub', name: '子会社', x: 3 * width / 4, y: height / 2, radius: 50, color: '#99ccff' }
        ];
        
        // 取引データ
        let transactions = [
            { id: 'sale', name: '売上 1,000万円', fromId: 'parent', toId: 'sub', y: height / 2 - 40, visible: true },
            { id: 'receivable', name: '売掛金 500万円', fromId: 'parent', toId: 'sub', y: height / 2, visible: true },
            { id: 'inventory', name: '在庫 300万円', fromId: 'parent', toId: 'sub', y: height / 2 + 40, visible: true }
        ];
        
        // 消去ボタンのデータ
        const eliminationButton = {
            x: width / 2,
            y: height - 50,
            width: 150,
            height: 40,
            text: '内部取引を消去',
            eliminated: false
        };
        
        // 会社の描画
        const drawCompanies = () => {
            companies.forEach(company => {
                // 円の描画
                ctx.beginPath();
                ctx.arc(company.x, company.y, company.radius, 0, Math.PI * 2);
                ctx.fillStyle = company.color;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#333333';
                ctx.stroke();
                
                // テキストの描画
                ctx.font = '16px Arial';
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                ctx.fillText(company.name, company.x, company.y);
            });
        };
        
        // 取引の描画
        const drawTransactions = () => {
            transactions.forEach(transaction => {
                if (!transaction.visible) return;
                
                const fromCompany = companies.find(c => c.id === transaction.fromId);
                const toCompany = companies.find(c => c.id === transaction.toId);
                
                if (!fromCompany || !toCompany) return;
                
                // 矢印の描画
                ctx.beginPath();
                ctx.moveTo(fromCompany.x + fromCompany.radius, transaction.y);
                ctx.lineTo(toCompany.x - toCompany.radius, transaction.y);
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 矢印の先端
                ctx.beginPath();
                ctx.moveTo(toCompany.x - toCompany.radius, transaction.y);
                ctx.lineTo(toCompany.x - toCompany.radius - 10, transaction.y - 5);
                ctx.lineTo(toCompany.x - toCompany.radius - 10, transaction.y + 5);
                ctx.closePath();
                ctx.fillStyle = '#666666';
                ctx.fill();
                
                // テキストの描画
                ctx.font = '14px Arial';
                ctx.fillStyle = '#333333';
                ctx.textAlign = 'center';
                ctx.fillText(transaction.name, width / 2, transaction.y - 10);
            });
        };
        
        // 消去ボタンの描画
        const drawEliminationButton = () => {
            ctx.beginPath();
            ctx.rect(eliminationButton.x - eliminationButton.width / 2, eliminationButton.y - eliminationButton.height / 2, 
                    eliminationButton.width, eliminationButton.height);
            ctx.fillStyle = eliminationButton.eliminated ? '#cccccc' : '#4CAF50';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#333333';
            ctx.stroke();
            
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(eliminationButton.eliminated ? '内部取引消去済み' : '内部取引を消去', 
                        eliminationButton.x, eliminationButton.y + 5);
        };
        
        // 説明テキストの描画
        const drawDescription = () => {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText('内部取引の消去プロセス', width / 2, 30);
            
            if (eliminationButton.eliminated) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#ff0000';
                ctx.fillText('内部取引消去後の連結財務諸表には、これらの取引は表示されません', width / 2, 60);
            } else {
                ctx.font = '14px Arial';
                ctx.fillStyle = '#333333';
                ctx.fillText('ボタンをクリックして内部取引を消去してください', width / 2, 60);
            }
        };
        
        // 全体の描画
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            drawCompanies();
            drawTransactions();
            drawEliminationButton();
            drawDescription();
        };
        
        // 初回描画
        render();
        
        // インタラクティブ機能の追加
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 消去ボタンのクリック判定
            if (mouseX >= eliminationButton.x - eliminationButton.width / 2 && 
                mouseX <= eliminationButton.x + eliminationButton.width / 2 &&
                mouseY >= eliminationButton.y - eliminationButton.height / 2 && 
                mouseY <= eliminationButton.y + eliminationButton.height / 2) {
                
                if (!eliminationButton.eliminated) {
                    // 内部取引を消去
                    eliminationButton.eliminated = true;
                    
                    // アニメーションで取引を消去
                    let transactionIndex = 0;
                    const eliminateNextTransaction = () => {
                        if (transactionIndex < transactions.length) {
                            transactions[transactionIndex].visible = false;
                            transactionIndex++;
                            render();
                            setTimeout(eliminateNextTransaction, 500);
                        }
                    };
                    
                    eliminateNextTransaction();
                } else {
                    // 内部取引を復元
                    eliminationButton.eliminated = false;
                    transactions.forEach(t => t.visible = true);
                    render();
                }
            }
        });
    }
};

// エクスポート
window.ConsolidationVisualizations = ConsolidationVisualizations;