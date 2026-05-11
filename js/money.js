let selectedUser = 'มด';
let currentType = 'withdraw';
let totalMoney = 0;

function selectUser(user, element) {
    selectedUser = user;
    // เปลี่ยนสถานะปุ่ม Chip
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

function changeType(type) {
    currentType = type;
    const btnW = document.getElementById('typeWithdraw');
    const btnR = document.getElementById('typeReturn');
    const input = document.getElementById('amountInput');

    if (type === 'withdraw') {
        btnW.classList.add('active');
        btnR.classList.remove('active');
        input.placeholder = "จำนวนเงินที่เบิก";
    } else {
        btnR.classList.add('active');
        btnW.classList.remove('active');
        input.placeholder = "จำนวนเงินที่คืน";
    }
}

function addValue(val) {
    const input = document.getElementById('amountInput');
    const current = parseInt(input.value) || 0;
    input.value = current + val;
}

function handleSave() {
    const amountInput = document.getElementById('amountInput');
    const amount = parseInt(amountInput.value);

    if (!amount) {
        alert("กรุณากรอกจำนวนเงิน");
        return;
    }

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    // คำนวณขีด
    const unit = amount / 200;

    // เพิ่มในตาราง
    const historyBody = document.getElementById('historyBody');
    const typeLabel = currentType === 'withdraw' ? 
        `<span class="badge-withdraw">↗ เบิก</span>` : 
        `<span class="badge-return">↩ คืน</span>`;
    
    const amountColor = currentType === 'withdraw' ? 'style="color: #ef4444; font-weight:bold;"' : 'style="color: #10b981; font-weight:bold;"';
    const amountSign = currentType === 'withdraw' ? '+' : '-';

    const row = `
        <tr>
            <td>${timeStr}</td>
            <td><span class="summary-chip" style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:4px;">${selectedUser}</span></td>
            <td>${typeLabel}</td>
            <td ${amountColor}>${amountSign}${amount.toLocaleString()}</td>
            <td>${unit}</td>
        </tr>
    `;
    historyBody.insertAdjacentHTML('afterbegin', row);

    // อัปเดตยอดรวม
    if (currentType === 'withdraw') {
        totalMoney += amount;
    } else {
        totalMoney -= amount;
    }

    document.getElementById('totalText').innerText = `${totalMoney.toLocaleString()} ฿`;
    document.getElementById('unitText').innerText = `${totalMoney / 200} ขีด`;

    // ล้างค่า
    amountInput.value = '';
}

function resetAll() {
    if(confirm("ต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?")) {
        location.reload();
    }
}
