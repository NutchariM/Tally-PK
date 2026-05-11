import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- Firebase Configuration ---
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

// --- Listeners ---
onValue(ref(db, 'transactions'), (snap) => {
    transactions = snap.val() ? Object.values(snap.val()) : [];
    updateUI();
    renderSummary();
});

onValue(ref(db, 'sessions'), (snap) => {
    sessions = snap.val() ? Object.values(snap.val()).reverse() : [];
    window.renderLog();
});

// 🚩 Logic ใหม่: ตรวจสอบการพิมพ์ชื่อ
document.addEventListener('DOMContentLoaded', () => {
    const userNameInput = document.getElementById('userName');
    const interactiveArea = document.getElementById('interactive-area');

    userNameInput.addEventListener('input', () => {
        if (userNameInput.value.trim().length > 0) {
            interactiveArea.style.display = 'block'; // โชว์ส่วนปุ่มกดเมื่อมีชื่อ
        } else {
            interactiveArea.style.display = 'none'; // ซ่อนถ้าลบชื่อออกจนว่าง
        }
    });
});

window.setMode = (m) => {
    currentMode = m;
    document.getElementById('modeWithdraw').classList.toggle('active', m === 'withdraw');
    document.getElementById('modeReturn').classList.toggle('active', m === 'return');
    document.getElementById('withdraw-section').style.display = m === 'withdraw' ? 'block' : 'none';
    document.getElementById('return-section').style.display = m === 'return' ? 'block' : 'none';
};

window.saveEntry = (amt) => {
    const name = document.getElementById('userName').value.trim();
    if (!name) return;
    push(ref(db, 'transactions'), {
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name, type: currentMode, amount: Math.abs(amt)
    });
    // ไม่เคลียร์ชื่อทิ้งเพื่อให้บันทึกรายการอื่นต่อได้ทันที
};

window.handleReturn = () => {
    const input = document.getElementById('returnAmount');
    const amt = parseInt(input.value);
    if (!amt) return alert("ระบุยอดเงินด้วยจ้า");
    window.saveEntry(amt);
    input.value = '';
};

function updateUI() {
    const body = document.getElementById('historyBody');
    const historyArea = document.getElementById('recent-history-area');
    const currentName = document.getElementById('userName').value.trim();
    
    // ฟิลเตอร์เฉพาะรายการของชื่อที่กำลังกรอกอยู่ (เพื่อให้ Clean ที่สุด)
    const myLogs = transactions.filter(t => t.name === currentName);

    if (myLogs.length > 0) {
        historyArea.style.display = 'block';
        body.innerHTML = myLogs.slice().reverse().map(t => `
            <tr>
                <td style="font-size:0.8rem; color:#A4B0BE;">${t.time}</td>
                <td class="${t.type === 'withdraw' ? 't-red' : 't-green'}" style="font-weight:800; text-align:right;">
                    ${t.type === 'withdraw' ? '-' : '+'}${t.amount.toLocaleString()}
                </td>
            </tr>
        `).join('');
    } else {
        historyArea.style.display = 'none';
    }

    const total = transactions.reduce((s, t) => s + (t.type === 'withdraw' ? -t.amount : t.amount), 0);
    const totalEl = document.getElementById('grandTotal');
    totalEl.innerText = `${total >= 0 ? '+' : ''}${total.toLocaleString()} ฿`;
    totalEl.style.color = total >= 0 ? '#10B981' : '#EF4444';
}

// ... ส่วนที่เหลือ (renderSummary, endRound, nuclearReset, handleRouting) ให้ใช้ตามเดิม ...
// (เพื่อประหยัดพื้นที่ ผมละไว้แต่คุณต้องมีฟังก์ชันเหล่านั้นอยู่ในไฟล์นะครับ)
