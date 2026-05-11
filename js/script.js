let currentMode = 'withdraw';
let transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
let sessions = JSON.parse(localStorage.getItem('mySessions')) || [];

updateUI();

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (tabName === 'summary') renderSummary();
    if (tabName === 'log') renderLog();
}

function setMode(mode) {
    currentMode = mode;
    const isW = mode === 'withdraw';
    document.getElementById('modeWithdraw').classList.toggle('active', isW);
    document.getElementById('modeReturn').classList.toggle('active', !isW);
    document.getElementById('withdraw-section').style.display = isW ? 'block' : 'none';
    document.getElementById('return-section').style.display = isW ? 'none' : 'block';
}

function handleReturn() {
    const amt = parseInt(document.getElementById('returnAmount').value);
    if (!amt) return alert("กรุณาระบุยอดเงิน");
    saveEntry(amt);
    document.getElementById('returnAmount').value = '';
}

function saveEntry(amount) {
    const name = document.getElementById('userName').value.trim();
    if (!name) return alert("กรุณากรอกชื่อ");

    const newTx = {
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name: name,
        type: currentMode,
        amount: amount
    };

    transactions.push(newTx);
    saveData();
    updateUI();
}

// อัปเดต UI แบบไม่มีปุ่มลบ
function updateUI() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = '';
    
    [...transactions].reverse().forEach(t => {
        const isW = t.type === 'withdraw';
        const khitValue = t.amount / 200;
        
        body.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${t.time}</td>
                <td><strong>${t.name}</strong></td>
                <td class="${isW ? 't-red' : 't-green'}">${isW ? '+' : '-'}${t.amount.toLocaleString()}</td>
                <td class="khit-col">${khitValue} ขีด</td>
            </tr>
        `);
    });

    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    document.getElementById('grandTotal').innerText = `${total.toLocaleString()} ฿`;
}

function saveData() {
    localStorage.setItem('myTransactions', JSON.stringify(transactions));
    localStorage.setItem('mySessions', JSON.stringify(sessions));
}

function renderSummary() {
    const container = document.getElementById('summaryList');
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    const keys = Object.keys(summary);
    if (keys.length === 0) return container.innerHTML = '<p style="text-align:center; color:#94a3af;">ไม่มีข้อมูล</p>';
    container.innerHTML = keys.map(name => `
        <div class="person-card">
            <span>${name}</span>
            <strong>${summary[name].toLocaleString()} ฿</strong>
        </div>
    `).join('');
}

function endRound() {
    if (transactions.length === 0) return alert("ไม่มีรายการให้จบยอด");
    if (!confirm("จบยอดรอบนี้และเริ่มรอบใหม่ใช่หรือไม่? (ข้อมูลจะถูกบันทึกลงประวัติรอบ)")) return;
    
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });

    const session = { 
        date: new Date().toLocaleString('th-TH'), 
        total: transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0), 
        details: summary 
    };

    sessions.unshift(session);
    transactions = [];
    saveData();
    updateUI();
    switchTab('log');
}

function renderLog() {
    const container = document.getElementById('logList');
    if (sessions.length === 0) return container.innerHTML = '<p style="text-align:center; color:#94a3af;">ยังไม่มีประวัติ</p>';
    container.innerHTML = sessions.map(s => `
        <div class="log-card">
            <div class="log-date">🕒 ${s.date}</div>
            <div style="font-weight:bold; margin:5px 0;">ยอดรวม: ${s.total.toLocaleString()} ฿</div>
            <div class="log-details">
                ${Object.keys(s.details).map(name => `<span>${name}: ${s.details[name]}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function copySummary() {
    let text = "📊 สรุปยอดเบิก-คืน\n";
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    Object.keys(summary).forEach(n => text += `- ${n}: ${summary[n]} ฿\n`);
    navigator.clipboard.writeText(text).then(() => alert("ก๊อปปี้แล้ว!"));
}
