import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🚩 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCr9fXfx9m9cQ9_N_VhE3VTLbgdk3ZXRKM",
  authDomain: "tally-pk.firebaseapp.com",
  databaseURL: "https://tally-pk-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "tally-pk",
  storageBucket: "tally-pk.firebasestorage.app",
  messagingSenderId: "849778226457",
  appId: "1:849778226457:web:6ec1724e76588358f3c188"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentMode = 'withdraw';
let transactions = [];
let sessions = [];

// --- 1. Real-time Listeners (คนอื่นกด เราเห็นทันที) ---

// ดึงข้อมูลรายการปัจจุบัน
onValue(ref(db, 'transactions'), (snapshot) => {
    const data = snapshot.val();
    transactions = data ? Object.values(data) : [];
    updateUI();
    renderSummary();
});

// ดึงข้อมูลประวัติรอบเก่า
onValue(ref(db, 'sessions'), (snapshot) => {
    const data = snapshot.val();
    sessions = data ? Object.values(data).reverse() : [];
    renderLog();
});

// --- 2. ฟังก์ชันการทำงาน (ใส่ window. เพื่อให้ HTML เรียกใช้ได้) ---

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

    // บันทึกไปที่ Firebase
    push(ref(db, 'transactions'), newTx);
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
    
    body.innerHTML = transactions.slice().reverse().map(t => {
        const isW = t.type === 'withdraw';
        return `
            <tr>
                <td>${t.time}</td>
                <td><strong>${t.name}</strong></td>
                <td class="${isW ? 't-red' : 't-green'}">${isW ? '+' : '-'}${t.amount.toLocaleString()}</td>
                <td class="khit-col">${t.amount / 200} ขีด</td>
            </tr>
        `;
    }).join('');

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
    if (keys.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3af; padding:20px;">ยังไม่มีข้อมูลในรอบนี้</p>';
        return;
    }
    
    container.innerHTML = keys.map(name => `
        <div class="person-card">
            <span>${name}</span>
            <strong>${summary[name].toLocaleString()} ฿</strong>
        </div>
    `).join('');
}

window.endRound = () => {
    if (transactions.length === 0) return alert("ยังไม่มีรายการให้จบยอด");
    if (!confirm("จบยอดรอบนี้และเริ่มรอบใหม่? ข้อมูลจะถูกย้ายไปที่หน้า 'ประวัติรอบ'")) return;

    const summary = {};
    transactions.forEach(t => {
        if (!summary[t.name]) summary[t.name] = 0;
        summary[t.name] += (t.type === 'withdraw' ? t.amount : -t.amount);
    });

    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? t.amount : -t.amount), 0);
    
    const session = {
        id: Date.now(),
        date: new Date().toLocaleString('th-TH'),
        total: total,
        details: summary
    };

    // เก็บเข้าประวัติและล้างรายการปัจจุบันบน Cloud
    push(ref(db, 'sessions'), session);
    remove(ref(db, 'transactions'));
    
    location.hash = 'log';
};

function renderLog() {
    const container = document.getElementById('logList');
    if (!container) return;
    
    const filterValue = document.getElementById('logDateFilter').value;
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3af; padding:40px;">ไม่มีประวัติรอบที่จบไปแล้ว</p>';
        return;
    }

    let filtered = sessions;
    if (filterValue) {
        filtered = sessions.filter(s => {
            try {
                return new Date(s.id).toISOString().split('T')[0] === filterValue;
            } catch(e) { return false; }
        });
    }

    container.innerHTML = filtered.map(s => `
        <div class="log-card">
            <div class="log-date">🕒 จบเมื่อ: ${s.date}</div>
            <div style="font-weight:bold; margin:5px 0;">ยอดรวม: ${s.total.toLocaleString()} ฿</div>
            <div class="log-details">
                ${Object.keys(s.details).map(name => `<span>${name}: ${s.details[name].toLocaleString()}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

window.clearFilter = () => {
    document.getElementById('logDateFilter').value = '';
    renderLog();
};

window.nuclearReset = () => {
    if (confirm("⚠️ ล้างข้อมูลทั้งหมดบน Cloud? ข้อมูลของทุกคนจะหายถาวรนะครับ!")) {
        remove(ref(db, '/'));
        location.reload();
    }
};

// --- 3. ระบบจัดการหน้า (Routing) ---
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
