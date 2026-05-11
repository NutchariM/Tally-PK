let selectedUser = 'มด';
let currentMode = 'withdraw';

// เก็บยอดเงินแยกรายคน
const balances = {
    'มด': 0,
    'Rex': 0,
    'นิว': 0
};

function selectUser(user, element) {
    selectedUser = user;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
}

function changeType(mode) {
    currentMode = mode;
    const btnW = document.getElementById('typeWithdraw');
    const btnR = document.getElementById('typeReturn');
    const quickBtn = document.getElementById('btnQuickWithdraw');
    const returnWrapper = document.getElementById('returnInputWrapper');

    if (mode === 'withdraw') {
        btnW.classList.add('active');
        btnR.classList.remove('active');
        quickBtn.style.display = 'block';
        returnWrapper.style.display = 'none';
    } else {
        btnR.classList.add('active');
        btnW.classList.remove('active');
        quickBtn.style.display = 'none';
        returnWrapper.style.display = 'flex';
        document.getElementById('returnAmount').focus();
    }
}

function handleReturnSave() {
    const input = document.getElementById('returnAmount');
    const val = parseInt(input.value);
    if (!val) return alert("กรุณาระบุจำนวนเงิน");
    saveData(val);
    input.value = '';
}

function saveData(amount) {
    const isWithdraw = currentMode === 'withdraw';
    
    // อัปเดตยอดเงินรายคน
    if (isWithdraw) balances[selectedUser] += amount;
    else balances[selectedUser] -= amount;

    // คำนวณขีด (200 = 1 ขีด)
    const khitCount = amount / 200;
    let khitDisplay = "";
    for(let i=0; i < Math.floor(khitCount); i++) khitDisplay += " |";
    if (khitCount % 1 !== 0) khitDisplay += " (เศษ)"; 

    // อัปเดตการแสดงผลรายคน
    document.getElementById(`val-${selectedUser}`).innerText = balances[selectedUser] / 200;
    document.getElementById(`baht-${selectedUser}`).innerText = `${balances[selectedUser].toLocaleString()} ฿`;

    // อัปเดตยอดรวมทั้งกอง
    const totalBaht = Object.values(balances).reduce((a, b) => a + b, 0);
    document.getElementById('totalUnit').innerText = `${totalBaht / 200} ขีด`;
    document.getElementById('totalBaht').innerText = `${totalBaht.toLocaleString()} ฿`;

    // เพิ่มประวัติ
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const row = `
        <tr>
            <td>${time}</td>
            <td><span class="user-badge">${selectedUser}</span></td>
            <td class="${isWithdraw ? 'text-red' : 'text-green'}">${isWithdraw ? '↗ เบิก' : '↩ คืน'}</td>
            <td class="${isWithdraw ? 'text-red' : 'text-green'}">
                ${isWithdraw ? '+' : '-'}${amount} 
                <span class="khit-symbol">${khitDisplay}</span>
            </td>
        </tr>
    `;
    document.getElementById('historyBody').insertAdjacentHTML('afterbegin', row);
}
