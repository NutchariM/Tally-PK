// เพิ่มการซ่อน/แสดงยอดรวมด้านล่างตาม Tab
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // ซ่อนยอดรวมด้านล่างเมื่ออยู่หน้า "สรุปรายคน" และ "ประวัติรอบ"
    const footer = document.querySelector('.footer-summary');
    if (tabName === 'record') {
        footer.style.display = 'block';
    } else {
        footer.style.display = 'none';
    }

    if (tabName === 'summary') renderSummary();
    if (tabName === 'log') renderLog();
}

// ระบบ Filter วันที่ในหน้า Log
function renderLog() {
    const container = document.getElementById('logList');
    const filterValue = document.getElementById('logDateFilter').value; // YYYY-MM-DD
    
    if (sessions.length === 0) return container.innerHTML = '<p class="empty-msg">ยังไม่มีประวัติ</p>';

    let filteredSessions = sessions;

    // ถ้ามีการเลือกวันที่ ให้กรองข้อมูล
    if (filterValue) {
        filteredSessions = sessions.filter(s => {
            // s.timestamp คือค่าที่เก็บตอนบันทึก (Date.now())
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

function clearFilter() {
    document.getElementById('logDateFilter').value = '';
    renderLog();
}

// แก้ไขฟังก์ชัน endRound เล็กน้อยเพื่อให้เก็บ ID เป็น Timestamp สำหรับ Filter
function endRound() {
    if (transactions.length === 0) return alert("ไม่มีรายการให้จบยอด");
    if (!confirm("จบยอดรอบนี้และเริ่มรอบใหม่ใช่หรือไม่?")) return;

    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });

    const session = { 
        id: Date.now(), // ใช้ตัวนี้เป็นตัวอ้างอิงวันที่
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
