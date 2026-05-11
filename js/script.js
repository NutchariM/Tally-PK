// --- 1. ตั้งค่าเริ่มต้นและโหลดข้อมูลจากเครื่อง ---
let currentMode = 'withdraw'; // โหมดเริ่มต้นคือ "เบิก"
let transactions = JSON.parse(localStorage.getItem('myTransactions')) || [];
let sessions = JSON.parse(localStorage.getItem('mySessions')) || [];

// เรียกใช้งานทันทีเมื่อโหลดหน้าเว็บ
updateUI();

// --- 2. ฟังก์ชันสลับ Tab และจัดการ Footer ---
function switchTab(tabName) {
    // จัดการการแสดงผล Content ของแต่ละ Tab
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // 🚩 ส่วนที่แก้ไข: ซ่อนยอดรวมด้านล่าง (Footer) เมื่อไม่อยู่หน้าบันทึก
    const footer = document.querySelector('.footer-summary');
    if (footer) {
        if (tabName === 'record') {
            footer.style.display = 'block';
        } else {
            footer.style.display = 'none';
        }
    }

    // โหลดข้อมูลตามหน้าที่จะไป
    if (tabName === 'summary') renderSummary();
    if (tabName === 'log') renderLog();
}

// --- 3. ฟังก์ชันจัดการการเบิก-คืน ---

// สลับโหมด เบิกเงิน / คืนเงิน
function setMode(mode) {
    currentMode = mode;
    const isW = mode === 'withdraw';
    
    // สลับสีปุ่ม Toggle
    document.getElementById('modeWithdraw').classList.toggle('active', isW);
    document.getElementById('modeReturn').classList.toggle('active', !isW);
    
    // สลับส่วนแสดงผล (ปุ่มเบิก 200 / ช่องกรอกเงินคืน)
    document.getElementById('withdraw-section').style.display = isW ? 'block' : 'none';
    document.getElementById('return-section').style.display = isW ? 'none' : 'block';
}

// จัดการการกดบันทึกในโหมด "คืนเงิน" (ระบุยอดเอง)
function handleReturn() {
    const input = document.getElementById('returnAmount');
    const amt = parseInt(input.value);
    if (!amt) return alert("กรุณาระบุยอดเงินที่คืน");
    saveEntry(amt);
    input.value = ''; // ล้างช่องกรอก
}

// ฟังก์ชันบันทึกข้อมูลลงรายการ (Core Function)
function saveEntry(amount) {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();

    if (!name) {
        alert("กรุณากรอกชื่อผู้เบิก/คืน");
        nameInput.focus();
        return;
    }

    const newTx = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name: name,
        type: currentMode,
        amount: amount
    };

    transactions.push(newTx);
    saveData(); // บันทึกลง LocalStorage
    updateUI(); // อัปเดตหน้าจอ
}

// --- 4. ฟังก์ชันอัปเดตหน้าจอ (UI) ---

// วาดตารางประวัติในรอบปัจจุบัน
function updateUI() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = '';
    
    [...transactions].reverse().forEach(t => {
        const isW = t.type === 'withdraw';
        const khitValue = t.amount / 200; // คำนวณขีด
        
        body.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${t.time}</td>
                <td><strong>${t.name}</strong></td>
                <td class="${isW ? 't-red' : 't-green'}">${isW ? '+' : '-'}${t.amount.toLocaleString()}</td>
                <td class="khit-col">${khitValue} ขีด</td>
            </tr>
        `);
    });

    // อัปเดตยอดรวมกองกลางด้านล่าง
    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    const grandTotalElement = document.getElementById('grandTotal');
    if (grandTotalElement) {
        grandTotalElement.innerText = `${total.toLocaleString()} ฿`;
    }
}

// วาดหน้าสรุปยอดรายบุคคล (Tab: สรุปรายคน)
function renderSummary() {
    const container = document.getElementById('summaryList');
    const summary = {};
    
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });

    const keys = Object.keys(summary);
    if (keys.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3af; padding:20px;">ไม่มีข้อมูลในรอบนี้</p>';
        return;
    }

    container.innerHTML = keys.map(name => `
        <div class="person-card">
            <span>${name}</span>
            <strong>${summary[name].toLocaleString()} ฿</strong>
        </div>
    `).join('');
}

// วาดหน้าประวัติรอบที่จบไปแล้ว พร้อมระบบ Filter (Tab: ประวัติรอบ)
function renderLog() {
    const container = document.getElementById('logList');
    const filterValue = document.getElementById('logDateFilter').value; // YYYY-MM-DD
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="empty-msg">ยังไม่มีประวัติการจบยอด</p>';
        return;
    }

    let filteredSessions = sessions;

    // ระบบกรองตามวันที่
    if (filterValue) {
        filteredSessions = sessions.filter(s => {
            const sessionDate = new Date(s.id).toISOString().split('T')[0];
            return sessionDate === filterValue;
        });
    }

    if (filteredSessions.length === 0) {
        container.innerHTML = '<p class="empty-msg">ไม่พบข้อมูลในวันที่เลือก</p>';
        return;
    }

    container.innerHTML = filteredSessions.map(s => `
        <div class="log-card">
            <div class="log-date">🕒 ${s.date}</div>
            <div style="font-weight:bold; margin:5px 0;">ยอดรวมรอบนี้: ${s.total.toLocaleString()} ฿</div>
            <div class="log-details">
                ${Object.keys(s.details).map(name => `<span>${name}: ${s.details[name].toLocaleString()}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// ล้างตัวกรองวันที่
function clearFilter() {
    document.getElementById('logDateFilter').value = '';
    renderLog();
}

// จบยอดรอบปัจจุบันและบันทึกลง Log
function endRound() {
    if (transactions.length === 0) return alert("ไม่มีรายการให้จบยอด");
    if (!confirm("จบยอดรอบนี้และเริ่มรอบใหม่ใช่หรือไม่?")) return;

    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });

    const session = { 
        id: Date.now(), // ใช้ timestamp สำหรับ filter วันที่
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

// --- 5. การจัดการข้อมูลคงที่ (Persistence) ---
function saveData() {
    localStorage.setItem('myTransactions', JSON.stringify(transactions));
    localStorage.setItem('mySessions', JSON.stringify(sessions));
}
