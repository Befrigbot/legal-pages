const store = {
  get inventory() { return JSON.parse(localStorage.getItem('inventory') || '[]'); },
  set inventory(v) { localStorage.setItem('inventory', JSON.stringify(v)); },
  get sales() { return JSON.parse(localStorage.getItem('sales') || '[]'); },
  set sales(v) { localStorage.setItem('sales', JSON.stringify(v)); },
  get webhook() { return localStorage.getItem('n8nWebhook') || ''; },
  set webhook(v) { localStorage.setItem('n8nWebhook', v); }
};

const fmt = n => new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(n);

function switchView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === id));
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

document.getElementById('inventoryForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const inventory = store.inventory;
  const existing = inventory.find(x => x.code === data.code);
  if (existing) {
    existing.stockQty += Number(data.stockQty || 1);
  } else {
    inventory.push({
      code: data.code,
      name: data.name,
      category: data.category,
      buyPrice: Number(data.buyPrice),
      stockQty: Number(data.stockQty || 1)
    });
  }
  store.inventory = inventory;
  e.target.reset();
  render();
});

document.getElementById('salesForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const inventory = store.inventory;
  const item = inventory.find(x => x.code === data.code);
  if (!item || item.stockQty < 1) {
    alert('القطعة غير متوفرة أو الكود غير موجود.');
    return;
  }
  item.stockQty -= 1;
  const sale = {
    date: new Date().toISOString(),
    code: item.code,
    name: item.name,
    buyPrice: item.buyPrice,
    sellPrice: Number(data.sellPrice)
  };
  store.sales = [sale, ...store.sales];
  store.inventory = inventory;
  e.target.reset();
  render();
});

document.getElementById('webhookForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  store.webhook = data.webhook;
  document.getElementById('automationStatus').textContent = 'تم حفظ رابط Webhook.';
});

document.getElementById('sendDemoOrder').addEventListener('click', async () => {
  if (!store.webhook) return alert('أدخل رابط Webhook أولا.');
  const payload = {
    customer: 'عميل تجريبي',
    message: 'هل لديكم iPhone 12 مستعمل؟',
    sentAt: new Date().toISOString()
  };
  try {
    const res = await fetch(store.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    document.getElementById('automationStatus').textContent = `تم إرسال الطلب. الحالة: ${res.status}`;
  } catch {
    document.getElementById('automationStatus').textContent = 'فشل الإرسال. تحقق من رابط n8n.';
  }
});

function calcProfits() {
  const sales = store.sales;
  const today = new Date();
  const dayKey = today.toISOString().slice(0, 10);
  const monthKey = today.toISOString().slice(0, 7);
  const year = today.getFullYear();

  const sum = f => sales.filter(f).reduce((a, s) => a + (s.sellPrice - s.buyPrice), 0);
  return {
    daily: sum(s => s.date.slice(0, 10) === dayKey),
    monthly: sum(s => s.date.slice(0, 7) === monthKey),
    yearly: sum(s => new Date(s.date).getFullYear() === year)
  };
}

function render() {
  const inventory = store.inventory;
  const sales = store.sales;
  document.getElementById('inventoryTable').innerHTML = inventory.map(i => `
    <tr><td>${i.code}</td><td>${i.name}</td><td>${i.category}</td><td>${fmt(i.buyPrice)}</td><td>${i.stockQty}</td></tr>
  `).join('');

  document.getElementById('salesTable').innerHTML = sales.map(s => `
    <tr>
      <td>${new Date(s.date).toLocaleString('ar')}</td><td>${s.code}</td><td>${s.name}</td>
      <td>${fmt(s.buyPrice)}</td><td>${fmt(s.sellPrice)}</td><td>${fmt(s.sellPrice - s.buyPrice)}</td>
    </tr>
  `).join('');

  const profits = calcProfits();
  document.getElementById('summaryCards').innerHTML = `
    <div class="card"><h3>إجمالي العناصر</h3><p>${inventory.reduce((a, i) => a + i.stockQty, 0)}</p></div>
    <div class="card"><h3>عدد المبيعات اليوم</h3><p>${sales.filter(s => s.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}</p></div>
    <div class="card"><h3>ربح اليوم</h3><p>${fmt(profits.daily)}</p></div>
  `;

  document.getElementById('profitCards').innerHTML = `
    <div class="card"><h3>الربح اليومي</h3><p>${fmt(profits.daily)}</p></div>
    <div class="card"><h3>الربح الشهري</h3><p>${fmt(profits.monthly)}</p></div>
    <div class="card"><h3>الربح السنوي</h3><p>${fmt(profits.yearly)}</p></div>
  `;
}

render();
