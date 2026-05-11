let selectedType = 'เบิก';
let transactions = [];
let currentAmount = 0;

function selectType(type) {
    selectedType = type;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(type)) {
            tab.classList.add('active');
        }
    });
}

function addAmount(amount) {
    const input = document.getElementById('amountInput');
    currentAmount += amount;
    input.value = currentAmount.toLocaleString();
}

function submitTransaction() {
    const personInput = document.getElementById('personInput');
    const amountInput = document.getElementById('amountInput');
    const person = personInput.value.trim();
    const amount = currentAmount || parseInt(amountInput.value.replace(/,/g, '')) || 0;

    if (!person) {
        alert('กรุณากรอกชื่อผู้เบิก/คืน');
        return;
    }

    if (amount === 0) {
        alert('กรุณาใส่จำนวนเงิน');
        return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const transaction = {
        time: time,
        person: person,
        type: selectedType,
        amount: amount,
        isIncome: selectedType === 'เบิก'
    };

    transactions.unshift(transaction);
    renderHistory();
    updateSummary();

    // Reset
    personInput.value = '';
    amountInput.value = '';
    currentAmount = 0;
}

function renderHistory() {
    const tbody = document.getElementById('historyBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">ยังไม่มีรายการ</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.time}</td>
            <td><span class="badge" style="background: #e3f2fd; color: #1976d2;">${t.person}</span></td>
            <td><span class="badge ${t.isIncome ? 'badge-income' : 'badge-expense'}">${t.type}</span></td>
            <td class="${t.isIncome ? 'amount-positive' : 'amount-negative'}">
                ${t.isIncome ? '+' : '-'}${t.amount.toLocaleString()}
            </td>
        </tr>
    `).join('');
}

function updateSummary() {
    const total = transactions.reduce((sum, t) => {
        return sum + (t.isIncome ? t.amount : -t.amount);
    }, 0);

    const sheets = Math.floor(Math.abs(total) / 200);

    document.getElementById('totalAmount').textContent = `${total.toLocaleString()} ฿`;
    document.getElementById('transactionCount').textContent = `${sheets} ชีต`;
}

// กด Enter เพื่อบันทึก
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitTransaction();
    }
});

// เริ่มต้น
selectType('เบิก');
