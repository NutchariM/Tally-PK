import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCr9fXfx9m9cQ9_N_VhE3VTLbgdk3ZXRKM",
  authDomain: "tally-pk.firebaseapp.com",
  databaseURL: "https://tally-pk-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "tally-pk",
  storageBucket: "tally-pk.firebasestorage.app",
  messagingSenderId: "849778226457",
  appId: "1:849778226457:web:6ec1724e76588358f3c188"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentMode = 'withdraw';
let transactions = [];
let sessions = [];

// --- Listener ข้อมูลจาก Cloud ---
onValue(ref(db, 'transactions'), (snapshot) => {
    const data = snapshot.val();
    transactions = data ? Object.values(data) : [];
    updateUI();
    renderSummary();
});

onValue(ref(db, 'sessions'), (snapshot) => {
    const data = snapshot.val();
    sessions = data ? Object.values(data).reverse() : [];
    window.renderLog(); // 🚩 เรียกผ่าน window เพื่อความชัวร์
});

// --- ฟังก์ชันหลัก (ส่งออกไปที่ window ทั้งหมดเพื่อแก้ปัญหา ReferenceError) ---

window.setMode = (mode) => {
    currentMode = mode;
    const isW = mode === 'withdraw';
    document.getElementById('modeWithdraw').classList.toggle('active', isW);
    document.getElementById('modeReturn').classList.toggle('active', !isW);
    document.getElementById('withdraw-section').style.display = isW ? 'block' : 'none';
    document.getElementById('return-section').style.display = isW ? 'none' : 'block';
};

window.saveEntry = (amount) => {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    if (!name) return alert("กรุณาใส่ชื่อก่อนบันทึกครับ"), nameInput.focus();

    const newTx = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name: name,
        type: currentMode,
        amount: amount
    };

    push(ref(db, 'transactions'), newTx);
    nameInput.value = '';
    nameInput.focus();
};

window.handleReturn = () => {
    const input = document.getElementById('returnAmount');
    const amt = parseInt(input.value);
    if (!amt) return alert("ระบุยอดเงินด้วยครับ");
    window.saveEntry(amt);
    input.value = '';
};

function updateUI() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = transactions.slice().reverse().map(t => `
        <tr>
            <td>${t.time}</td>
            <td><strong>${t.name}</strong></td>
            <td class="${t.type === 'withdraw' ? 't-red' : 't-green'}">${t.type === 'withdraw' ? '+' : '-'}${t.amount.toLocaleString()}</td>
            <td class="khit-col">${t.amount / 200} ขีด</td>
        </tr>
    `).join('');
    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    document.getElementById('grandTotal').innerText = `${total.toLocaleString()} ฿`;
}

function renderSummary() {
    const container = document.getElementById('summaryList');
    if (!container) return;
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    const keys = Object.keys(summary);
    container.innerHTML = keys.length ? keys.map(n => `<div class="person-card"><span>${n}</span><strong>${summary[n].toLocaleString()} ฿</strong></div>`).join('') : '<p class="empty-msg">ยังไม่มีข้อมูลในรอบนี้</p>';
}

window.endRound = () => {
    if (!transactions.length) return alert("ยังไม่มีรายการ");
    if (!confirm("จบยอดรอบนี้และเริ่มรอบใหม่?")) return;
    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });
    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    push(ref(db, 'sessions'), { id: Date.now(), date: new Date().toLocaleString('th-TH'), total, details: summary });
    remove(ref(db, 'transactions'));
    location.hash = 'log';
};

// 🚩 ฟังก์ชันเจ้าปัญหาที่ต้องส่งออกไปที่ window และเพิ่ม Logic "ไม่พบรายการ"
window.renderLog = () => {
    const container = document.getElementById('logList');
    const filterValue = document.getElementById('logDateFilter').value;
    if (!container) return;

    if (sessions.length === 0) {
        container.innerHTML = '<p class="empty-msg">ไม่มีประวัติการจบยอด</p>';
        return;
    }

    let filtered = sessions;
    if (filterValue) {
        filtered = sessions.filter(s => {
            // แปลง id (timestamp) เป็นวันที่ YYYY-MM-DD เพื่อเทียบกับ input date
            const sessionDate = new Date(s.id).toISOString().split('T')[0];
            return sessionDate === filterValue;
        });
    }

    // ✅ เพิ่มตรงนี้: ถ้าเลือกวันที่แล้วไม่มีข้อมูล ให้แสดงข้อความแจ้งเตือน
    if (filterValue && filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color: #94a3af;">
                <i class="fa-regular fa-calendar-xmark" style="font-size: 40px; margin-bottom: 10px; display: block;"></i>
                <p>ไม่พบรายการของวันที่คุณเลือกครับ</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(s => `
        <div class="log-card">
            <div class="log-date">🕒 จบเมื่อ: ${s.date}</div>
            <div style="font-weight:bold; margin:5px 0;">ยอดรวม: ${s.total.toLocaleString()} ฿</div>
            <div class="log-details">
                ${Object.keys(s.details).map(n => `<span>${n}: ${s.details[n].toLocaleString()}</span>`).join('')}
            </div>
        </div>
    `).join('');
};

window.clearFilter = () => {
    document.getElementById('logDateFilter').value = '';
    window.renderLog();
};

window.nuclearReset = () => {
    if (confirm("⚠️ ล้างข้อมูลทั้งหมดถาวร?")) {
        remove(ref(db, '/'));
        location.reload();
    }
};

function handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'record';
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${hash}`);
    const targetBtn = document.getElementById(`btn-${hash}`);
    if (targetTab && targetBtn) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }
    const footer = document.querySelector('.footer-summary');
    if (footer) footer.style.display = (hash === 'record') ? 'block' : 'none';
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
