let selectedPerson = '';
let selectedRecorder = '';
let selectedType = 'เบิก';
let transactions = [];
let currentAmount = 0;

function selectPerson(person) {
    selectedPerson = person;
    document.querySelectorAll('.person-buttons .person-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === person) {
            btn.classList.add('active');
        }
    });
}

function selectRecorder(person) {
    selectedRecorder = person;
    document.querySelectorAll('#recorderButtons .person-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === person) {
            btn.classList.add('active');
        }
    });
}

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
    const input = document.getElementById('noteInput');
    currentAmount += amount;
    input.value = currentAmount.toLocaleString();
}

function submitTransaction() {
    const noteInput = document.getElementById('noteInput');
    const amount = currentAmount || parseInt(noteInput.value.replace(/,/g, '')) || 0;

    if (!selectedPerson) {
        alert('กรุณาเลือกผู้เบิก/คืน');
        return;
    }

    if (!selectedRecorder) {
        alert('กรุณาเลือกผู้บันทึก');
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
        person: selectedPerson,
        recorder: selectedRecorder,
        type: selectedType,
        amount: amount,
        isIncome: selectedType === 'เบิก'
    };

    transactions.unshift(transaction);
    renderHistory();
    updateSummary();

    noteInput.value = '';
    currentAmount = 0;
    selectedPerson = '';
    selectedRecorder = '';
    document.querySelectorAll('.person-btn').forEach(btn => btn.classList.remove('active'));
}

function renderHistory() {
    const tbody = document.getElementById('historyBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">ยังไม่มีรายการ</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.time}</td>
            <td><span class="badge" style="background: #e3f2fd; color: #1976d2;">${t.person}</span></td>
            <td><span class="badge" style="background: #fff3e0; color: #f57c00;">${t.recorder}</span></td>
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

selectType('เบิก');
