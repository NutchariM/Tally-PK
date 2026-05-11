let currentMode = 'withdraw';
let transactions = [];
let sessions = [];

// 1. ฟังก์ชันโหลดข้อมูลแบบ Safe-Mode (ป้องกัน Invalid Date)
function loadData() {
    try {
        transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
        sessions = JSON.parse(localStorage.getItem('mySessions')) || [];
    } catch (e) {
        console.error("Data Corrupted", e);
        transactions = [];
        sessions = [];
    }
}

// 2. ฟังก์ชันสลับ Tab ตาม URL Hash (#)
function handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'record';
    
    // ซ่อนทุกหน้า
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));

    // แสดงหน้าตาม Hash
    const targetTab = document.getElementById(`tab-${hash}`);
    const targetBtn = document.getElementById(`btn-${hash}`);
    
    if (targetTab && targetBtn) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }

    // จัดการ Footer
    const footer = document.querySelector('.footer-summary');
    if (footer) footer.style.display = (hash === 'record') ? 'block' : 'none';

    // โหลดข้อมูลใหม่ทุกครั้งที่เปลี่ยนหน้า (กันแคชข้อมูล)
    loadData();
    if (hash === 'record') updateUI();
    if (hash === 'summary') renderSummary();
    if (hash === 'log') renderLog();
}

// ตรวจจับการเปลี่ยน URL
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

function setMode(mode) {
    currentMode = mode;
    const isW = mode === 'withdraw';
    document.getElementById('modeWithdraw').classList.toggle('active', isW);
    document.getElementById('modeReturn').classList.toggle('active', !isW);
    document.getElementById('withdraw-section').style.display = isW ? 'block' : 'none';
    document.getElementById('return-section').style.display = isW ? 'none' : 'block';
}

function saveEntry(amount) {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    if (!name) return alert("กรุณาใส่ชื่อ");

    const newTx = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name: name,
        type: currentMode,
        amount: amount
    };

    transactions.push(newTx);
    saveData();
    updateUI();
}

function updateUI() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = '';
    [...transactions].reverse().forEach(t => {
        const isW = t.type === 'withdraw';
        body.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${t.time}</td>
                <td><strong>${t.name}</strong></td>
                <td class="${isW ? 't-red' : 't-green'}">${isW ? '+' : '-'}${t.amount.toLocaleString()}</td>
                <td class="khit-col">${t.amount / 200} ขีด</td>
            </tr>
        `);
    });
    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    document.getElementById('grandTotal').innerText = `${total.toLocaleString()} ฿`;
}

function renderLog() {
    const container = document.getElementById('logList');
    const filter = document.getElementById('logDateFilter').value;
    if (sessions.length === 0) return container.innerHTML = '';

    let filtered = sessions;
    if (filter) {
        filtered = sessions.filter(s => {
            try {
                if (!s.id) return false;
                return new Date(s.id).toISOString().split('T')[0] === filter;
            } catch(e) { return false; }
        });
    }

    if (filter && filtered.length === 0) {
        container.innerHTML = '<p class="empty-msg">❌ ไม่พบข้อมูล</p>';
        return;
    }

    container.innerHTML = filtered.map(s => `
        <div class="log-card">
            <div class="log-date">🕒 ${s.date || 'ไม่มีวันที่'}</div>
            <div style="font-weight:bold; margin:5px 0;">ยอดรวม: ${(s.total || 0).toLocaleString()} ฿</div>
            <div class="log-details">${s.details ? Object.keys(s.details).map(n => `<span>${n}: ${s.details[n].toLocaleString()}</span>`).join('') : ''}</div>
        </div>
    `).join('');
}

function handleReturn() {
    const val = parseInt(document.getElementById('returnAmount').value);
    if (!val) return alert("ใส่ยอดเงินด้วย");
    saveEntry(val);
    document.getElementById('returnAmount').value = '';
}

function renderSummary() {
    const container = document.getElementById('summaryList');
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    const keys = Object.keys(summary);
    container.innerHTML = keys.length ? keys.map(n => `<div class="person-card"><span>${n}</span><strong>${summary[n].toLocaleString()} ฿</strong></div>`).join('') : '';
}

function endRound() {
    if (!transactions.length) return alert("ไม่มีข้อมูล");
    if (!confirm("จบยอด?")) return;
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    sessions.unshift({ id: Date.now(), date: new Date().toLocaleString('th-TH'), total: transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0), details: summary });
    transactions = [];
    saveData();
    location.hash = 'log'; // เปลี่ยนหน้าไปหน้า Log
}

function saveData() {
    localStorage.setItem('myTransactions', JSON.stringify(transactions));
    localStorage.setItem('mySessions', JSON.stringify(sessions));
}

function clearFilter() {
    document.getElementById('logDateFilter').value = '';
    renderLog();
}

// ☢️ ปุ่มไม้ตายสำหรับล้างข้อมูลเน่ากรณีหน้าจอค้าง
function nuclearReset() {
    if(confirm("ล้างข้อมูลประวัติทั้งหมดเพื่อซ่อมระบบที่ค้างใช่ไหม? (ข้อมูลจะหายหมด)")) {
        localStorage.clear();
        location.reload();
    }
}
