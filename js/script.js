let currentMode = 'withdraw';
let totalMoney = 0;

function changeType(mode) {
    currentMode = mode;
    const isW = mode === 'withdraw';
    document.getElementById('typeWithdraw').classList.toggle('active', isW);
    document.getElementById('typeReturn').classList.toggle('active', !isW);
    document.getElementById('btnQuickWithdraw').style.display = isW ? 'block' : 'none';
    document.getElementById('returnInputWrapper').style.display = isW ? 'none' : 'flex';
}

function handleReturnSave() {
    const input = document.getElementById('returnAmount');
    const val = parseInt(input.value);
    if (!val) return alert("กรุณาระบุจำนวนเงินที่คืน");
    saveData(val);
    input.value = '';
}

function saveData(amount) {
    // อ่านชื่อจากช่อง Input
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();

    if (!name) {
        alert("กรุณากรอกชื่อผู้เบิก/คืน");
        nameInput.focus();
        return;
    }

    const isW = currentMode === 'withdraw';
    
    // อัปเดตยอดรวม
    if (isW) {
        totalMoney += amount;
    } else {
        totalMoney -= amount;
    }

    // อัปเดตการแสดงผลยอดรวม (เป็นบาทอย่างเดียว)
    document.getElementById('totalBaht').innerText = `${totalMoney.toLocaleString()} ฿`;

    // บันทึกประวัติ
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const historyBody = document.getElementById('historyBody');
    const row = `
        <tr>
            <td>${time}</td>
            <td><strong>${name}</strong></td>
            <td class="${isW ? 't-withdraw' : 't-return'}">${isW ? '↗ เบิก' : '↩ คืน'}</td>
            <td class="${isW ? 't-withdraw' : 't-return'}">${isW ? '+' : '-'}${amount.toLocaleString()} ฿</td>
        </tr>
    `;
    historyBody.insertAdjacentHTML('afterbegin', row);

    // ไม่ต้องล้างชื่อ เพื่อให้คนเดิมเบิกซ้ำได้เร็วๆ
}
