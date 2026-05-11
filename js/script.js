import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 🚩 วางค่า Config ของคุณตรงนี้ (ผมเพิ่ม databaseURL ให้แล้วตามชื่อโปรเจกต์)
const firebaseConfig = {
  apiKey: "AIzaSyCr9fXfx9m9cQ9_N_VhE3VTLbgdk3ZXRKM",
  authDomain: "tally-pk.firebaseapp.com",
  databaseURL: "https://tally-pk-default-rtdb.asia-southeast1.firebasedatabase.app/", // 💡 ตรวจสอบ URL นี้ในหน้า Database อีกทีนะครับ
  projectId: "tally-pk",
  storageBucket: "tally-pk.firebasestorage.app",
  messagingSenderId: "849778226457",
  appId: "1:849778226457:web:6ec1724e76588358f3c188"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentMode = 'withdraw';
let transactions = [];
let sessions = [];

// --- 1. ระบบ Real-time Listener (คนอื่นกด เราเห็นทันที) ---
onValue(ref(db, 'transactions'), (snapshot) => {
    const data = snapshot.val();
    transactions = data ? Object.values(data) : [];
    updateUI();
    renderSummary();
});

onValue(ref(db, 'sessions'), (snapshot) => {
    const data = snapshot.val();
    // เรียงประวัติจากใหม่ไปเก่า
    sessions = data ? Object.values(data).reverse() : [];
    renderLog();
});

// --- 2. ฟังก์ชันการทำงาน (ต้องใส่ window. นำหน้าเพื่อให้ HTML เรียกหาเจอ) ---
window.setMode = (mode) => {
    currentMode = mode;
    const isW = mode === 'withdraw';
    document.getElementById('modeWithdraw').classList.toggle('active', isW);
    document.getElementById('modeReturn').classList.toggle('active', !isW);
    document.getElementById('withdraw-section').style.display = isW ? 'block' : 'none';
    document.getElementById('return-section').style.display = isW ? 'none' : 'block';
};

window.saveEntry = (amount) => {
    const name = document.getElementById('userName').value.trim();
    if (!name) return alert("กรุณาใส่ชื่อก่อนบันทึกครับ");

    const newTx = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        name: name,
        type: currentMode,
        amount: amount
    };

    // ส่งข้อมูลไปที่ Firebase Cloud
    push(ref(db, 'transactions'), newTx);
};

window.handleReturn = () => {
    const val = parseInt(document.getElementById('returnAmount').value);
    if (!val) return alert("กรุณาระบุยอดเงินคืน");
    window.saveEntry(val);
    document.getElementById('returnAmount').value = '';
};

function updateUI() {
    const body = document.getElementById('historyBody');
    if (!body) return;
    body.innerHTML = transactions.slice().reverse().map(t => `
        <tr>
            <td>${t.time}</td>
            <td><strong>${t.name}</strong></td>
            <td class="${t.type === 'withdraw' ? 't-red' : 't-green'}">
                ${t.type
