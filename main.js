const statusText = document.getElementById('status-text');
const statusIndicator = document.getElementById('status-indicator');
const resultArea = document.getElementById('result-area');
const idmValue = document.getElementById('idm-value');
const debugLog = document.getElementById('debug-log');

let nfcReader = null;
let isScanning = false;

// デバッグログ追加
function addDebugLog(message, isError = false) {
    const p = document.createElement('p');
    p.textContent = `• ${message}`;
    if (isError) {
        p.className = 'debug-error';
    } else {
        p.className = 'debug-success';
    }
    debugLog.appendChild(p);
    debugLog.scrollTop = debugLog.scrollHeight;
}

// NFC非対応チェック
function checkNFCSupport() {
    if (!('NDEFReader' in window)) {
        addDebugLog('❌ NFC非対応: このブラウザは Web NFC API をサポートしていません', true);
        statusText.innerHTML = '❌ NFC非対応<br>Android Chrome 93+ をご利用ください';
        statusIndicator.textContent = '✗';
        return false;
    }
    addDebugLog('✓ Web NFC API を検出', false);
    return true;
}

// NFC スキャン開始
async function startNFCScan() {
    if (isScanning) return;
    isScanning = true;

    try {
        if (!checkNFCSupport()) {
            isScanning = false;
            return;
        }

        nfcReader = new NDEFReader();
        addDebugLog('NDEFReader インスタンス作成');

        // scan() 呼び出し → ユーザーに NFC 使用許可を求める
        await nfcReader.scan();
        addDebugLog('✓ scan() 成功 - スキャン待機中...');

        statusIndicator.textContent = '⏳';
        statusIndicator.classList.remove('success');
        statusText.innerHTML = '📱 学生証をかざしてください';

        // リーディングイベント
        nfcReader.onreading = (event) => {
            try {
                const idm = event.serialNumber;
                addDebugLog(`✓ NFC 読み込み成功 - IDm: ${idm}`);

                // 16進数形式で表示
                displayIDm(idm);

                // スキャンを停止
                if (nfcReader) {
                    nfcReader.onreading = null;
                }
                isScanning = false;
            } catch (err) {
                addDebugLog(`❌ IDm 抽出エラー: ${err.message}`, true);
            }
        };

        // エラーハンドリング
        nfcReader.onerror = () => {
            addDebugLog('❌ NFC スキャン中止', true);
            statusIndicator.textContent = '⚠';
            statusText.innerHTML = 'スキャンがキャンセルされました<br>もう一度かざしてください';
            isScanning = false;
        };

    } catch (error) {
        const errorMsg = error.message || String(error);
        addDebugLog(`❌ エラー: ${errorMsg}`, true);

        // 一般的なエラーメッセージ
        if (error.name === 'NotAllowedError') {
            statusText.innerHTML = '❌ NFC 使用許可が拒否されました<br>ブラウザ設定を確認してください';
        } else if (error.name === 'NotSupportedError') {
            statusText.innerHTML = '❌ このデバイスは NFC 非対応です';
        } else {
            statusText.innerHTML = `❌ エラー: ${errorMsg}`;
        }

        statusIndicator.textContent = '✗';
        isScanning = false;
    }
}

// IDm 表示
function displayIDm(idm) {
    // 16進数文字列に変換（既に16進数の可能性）
    let hexString = idm;
    if (!idm.match(/^[0-9a-fA-F]+$/)) {
        // バイナリの場合は16進数に変換
        hexString = Array.from(new Uint8Array([idm]))
            .map(x => ('0' + x.toString(16)).slice(-2).toUpperCase())
            .join('');
    } else {
        hexString = idm.toUpperCase();
    }

    idmValue.textContent = hexString;
    resultArea.style.display = 'block';
    statusIndicator.textContent = '✓';
    statusIndicator.classList.add('success');
    statusText.innerHTML = '✅ 読み込み完了！';

    addDebugLog(`表示 IDm: ${hexString}`);
}

// UI リセット
function resetUI() {
    resultArea.style.display = 'none';
    idmValue.textContent = '-';
    statusIndicator.textContent = '●';
    statusIndicator.classList.remove('success');
    statusText.innerHTML = 'スクリーンをタップして、次のカードを読んでください';
    isScanning = false;
    addDebugLog('UI リセット - スキャン準備完了');
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    addDebugLog('ページ読み込み完了');

    if (!checkNFCSupport()) {
        statusIndicator.textContent = '✗';
        return;
    }

    // クリック/タップで スキャン開始
    document.addEventListener('click', () => {
        if (!isScanning && resultArea.style.display === 'none') {
            startNFCScan();
        }
    });
});
