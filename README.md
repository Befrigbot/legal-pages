# نظام إدارة متجر الهواتف والإكسسوارات (عربي)

هذا المشروع نسخة أولية تعمل على `localhost` وتدعم:

- إدارة المخزون حسب الفئات (هواتف جديدة/مستعملة، حمايات، أغطية، حواسيب...).
- إدخال المبيعات عبر الكود/الباركود.
- حساب الربح اليومي/الشهري/السنوي تلقائيا.
- تجهيز نقطة ربط مع `n8n` لاستقبال طلبات WhatsApp وتسجيلها.

## 1) التشغيل محليا

```bash
python3 -m http.server 8080
```

ثم افتح:

`http://localhost:8080`

> البيانات تحفظ محليا في المتصفح عبر `localStorage`.

## 2) هيكلة البيانات المقترحة في Google Sheets

أنشئ ملف Sheets فيه 3 أوراق:

### Inventory
| code | name | category | buy_price | stock_qty | updated_at |
|---|---|---|---:|---:|---|

### Sales
| sold_at | code | name | buy_price | sell_price | profit |
|---|---|---|---:|---:|---:|

### Orders
| created_at | customer_phone | customer_name | requested_item | status | notes |
|---|---|---|---|---|---|

## 3) ربط Google Apps Script (اختياري لكن مهم للإنتاج)

1. من Google Sheets → Extensions → Apps Script.
2. أنشئ `doPost(e)` يستقبل JSON ويكتب في الورقة المناسبة.
3. انشره Web App بصلاحية مناسبة.
4. استخدم رابط Web App داخل n8n أو داخل التطبيق.

## 4) تدفق n8n + WhatsApp (تصميم مقترح)

1. **Webhook Node**: يستقبل رسالة العميل.
2. **Function/Code Node**: استخراج اسم المنتج أو الفئة.
3. **Google Sheets Node (Read)**: البحث في Inventory.
4. **AI Node**: صياغة الرد بالعربية حسب نتيجة البحث.
5. **WhatsApp Cloud API Node**: إرسال الرد للعميل.
6. **Google Sheets Node (Append)**: حفظ الطلب في Orders.
7. **If Node**: إذا العميل أكد الطلب، يتم تحويل `status` إلى `confirmed`.

## 5) نصائح مهمة قبل الإطلاق

- استعمل ماسح باركود USB (Keyboard Emulation) لتسريع البيع.
- أضف صلاحيات مستخدمين (Admin/Cashier) عند التحويل لنسخة Production.
- أضف نسخة احتياطية يومية تلقائية من Google Sheets.
- ضع تنبيه انخفاض مخزون داخل n8n (Trigger يومي).

## 6) ما تم تنفيذه الآن

- واجهة عربية بنفس أسلوب اللوحة الجانبية الموجودة في الصور المرجعية.
- أقسام: لوحة التحكم، المخزون، مبيعات اليوم، الأرباح، واتساب+n8n.
- حفظ محلي + حساب أرباح فوري + إرسال طلب تجريبي إلى Webhook.

