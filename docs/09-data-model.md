# 09 — نموذج البيانات

> النموذج الفيزيائي الكامل لقاعدة بيانات المنصة: كل جدول بأعمدته وأنواعها وقابليتها للفراغ وقيودها وفهارسها، مع علامات التشفير والمواقع والعزل، والمتطلبات التي يخدمها. أسماء الجداول والحقول بالإنكليزية لأنها تُستخدم كما هي في الكود والترحيلات. ويُقرأ مع [التصميم التقني](19-technical-design.md) الذي يحدد آلات الحالة والصلاحيات والعزل والأحداث التي تعمل على هذه الجداول، ومع [الخصوصية وتقييم الأثر](21-privacy-dpia.md) الذي يحدد مدد الاحتفاظ، ومع [الترابط والسيناريوهات](26-scenarios-and-linkage.md) الذي يشرح سلوك المنصة على مستوى العمل. ورموز الحالات في هذه الوثيقة **منسوخة حرفياً** من سجل الآلات في التصميم التقني §8، وأي حالة جديدة تبدأ هناك لا هنا.

---

## 1. الاصطلاحات

### 1.1 المخططات

| المخطط | المحتوى | من يصل إليه |
|---|---|---|
| `app` | الكيانات الأساسية: الحسابات، والأجهزة، والملكية، والبلاغات، والمحلات، والتكاملات، والإدارة، والأمن، والإشعارات، والخصوصية | أدوار التشغيل حسب [التصميم التقني §6.2](19-technical-design.md) |
| `commerce` | الخدمات التجارية: الباقات، والمدفوعات، والمتجر، والمورّدون، والشحن، والتسويات، والمحفظة، والتعبئة، والإعلانات، والربط البرمجي | **لا وصول لدور بوابة الأمن** (D-83) |
| `shoppro` | المحاسبة وإدارة المحل (D-92) | المحل نفسه فقط، والقيود الآلية بدور `shoppro_system`. **لا وصول لأحد من المنصة أبداً**: لا الإدارة ولا الدعم ولا المبرمجون ولا الأمن ولا التقارير، ولا حتى بإذن صاحب المحل (D-101) |
| `geo_private` | المواقع الدقيقة للأشخاص والأجهزة (07 §2) | الإدارة والأمن ضمن النطاق قراءةً، والواجهة العامة إدراجاً فقط |
| `audit` | سجل التدقيق وختمه | إدراج فقط لكل الأدوار، وقراءة لشاشة التدقيق |
| `ops` | صندوق الصادر، ومفاتيح عدم التكرار، والمؤقّتات، والرسائل الواردة، والمطابقات، وسجلات التشغيل، والأحداث المركونة، وجداول المفاتيح للتفرّد عبر الأقسام، ومراجع الأخطاء، وأحداث الاستعادة | أدوار التشغيل حسب الحاجة، ولا شيء من `shoppro` أبداً |

أسماء الجداول دون بادئة في هذه الوثيقة تعني المخطط `app`.

### 1.2 الأنواع والأعمدة القياسية

| النوع | الاستخدام |
|---|---|
| `uuid` | المفاتيح الأساسية والأجنبية، UUIDv7 يولّده التطبيق (ADR-15) |
| `timestamptz` | كل الأوقات بتوقيت UTC |
| `date` | التواريخ المجرّدة بتقويم دمشق |
| `text` | النصوص، مع قيد `CHECK` للصيغ (IMEI، والمراجع، والرموز) |
| `citext` | أسماء الدخول للموظفين |
| `bigint` بلاحقة `_minor` | المبالغ: **أعداد صحيحة** بأصغر وحدة حسب ISO 4217 **بالوحدة الرسمية الحالية** (D-118)، ومعها `currency char(3)` في الصف نفسه (أو في الصف الأب لأسطره). لا كسور ولا `numeric` ولا `float` لأي مبلغ. ولا يُحوَّل صف قديم في مكانه عند تبديل العملة: العرض بوحدة أخرى عبر `currency_units` وحده (§16.7). والإدخال والعرض بليرات كاملة، والمبلغ الفرعي = الليرات × 100. وفي الكود يُقرأ `int8` بنوع المال المشترك (`mode: 'bigint'`) لا نصاً ولا رقماً عائماً، وفي العقد عدد صحيح آمن (`Number.isSafeInteger`، [التصميم التقني §3.10](19-technical-design.md)) |
| `text` للمعرّفات الطويلة | IMEI (15 رقماً)، والرقم الوطني (11 رقماً)، والموبايل (`+9639XXXXXXXX`)، ورقم الوثيقة البديلة، والمراجع المقروءة: **نص دائماً** بقيد صيغة، لا `bigint` ولا `numeric`، فلا يضيع صفر بادئ ولا يتجاوز رقمٌ حدَّ الأعداد الآمنة |
| النسب | `int` بلاحقة `_bp` بنقاط الأساس (1% = 100). وكل سطر محسوب يُقرَّب نصف للأعلى إلى الوحدة الكاملة لحظة حسابه، والمجاميع مجموع أسطر مقرّبة ([التصميم التقني §3.10](19-technical-design.md)) |
| `bytea` بلاحقة `_enc` | الحقول المشفّرة 🔐 بصيغة الظرف في [التصميم التقني §17.5](19-technical-design.md) |
| `bytea` بلاحقة `_bidx` | بصمة البحث #️⃣ (HMAC-SHA256، 32 بايت). **مدخلها القانوني مجمّد بإصدار `v1`** لكل فئة ([التصميم التقني §17.5](19-technical-design.md)): مدخل HMAC = `الفئة ‖ ":v1:" ‖ الصيغة القانونية`. الرقم الوطني 11 رقماً ASCII، والوثيقة البديلة `النوع:البلد:الرقم بحروف كبيرة دون مسافات` (فلا تتصادم بصمتها مع رقم وطني)، والموبايل `+9639XXXXXXXX`، والتسلسلي `manufacturer_id:` ثم الحروف الكبيرة. وأي تغيير في الصيغة عمود جديد `*_bidx_v2` وإعادة حساب بإجراء تدوير مفتاح البصمة، لا تعديل في مكانه |
| `text` بلاحقة `_mask` | نص مخفي جزئياً للعرض، **يولّده الخادم وحده بالصيغ القانونية في [نموذج التهديد](20-threat-model.md) §2.2**: الرقم الوطني `••••••••123`، والموبايل `0933••••12`، وIMEI `35846210•••4821`. ولا يُكتب القناع يدوياً ولا في الواجهة |
| `text` بلاحقة `_norm` | النص مطبَّعاً للبحث والمطابقة بالدالة الوحيدة `app.ar_norm_v1` (`IMMUTABLE`، [التصميم التقني §16.2](19-technical-design.md))، يملؤها محفّز في الكتابة، **وتُستدعى الدالة نفسها على جهة الاستعلام** (`WHERE name_norm % app.ar_norm_v1($1)`)، فلا تطبيعان مختلفان. والأصل يبقى كما أُدخل بصيغة NFC |
| `geography(Point,4326)` | النقاط 📍 بالأمتار |
| `geometry(MultiPolygon,4326)` | مضلّعات المحافظات والمناطق |
| `jsonb` | الملخصات واللقطات والإعدادات المرنة فقط، لا لبيانات يُبحث فيها بانتظام |
| أنواع القيم (enum) | كل عمود حالة أو نوع `text` بقيد `CHECK` على القائمة المذكورة، لتسهيل إضافة قيمة بترحيل توسيع (ADR-03). وقيود `CHECK` لأعمدة الحالة **تُولَّد من سجل الآلات** ([التصميم التقني §8.0](19-technical-design.md))، وفحص FF-04 يرفض عمود `status` أو `state` بلا صف آلة، أو قائمة في القاعدة تخالف السجل |
| أعمدة المستأجر بأدوارها | `tenant_id` **محجوز للجداول المعزولة بـ RLS وحدها** ([التصميم التقني §6.1](19-technical-design.md)). والجدول غير المعزول الذي يذكر مستأجراً يسمّي العمود بدوره: `actor_tenant_id` (المستأجر الذي نفّذ الفعل)، أو `subject_tenant_id` (المستأجر موضوع الصف)، أو `client_tenant_id` (المستأجر المرتبط بعميل ربط). وفحص في CI يرفض `*_tenant_id` خارج قائمة مسموحة يراجعها الأمن |

**الأعمدة القياسية** تُذكر في رأس كل جدول ولا تتكرر في جدوله:

| الوسم | الأعمدة |
|---|---|
| «قياسية» | `id uuid PK`، و`created_at timestamptz NOT NULL DEFAULT now()`، و`updated_at timestamptz NOT NULL`، و`version int NOT NULL DEFAULT 1` (للتزامن المتفائل، [التصميم التقني §3.7](19-technical-design.md)) |
| «ثابتة» | `id uuid PK`، و`created_at timestamptz NOT NULL DEFAULT now()` فقط: جدول للإضافة، وأي تصحيح يكون بصف جديد |
| «مقسّم» | الجدول مقسّم زمنياً بعمود الوقت المذكور (أو ببصمة المستأجر في `shoppro`)، والمفتاح الأساسي يضمّه، والتفاصيل في §17 |

### 1.3 الرموز

| الرمز | المعنى |
|---|---|
| 🔐 | حقل مشفّر في التطبيق بـ AES-256-GCM (ADR-07). لا يُقرأ في SQL، ولا يُفهرس إلا عبر بصمته |
| #️⃣ | بصمة بحث للمطابقة التامة دون فك التشفير |
| 📍 | موقع دقيق. مواقع الأشخاص والأجهزة في `geo_private` فقط، وموقع المحل أو الوكيل التجاري في جدوله لأنه عنوان عمل يراجعه المشرف |
| RLS | الجدول معزول بـ Row-Level Security بالعمود المذكور ([التصميم التقني §6](19-technical-design.md)) |
| نطاق الأمن | للجدول سياسة قراءة لدور بوابة الأمن بالمحافظة ([التصميم التقني §5.6](19-technical-design.md)) |
| FK | مفتاح أجنبي إلى الجدول المذكور. وكل مفتاح أجنبي مفهرس، و`ON DELETE RESTRICT` ما لم يُذكر غيره (§1.4) |
| FK~ | **مفتاح منطقي** إلى جدول مقسّم لا يعيش معه المدة نفسها: لا قيد في القاعدة، وتتحقق منه الخدمة عند الكتابة ومهمة `integrity.fk.check` الليلية ([التصميم التقني §7.1](19-technical-design.md)) |
| الفئة | فئة البيانات للحقل أو الجدول ([التصميم التقني §20.12](19-technical-design.md)): `public`، و`internal`، و`personal`، و`sensitive`، و`secret_ephemeral`، و`tenant_private`، و`location_precise` |
| RT | فئة الاحتفاظ في [الخصوصية وتقييم الأثر](21-privacy-dpia.md) §5.2. وخريطة الاحتفاظ لكل جدول في §17.5 |

### 1.4 قواعد عامة

- **لا حذف** للكيانات الأساسية (الملكية، والمعاملات، والبلاغات، والفحوص، والقرارات، والتنبيهات، والمدفوعات، والقيود المحاسبية). الحذف الفعلي فقط بمحرك الاحتفاظ (§17).
- الفهارس المذكورة في نهاية كل جدول هي الإضافية على المفتاح الأساسي والمفاتيح الأجنبية. وصيغة الاسم: `uq_` للفريد، و`ix_` للعادي، و`px_` للجزئي.
- الأسماء العربية المطبَّعة للبحث في أعمدة `*_norm` تُحدَّث بمحفّز بقواعد التطبيع في [التصميم التقني §16.2](19-technical-design.md)، وعليها فهرس GIN بـ `gin_trgm_ops`.
- كل جدول فيه `status` يتغير عبر آلة الحالة في [التصميم التقني §8](19-technical-design.md)، ويُكتب كل انتقال في `state_transitions` (§16.4)، ومعه حدث السبب `cause_event_id` حين يكون أثراً لتتابع، وصفة الفاعل `acting_as`.
- **الحالة لدورة الحياة وحدها، والقيد صف** ([التصميم التقني §5.11](19-technical-design.md)): كل منع يمكن أن يجتمع مع غيره وله مصدره ويُرفع وحده (تجميد المحفظة، والتهدئة، وحظر الشخص، وحجز الجهاز لدى الجهات...) صف في `restrictions` (§5.9) لا قيمة في عمود حالة. والأعمدة القديمة مثل `users.cooldown_until` **إسقاطات للقراءة فقط** تُحدَّث من صفوف القيود. وفحص FF-15 يرفض قيمة حالة تطابق نوع قيد.
- **حذف المفاتيح الأجنبية:** كل مفتاح أجنبي `ON DELETE RESTRICT` ودون `CASCADE`. والحذف الفعلي بمحرك الاحتفاظ وحده (§17)، يحذف الأبناء أولاً أو يخفي الهوية في مكانها. والاستثناءان الوحيدان لبيانات الاعتماد: `refresh_tokens → sessions` و`sessions → user_devices` بـ `ON DELETE CASCADE`. ولا `ON UPDATE CASCADE` لأن المفاتيح UUID لا تتغير.
- **المفتاح الأجنبي إلى جدول مقسّم:** مركّب `(x_id, x_created_at)` حين يعيش الصفان المدة نفسها (مثل `geo_private.check_locations` مع `imei_checks`)، وإلا فهو مفتاح منطقي FK~ (§1.3).
- **التفرّد على الجدول المقسّم:** PostgreSQL لا يفرض تفرّداً لا يتضمن مفتاح التقسيم. فكل تفرّد عبر الأقسام **جدول مفاتيح غير مقسّم** يُدرج في معاملة الصف نفسه: `ops.reference_keys` للأرقام المرجعية (`WL-`، `TP-`)، و`commerce.wallet_operation_refs`، و`commerce.topup_order_refs`، و`commerce.topup_provider_refs`، و`ops.inbound_messages`. وفحص في CI يتحقق أن كل قيد في [التصميم التقني §7.1](19-technical-design.md) فهرس فريد حقيقي على الأعمدة المعلنة بالضبط.
- **الفهرسة:** كل عمود `*_bidx` وكل عمود موبايل يُبحث به له فهرس (جزئي حيث يُصفّى بالحالة)، أو سطر يذكر لماذا لا يُبحث به. واستعلام في CI يسرد أعمدة البصمات غير المفهرسة.
- **ثوابت المال والكميات في المخطط** ([التصميم التقني §11.5](19-technical-design.md)): `CHECK (amount_minor > 0)` على المدفوعات والسحب والتعبئة والاسترداد والإعادة الآلية والقبض والتسليم، و`qty > 0` على الأسطر، وسعر الوحدة صفر أو أكثر، والخصم لا يتجاوز السطر، ومحفّزات قيد مؤجلة لـ «Σ المسترد ≤ المدفوع» و«Σ المرتجع ≤ المسلّم» و«تعديل التسوية ≤ الإرجاع أو العيب المرتبط». وفحص FF-30 يرفض عمود مال أو كمية بلا قيده.
- **الترتيب والبحث العربي:** قاعدة البيانات بـ `ENCODING 'UTF8'` ومحلية ICU لـ `LC_CTYPE` (لا `C` أبداً، وإلا تُسقط `pg_trgm` الحروف العربية)، والترتيب الظاهر للناس بترتيب ICU (`ar-x-icu`) على أعمدة العرض أو على `*_norm`. ويسجّل دليل التشغيل `pg_collation_actual_version`، وتُعاد فهرسة الفهارس المتأثرة بعد ترقية ICU.
- **ما يملكه الكود وما يملكه التشغيل:** الجداول المرجعية صنفان (§17.6، §17.7): ما يملكه الكود (المفاتيح، والرموز، والأنواع) يحدّثه الإصدار، وما يملكه التشغيل (القيم، وحالات المفاتيح، والنصوص، والقوائم المعدّلة، والباقات، والتقويم، والأدوار) **يُدرج إن غاب فقط** ولا يكتب فوقه إصدار أبداً (N-01).
- **خريطة الاحتفاظ:** لكل جدول صف في §17.5 (فئة الاحتفاظ، وعمود البداية، والإجراء، والأعمدة التي يمحوها إخفاء الهوية)، وجدول بلا صف يرفض البناء.
- هذا الإصدار يحل محل التصميم المبدئي، وكل ما فيه باقٍ بالأسماء نفسها عدا ما يلي:

| في التصميم المبدئي | في هذا النموذج |
|---|---|
| `shop_documents` | `tenant_documents` لكل أنواع المستأجرين |
| `telecom_list_entries` (الطلبات) | الاسم نفسه للطلبات، ومعه `telecom_list_states` للحالة المطلوبة والمؤكدة |
| `telecom_location_updates` | `geo_private.telecom_location_updates` |
| `audit_logs` | `audit.audit_logs` مع `audit.seals` و`audit.anchors` |
| `gsma_checks` و`customs_lookups` | `gsma_cache` و`customs_cache` |
| `store_orders` و`store_order_items` | `commerce.store_orders` و`commerce.order_items` |
| `ad_stats` | `commerce.ad_stats_daily` |
| `subscription_plans` و`subscriptions` | `commerce.packages` و`commerce.package_features` و`commerce.shop_subscriptions` و`commerce.api_subscriptions` (D-93) |
| `api_usage` | `commerce.api_usage_events` و`commerce.api_usage_daily` |
| `shoppro_*` | المخطط `shoppro` (D-92) |
| `police_units` (الجهة) | بالمعنى نفسه، ومعه `police_stations` للأقسام |

## 2. المخطط العام

مخططات صغيرة حسب المجال، والعلاقات الكاملة في جداول الأقسام التالية.

### 2.1 الحسابات والهوية

```mermaid
erDiagram
    persons ||--o| users : "يملك حساباً"
    users ||--o{ user_devices : "يدخل من"
    user_devices ||--o{ sessions : "جلسات"
    sessions ||--o{ refresh_tokens : "رموز تجديد"
    users ||--o{ otp_challenges : "رموز تحقق"
    users ||--o{ identity_verifications : "يطلب التوثيق"
    users ||--o{ trusted_contacts : "يضيف"
    users ||--o{ alternate_contacts : "رقم بديل"
    users ||--o{ account_recoveries : "استعادة"
    users ||--o{ consents : "موافقات"
    persons ||--o{ data_access_events : "من اطّلع"
    users ||--o{ security_emails : "إيميل أمني"
    users ||--o{ account_executors : "الوصي المختار"
    users ||--o{ user_channel_links : "ربط تلغرام"
    persons ||--o{ restrictions : "قيود الشخص"
    users ||--o{ restrictions : "قيود الحساب"
    persons ||--o| persons : "مدموج في"
```

### 2.2 الأجهزة والملكية

```mermaid
erDiagram
    manufacturers ||--o{ devices : "تصنّع"
    devices ||--|{ device_identifiers : "معرّفات"
    tac_entries ||--o{ devices : "الموديل"
    devices ||--o{ ownerships : "سجل الملكية"
    persons ||--o{ ownerships : "يملك"
    tenants ||--o{ ownerships : "مخزون"
    devices ||--o{ ownership_transfers : "طلبات نقل"
    devices ||--o{ authorized_users : "مفوّضون"
    devices ||--o{ certificates : "شهادات"
    devices ||--o{ self_registrations : "تسجيل ذاتي"
    devices ||--o{ device_merges : "دمج"
    devices ||--o{ device_timeline_entries : "خط زمني"
    device_identifiers ||--o{ device_identifier_flags : "معرّف مشترك"
    devices ||--o{ device_reservations : "حجز لتدفق"
    devices ||--o{ succession_requests : "انتقال المتوفى"
    persons ||--o{ succession_requests : "الطالب والمتوفى"
    tenants ||--o{ ownership_transfers : "نقل لمحل"
    devices ||--o{ restrictions : "قيود الجهاز"
```

### 2.3 البلاغات والفحوص

```mermaid
erDiagram
    devices ||--o{ reports : "بلاغات"
    report_batches ||--o{ reports : "بلاغ سرقة المحل"
    users ||--o{ reports : "يقدّم"
    reports ||--o{ report_evidence : "أدلة"
    reports ||--o{ report_messages : "طلب معلومات"
    reports ||--o{ closure_requests : "طلبات إغلاق"
    reports ||--o{ disputes : "اعتراضات"
    reports ||--o| report_owner_confirmations : "تأكيد المالك"
    devices ||--o{ imei_checks : "فحوص"
    imei_checks ||--o| check_receipts : "إيصال"
    imei_checks ||--o{ tips : "معلومات واردة"
    reports ||--o{ tips : "مرتبطة"
    reports ||--o{ reports : "ادعاء منافس"
    police_imports ||--o{ police_import_rows : "أسطر"
    police_import_rows }o--o| reports : "أنشأ أو رُبط"
```

### 2.4 المستأجرون وعمليات المحل

```mermaid
erDiagram
    tenants ||--o| shops : "محل"
    tenants ||--o| importers : "وكيل"
    shops ||--o{ shop_members : "أعضاء"
    importers ||--o{ importer_members : "أعضاء"
    shops ||--o{ shop_transactions : "معاملات"
    shop_transactions ||--o| invoices : "فاتورة"
    devices ||--o{ shop_transactions : "موضوع"
    shops ||--o{ repair_jobs : "صيانة"
    repair_jobs ||--o{ board_replacements : "استبدال لوحة"
    importers ||--o{ import_batches : "دفعات"
    importers ||--o{ wholesale_transfers : "نقل بالجملة"
    shops ||--o{ wholesale_transfers : "يستلم"
    tenants ||--o{ tenant_member_invites : "دعوات"
    tenants ||--o{ tenant_change_requests : "تعديل وتغيير مالك"
    tenants ||--o{ tenant_owner_periods : "فترات الملكية"
    shops ||--o{ shop_branches : "فروع"
    shop_branches ||--o{ shop_transactions : "موقع العملية"
    tenants ||--o{ printer_profiles : "طابعات"
    shop_transactions ||--o| shop_transactions : "إرجاع لبيع"
```

### 2.5 التنبيهات والاتصالات والتتبّع والأمن

```mermaid
erDiagram
    devices ||--o{ security_alerts : "تنبيهات"
    telecom_operators ||--o{ telecom_events : "أحداث"
    devices ||--o{ telecom_list_entries : "طلبات القوائم"
    devices ||--o{ block_holds : "تأجيل الحظر"
    devices ||--o{ tracking_sessions : "جلسات تتبّع"
    police_units ||--o{ police_stations : "أقسام"
    police_units ||--o{ police_users : "عناصر"
    police_units ||--o{ police_case_refs : "قضايا"
    police_case_refs ||--o{ police_case_lookups : "بحث بالرقم الوطني"
    devices ||--o{ seized_devices : "ضبط"
    security_alerts }o--o{ police_referrals : "إحالة"
```

### 2.6 الباقات والمدفوعات والمتجر

```mermaid
erDiagram
    packages ||--o{ package_features : "ميزات"
    packages ||--o{ shop_subscriptions : "اشتراكات"
    service_orders ||--o{ payments : "دفعات"
    payments ||--o| service_activations : "تفعيل"
    suppliers ||--o{ products : "منتجات"
    store_orders ||--|{ order_items : "أسطر"
    store_orders ||--o| shipments : "شحنة"
    shipments ||--o| courier_collections : "قبض"
    shipments ||--|{ shipment_codes : "رمزا الاستلام والتسليم"
    store_orders ||--o{ returns : "إرجاع"
    suppliers ||--o{ supplier_settlements : "تسويات"
    supplier_settlements ||--|{ settlement_lines : "أسطر"
    supplier_settlements ||--o{ settlement_remarks : "ملاحظات"
    suppliers ||--o{ supplier_receivables : "ذمم"
    suppliers ||--o{ product_revisions : "تعديلات منتج"
    products ||--o{ product_revisions : "مراجعة"
    returns ||--o| shipments : "شحنة إرجاع"
    payments ||--o{ payment_voids : "إعادة آلية"
    payments ||--o{ refunds : "استرداد"
    shop_subscriptions ||--o{ subscription_adjustments : "تمديد وتحويل"
    tenants ||--o{ trial_grants : "تجربة واحدة"
    courier_remittances ||--o{ courier_collections : "تسليم نقد"
```

### 2.7 المحفظة وتعبئة الرصيد

```mermaid
erDiagram
    shops ||--o| shop_wallets : "محفظة"
    shop_wallets ||--o{ wallet_operations : "عمليات"
    shop_members ||--o| wallet_member_limits : "حدود"
    topup_products ||--o{ topup_orders : "منتج"
    shop_wallets ||--o{ topup_orders : "تعبئة"
    topup_orders ||--o| wallet_operations : "خصم أو استرداد"
    operator_prefixes }o--|| topup_products : "الشبكة"
    wallet_operations ||--o{ wallet_operations : "تصحيح مرتبط"
    shop_wallets ||--o{ restrictions : "قيود المحفظة"
    topup_orders ||--|| topup_order_refs : "تفرّد الطلب"
```

### 2.8 المحاسبة وإدارة المحل (`shoppro`)

```mermaid
erDiagram
    items ||--o{ stock_movements : "حركة"
    items ||--o{ pos_sale_lines : "مبيع"
    pos_sales ||--|{ pos_sale_lines : "أسطر"
    pos_sales ||--o{ pos_payments : "دفع"
    cash_sessions ||--o{ cash_movements : "حركات الصندوق"
    customers ||--o{ receivables : "ديون"
    receivables ||--o| installment_plans : "تقسيط"
    installment_plans ||--|{ installments : "دفعات"
    journal_entries ||--|{ journal_lines : "قيد"
    ledger_accounts ||--o{ journal_lines : "حساب"
    pos_sales ||--o{ sales_returns : "مرتجع"
    sales_returns ||--|{ sales_return_lines : "أسطر"
    pending_postings }o--o| journal_entries : "يُرحَّل عند التجديد"
    tenant_data_keys ||--o{ journal_entries : "مفتاح المحل"
```

### 2.9 البنية المشتركة

```mermaid
erDiagram
    files ||--o{ file_duplicates : "تكرار"
    notifications ||--o{ notification_deliveries : "تسليمات"
    message_templates ||--o{ message_template_versions : "إصدارات"
    settings ||--o{ settings_history : "تغييرات"
    feature_toggles ||--o{ feature_toggle_versions : "تغييرات"
    content_entries ||--o{ content_versions : "إصدارات"
    audit_logs ||--o| seals : "ختم"
    outbox_events ||--o{ consumed_events : "استهلاك"
    outbox_events ||--o{ parked_events : "ركن بالترتيب"
    settings ||--o{ scheduled_setting_changes : "تغيير بمهلة"
    catalog_changes }o--|| content_entries : "مجموعة تغيير"
    business_calendar ||--o{ admin_work_items : "مهل الدوام"
    unforeseen_cases ||--o| admin_work_items : "قائمة unforeseen"
```

### 2.10 القيود والصفة ودورة حياة الشخص (الآليات الموحّدة)

```mermaid
erDiagram
    persons ||--o{ users : "حساب حي واحد"
    persons ||--o{ restrictions : "حظر وقيود إساءة"
    users ||--o{ account_executors : "يختار وصياً"
    account_executors }o--|| users : "الوصي"
    succession_requests }o--|| persons : "المتوفى"
    succession_requests }o--|| users : "الطالب"
    succession_requests ||--o| ownerships : "ملكية بمصدر succession"
    tenants ||--o{ tenant_owner_periods : "مالك على السجل نفسه"
    tenant_change_requests ||--o| tenant_owner_periods : "تغيير المالك"
    devices ||--o| device_reservations : "حجز مفتوح واحد"
    restrictions }o--o| state_transitions : "حدث السبب"
```

الآليات التي تعمل على هذه الجداول في [التصميم التقني §20](19-technical-design.md): القيود (M-4، §5.9 هنا)، وحارس الحيازة والحجز (M-3، §7.8)، والانتقال (D-103، §7.9)، وتغيير المالك على السجل نفسه (D-107، §10.14)، وصفة التصرّف (M-13، `acting_as` في §16.4 و§16.6).

## 3. المرجعيات والجغرافيا

### 3.1 `governorates` — المحافظات
**ثابتة جزئياً** (المفتاح `smallint` من 1 إلى 14) · **المتطلبات:** GEO-01، ROLLOUT-02، D-80

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | smallint | لا | PK |
| code | text | لا | فريد، رمز لاتيني ثابت |
| name_ar | text | لا | الاسم المعروض |
| sort | smallint | لا | ترتيب العرض |
| polygon | geometry(MultiPolygon,4326) | لا | الحدود الإدارية (§15.2 في 19) |
| polygon_version | int | لا | إصدار المضلّع المبذور |
| centroid | geography(Point,4326) | لا | — |
| updated_at | timestamptz | لا | — |

**الفهارس:** `ix_governorates_polygon` (GiST).

الكود يحمل **المعرّف الثابت ورمزه فقط** (`packages/shared`)، والأسماء والترتيب والمضلّعات من هذا الجدول وتصل الواجهات في `bootstrap` (N-18). وتعديل الاسم أو الترتيب من اللوحة مجموعة تغيير في `catalog_changes` (§16.7). وإضافة محافظة تغيير قانوني: ترحيل وقرار معماري ونطاق الأمن (D-80) وتفعيل الإطلاق.

### 3.2 `areas` — المناطق
**قياسية** (المفتاح `int`) · **المتطلبات:** GEO-01، GEO-05، 07 §2

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| governorate_id | smallint | لا | FK → governorates |
| name_ar | text | لا | — |
| name_norm | text | لا | للبحث |
| polygon | geometry(MultiPolygon,4326) | نعم | إن توفر |
| centroid | geography(Point,4326) | لا | يُستخدم عند تخفيض دقة المواقع |
| active | boolean | لا | — |

**الفهارس:** `uq_areas_gov_name (governorate_id, name_ar)`، و`ix_areas_polygon` (GiST)، و`ix_areas_name_norm` (trgm).

### 3.3 `manufacturers` — الشركات المصنّعة
**قياسية** (المفتاح `int`) · **المتطلبات:** SERIAL-01، SERIAL-02، CHECK-01، D-91

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| name | text | لا | فريد، الاسم اللاتيني |
| name_ar | text | لا | — |
| serial_pattern | text | نعم | ⚙️ تعبير صيغة الرقم التسلسلي، يُختبر بمحرّك خطّي قبل الحفظ مع معاينة أثره على الأرقام المسجّلة. وبذوره الافتراضية في [قواعد العمل](06-business-rules.md) §16.4 (Apple، وDell، وLenovo، وHP، وASUS، وAcer، وSamsung للأجهزة اللوحية، وMicrosoft، و«أخرى») |
| serial_hint_content_key | text | نعم | مفتاح محتوى إرشاد مكان الرقم (SERIAL-02) |
| device_kinds | text[] | لا | من `phone`، `tablet`، `laptop`، `desktop`، `watch`، `router`، `pos_terminal`، `tracker`، `other` |
| active | boolean | لا | يُتقاعد ولا يُحذف (`active = false`)، والرمز لا يتغير |

التطبيع قبل التخزين والمطابقة: قص الأطراف، وNFKC، وحروف كبيرة، وحذف المسافات والشرطات، **دون طيّ O/0 أو I/1**، والمحاولة بالمتغيرات الملتبسة عند عدم العثور في الفحص وحده ([التصميم التقني §3.10](19-technical-design.md)). وكل تعديل في هذا الجدول مجموعة تغيير في `catalog_changes` بصلاحية `devices.catalog.manage`.

### 3.4 `tac_entries` — قاعدة TAC
**المفتاح:** `tac char(8)` · **المتطلبات:** CHECK-04، FAKE-01، FAKE-02، 06 §1، R-16

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tac | char(8) | لا | PK، أرقام فقط |
| manufacturer_id | int | نعم | FK → manufacturers |
| brand | text | لا | — |
| model | text | لا | — |
| marketing_name | text | نعم | — |
| device_kind | text | لا | — |
| allocated | boolean | نعم | **ثلاثي القيمة:** `true` مخصص، و`false` غير مخصص (يعطي تحذير التقليد وحده)، و`NULL` غير معروف («موديل غير معروف» دون تحذير). `CHECK (allocated IS DISTINCT FROM false OR allocated_source = 'gsma')` |
| allocated_source | text | نعم | `gsma`، `regulator`، `customs`، `shop_confirmed`. ولا يضبط `false` إلا `gsma` |
| source | text | لا | مصدر بيانات الموديل: `gsma`، `regulator`، `customs`، `open_db`، `shop_confirmed`، `manual`. والدمج في `intl.tac.sync` بقاعدة «GSMA أولاً» |
| confirmations_count | int | لا | تأكيدات المحلات (للتعلّم) |
| confirmed | boolean | لا | اعتمده مشرف |
| updated_at | timestamptz | لا | — |

### 3.5 `shop_activity_types` — أنواع نشاط المحل
**المفتاح:** `code text` · **المتطلبات:** D-90، SHOP-01، 06 §6

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| code | text | لا | PK: `trade` (بيع وشراء أجهزة)، `repair` (صيانة)، `telecom_services` (خدمات اتصالات وإكسسوارات)، `computers` (حواسيب) |
| name_ar | text | لا | — |
| allows_device_trade | boolean | لا | `repair` وحده لا يسمح إلا بشراء «للقطع» |
| sort | smallint | لا | — |
| active | boolean | لا | يُتقاعد ولا يُحذف. وإزالة نوع نشاط من محل طلب في `tenant_change_requests` بنوع `activity_removal` ([التصميم التقني §8.4](19-technical-design.md)) |

### 3.6 مخطط `geo_private` — المواقع الدقيقة

كل جداول هذا المخطط: **الواجهة العامة إدراج فقط**، والإدارة قراءة، والأمن قراءة بنطاق المحافظة (نطاق الأمن). **المتطلبات:** 07 §2، GEO-02..07، D-46، CT-30.

**`geo_private.check_locations`** — موقع الفحص · **مقسّم** شهرياً بـ `checked_at`

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| check_id | uuid | لا | PK مع `checked_at`، FK مركّب `(check_id, checked_at)` → imei_checks (يعيشان المدة نفسها) |
| checked_at | timestamptz | لا | مفتاح التقسيم |
| point 📍 | geography(Point,4326) | نعم | يُفرَّغ عند تخفيض الدقة |
| accuracy_m | int | نعم | — |
| source | text | لا | `gps`، `whatsapp_share` |
| governorate_id | smallint | نعم | FK → governorates |
| area_id | int | نعم | FK → areas |
| precision_level | text | لا | `exact`، `area` |
| precision_reduced_at | timestamptz | نعم | بعد 90 يوماً ⚙️ لما لا يرتبط ببلاغ |
| report_linked | boolean | لا | يمنع التخفيض ما دام البلاغ قائماً |

**الفهارس:** `ix_check_locations_point` (GiST)، و`px_check_locations_reduce (checked_at) WHERE precision_level='exact' AND NOT report_linked`.

**`geo_private.operation_locations`** — موقع عمليات المحل · **ثابتة** · **المتطلبات:** SHOP-14، GEO-04، D-41

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| subject_type | text | لا | `shop_transaction`، `repair_job`، `board_replacement`، `topup`، `transfer_acceptance` (قبول النقل إلى محل، D-121) |
| subject_id | uuid | لا | — |
| subject_tenant_id | uuid | لا | FK → tenants (الجدول غير معزول بـ RLS، §1.2) |
| branch_id | uuid | نعم | FK → shop_branches، الفرع الذي قيست منه المسافة (D-109) |
| point 📍 | geography(Point,4326) | لا | — |
| accuracy_m | int | لا | — |
| distance_from_shop_m | int | لا | [التصميم التقني §15.4](19-technical-design.md) |
| out_of_range | boolean | لا | — |
| low_accuracy | boolean | لا | — |
| captured_at | timestamptz | لا | وقت الجهاز |

**الفهارس:** `uq_operation_locations_subject (subject_type, subject_id)`، و`ix_operation_locations_point` (GiST).

**`geo_private.incident_locations`** — نقطة الحادثة الاختيارية · **المفتاح:** `report_id` · **المتطلبات:** REPORT-02، GEO-05

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| report_id | uuid | لا | PK، FK → reports |
| point 📍 | geography(Point,4326) | لا | — |
| created_at | timestamptz | لا | — |

**`geo_private.findmy_locations`** — آخر موقع من صاحب الجهاز · **ثابتة** · **المتطلبات:** REPORT-16، TRACK-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| report_id | uuid | لا | FK → reports |
| point 📍 | geography(Point,4326) | لا | — |
| accuracy_m | int | نعم | — |
| observed_at | timestamptz | لا | وقت الظهور في Find My |
| screenshot_file_id | uuid | لا | FK → files |

**`geo_private.telecom_location_updates`** — مواقع الشبكة · **مقسّم** شهرياً بـ `received_at` · **المتطلبات:** TELCO-02، TELCO-13، TRACK-01..04

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `received_at` |
| received_at | timestamptz | لا | مفتاح التقسيم |
| operator_id | uuid | لا | FK → telecom_operators |
| device_id | uuid | لا | FK → devices |
| tracking_session_id | uuid | نعم | FK → tracking_sessions |
| telecom_event_id | uuid | نعم | حدث الاستخدام المصدر |
| source | text | لا | `usage_event`، `location_update` |
| point 📍 | geography(Point,4326) | لا | الموقع التقريبي (البرج أو المنطقة) |
| radius_m | int | لا | نصف قطر الدقة (TRACK-04) |
| msisdn_enc 🔐 | bytea | نعم | رقم الشريحة (TRACK-03) |
| msisdn_bidx #️⃣ | bytea | نعم | — |
| observed_at | timestamptz | لا | وقت الرصد |
| governorate_id | smallint | نعم | محسوبة من النقطة، لنطاق الأمن |

**الفهارس:** `ix_tlu_device_time (device_id, observed_at)`، و`ix_tlu_session (tracking_session_id)`.

## 4. الأشخاص والحسابات

### 4.1 `persons` — الأشخاص الطبيعيون
**قياسية** · **الاحتفاظ:** RT-06 · **الفئة:** `sensitive` · **المتطلبات:** AUTH-04، AUTH-06، AUTH-07، SHOP-06، SHOP-07، POLICE-03، PERSON-01..06، SUCCESSION-04، CIVIL-10، CIVIL-11، PLATFORM-05، 06 §5، 06 §7، 06 §16.6، 06 §16.7، D-103، D-104، D-105، D-106

الشخص كيان مستقل عن الحساب: من سجّله محل أو استورده الأمن موجود هنا ولو لم يفتح حساباً. **والمساءلة والعدّادات والقيود مربوطة بالشخص لا بالحساب** (P-12): حظر الشخص وقيود الإساءة صفوف `restrictions` بموضوع `person` (§5.9)، فإغلاق الحساب وفتح غيره لا يمحوها. والشخص يُبحث عنه أو يُنشأ **ببصمة وثيقته** تحت قفل استشاري للمعاملة ([التصميم التقني §7.6](19-technical-design.md)). وأجهزة المؤسسات تُسجَّل باسم ممثلها المسؤول شخصاً طبيعياً هنا (D-105)، فلا مالك اعتبارياً في هذا الجدول.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| full_name | text | لا | الاسم المعتمد **بالأسبقية**: اسم السجل المدني، ثم ما وثّقه المشرف، ثم اسم الطرف في آخر معاملة محل مكتملة، ثم استيراد الأمن. والاسم المعلن في الحساب لا يكتب فوقه أبداً، وكل تغيير يُكتب في `state_transitions` (K-09) |
| name_source | text | لا | مصدر `full_name`: `civil`، `moderator`، `shop_transaction`، `police_import` |
| given_name | text | نعم | الاسم الأول كما هو، والمركّب يبقى مركّباً («عبد …»، «أبو …»، «أم …»)، للعرض العام «الاسم الأول وأول حرف من الكنية» (06 §16.7، L-10) |
| father_name | text | نعم | — |
| surname | text | نعم | الكنية، من السجل المدني أو الحقول المنفصلة عند التوثيق. واسم الأم لا يُخزَّن أبداً (21) |
| surname_norm | text | نعم | الكنية بعد `ar_norm_v1` وحذف «ال» البادئة: مفتاح مطابقة الكنية في الانتقال (D-103) |
| name_norm | text | لا | للبحث الإداري |
| document_type | text | لا | نوع وثيقة الهوية: `sy_national_id` (الافتراضي)، `palestinian_syrian_card`، `foreign_passport_residence` (D-104، [قواعد العمل](06-business-rules.md) §16.6) |
| document_country | char(2) | لا | ISO 3166: `SY` للرقم الوطني ولبطاقة اللاجئ الفلسطيني السوري، وبلد إصدار الجواز للجواز الأجنبي |
| national_id_enc 🔐 | bytea | نعم | الرقم الوطني السوري. فارغ لصاحب الوثيقة البديلة. `CHECK ((document_type = 'sy_national_id') = (national_id_enc IS NOT NULL))` |
| national_id_bidx #️⃣ | bytea | نعم | بصمة الرقم الوطني |
| national_id_mask | text | نعم | `••••••••123` (20 §2.2) |
| document_number_enc 🔐 | bytea | نعم | رقم الوثيقة البديلة وحدها. `CHECK ((document_type = 'sy_national_id') = (document_number_enc IS NULL))` |
| document_bidx #️⃣ | bytea | لا | **بصمة وثيقة الهوية لكل الأنواع**: للرقم الوطني تساوي `national_id_bidx` (المدخل القانوني نفسه)، وللوثيقة البديلة بمدخل `النوع:البلد:الرقم` (§1.2)، ويضبطها محفّز. وهي المفتاح الذي تطابقه أعمدة الأطراف `*_national_id_bidx` في الجداول الأخرى |
| document_mask | text | لا | مخفي بصيغة 20 §2.2 |
| residence_number_enc 🔐 | bytea | نعم | رقم الإقامة السورية للنوع `foreign_passport_residence` |
| residence_valid_until | date | نعم | انتهاء الإقامة لا يمس الملكية القائمة، لكنه يوجب تحديث الوثيقة قبل أي إجراء حساس جديد (PERSON-03). `CHECK (document_type <> 'foreign_passport_residence' OR residence_valid_until IS NOT NULL)` |
| document_verified_at | timestamptz | نعم | تحقق المشرف اليدوي من الوثيقة البديلة (PERSON-02). والوثيقة البديلة لا تُطابق مع الأحوال المدنية |
| document_verified_by_admin_id | uuid | نعم | FK → admin_users |
| phone_e164 | text | نعم | آخر رقم معروف |
| id_card_status | text | لا | `valid`، `lost`، `cancelled`، `deceased`، `unknown` (CIVIL-05). وقيمة `deceased` من الأحوال المدنية **تمنع المعاملات وتُعلَّم فقط** ولا تغيّر `lifecycle` ولا تنقل شيئاً (CIVIL-11) |
| id_card_status_checked_at | timestamptz | نعم | — |
| civil_verified_at | timestamptz | نعم | آخر مطابقة ناجحة |
| lifecycle | text | لا | دورة حياة الشخص ([التصميم التقني §8.5 ج](19-technical-design.md)): `active`، `deceased`، `merged_into` |
| deceased_at | timestamptz | نعم | تأكيد الوفاة النافذ بعد مهلة الاعتراض (§7.9)، ويطلق تتابع `ended(deceased)`. `CHECK ((lifecycle = 'deceased') = (deceased_at IS NOT NULL))` |
| deceased_confirmed_ref_type | text | نعم | `succession_request`، `support_case` |
| deceased_confirmed_ref_id | uuid | نعم | الطلب الذي أكد الوفاة |
| merged_into_person_id | uuid | نعم | FK ذاتي: دمج صفّين لشخص واحد بعد تصحيح رقم وطني (C-27)، بأربع عيون ([التصميم التقني §7.4](19-technical-design.md)). `CHECK ((lifecycle = 'merged_into') = (merged_into_person_id IS NOT NULL))`. والصف المدموج لا يُحذف |
| merged_at | timestamptz | نعم | — |
| source | text | لا | كيف أُنشئ الصف: `account`، `shop_transaction`، `repair_intake`، `police_import`، `on_behalf`، `seizure`، `member_invite`، `transfer_recipient`، `succession` |

**الفهارس:** `uq_persons_document (document_type, document_bidx)` ([التصميم التقني §7.1](19-technical-design.md))، و`uq_persons_national_id (national_id_bidx) WHERE national_id_bidx IS NOT NULL`، و`ix_persons_name_norm` (trgm)، و`ix_persons_surname_norm (surname_norm)`، و`ix_persons_phone (phone_e164)`، و`px_persons_lifecycle (lifecycle) WHERE lifecycle <> 'active'`.

**أعمدة الأطراف في الجداول الأخرى:** حيثما يحمل جدول رقم طرف (`*_national_id_enc` و`*_bidx` و`*_mask`: المعاملات، والصيانة، ونقل الملكية، والدعوات، والاستعلامات، والهوية المعلنة) يحمل العمود **رقم وثيقة الطرف** أياً كان نوعها، ومعه `*_document_type` (الافتراضي `sy_national_id`)، وبصمته بمدخل `persons.document_bidx` نفسه، فيُطابق الشخص دون فك التشفير. والطرف بوثيقة بديلة يُعلَّم في المعاملة (`non_nid_party`) للمعاينة (PERSON-02، SHOP-30).

### 4.2 `users` — حسابات الجمهور
**قياسية** · **الاحتفاظ:** RT-03 · **الفئة:** `personal` (والهوية المعلنة `sensitive`) · **المتطلبات:** AUTH-01..16، THEFT-03، THEFT-06، ROLLOUT-01، PRIV-02، PRIV-09، ONBEHALF-04، RESTRICT-05، D-81، D-106، D-126

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| account_number | text | لا | فريد، `^SY-[2-9A-HJKMNPQRTUVWXY]{6}$` (AUTH-12) |
| person_id | uuid | نعم | FK → persons. **لا يُضبط إلا بالربط التلقائي أو بالتوثيق** ([التصميم التقني §4.2.1](19-technical-design.md)): الربط التلقائي = بصمة الوثيقة المعلنة تطابق بصمة الشخص **و**الرقم المؤكَّد هو رقم الطرف في معاملة محل مكتملة لذلك الشخص. وقبله تبقى «أجهزتي» فارغة. ويُفرَّغ عند تنفيذ الإغلاق ويبقى في `state_transitions` والتدقيق، والحساب المحظور يحتفظ به |
| phone_e164 | text | نعم | `^\+9639\d{8}$`. فارغ بعد تحرير الرقم |
| phone_bidx #️⃣ | bytea | نعم | بصمة الرقم (`pii.msisdn`) لمطابقة الدعوات والطلبات الموجّهة للرقم وحجب «أوقف» دون نص صريح |
| phone_released_at | timestamptz | نعم | تحرير الرقم من هذا الحساب (K-01): تنفيذ الإغلاق، أو فصل رقم أُعيد تدويره (§4.10). `CHECK (phone_released_at IS NOT NULL OR phone_e164 IS NOT NULL)` |
| phone_release_reason | text | نعم | `closed`، `recycled_detach`. `CHECK ((phone_released_at IS NULL) = (phone_release_reason IS NULL))` |
| phone_verified_at | timestamptz | نعم | — |
| phone_compromised_at | timestamptz | نعم | **إسقاط للقراءة فقط** لقيد `phone_compromised` النافذ (§5.9): الرقم في جهاز مسروق (THEFT-03)، لا رسائل ولا رموز إليه |
| phone_restored_at | timestamptz | نعم | — |
| password_hash | text | لا | Argon2id |
| password_changed_at | timestamptz | لا | — |
| governorate_id | smallint | نعم | FK → governorates |
| declared_full_name | text | نعم | **الهوية المعلنة قبل التوثيق** (K-09، [التصميم التقني §4.2.1](19-technical-design.md)) |
| declared_document_type | text | نعم | كـ `persons.document_type` (D-104) |
| declared_national_id_enc 🔐 | bytea | نعم | رقم الوثيقة المعلن (الرقم الوطني أو البديلة) |
| declared_national_id_bidx #️⃣ | bytea | نعم | بمدخل `persons.document_bidx` نفسه. يُستخدم لمطابقة طلب النقل الوارد قبل التوثيق، ولفحص `person_ban` عند الإعلان (D-106)، والتصادم يرد `AUTH_NATIONAL_ID_TAKEN` |
| declared_national_id_mask | text | نعم | — |
| declared_at | timestamptz | نعم | — |
| status | text | لا | `pending_phone`، `active`، `suspended`، `banned`، `closing`، `closed` ([التصميم التقني §8.5](19-technical-design.md)) |
| status_reason | text | نعم | — |
| closure_reason | text | نعم | `user_request`، `deceased` (تنفيذ تأكيد الوفاة دون مهلة التراجع، §7.9). `CHECK ((status = 'closed') = (closure_reason IS NOT NULL))` |
| identity_status | text | لا | `none`، `pending`، `verified`، `rejected` |
| identity_rejections | smallint | لا | 3 ⚙️ تحيل للدعم، والرفض لعدم تطابق الاسم وحده لا يُحسب (CIVIL-10) |
| auto_linked_at | timestamptz | نعم | الربط التلقائي (AUTH-06) |
| cooldown_until | timestamptz | نعم | **إسقاط للقراءة فقط** لقيد `cooldown` النافذ (§5.9)، لا مصدر قرار: القرار من محلّل القدرات وصفوف القيود |
| frozen_by_owner_at | timestamptz | نعم | **إسقاط** لقيد `account_not_me_freeze` («لم أكن أنا»)، ويُقارن به `user_devices.trusted_at` في فك التجميد من جهاز مربوط قبله |
| login_locked_at | timestamptz | نعم | قفل الحساب كله بعد ⚙️ 20 إخفاقاً خلال 24 ساعة من أي مصادر، ويُفك بإعادة تعيين كلمة المرور برمز. والقفل لكل مصدر (15 دقيقة ثم ساعة ⚙️) في Redis بمفتاح (الحساب، المصدر) لا هنا ([التصميم التقني §4.2.3](19-technical-design.md)) |
| minor_managed | boolean | لا | قاصر بإدارة وليّ الأمر (PRIV-09) |
| age_confirmed_at | timestamptz | نعم | إقرار «18 سنة أو أكثر» (21 §10) |
| notify_channel_pref | text | لا | `whatsapp` (الافتراضي)، `sms`: قناة صاحب البلاغ بالنيابة وغيره ممن يطلبها (ONBEHALF-04، K-25) |
| created_via | text | لا | `self`، `on_behalf`، `member_invite` |
| invite_id | uuid | نعم | FK → rollout_invites |
| closure_requested_at | timestamptz | نعم | — |
| closed_at | timestamptz | نعم | — |
| authz_version | int | لا | يرتفع مع كل تغيير صلاحيات أو قيد |
| last_login_at | timestamptz | نعم | — |

**الفهارس:** `uq_users_account_number`، و`uq_users_phone_live (phone_e164) WHERE phone_released_at IS NULL`، و`uq_users_person (person_id) WHERE status <> 'closed'`، و`uq_users_declared_nid (declared_national_id_bidx) WHERE status <> 'closed'`، و`ix_users_phone_bidx (phone_bidx)`، و`ix_users_status (status)`.

**إعادة التسجيل بعد الإغلاق وفصل الرقم المعاد تدويره (K-01):** التفرّد على الرقم يشمل الحسابات التي لم يُحرَّر رقمها فقط، وعلى الشخص وعلى الوثيقة المعلنة الحسابات غير المغلقة فقط. فتنفيذ الإغلاق يضبط `phone_released_at` ويفرّغ `phone_e164` و`person_id`، فيفتح الشخص نفسه حساباً جديداً برقمه ويستعيد أجهزته وفواتيره بالربط التلقائي أو التوثيق، لأن `persons` والملكيات والفواتير باقية. وفصل الرقم المعاد تدويره (`account_recoveries.kind = number_detach`، §4.10) يضبط `phone_released_at` بسبب `recycled_detach` فيفتح حامل الرقم حساباً جديداً، والحساب القديم يدخل بعدها بالاستعادة بالهوية فقط. والحساب الذي لم يُؤكَّد رقمه خلال ⚙️ 24 ساعة يُحذف نهائياً.

### 4.3 `user_devices` — أجهزة الدخول
**قياسية** · **المتطلبات:** AUTH-08، 07 §5، CT-11

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| client_device_id | uuid | لا | يولّده التطبيق أو الموقع |
| platform | text | لا | `web`، `ios`، `android` |
| distribution_channel | text | نعم | `play`، `app_store`، `direct_apk` |
| device_model | text | نعم | — |
| os_version | text | نعم | — |
| app_version | text | نعم | — |
| public_key | bytea | نعم | مفتاح P-256 للجهاز (§4.2.4 في 19) |
| trusted_at | timestamptz | نعم | تأكيد الجهاز برمز |
| push_token | text | نعم | — |
| push_provider | text | نعم | `apns`، `fcm` |
| last_seen_at | timestamptz | لا | — |
| revoked_at | timestamptz | نعم | — |

**الفهارس:** `uq_user_devices (user_id, client_device_id)`.

### 4.4 `sessions` — جلسات الجمهور
**قياسية** (المعرّف هو `sid` في رمز الدخول) · **الاحتفاظ:** RT-01 · **الفئة:** `personal` · **المتطلبات:** AUTH-08، THEFT-04، TRUSTED-02، TENANT-03، REPORT-21

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| user_device_id | uuid | نعم | FK → user_devices (`ON DELETE CASCADE`، §1.4). فارغ لجلسات `theft_only` و`exit_only` التي لا توثّق الجهاز |
| last_used_at | timestamptz | لا | — |
| expires_at | timestamptz | لا | 30 يوماً ⚙️ من آخر تجديد |
| step_up_at | timestamptz | نعم | آخر إعادة تحقق |
| tenant_context_id | uuid | نعم | آخر سياق مستأجر مختار (للعرض فقط) |
| scope | text | لا | نطاق الجلسة من سجل النطاقات ([التصميم التقني §5.12](19-technical-design.md)): `full`، و`theft_only` (جلسة «بلاغ السرقة فقط» دون جهاز موثّق، §4.2.13 في 19، وكانت تُسمّى `theft_report`)، و`exit_only` (جلسة الخروج المالي ⚙️ 30 دقيقة دون تجديد، §4.2.14 في 19)، و`read_only` (المستخدم المعلّق)، و`handoff`. وطلب الاستعادة **رمز لا جلسة** (`account_recoveries.recovery_token_hash`) |
| client_kind | text | لا | `app`، `web_bff` (الموقع: الرموز عند خادم Next.js) |
| ip | inet | نعم | حساسة بتشفير التخزين، ويُحذف بالاحتفاظ |
| governorate_hint | smallint | نعم | للعرض في قائمة الجلسات |
| revoked_at | timestamptz | نعم | — |
| revoke_reason | text | نعم | `logout`، `logout_others`، `password_changed`، `phone_changed`، `recovery`، `reuse_detected`، `theft_protection`، `trusted_contact_report`، `suspended`، `banned`، `not_me`، `member_removed`، `tenant_owner_changed`، `account_closed`، `phone_detached`، `deceased`، `scope_expired` |

**الفهارس:** `px_sessions_active (user_id) WHERE revoked_at IS NULL`.

### 4.5 `refresh_tokens` — رموز التجديد
**ثابتة** (مع تحديث `used_at`) · **المتطلبات:** AUTH-02، CT-09

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| session_id | uuid | لا | FK → sessions (`ON DELETE CASCADE`، §1.4) |
| token_hash | bytea | لا | فريد، SHA-256 للرمز |
| parent_id | uuid | نعم | FK ذاتي |
| issued_at | timestamptz | لا | — |
| expires_at | timestamptz | لا | — |
| used_at | timestamptz | نعم | — |
| replaced_by_id | uuid | نعم | FK ذاتي |
| reuse_detected_at | timestamptz | نعم | — |

**الفهارس:** `uq_refresh_tokens_hash (token_hash)`، و`ix_refresh_tokens_session (session_id)`.

### 4.6 `otp_challenges` — رموز التحقق
**ثابتة** (مع تحديث العدّادات) · **المتطلبات:** AUTH-01، AUTH-03، AUTH-09، OWN-04، THEFT-02، 06 §9

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | نعم | FK → users (فارغ قبل إنشاء الحساب) |
| target_enc 🔐 | bytea | لا | الرقم الوجهة |
| target_bidx #️⃣ | bytea | لا | لحد الرموز لكل رقم |
| purpose | text | لا | `sign_up`، `login_new_device`، `password_reset`، `phone_change_old`، `phone_change_new`، `transfer_confirm`، `step_up`، `phone_restore`، `alternate_verify`، `trusted_invite`، `wallet_withdraw`، `recovery_new_phone`، `exit_session` |
| context_type | text | نعم | مثل `ownership_transfer` |
| context_id | uuid | نعم | — |
| code_hash | bytea | لا | HMAC للرمز. **والرمز نفسه لا يُخزَّن في أي جدول أبداً** (فئة `secret_ephemeral`، H-01): لا هنا، ولا في `notifications.payload`، ولا صندوق الصادر، ولا المهام المجدولة، ولا الرسائل الميتة، ولا `ops.integration_calls`. المرسل يقرؤه من خانة مؤقتة في Redis بمدة صلاحيته، وفحص الطُعم يبحث عنه في كل مصرف (FF-27) |
| channel | text | لا | `whatsapp`، `sms` |
| attempts | smallint | لا | — |
| max_attempts | smallint | لا | 5 ⚙️ |
| expires_at | timestamptz | لا | 5 دقائق ⚙️ |
| resend_available_at | timestamptz | لا | 60 ثانية ⚙️ |
| consumed_at | timestamptz | نعم | — |
| invalidated_at | timestamptz | نعم | — |
| notification_id | uuid | نعم | FK~ → notifications (مقسّم): رابط للحالة فقط، والإشعار لا يحمل الرمز. والتسليم الفاشل لرمز لا يُعاد إرساله من موظف: يطلب المستخدم رمزاً جديداً |

**الفهارس:** `ix_otp_target_time (target_bidx, created_at)`، و`px_otp_open (user_id, purpose) WHERE consumed_at IS NULL AND invalidated_at IS NULL`.

### 4.7 `identity_verifications` — طلبات توثيق الهوية
**قياسية** · **المتطلبات:** AUTH-05، ADMIN-05، CIVIL-01، CIVIL-02، CIVIL-05، D-32

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| declared_full_name | text | لا | — |
| declared_given_name | text | نعم | أجزاء الاسم المعلنة (06 §16.7) |
| declared_father_name | text | نعم | — |
| declared_surname | text | نعم | — |
| document_type | text | لا | كـ `persons.document_type` (D-104). والوثيقة البديلة يتحقق منها المشرف يدوياً ولا تُطابق مع الأحوال المدنية |
| document_country | char(2) | لا | — |
| declared_national_id_enc 🔐 | bytea | لا | رقم الوثيقة (الرقم الوطني أو البديلة) |
| declared_national_id_bidx #️⃣ | bytea | لا | بمدخل `persons.document_bidx`، لمنع استخدام رقم مسجّل (06 §7) |
| residence_number_enc 🔐 | bytea | نعم | للجواز الأجنبي مع الإقامة |
| residence_valid_until | date | نعم | سارية عند التحقق |
| extra_field_kind | text | نعم | `mother_name`، `birth_date` (CIVIL-01) |
| extra_field_enc 🔐 | bytea | نعم | — |
| front_file_id | uuid | لا | FK → files، التقاط حي (`id_card_front` أو `alt_identity_document`) |
| back_file_id | uuid | لا | FK → files |
| civil_match | text | لا | `match`، `no_match`، `name_only_mismatch` (الرقم والبيان الإضافي متطابقان والاسم وحده لا: مراجعة يدوية ولا يُحسب محاولة، CIVIL-10)، `unavailable`، `not_enabled`، `not_applicable` (الوثيقة البديلة) |
| counts_as_attempt | boolean | لا | هل يُحسب الرفض في `users.identity_rejections` |
| civil_query_id | uuid | نعم | — |
| civil_card_status | text | نعم | — |
| status | text | لا | `pending`، `approved`، `rejected`، `cancelled`، `reversed` |
| assigned_admin_id | uuid | نعم | FK → admin_users |
| decided_by_admin_id | uuid | نعم | FK → admin_users |
| decided_at | timestamptz | نعم | — |
| reason_code | text | نعم | من الأسباب الجاهزة |
| reason_text | text | نعم | — |
| attempt_no | smallint | لا | — |

**الفهارس:** `px_idv_pending (user_id) WHERE status='pending'` فريد، و`ix_idv_queue (status, created_at)`.

### 4.8 `alternate_contacts` — الأرقام البديلة
**قياسية** · **المتطلبات:** THEFT-02، TRUSTED-02، D-81

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| report_id | uuid | نعم | FK → reports |
| phone_enc 🔐 | bytea | لا | للإشعارات فقط، لا يُستخدم في أي مسار دخول أو استعادة |
| phone_bidx #️⃣ | bytea | لا | — |
| phone_mask | text | لا | — |
| source | text | لا | `self`، `trusted_contact` |
| added_by_user_id | uuid | لا | FK → users |
| verified_at | timestamptz | نعم | — |
| active | boolean | لا | — |
| deactivated_at | timestamptz | نعم | عند استعادة الرقم الأصلي |

**الفهارس:** `px_alternate_active (user_id) WHERE active` فريد.

### 4.9 `trusted_contacts` — الجهات الموثوقة
**قياسية** · **المتطلبات:** TRUSTED-01..05، 06 §3.2

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users (صاحب الحساب) |
| contact_user_id | uuid | نعم | FK → users، بعد القبول |
| invited_phone_e164 | text | لا | — |
| display_name | text | لا | — |
| status | text | لا | نموذج RELATION ([التصميم التقني §8.15](19-technical-design.md)): `invited`، `active`، `suspended`، `declined`، `expired`، `removed` |
| expires_at | timestamptz | نعم | الدعوة 7 أيام ⚙️ |
| responded_at | timestamptz | نعم | — |
| suspended_at | timestamptz | نعم | تعليق حساب أي طرف، ويعود برفعه (`restore_if_cause`) |
| removed_at | timestamptz | نعم | — |
| removed_reason | text | نعم | `owner`، `contact_left`، `account_closed`، `account_banned`، `contact_banned` (D-106: المحظور شخصاً لا يكون جهة موثوقة)، `contact_closed`، `abuse` |

**الفهارس:** `px_trusted_open (user_id, invited_phone_e164) WHERE status IN ('invited','active','suspended')` فريد، و`px_trusted_invited_phone (invited_phone_e164) WHERE status = 'invited'` لمطابقة الدعوة عند التسجيل (K-18)، وحد 3 ⚙️ يُفرض بقفل على صف المستخدم.

### 4.10 `account_recoveries` — استعادة الحساب بالهوية وفصل الرقم
**قياسية** · **الاحتفاظ:** RT-37 (5 سنوات للاستعادة وتغيير الرقم) · **الفئة:** `sensitive` · **المتطلبات:** THEFT-06، THEFT-07، AUTH-09، D-81، CT-07، CT-12، K-01

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users (يُحدَّد من رقم الحساب أو `SY-` المدخل، والرد للمستخدم محايد دائماً) |
| initiated_by_type | text | لا | `self` (يبدأها المستخدم دون جلسة، THEFT-06)، `support` |
| kind | text | لا | `identity_recovery`، `assisted_phone_change`، `phone_restore` (رفع إيقاف الرسائل عن الرقم الأصلي بالهوية L3)، `unfreeze` (فك تجميد «لم أكن أنا» بالهوية)، `number_detach` (فصل رقم أُعيد تدويره عن حساب قديم بطلب حامله الجديد عبر الدعم، K-01) |
| support_ticket_id | uuid | لا | FK → support_tickets |
| new_phone_e164 | text | نعم | `CHECK (kind IN ('phone_restore','unfreeze','number_detach') OR new_phone_e164 IS NOT NULL)` |
| detach_holder_phone_bidx #️⃣ | bytea | نعم | لـ `number_detach`: بصمة الرقم الذي أثبت حامله الجديد حيازته، ويجب أن يساوي `users.phone_bidx` للحساب القديم. `CHECK ((kind = 'number_detach') = (detach_holder_phone_bidx IS NOT NULL))` |
| requires_gm_approval | boolean | لا | لـ `number_detach`: الحساب القديم يملك محلاً أو محفظة أو بلاغاً نافذاً، فالموافقة الثانية للمدير العام |
| objection_until | timestamptz | نعم | لـ `number_detach`: ⚙️ 72 ساعة `WALL_SECURITY` يُشعَر فيها الحساب القديم على كل وسائله الأخرى مع «هذا رقمي، أوقف» (مهمة `account.phone_detach.execute`) |
| objected_at | timestamptz | نعم | اعتراض صاحب الحساب القديم يجعل الطلب `cancelled` |
| new_phone_verified_at | timestamptz | نعم | رمز `recovery_new_phone`، إلزامي للبدء الذاتي |
| recovery_token_hash | bytea | نعم | فريد. رمز الاستعادة المعتم (256 بت) في التطبيق: يسمح برموز الالتقاط ورفع الهوية ومتابعة الحالة فقط، ولا جلسة |
| recovery_token_expires_at | timestamptz | نعم | ⚙️ 72 ساعة |
| notice_sent_at | timestamptz | نعم | إشعار ⚙️ 24 ساعة قبل التنفيذ مع «لم أكن أنا» |
| id_front_file_id | uuid | نعم | FK → files |
| id_back_file_id | uuid | نعم | FK → files |
| civil_match | text | نعم | — |
| initiated_by_admin_id | uuid | نعم | FK → admin_users. فارغ للبدء الذاتي. `CHECK ((initiated_by_type = 'self') = (initiated_by_admin_id IS NULL))` |
| reviewed_by_admin_id | uuid | نعم | موظف الدعم المراجع |
| approved_by_admin_id | uuid | نعم | `CHECK (approved_by_admin_id <> reviewed_by_admin_id AND approved_by_admin_id IS DISTINCT FROM initiated_by_admin_id)` |
| status | text | لا | `requested`، `under_review`، `approved`، `waiting`، `executed`، `rejected`، `cancelled`، `expired` ([التصميم التقني §8.14](19-technical-design.md)) |
| execute_after | timestamptz | نعم | 24 ساعة ⚙️ بعد الموافقة |
| paused_at | timestamptz | نعم | «لم أكن أنا» من وسيلة أُنشئت بعد آخر حدث خطر **لا يُلغي**: يبقى `waiting` موقوفاً ويُجمَّد الحساب ويقرر المدير العام بالأدلة خلال ⚙️ يوم دوام |
| cancel_count_for_account | smallint | لا | الطلب المُلغى ⚙️ مرتين للحساب نفسه يُصعَّد للمدير العام آلياً |
| executed_at | timestamptz | نعم | — |
| reason_text | text | نعم | — |

### 4.11 `phone_changes` — تغييرات الرقم
**ثابتة** · **المتطلبات:** AUTH-09

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| old_phone_e164 | text | لا | — |
| new_phone_e164 | text | لا | — |
| method | text | لا | `self_otp`، `recovery` |
| account_recovery_id | uuid | نعم | — |
| old_verified_at | timestamptz | نعم | — |
| new_verified_at | timestamptz | نعم | — |
| completed_at | timestamptz | نعم | — |

### 4.12 `security_emails` — الإيميل الأمني الاختياري (D-126)
**قياسية** · **الاحتفاظ:** RT-03 · **الفئة:** `personal` · **المتطلبات:** AUTH-13، NOTIF-01، D-126، [التصميم التقني §4.2.15](19-technical-design.md)

للتنبيهات الأمنية وحدها: لا يحمل رمزاً ولا رابط دخول أبداً، ولا يصلح لاستعادة الحساب، ورابطه الوحيد «لم أكن أنا» بإجراء التجميد. وإيميل الفواتير الاختياري في المعاملة (SHOP-11) شيء منفصل.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| address_enc 🔐 | bytea | لا | العنوان (`pii.contact`) |
| address_bidx #️⃣ | bytea | لا | بعد التطبيع (نطاق بحروف صغيرة) |
| address_mask | text | لا | — |
| status | text | لا | `pending_verification` ← `pending_activation` ← `active` ← `replaced` أو `removed` ([التصميم التقني §8.15](19-technical-design.md)) |
| verification_link_token_id | uuid | نعم | FK → link_tokens (`action = email_verify`، ⚙️ 24 ساعة، يؤكد بطلب POST ولا يفتح جلسة) |
| verified_at | timestamptz | نعم | — |
| effective_after | timestamptz | نعم | التغيير يسري بعد ⚙️ 72 ساعة `WALL_SECURITY` (مهمة `account.security_email.activate`)، والإضافة الأولى تسري عند التأكيد |
| activated_at | timestamptz | نعم | — |
| replaced_by_id | uuid | نعم | FK ذاتي |
| ended_at | timestamptz | نعم | — |
| cancelled_by_not_me_at | timestamptz | نعم | «لم أكن أنا» من أي وسيلة يلغي التغيير ويجمّد الحساب |

**الفهارس:** `px_security_email_active (user_id) WHERE status = 'active'` فريد (عنوان نشط واحد)، و`px_security_email_pending (user_id) WHERE status IN ('pending_verification','pending_activation')` فريد (تغيير منتظر واحد). والتغيير ممنوع أثناء قيدي `cooldown` و`password_reset_hold` (`AUTH_EMAIL_CHANGE_PENDING` للتغيير المنتظر).

### 4.13 `account_executors` — «الوصي» المختار مسبقاً (D-103)
**قياسية** · **الاحتفاظ:** RT-33 (كالجهات الموثوقة: مدة العلاقة ثم سنة) · **الفئة:** `personal` · **المتطلبات:** SUCCESSION-03، SUCCESSION-02، RESTRICT-05، D-103، D-106

علاقة بنموذج RELATION: يدعو صاحب الحساب وصياً (⚙️ واحداً افتراضياً) بإعادة تحقق، ويقبل الوصي من حسابه الموثّق الهوية. **ولا يملك الوصي أي قدرة على الحساب في حياة صاحبه** (D-81)، وصفته `executor` لا تظهر إلا في طلب الانتقال (§7.9).

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users (صاحب الحساب) |
| person_id | uuid | لا | FK → persons (صاحب الحساب، لأن الصفة تبقى بعد إغلاق حسابه بالوفاة) |
| executor_user_id | uuid | نعم | FK → users، بعد القبول |
| executor_person_id | uuid | نعم | FK → persons، بعد القبول (موثّق الهوية) |
| invited_phone_e164 | text | لا | — |
| invited_phone_bidx #️⃣ | bytea | لا | — |
| display_name | text | لا | — |
| status | text | لا | `invited`، `active`، `declined`، `expired`، `removed` ([التصميم التقني §8.15](19-technical-design.md)) |
| expires_at | timestamptz | لا | الدعوة ⚙️ 7 أيام (`succession.designation.accept_window`) |
| responded_at | timestamptz | نعم | — |
| removed_at | timestamptz | نعم | — |
| removed_reason | text | نعم | `owner`، `executor_left`، `executor_banned` (D-106: المحظور لا يكون وصياً)، `account_closed` |

**الفهارس:** `px_executor_open (user_id) WHERE status IN ('invited','active')` بحد ⚙️ 1 (`succession.designated_guardians.max`) يُفرض بقفل صف المستخدم، و`ix_executor_person (executor_person_id) WHERE status = 'active'`، و`px_executor_invited_phone (invited_phone_bidx) WHERE status = 'invited'`.

### 4.14 `user_channel_links` — ربط تلغرام للإشعارات (E-09)
**قياسية** · **RLS** (`user_id = app.user_id` للقراءة) · **الاحتفاظ:** RT-03 · **الفئة:** `personal` · **المتطلبات:** NOTIF-01، [التصميم التقني §11.2](19-technical-design.md)

قناة إشعارات فقط لمن ربطها، **لا رموز تحقق أبداً** (20 §7)، تحت مفتاح `integration.telegram`.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| channel | text | لا | `telegram` |
| link_token_hash | bytea | نعم | رابط ربط لمرة واحدة 128 بت (`t.me/<bot>?start=<token>`) |
| link_token_expires_at | timestamptz | نعم | — |
| chat_id_enc 🔐 | bytea | نعم | معرّف المحادثة بعد الربط (`pii.contact`) |
| linked_at | timestamptz | نعم | — |
| unlinked_at | timestamptz | نعم | يفكّه صاحبه متى شاء |

**الفهارس:** `px_channel_link_active (user_id, channel) WHERE unlinked_at IS NULL` فريد، و`uq_channel_link_token (link_token_hash)`.

## 5. الإدارة والصلاحيات وقوائم العمل

### 5.1 `admin_users` — حسابات الإدارة
**قياسية** · **الاحتفاظ:** RT-40 · **الفئة:** `personal` · **المتطلبات:** AUTH-11، AUTH-16، ADMIN-14، ADMIN-24، D-78، D-102، D-125، 03 §4

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| username | citext | لا | فريد |
| full_name | text | لا | — |
| work_phone_e164 | text | نعم | — |
| work_email | text | نعم | — |
| own_national_id_bidx #️⃣ | bytea | نعم | لتعارض المصالح مع طلباته هو |
| password_hash | text | لا | Argon2id، 12 حرفاً ⚙️ |
| status | text | لا | `invited`، `active`، `suspended`، `disabled` (بعد ⚙️ 10 إخفاقات خلال 24 ساعة، أو ⚙️ 60 يوماً دون دخول بمهمة `access.staff.inactivity_disable`، ويفكّه المدير العام) |
| disabled_reason | text | نعم | `failed_logins`، `inactivity`، `manager`، `left` |
| is_break_glass | boolean | لا | حساب الطوارئ المختوم (D-102): واحد فقط، `CHECK` بفهرس فريد جزئي، وأي دخول به ينبّه الجميع |
| mfa_policy | text | لا | `webauthn_required` (إلزامي للمدير العام ولكل دور يملك `pii.reveal` أو تصديراً أو تتبّعاً أو بحثاً بالرقم الوطني، D-125)، `totp_with_allowlist` (لباقي الأدوار، مع قائمة عناوين إلزامية). ويُحسب من أدواره ويُرفع آلياً عند إسناد صلاحية من الفئة الأولى. `CHECK (mfa_policy = 'webauthn_required' OR ip_allowlist IS NOT NULL)` |
| ip_allowlist | cidr[] | نعم | إلزامية لمن يدخل بـ TOTP، واختيارية ⚙️ لحسابات WebAuthn |
| away_from | timestamptz | نعم | الغياب بتواريخ (يضبطه الموظف أو المدير العام، E-17): عناصره المسندة تعود للقائمة (`reassign_to_pool`) |
| away_until | timestamptz | نعم | `CHECK (away_until IS NULL OR away_until > away_from)` |
| away_set_by_admin_id | uuid | نعم | FK ذاتي |
| failed_login_count | smallint | لا | — |
| locked_until | timestamptz | نعم | 15 دقيقة ثم ساعة ⚙️ |
| coi_declared_at | timestamptz | نعم | إقرار تعارض المصالح |
| authz_version | int | لا | — |
| created_by_admin_id | uuid | نعم | FK ذاتي |
| last_login_at | timestamptz | نعم | — |

### 5.2 `roles` — الأدوار
**قياسية** · **المتطلبات:** D-78، SMART-03، REVERSAL-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| key | text | لا | فريد: `general_manager`، `reports_supervisor`، `shops_supervisor`، `support`، `commercial_supervisor`، أو مفتاح دور ديناميكي |
| name_ar | text | لا | — |
| description | text | نعم | — |
| kind | text | لا | `system_default`، `custom` |
| rank | smallint | لا | لقاعدة «مساوٍ أو أعلى» |
| archived_at | timestamptz | نعم | — |
| created_by_admin_id | uuid | نعم | — |

### 5.3 `permissions` — كتالوج الصلاحيات
**المفتاح:** `key text` · بذور فقط · **المتطلبات:** [التصميم التقني §5.9](19-technical-design.md)

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| key | text | لا | PK |
| module | text | لا | — |
| name_ar | text | لا | — |
| domain | text | لا | `admin`، `police`، `public`، `tenant`، `machine` |
| assignable | boolean | لا | قابلة للإسناد لدور ديناميكي |
| gm_only | boolean | لا | — |
| sensitive | boolean | لا | 🔒 سبب وتدقيق |
| requires_step_up | boolean | لا | — |
| four_eyes | boolean | لا | لا يُطبَّق على إجراء فاعله المدير العام، إلا التصحيحات والتسويات والاسترداد وإيقاف السحب (D-102) |
| compliance | boolean | لا | وظيفة التزام لا تخضع للباقات |
| requires_feature | text | نعم | FK → commerce.features. `CHECK (NOT (compliance AND requires_feature IS NOT NULL))` |

### 5.4 `role_permissions` و`admin_user_roles` و`permission_sod_rules`
**المتطلبات:** SMART-03، ADMIN-14، CT-21، CT-22

| الجدول | الأعمدة |
|---|---|
| `role_permissions` | `role_id uuid` FK، و`permission_key text` FK، وPK مركّب، و`granted_by_admin_id`، و`granted_at` |
| `admin_user_roles` | `admin_user_id uuid` FK، و`role_id uuid` FK، وPK مركّب، و`assigned_by_admin_id`، و`assigned_at`، و`reason_text` |
| `permission_sod_rules` | `permission_a`، و`permission_b`، وPK مركّب، و`note`. بذور: أزواج فصل المهام ([التصميم التقني §5.4](19-technical-design.md)) |

### 5.5 `staff_mfa_factors` — العامل الثاني
**ثابتة** (مع `revoked_at`) · **المتطلبات:** AUTH-11، PP-02، CT-10

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| staff_type | text | لا | `admin`، `police` |
| staff_id | uuid | لا | FK منطقي → admin_users أو police_users |
| kind | text | لا | `totp`، `webauthn` |
| totp_secret_enc 🔐 | bytea | نعم | — |
| webauthn_credential_id | bytea | نعم | فريد |
| webauthn_public_key | bytea | نعم | — |
| webauthn_kind | text | نعم | `platform_passkey` (مفتاح مرور على الجهاز المعتمد)، `security_key` (مفتاح أمان عتادي، إلزامي للمدير العام) (D-125) |
| aaguid | uuid | نعم | معرّف طراز المصادِق، ويُقارن بقائمة الطرز المسموحة |
| transports | text[] | نعم | `usb`، `nfc`، `ble`، `internal`، `hybrid` |
| backup_eligible | boolean | نعم | علَم المزامنة. ومفتاح المرور القابل للمزامنة غير مقبول للأدوار الإلزامية ما لم يكن على جهاز معتمد |
| user_verification | boolean | نعم | التحقق من المستخدم مطلوب دائماً |
| managed_device_id | uuid | نعم | FK → staff_managed_devices، الجهاز المعتمد المربوط به المفتاح |
| is_gm_backup | boolean | لا | مفتاح المرور الاحتياطي للمدير العام على جهاز معتمد ثانٍ |
| sign_count | bigint | نعم | — |
| label | text | نعم | — |
| last_used_at | timestamptz | نعم | — |
| revoked_at | timestamptz | نعم | — |

### 5.6 `staff_sessions` و`staff_invitations` و`staff_coi_declarations`
**المتطلبات:** ADR-12، PP-01، 03 §4

| الجدول | الأعمدة |
|---|---|
| `staff_sessions` (ثابتة) | `session_hash bytea` فريد، و`staff_type`، و`staff_id`، و`last_seen_at`، و`idle_expires_at`، و`absolute_expires_at`، و`mfa_at`، و`ip inet`، و`user_agent_hash bytea`، و`revoked_at`، و`revoke_reason`. والحالة الحية في Redis |
| `staff_invitations` (ثابتة) | `staff_type`، و`staff_id`، و`token_hash bytea` فريد، و`expires_at` (24 ساعة ⚙️)، و`used_at`، و`created_by_type`، و`created_by_id`. وتحذف المنتهية مهمة `platform.tokens.purge` بعد مدتها (§17.5) |
| `staff_credential_resets` (قياسية) | «نسيت كلمة المرور» وفقدان العامل الثاني للإدارة والأمن ([التصميم التقني §4.3](19-technical-design.md)): `staff_type`، و`staff_id`، و`kind` (`password`، `mfa`، `both`)، و`requested_at`، و`requested_via` (`login_screen`، `manager`)، و`approver_type` (`admin` للمدير العام، `police` لمسؤول أمن الجهة)، و`approver_id`، و`identity_check` (`in_person`، `video_call`)، و`identity_checked_at`، و`status` (`requested`، `approved`، `rejected`، `completed`، `expired`)، و`reset_token_hash` (رابط لمرة واحدة ⚙️ 24 ساعة يُسلَّم في الجلسة نفسها)، و`completed_at`، و`mfa_rebound_at` (إلزامي عند الإكمال)، و`reason_text`. ولا قناة SMS أو واتساب في أي خطوة |
| `staff_coi_declarations` (ثابتة) | `staff_type`، و`staff_id`، و`relative_national_id_bidx #️⃣`، و`relation`، و`removed_at`. وفهرس `px_coi_relative (relative_national_id_bidx) WHERE removed_at IS NULL` لفحص التعارض (K-18) |
| `staff_managed_devices` (قياسية) | الأجهزة المعتمدة للموظفين (D-125، [التصميم التقني §4.3](19-technical-design.md)): `staff_type`، و`staff_id`، و`label`، و`binding_kind` (`device_bound_key`، `client_certificate`)، و`client_cert_fingerprint` فريد (شهادة عميل من إدارة الأجهزة تُفحص على الحافة)، و`enrolled_by_type`، و`enrolled_by_id`، و`enrolled_at`، و`revoked_at`، و`revoke_reason`. والاحتفاظ RT-40 |

### 5.7 `saved_filters` و`dashboard_layouts`
**المتطلبات:** SMART-08، SMART-13

| الجدول | الأعمدة |
|---|---|
| `saved_filters` (قياسية) | `admin_user_id` FK، و`screen text`، و`name text`، و`filter jsonb`، و`deleted_at` |
| `dashboard_layouts` | `admin_user_id` PK، و`layout jsonb`، و`theme text`، و`updated_at` |

### 5.8 `admin_work_items` — قوائم العمل الموحّدة
**قياسية** · إسقاط يُحدَّث من الأحداث ويُعاد بناؤه من جداوله المصدر (`backoffice.projection.rebuild`، N-10) · **الاحتفاظ:** يتبع الكيان المصدر · **الفئة:** `internal` · **المتطلبات:** ADMIN-01، ADMIN-21، ADMIN-24، SMART-05، SMART-08، [التصميم التقني §20.11](19-technical-design.md)

**القوائم مولّدة من سجل الآلات** (M-10): كل حالة من نوع `waiting_actor(staff)` في [التصميم التقني §8.0](19-technical-design.md) تولّد قائمة بمهلتها (`BUSINESS`) وأدوارها المؤهلة وتصعيدها، وقيد `CHECK` على `queue` يُولَّد منها، فلا قائمة مكتوبة يدوياً ولا حالة تنتظر موظفاً بلا قائمة (FF-10). وما يلي قيم البذور الحالية للتوضيح لا مصدر لها.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| queue | text | لا | مولّدة: `reports`، `closures`، `disputes`، `identities`، `self_registrations`، `tenant_applications`، `tenant_changes` (ومنها تغيير المالك وتوثيق موقع الفرع)، `tx_conflicts`، `security_alerts`، `network_alerts`، `stale_events`، `tips`، `support`، `recoveries`، `number_detach`، `reversals`، `device_merges`، `device_conflicts`، `successions`، `police_shop_suspensions`، `compliance`، `store_orders`، `returns`، `settlements`، `payments`، `unallocated_payments`، `refund_approvals`، `withdrawal_stop_approvals`، `payout_approvals`، `staff_resets`، `wholesale_overdue`، `repair_overdue`، `reconciliation_diffs`، `product_reviews`، `ad_reviews`، `data_subject_requests`، `unforeseen` |
| entity_type | text | لا | — |
| entity_id | uuid | لا | — |
| priority_score | int | لا | الخطورة والموثوقية والمهلة (SMART-05) |
| sla_due_at | timestamptz | نعم | بتقويم الدوام (`business_calendar`)، ويُعاد حسابه عند كل تعديل للتقويم (`config.calendar.recompute`) |
| warned_at | timestamptz | نعم | تحذير ⚙️ 80% من المهلة |
| breached_at | timestamptz | نعم | 100%: مجموعة دور القائمة والمدير العام وملخص يومي |
| assigned_admin_id | uuid | نعم | FK → admin_users. **الإسناد علاقة** تتفاعل مع حالة الموظف: التعطيل أو التعليق أو فقد صلاحية القائمة أو الغياب يعيد العنصر للقائمة بمهلته وأولوية أعلى |
| assigned_at | timestamptz | نعم | — |
| first_opened_at | timestamptz | نعم | العنصر الذي لم يفتحه صاحبه حتى ⚙️ 80% من المهلة يعود للقائمة |
| reassigned_reason | text | نعم | `staff_disabled`، `staff_suspended`، `permission_lost`، `away`، `unopened`، `coi_declared` |
| second_approver_admin_id | uuid | نعم | الموافق الثاني المختار لعنصر أربع عيون، ويُعاد اختياره إن خرج، ويُصعَّد للمدير العام عند ⚙️ 50% من المهلة دون موافق مؤهل (ولا يكون المدير العام موافقاً ثانياً على فعله) |
| governorate_id | smallint | نعم | — |
| status | text | لا | `open`، `done` |

**الفهارس:** `uq_work_items (queue, entity_id)`، و`px_work_items_open (queue, priority_score DESC, sla_due_at) WHERE status='open'`، و`px_work_items_assignee (assigned_admin_id) WHERE status='open'`.

### 5.9 `restrictions` — القيود (M-4)
**ثابتة** (مع أعمدة الرفع) · **الاحتفاظ:** مقترح جديد في 21 «القيود والعقوبات» (§17.5) · **الفئة:** `personal` · **المتطلبات:** RESTRICT-01..08، AUTH-14، SHOPWALLET-09، OWN-20، SUCCESSION-09، TENANT-02، D-100، D-106، D-115، [التصميم التقني §5.11](19-technical-design.md)

الحالة تحمل دورة الحياة وحدها، **وكل قيد يمكن أن يجتمع مع غيره وله مصدره ويُرفع وحده صف هنا**. الإدراج والرفع فقط، وكل تغيير في `state_transitions` والتدقيق. وسجل الأنواع (ما يمنعه كل نوع من قدرات، ومن يضعه ويرفعه، وأقصى مدة، والإشعار، والتسمية، وأسبقية العرض، وهل يبقى بعد إغلاق الحساب) في `packages/registry` لا هنا.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| subject_type | text | لا | `person` (بالرقم الوطني أو الوثيقة)، `user`، `tenant`، `member`، `wallet`، `device`، `recipient_pair`، `staff` |
| subject_id | uuid | نعم | معرّف الموضوع. فارغ لـ `recipient_pair` (موضوعه البصمتان) ولـ `withdrawal_stop` على كل المحافظ |
| subject_ref_bidx #️⃣ | bytea | نعم | لـ `recipient_pair`: بصمة زوج (المرسل، والرقم المستلم) |
| type | text | لا | من سجل الأنواع ([التصميم التقني §5.11](19-technical-design.md)): `cooldown`، `password_reset_hold`، `phone_compromised`، `account_not_me_freeze`، `person_ban`، `pin_reset_delay`، `wallet_owner_freeze`، `wallet_not_me`، `wallet_admin_freeze`، `wallet_recon_hold`، `wallet_external_freeze`، `withdrawal_stop`، `tenant_suspended`، `held_by_authority`، `fraud_freeze`، `owner_deceased`، `succession_pending`، `invites`، `uploads_gallery`، `self_registration`، `tips`، `support_new_tickets`، `staff_bar`، `se_flag_l3`، `cod_blocked`، `recipient_block`، `scan_source_block` |
| scope | text | نعم | تضييق اختياري (مثل `all_wallets` لإيقاف السحب على كل المحافظ، أو `recon_ops` لفرق مطابقة يخص عمليات بعينها) |
| source_type | text | لا | ما أنشأه: `cascade_event`، `decision`، `timer`، `system_rule`، `partner`، `owner` |
| source_id | uuid | نعم | الحدث أو القرار أو الطلب المسبِّب. وإعادة الحال بعد تتابع ترفع **ما وضعه ذلك السبب وحده** بقراءة هذين العمودين |
| reason_code | text | نعم | RSN من القائمة الجاهزة |
| set_by_type | text | لا | `system`، `admin`، `police`، `owner`، `partner` |
| set_by_id | uuid | نعم | — |
| second_approver_admin_id | uuid | نعم | لـ `withdrawal_stop` وحده (D-100): `CHECK (type <> 'withdrawal_stop' OR (second_approver_admin_id IS NOT NULL AND second_approver_admin_id <> set_by_id))` |
| starts_at | timestamptz | لا | — |
| until | timestamptz | نعم | فارغ لما يبقى حتى الرفع. والمنتهي يرفعه الكاسح (`restrictions.expire`، صنف `WALL_SECURITY`) |
| renewed_count | smallint | لا | تجديد `withdrawal_stop` بالمدير العام وحده |
| lifted_at | timestamptz | نعم | — |
| lifted_by_type | text | نعم | `system` (انتهاء أو إعادة حال)، `admin`، `police`، `owner` |
| lifted_by_id | uuid | نعم | — |
| lift_reason | text | نعم | `expired`، `cause_lifted`، `decision`، `appeal`، `correction` |
| appeal_ticket_id | uuid | نعم | FK → support_tickets: اعتراض واحد لكل قرار (RESTRICT-07) |

**الفهارس:** `px_restrictions_active (subject_type, subject_id, type) WHERE lifted_at IS NULL`، و`px_restrictions_pair (subject_ref_bidx) WHERE type = 'recipient_block' AND lifted_at IS NULL`، و`px_restrictions_expiring (until) WHERE lifted_at IS NULL AND until IS NOT NULL`، و`ix_restrictions_source (source_type, source_id)`.

- **بوابات السحب** هي الأنواع التي يحمل سجلها `denies: wallet.withdraw` وحدها: `withdrawal_stop` (الإيقاف التقديري الوحيد، D-100)، و`cooldown` حين سببه تغيير الرقم أو الاستعادة و`pin_reset_delay` (D-115)، و`wallet_owner_freeze` و`wallet_not_me`، و`wallet_external_freeze`، و`wallet_recon_hold` فوق الرصيد المؤكد. وتجميد الإدارة وتعليق المحل لا يمنعان السحب أبداً.
- **قيود الشخص** (`person`) تبقى بعد إغلاق الحساب، ومن يعيد فتح حساب خلال ⚙️ 12 شهراً يرثها مع عدّاداته (PLATFORM-05).
- **الإسقاطات:** `users.cooldown_until` و`users.frozen_by_owner_at` و`users.phone_compromised_at` و`shop_wallets.display_restriction` تُحدَّث من هذا الجدول في المعاملة نفسها، للقراءة فقط.

### 5.10 `unforeseen_cases` — الحالات غير المتوقعة
**قياسية** · **الاحتفاظ:** مقترح جديد في 21 «الحالات غير المتوقعة» (§17.5) · **الفئة:** `internal` (والسياق معرّفات فقط) · **المتطلبات:** ADMIN-21، PLATFORM-01، [التصميم التقني §20.17](19-technical-design.md)

حين يجد محرّك التتابعات أو حارس أو مؤقّت حالة لم تُعلن **لا يخمّن**: يوقف العنصر هنا بسياقه الكامل ويُنشئ عنصر عمل في قائمة `unforeseen`، ويبقي الحمايات قائمة والمال في مكانه قابلاً للوصول (P-1، P-3)، ويقرر المدير العام (`unforeseen.decide`).

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| mechanism | text | لا | `cascade`، `guard`، `timer`، `consumer`، `capability` |
| entity_type | text | لا | — |
| entity_id | uuid | لا | — |
| cause_event_id | uuid | نعم | الحدث الذي كشف الحالة |
| registry_ref | text | لا | صف السجل الناقص (مثل `cascade:tenant.ended×repair_jobs`) |
| context | jsonb | لا | **معرّفات وحالات فقط**، دون بيانات شخصية ولا شيء من `shoppro` (D-101) |
| reason_code | text | لا | `RSN-*-99` |
| protections_kept | boolean | لا | تأكيد بقاء الحمايات (P-1) |
| decided_by_admin_id | uuid | نعم | المدير العام |
| decided_at | timestamptz | نعم | — |
| decision_text | text | نعم | — |
| uc_ref | text | نعم | صف `UC-NN` في سجل غير المتوقع ([العملية الهندسية](22-engineering-process.md) §16.6) حين يتكرر |

**الفهارس:** `px_unforeseen_open (created_at) WHERE decided_at IS NULL`، و`ix_unforeseen_registry (registry_ref)` للمراجعة الأسبوعية لأسباب «99».

## 6. الأجهزة

### 6.1 `devices` — الأجهزة
**قياسية** · **الاحتفاظ:** RT-22 (يتبع الملكية، دائم) · **الفئة:** `internal` · **المتطلبات:** 06 §1، 06 §2، 06 §5، 14 §2، CHECK-08، CHECK-21، REPORT-13، TELCO-01، REPAIR-05، FAKE-02، SERIAL-01، OWN-19، OWN-20، PP-19، D-91، D-120

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_class | text | لا | `mobile`، `sim_less` |
| device_kind | text | لا | `phone`، `tablet`، `laptop`، `desktop`، `watch`، `router`، `pos_terminal`، `tracker`، `other`. وأجهزة IMEI غير الهواتف تُفحص ويُبلَّغ عنها وتُسجَّل، والتزام المحل بتسجيل بيعها وشرائها يتبع مفتاح `registry.device_kind.{kind}` ([التصميم التقني §7.2](19-technical-design.md)) |
| primary_imei | text | نعم | IMEI الأول. `CHECK ((device_class='mobile') = (primary_imei IS NOT NULL))` |
| manufacturer_id | int | نعم | FK → manufacturers، إلزامي لـ `sim_less` |
| primary_serial | text | نعم | المعرّف الرئيسي للجهاز دون شريحة |
| tac | char(8) | نعم | أول 8 خانات من IMEI الأول |
| brand | text | نعم | — |
| model | text | نعم | — |
| color | text | نعم | — |
| model_source | text | نعم | `tac`، `shop_confirmed`، `importer`، `customs`، `user` |
| registration_origin | text | نعم | `importer`، `customs`، `shop`، `self`. يُضبط مرة واحدة ويمنع محفّز تعديله |
| origin_set_at | timestamptz | نعم | — |
| current_owner_type | text | لا | `none`، `person`، `shop`، `importer` |
| current_owner_person_id | uuid | نعم | FK → persons (نسخة سريعة من الملكية الحالية) |
| current_owner_tenant_id | uuid | نعم | FK → tenants |
| custody_state | text | لا | `unknown`، `importer_stock`، `shop_stock`، `owned`، `self_reg_waiting`، `dismantled`، `retired` (تخلّى عنه مالكه بنوع الحيازة `relinquish`، OWN-19، [التصميم التقني §8.2 ب](19-technical-design.md)). والحجز لدى الجهات والتجميد ووفاة المالك والانتقال **قيود** على الجهاز (§5.9) لا قيم هنا |
| relinquished_at | timestamptz | نعم | — |
| relinquish_reason | text | نعم | `destroyed`، `sold_or_gifted_abroad`، `recycled`، `warranty_abroad`. وظهور الجهاز بعدها في فحص محل أو حدث شبكة أو تسجيل ينبّه كظهور جهاز مفكّك |
| public_status | text | لا | `no_active_reports`، `reported_stolen`، `reported_lost` |
| active_report_id | uuid | نعم | FK → reports |
| has_pending_report | boolean | لا | لـ CHECK-15 |
| has_competing_claim | boolean | لا | إسقاط: على الجهاز ادعاء منافس مفتوح (`reports.competing_claim_of`)، فتعرض البوابة «ادعاءات متعددة» (PP-19) |
| network_status | text | لا | `none`، `watch`، `block_delayed`، `blocked`. `CHECK (device_class='mobile' OR network_status='none')` |
| block_due_at | timestamptz | نعم | فاصل الحظر ⚙️ بعد أول استخدام |
| dismantled_at | timestamptz | نعم | — |
| flag_model_mismatch | boolean | لا | موديل المحل يخالف TAC |
| flag_dual_imei_mismatch | boolean | لا | D-66 |
| flag_counterfeit_tac | boolean | لا | D-65 |
| record_status | text | لا | `active`، `merged` |
| merged_into_id | uuid | نعم | FK ذاتي |

**الفهارس:** `px_devices_active_report (active_report_id) WHERE active_report_id IS NOT NULL`، و`px_devices_owner_person (current_owner_person_id) WHERE current_owner_person_id IS NOT NULL`، و`px_devices_owner_tenant (current_owner_tenant_id) WHERE current_owner_tenant_id IS NOT NULL`، و`px_devices_network (network_status) WHERE network_status <> 'none'`، و`uq_devices_primary_imei (primary_imei) WHERE primary_imei IS NOT NULL`.

### 6.2 `device_identifiers` — المعرّفات
**قياسية** · **المتطلبات:** 06 §1، REPORT-13، REPAIR-04، SERIAL-01، CHECK-01

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| type | text | لا | `imei`، `serial` |
| manufacturer_id | int | نعم | FK → manufacturers. `CHECK (type='imei' OR manufacturer_id IS NOT NULL)` |
| value | text | لا | IMEI: `^\d{15}$` مع Luhn. التسلسلي: حروف كبيرة وأرقام |
| slot | smallint | نعم | 1 أو 2 لـ IMEI |
| status | text | لا | `active`، `retired` |
| source | text | لا | مصدر الإضافة |
| retired_at | timestamptz | نعم | — |
| retired_reason | text | نعم | `board_replaced`، `merged`، `corrected` |
| moved_from_device_id | uuid | نعم | FK → devices: المعرّف انتقل ذرياً من لوحة جهاز مفكّك في حيازة المحل نفسه إلى هذا الجهاز (نوع الحيازة `board_swap`، `board_replacements.donor_device_id`، C-06). والانتقال تحديث لـ `device_id` في معاملة واحدة مع سطر في `state_transitions`، لأن المعرّف فريد عبر كل الحالات |
| moved_at | timestamptz | نعم | — |

**الفهارس:** `uq_identifier_imei (value) WHERE type='imei'`، و`uq_identifier_serial (manufacturer_id, value) WHERE type='serial'`، و`px_identifier_slot (device_id, slot) WHERE type='imei' AND status='active'` فريد. المعرّف المتقاعد يبقى فريداً (06 §1).

### 6.3 `device_merges` — دمج السجلات
**قياسية** · **المتطلبات:** ADMIN-18، [التصميم التقني §7.4](19-technical-design.md)، 06 §1

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| survivor_device_id | uuid | لا | FK → devices |
| merged_device_id | uuid | لا | FK → devices |
| reason_text | text | لا | — |
| evidence_file_ids | uuid[] | نعم | — |
| status | text | لا | `proposed`، `approved`، `executed`، `rejected`، `failed`، `unmerged` ([التصميم التقني §8.15](19-technical-design.md)) |
| proposed_by_type | text | لا | `admin`، `system` |
| proposed_by_admin_id | uuid | نعم | — |
| approved_by_admin_id | uuid | نعم | يختلف عن المقترح |
| executed_at | timestamptz | نعم | — |
| manifest | jsonb | نعم | **بيان الصفوف المنقولة** لكل جدول ابن (المعرّفات والملكيات والمعاملات والفحوص والتنبيهات وأحداث الشبكة وأوامر الصيانة وخط الزمن والبلاغ الباقي والملغى وطلبات النقل والمفوّضين)، ومنه يعمل فك الدمج بالتصحيح (B-12). معرّفات فقط |
| surviving_report_id | uuid | نعم | البلاغ **الأنفذ** الذي بقي ([التصميم التقني §7.4](19-technical-design.md)) |
| unmerged_at | timestamptz | نعم | — |
| unmerge_reversal_id | uuid | نعم | FK → reversal_requests |
| last_error | text | نعم | — |

### 6.4 `device_conflicts` — تعارضات الأجهزة
**قياسية** · **المتطلبات:** 06 §1، IMPORTER-07، POLICE-06، CUSTOMS-04، FAKE-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| type | text | لا | `identifier_bound_elsewhere`، `dual_imei_model_mismatch`، `official_report_vs_registered_owner`، `importer_duplicate`، `customs_unregistered`، `model_mismatch`، `possible_laundering` (لوحة مستعملة من غير جهاز مفكّك في المحل نفسه، C-06) |
| device_id | uuid | نعم | FK → devices |
| other_device_id | uuid | نعم | FK → devices |
| source_type | text | لا | — |
| source_id | uuid | لا | — |
| status | text | لا | `open`، `resolved`، `referred` ([التصميم التقني §8.15](19-technical-design.md)) |
| follow_up_due_at | timestamptz | نعم | `referred` بمؤقّت متابعة ⚙️ 30 يوماً وقائمة متابعة أسبوعية (`waiting_external`) |
| assigned_admin_id | uuid | نعم | — |
| resolution_text | text | نعم | — |
| resolved_by_admin_id | uuid | نعم | — |
| resolved_at | timestamptz | نعم | — |
| governorate_id | smallint | نعم | — |

### 6.5 `device_timeline_entries` — الخط الزمني للجهاز
**ثابتة** · **مقسّم** سنوياً بـ `occurred_at` · **نطاق الأمن** · **المتطلبات:** ADMIN-11، ADMIN-12، PP-06، HISTORY-01

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| occurred_at | timestamptz | لا | — |
| kind | text | لا | `registered`، `ownership_changed`، `custody_changed`، `shop_transaction`، `repair`، `board_replaced`، `report_status`، `check`، `network_event`، `alert`، `seizure`، `wholesale_transfer`، `store_delivery`، `store_return`، `merged`، `unmerged`، `relinquished`، `succession`، `identifier_flagged` |
| ref_type | text | لا | — |
| ref_id | uuid | لا | — |
| summary | jsonb | لا | دون بيانات شخصية |
| governorate_id | smallint | نعم | — |
| subject_tenant_id | uuid | نعم | المستأجر المعني (الجدول غير معزول بـ RLS، §1.2) |

**الفهارس:** `ix_timeline_device (device_id, occurred_at DESC)`.

### 6.6 `device_identifier_flags` — المعرّف المشترك أو المنسوخ (D-120)
**قياسية** · **الاحتفاظ:** يتبع الجهاز (RT-22) · **الفئة:** `internal` · **المتطلبات:** CHECK-18، TELCO-15، PP-18، L-01، D-120، [التصميم التقني §7.3](19-technical-design.md)

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| identifier_id | uuid | لا | FK → device_identifiers |
| identifier_value | text | لا | نسخة القيمة للبحث السريع وقائمة الأرقام المنسوخة المعروفة |
| flag | text | لا | `shared_identifier` |
| source | text | لا | `telecom_imsi_count` (⚙️ 5 شرائح IMSI مختلفة أو أكثر خلال ⚙️ 30 يوماً، مهمة `devices.shared_identifier.evaluate`)، `known_list` (قائمة ⚙️ `identifiers.invalid_patterns` والأرقام الافتراضية المنشورة للنسخ)، `admin` |
| distinct_imsi_count | int | نعم | العدد عند التعليم |
| window_days | smallint | نعم | — |
| flagged_at | timestamptz | لا | حدث `device.identifier.flagged_shared` |
| flagged_by_admin_id | uuid | نعم | للمصدر `admin` |
| cleared_at | timestamptz | نعم | رفع العلامة بقرار مسجّل |
| cleared_by_admin_id | uuid | نعم | — |
| clear_reason | text | نعم | — |

**الفهارس:** `px_identifier_flag_active (identifier_id, flag) WHERE cleared_at IS NULL` فريد، و`ix_identifier_flag_value (identifier_value)`.

أثر العلامة: الفحص يضيف السطر المحايد «قد يكون منسوخاً» (`CHECK_IDENTIFIER_SHARED`)، والملكية والتسجيل الذاتي بهذا الرقم يحتاجان معرّفاً ثانياً ويُحالان للمراجعة، والبلاغ يُقبل بحمايته كاملة **وطلب المراقبة والحظر لا يُرسل آلياً**: ينتظر قرار وحدة الأمن المختصة المسجّل في `reports.network_decision` (§9.1).

## 7. الملكية

### 7.1 `ownerships` — سجل الملكية
**قياسية** · **الاحتفاظ:** RT-22 (دائم) · **الفئة:** `personal` · **الكاتب الوحيد:** حارس الحيازة `custody.move` في وحدة `ownership` ([التصميم التقني §7.10](19-technical-design.md)، FF-12) · **المتطلبات:** 06 §5، 06 §5.3، OWN-01، OWN-07، OWN-17..19، IMPORTER-04، REVERSAL-03، SUCCESSION-08، TENANT-05، PERSON-04، D-103، D-105، D-108، D-121

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| owner_type | text | لا | `person`، `shop`، `importer` |
| owner_person_id | uuid | نعم | FK → persons |
| owner_tenant_id | uuid | نعم | FK → tenants. `CHECK` يربط النوع بالعمود الممتلئ |
| source | text | لا | من سجل أنواع الحيازة ([التصميم التقني §7.10](19-technical-design.md)): `importer_intake`، `wholesale_transfer`، `wholesale_return`، `b2b_transfer`، `store_delivery`، `store_return`، `shop_purchase`، `shop_sale`، `transfer`، `closure_handover`، `succession`، `correction`، `self_registration` |
| custody_kind | text | لا | نوع الحيازة الذي كتب الصف (يميّز مثلاً `transfer_to_tenant` عن `shop_purchase` ولهما المصدر نفسه)، ومنه أثر الموثوقية على البلاغ اللاحق ([التصميم التقني §7.2](19-technical-design.md)) |
| source_ref_type | text | نعم | — |
| source_ref_id | uuid | نعم | — |
| correction_ref_type | text | نعم | للمصدر `correction`: `reversal_request`، `court_order` (حكم يتحقق منه المحامي وينفّذه المدير العام بحجز LH-5)، `official_document` (إفراج جهة رسمية عن مضبوط لغير مالكه)، `legal_agent` |
| acting_as | text | لا | صفة من أنشأ الملكية ([التصميم التقني §20.14](19-technical-design.md)): `self` (ومنه الفاعل النظامي)، `guardian`، `representative`، `heir`، `executor`، `legal_agent`، `support_on_behalf`، `authority` |
| represented_org_name | text | نعم | للصفة `representative` (D-105): اسم المؤسسة **للعرض فقط**، والمالك المسجّل هو الممثل شخصاً طبيعياً، ولا مالك اعتبارياً. وتغيير الممثل نقل ملكية عادي |
| started_at | timestamptz | لا | — |
| ended_at | timestamptz | نعم | فارغ للملكية الحالية |
| end_reason | text | نعم | `transfer`، `sale`، `purchase`، `correction`، `self_reg_cancelled`، `merged`، `tx_cancelled`، `relinquished` (OWN-19، الحيازة `retired`)، `succession`، `handover` (تسليم مخزون الإغلاق)، `returned` (الإرجاع للوكيل) |
| exit_notified_at | timestamptz | نعم | إشعار المالك السابق بخروج الملكية من اسمه على كل قنواته مع «لم أبِع هذا الجهاز» (OWN-17)، وخلال ⚙️ 14 يوماً يُقبل بلاغه بمستوى ⛔ (OWN-18) |

**الفهارس:** `px_ownership_current (device_id) WHERE ended_at IS NULL` فريد، و`px_ownership_person (owner_person_id) WHERE ended_at IS NULL`، و`px_ownership_tenant (owner_tenant_id) WHERE ended_at IS NULL`.

### 7.2 `ownership_transfers` — طلبات نقل الملكية
**قياسية** · **الاحتفاظ:** RT-22 للمقبول، RT-23 للملغى والمنتهي · **الفئة:** `sensitive` · **المتطلبات:** OWN-04..07، OWN-21، OWN-22، SHOP-20، 06 §5، D-121

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| from_person_id | uuid | لا | FK → persons |
| from_user_id | uuid | لا | FK → users |
| recipient_type | text | لا | `person` (OWN-04)، `tenant` («نقل لمحل» برقم `SH-`، D-121) |
| to_phone_e164 | text | نعم | للشخص. `CHECK ((recipient_type = 'person') = (to_phone_e164 IS NOT NULL))` |
| to_document_type | text | نعم | كـ `persons.document_type` |
| to_national_id_enc 🔐 | bytea | نعم | رقم وثيقة المستلم الشخص. `CHECK ((recipient_type = 'person') = (to_national_id_enc IS NOT NULL))` |
| to_national_id_bidx #️⃣ | bytea | نعم | للمطابقة عند القبول مع بصمة الوثيقة المعلنة أو الموثّقة **ورقم الحساب الحالي المؤكَّد** |
| to_national_id_mask | text | نعم | — |
| to_tenant_id | uuid | نعم | FK → shops، المحل الموثّق المستلم. `CHECK ((recipient_type = 'tenant') = (to_tenant_id IS NOT NULL))` |
| to_user_id | uuid | نعم | بعد القبول |
| to_person_id | uuid | نعم | — |
| accepted_by_member_id | uuid | نعم | FK → shop_members: العضو بـ `shop.tx.purchase` الذي قبل في سياق المحل وموقعه |
| shop_transaction_id | uuid | نعم | FK → shop_transactions: **القبول نفسه معاملة الشراء** (D-121)، بصورة هوية الشخص الحاضر، ودون حساب للحاضر |
| status | text | لا | `pending`، `accepted`، `cancelled`، `expired` ([التصميم التقني §8.3](19-technical-design.md)) |
| cancel_reason | text | نعم | `owner`، `report`، `owner_changed`، `cooldown`، `device_restricted` (ضبط، أو وفاة المالك، أو انتقال)، `account_restricted` (تعليق أو حظر المرسل أو المستلم)، `recipient_number_detached`، `merged_duplicate` |
| expires_at | timestamptz | لا | 72 ساعة ⚙️ بصنف `WALL_USER` |
| accepted_at | timestamptz | نعم | — |
| assisted_by_admin_id | uuid | نعم | القبول بمساعدة الدعم لمستلم بلا موبايل ذكي (OWN-22، ONBEHALF-02) |
| receipt_code_id | uuid | نعم | FK → verification_codes (إيصال النقل) |

**الفهارس:** `px_transfer_pending (device_id) WHERE status='pending'` فريد، و`ix_transfer_to_phone (to_phone_e164) WHERE status='pending'`، و`px_transfer_to_tenant (to_tenant_id) WHERE status='pending'`، و`px_transfer_to_nid (to_national_id_bidx) WHERE status='pending'` لمطابقة النقل الوارد عند التسجيل (K-18). والطلب المعلّق يحجز الجهاز (§7.8).

### 7.3 `authorized_users` — المستخدمون المفوّضون
**قياسية** · **المتطلبات:** OWN-08، D-33، PRIV-09، D-97

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| granted_by_person_id | uuid | لا | FK → persons |
| granted_by_user_id | uuid | نعم | FK → users. فارغ عند الإضافة في معاملة محل لوليّ أمر بلا حساب |
| source | text | لا | `owner` (من حساب المالك)، `shop_transaction` (D-97: يضيفه الموظف في معاملة وليّ الأمر) |
| shop_transaction_id | uuid | نعم | FK → shop_transactions، إلزامي عند `source = 'shop_transaction'` |
| recorded_by_member_id | uuid | نعم | FK → shop_members، الموظف الذي سجّل الإضافة |
| full_name | text | لا | — |
| relation | text | لا | `child`، `spouse`، `parent`، `sibling`، `other` |
| phone_e164 | text | لا | — |
| user_id | uuid | نعم | FK → users |
| person_id | uuid | نعم | فارغ للقاصر بلا هوية |
| is_minor | boolean | لا | علَم «قاصر بإدارة وليّ الأمر» |
| guardian_declaration_at | timestamptz | نعم | إقرار وليّ الأمر (CN-GUARDIAN في `consents`). `CHECK (NOT is_minor OR guardian_declaration_at IS NOT NULL)`. ولا رقم وطني ولا تاريخ ميلاد للقاصر |
| revoked_at | timestamptz | نعم | — |
| revoke_reason | text | نعم | `owner`، `ownership_changed`، `owner_account_closed`، `delegate_account_closed`، `delegate_banned`، `owner_deceased`، `merged` |

**الفهارس:** `px_authorized_active (device_id) WHERE revoked_at IS NULL`، و`px_authorized_phone (phone_e164) WHERE revoked_at IS NULL AND user_id IS NULL` لمطابقة التفويض عند التسجيل (K-18)، والحد 3 ⚙️ بقفل صف الجهاز. وموظفو المؤسسة على أجهزتها مفوّضون هنا (D-105).

### 7.4 `self_registrations` — التسجيل الذاتي
**قياسية** · **المتطلبات:** OWN-03، OWN-12..16، REPORT-15، D-36، 06 §5.1

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| person_id | uuid | لا | FK → persons |
| device_class | text | لا | — |
| manufacturer_id | int | نعم | للتسلسلي |
| imei1 | text | نعم | — |
| imei2 | text | نعم | — |
| serial | text | نعم | — |
| brand | text | نعم | — |
| model | text | نعم | — |
| color | text | نعم | — |
| device_id | uuid | نعم | يُضبط عند القبول |
| declaration_accepted_at | timestamptz | لا | الإقرار القانوني |
| status | text | لا | `pending_review`، `rejected`، `waiting`، `final`، `frozen`، `cancelled` ([التصميم التقني §8.6](19-technical-design.md)) |
| freeze_reason | text | نعم | `report` (بلاغ من شخص آخر)، `account_suspended`، `identity_review` |
| status_before_freeze | text | نعم | `pending_review` أو `waiting` أو `final`، ليعود إليها عند رفع التجميد |
| auto_reject_reason | text | نعم | `registered_to_other` (OWN-13) |
| suspicious_annual_limit | boolean | لا | تجاوز 3 ⚙️ **للشخص خلال 365 يوماً متحركة** (لا السنة التقويمية ولا الحساب، P-12) |
| sim_history_query_id | uuid | نعم | FK → telecom_sim_history_queries |
| sim_history_answer | text | نعم | `yes`، `no`، `unknown` |
| sim_history_first_used_at | date | نعم | — |
| assigned_admin_id | uuid | نعم | — |
| decided_by_admin_id | uuid | نعم | — |
| decided_at | timestamptz | نعم | — |
| reason_code | text | نعم | — |
| reason_text | text | نعم | — |
| waiting_until | timestamptz | نعم | 30 يوماً ⚙️ |
| remaining_wait_at_freeze | interval | نعم | لاستئناف الانتظار (14 §5.4) |
| finalized_at | timestamptz | نعم | — |
| frozen_at | timestamptz | نعم | — |
| frozen_by_report_id | uuid | نعم | FK → reports |

**الفهارس:** `px_selfreg_open_imei (imei1) WHERE status IN ('pending_review','waiting','frozen')` فريد، و`px_selfreg_open_serial (manufacturer_id, serial) WHERE status IN ('pending_review','waiting','frozen')` فريد، و`ix_selfreg_person_decided (person_id, decided_at)` للحد المتحرك لكل شخص.

### 7.5 `self_registration_evidence` و`registration_attempts`
**ثابتة** · **المتطلبات:** OWN-03، OWN-13، REPORT-05، REPORT-06

| الجدول | الأعمدة |
|---|---|
| `self_registration_evidence` | `self_registration_id` FK، و`type` (`carton`، `live_photo`، `serial_label`، `invoice`، `old_photo`، `other`)، و`file_id` FK، و`barcode_value`، و`barcode_matches boolean`، و`account_number_visible` (`yes`، `no`، `unclear`)، و`duplicate_of_file_id` |
| `registration_attempts` | `device_id` FK، و`attempted_by_user_id` FK، و`self_registration_id` FK، و`owner_notified_at`، و`alert_id` FK |

### 7.6 `certificates` — شهادات الفحص
**قياسية** · **المتطلبات:** OWN-09..11، PUB-03، 06 §10

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| owner_person_id | uuid | لا | FK → persons |
| issued_by_user_id | uuid | لا | FK → users |
| verification_code_id | uuid | لا | FK → verification_codes (`CR-`) |
| issued_at | timestamptz | لا | — |
| expires_at | timestamptz | لا | 30 يوماً ⚙️ |
| status | text | لا | `active`، `cancelled`، `expired` |
| cancel_reason | text | نعم | `owner`، `transfer`، `report` (عند **إرسال** البلاغ لا قبوله)، `merged`، `seized`، `owner_deceased`، `account_suspended`، `relinquished` |
| cancelled_at | timestamptz | نعم | — |
| pdf_file_id | uuid | نعم | — |

**الفهارس:** `px_certificates_active (device_id) WHERE status='active'`.

### 7.7 `protect_checklist_progress` — «احمِ جهازك»
**المفتاح:** (`user_id`، `device_id`، `step_key`) · **المتطلبات:** PROTECT-01، PROTECT-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | لا | FK → users |
| device_id | uuid | لا | FK → devices |
| step_key | text | لا | مفتاح الخطوة من المحتوى |
| done_at | timestamptz | نعم | — |
| reminded_at | timestamptz | نعم | — |

### 7.8 `device_reservations` — حجز الجهاز لتدفق (M-3)
**قياسية** · **الاحتفاظ:** يتبع التدفق المصدر · **الفئة:** `internal` · **المتطلبات:** STORE-18، IMPORTER-09، OWN-21، [التصميم التقني §7.10](19-technical-design.md)

حين يلتزم تدفق بجهاز يُحجز له، فلا يدخله تدفق آخر حتى يبلغ ذلك التدفق حالته النهائية. ومحاولة تدفق آخر ترد `DEVICE_RESERVED`.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| flow_type | text | لا | `wholesale_transfer_item` (`sent`، ومنه بين المحلات وتسليم الإغلاق والإرجاع)، `store_order_item_device` (عند `preparing`)، `held_shop_transaction`، `ownership_transfer`، `succession_request` (في مهلة الاعتراض) |
| flow_id | uuid | لا | الصف المالك للحجز |
| holder_tenant_id | uuid | نعم | المستأجر الذي يحجز الجهاز في مخزونه، للعرض في لوحته |
| reserved_at | timestamptz | لا | — |
| released_at | timestamptz | نعم | يُفك بالحالة النهائية للتدفق، داخل معاملة `custody.move` أو الإلغاء |
| release_reason | text | نعم | `completed`، `cancelled`، `rejected`، `expired`، `device_restricted` |

**الفهارس:** `px_reservation_open (device_id) WHERE released_at IS NULL` فريد ([التصميم التقني §7.1](19-technical-design.md))، و`ix_reservation_flow (flow_type, flow_id)`.

### 7.9 `succession_requests` — انتقال جهاز المالك المتوفى (D-103)
**قياسية** · **نطاق الأمن** (للقراءة عند الاحتيال) · **الاحتفاظ:** مقترح جديد في 21 «وثائق الانتقال» (§17.5) · **الفئة:** `sensitive` · **المتطلبات:** SUCCESSION-01..10، CIVIL-11، OWN-21، D-103، D-106، [التصميم التقني §8.17](19-technical-design.md)

يكفي تقديم شهادة وفاة المالك المسجّل، ثم يُنقل الجهاز إلى شخص يحمل **الكنية نفسها**، أو إلى **وصي**: مختار مسبقاً (`account_executors`، §4.13) أو قانوني بوثيقة وصاية. ولا حصر إرث ولا قرار محكمة. **صف لكل جهاز**: الطلب لعدة أجهزة صفوف تجمعها `group_id`.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| request_number | text | لا | فريد، `SU-YYYY-NNNNN` ([التصميم التقني §13.1](19-technical-design.md)) |
| group_id | uuid | لا | يجمع أجهزة الطلب الواحد |
| device_id | uuid | لا | FK → devices |
| deceased_person_id | uuid | لا | FK → persons، المالك المسجّل الحالي للجهاز عند التقديم |
| deceased_user_id | uuid | نعم | FK → users، حسابه إن وُجد (لإشعار كل وسائله) |
| requester_user_id | uuid | لا | FK → users، موثّق الهوية |
| requester_person_id | uuid | لا | FK → persons. ولا قيد `person_ban` عليه |
| acting_as | text | لا | `heir` (الكنية نفسها)، `executor` (وصي مختار مسبقاً أو قانوني) |
| executor_basis | text | نعم | `designated` (`account_executors`)، `legal_guardianship` (وثيقة وصاية أو وكالة رسمية). `CHECK ((acting_as = 'executor') = (executor_basis IS NOT NULL))` |
| account_executor_id | uuid | نعم | FK → account_executors. `CHECK ((executor_basis = 'designated') = (account_executor_id IS NOT NULL))` |
| via_support | boolean | لا | قُدّم عبر الدعم بعد التحقق من هوية الطالب |
| support_admin_id | uuid | نعم | — |
| death_certificate_file_id | uuid | نعم | FK → files (`death_certificate`، تصوير حي)، إلزامي من `under_review` |
| guardianship_file_id | uuid | نعم | FK → files (`guardianship_document`)، إلزامي لـ `legal_guardianship` |
| surname_match | text | نعم | نتيجة مقارنة `persons.surname_norm` للطرفين: `match`، `mismatch`، `unknown` (يقارن المشرف الوثيقتين بنفسه) |
| civil_death_status | text | نعم | `deceased`، `alive`، `not_enabled`، `unavailable`: حالة الوفاة في الأحوال المدنية عند الربط |
| status | text | لا | `submitted`، `under_review`، `notice_period`، `executed`، `rejected`، `objected`، `withdrawn` ([التصميم التقني §8.17](19-technical-design.md)) |
| reviewed_by_admin_id | uuid | نعم | المشرف (`succession.review`)، ولا أربع عيون (P-11): الضابط مهلة الاعتراض |
| reviewed_at | timestamptz | نعم | — |
| notice_until | timestamptz | نعم | ⚙️ 72 ساعة `WALL_SECURITY` (`succession.objection_window`، مهمة `succession.execute`). **والإشعار إلى كل وسائل حساب المتوفى**: الرقم الأساسي ما لم تكن رسائله موقوفة، والأجهزة المربوطة، والرقم البديل، والإيميل الأمني، وداخل المنصة، مع «أنا حي، أوقف هذا» |
| notice_sent_at | timestamptz | نعم | — |
| objected_at | timestamptz | نعم | — |
| objection_by | text | نعم | `account_holder` (صاحب الحساب حي: يُعلَّم الطلب احتيالاً)، `third_party` (يُحال للدعم والخلاف بالقانون) |
| fraud_flagged | boolean | لا | صاحب الحساب أوقفه: عنصر SOP-18 للطالب، وقيد، وإحالة للأمن حسب الإجراء |
| executed_at | timestamptz | نعم | الملكية للطالب بمصدر `succession` عبر حارس الحيازة، وتأكيد وفاة الشخص إن لم يكن مؤكداً |
| ownership_id | uuid | نعم | FK → ownerships، الملكية الجديدة |
| reason_code | text | نعم | `RSN-SUC-*` |
| reason_text | text | نعم | — |

**الفهارس:** `uq_succession_number (request_number)`، و`px_succession_open_device (device_id) WHERE status IN ('submitted','under_review','notice_period')` فريد (`SUCCESSION_ALREADY_OPEN`، [التصميم التقني §7.1](19-technical-design.md))، و`ix_succession_deceased (deceased_person_id)`، و`px_succession_notice (notice_until) WHERE status = 'notice_period'`.

وفي مهلة الاعتراض قيد `succession_pending` على الجهاز وحجز في `device_reservations`، والأجهزة غير المطلوبة تبقى باسم المتوفى بقيد `owner_deceased` بعد تأكيد الوفاة.

## 8. الفحص

### 8.1 `imei_checks` — سجل الفحوص
**ثابتة** · **مقسّم** شهرياً بـ `checked_at` · **المتطلبات:** CHECK-01..17، CHECK-12، WABOT-05، SMS-03، BIZAPI-05، GSMA-01، CUSTOMS-02، FAKE-01، SERIAL-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `checked_at` |
| checked_at | timestamptz | لا | مفتاح التقسيم |
| identifier_type | text | لا | `imei`، `serial` |
| manufacturer_id | int | نعم | للتسلسلي |
| identifier_value | text | لا | بعد التطبيع |
| valid | boolean | لا | — |
| device_id | uuid | نعم | FK → devices |
| result | text | لا | `no_active_reports`، `reported_stolen`، `reported_lost`، `invalid` |
| invalid_reason | text | نعم | `luhn`، `length`، `reserved` (الأنماط المحجوزة ⚙️ `identifiers.invalid_patterns`، K-10)، `imei_pair_identical` |
| shared_identifier_warning | boolean | لا | ظهر سطر «قد يكون منسوخاً» (D-120) |
| serial_ambiguous_match | boolean | لا | النتيجة من بديل أحرف ملتبسة مع تحذير `SERIAL_AMBIGUOUS_CHARS` |
| report_id | uuid | نعم | البلاغ النافذ إن وُجد |
| pending_report_hit | boolean | لا | CHECK-15 |
| gsma_status | text | لا | `listed`، `not_listed`، `pending`، `unavailable`، `not_applicable` |
| customs_status | text | لا | `registered`، `unregistered`، `pending`، `unavailable`، `not_applicable` |
| counterfeit_warning | boolean | لا | — |
| reward_shown | boolean | لا | — |
| checker_type | text | لا | `visitor`، `user`، `shop`، `importer`، `police`، `business` |
| platform | text | لا | `web`، `ios`، `android`، `whatsapp`، `sms`، `police_portal`، `business_api` |
| purpose | text | لا | `public`، `shop_purchase`، `shop_sale`، `repair_intake`، `board_replacement`، `seizure`، `seizure_bulk` |
| user_id | uuid | نعم | FK → users |
| actor_tenant_id | uuid | نعم | FK → tenants: المحل أو الوكيل الذي فحص (الجدول غير معزول بـ RLS، §1.2) |
| member_user_id | uuid | نعم | الموظف المنفّذ |
| police_user_id | uuid | نعم | — |
| api_client_id | uuid | نعم | — |
| visitor_key_hash | bytea | نعم | بصمة مفتاح جهاز الزائر (§3.8 في 19) |
| wa_number_enc 🔐 | bytea | نعم | رقم واتساب الفاحص (WABOT-05) |
| wa_number_bidx #️⃣ | bytea | نعم | — |
| sms_sender_enc 🔐 | bytea | نعم | رقم مرسل SMS (SMS-03) |
| sms_sender_bidx #️⃣ | bytea | نعم | — |
| location_mode | text | لا | `precise`، `manual_governorate`، `ip_only`، `none` |
| manual_governorate_id | smallint | نعم | — |
| ip | inet | نعم | حساسة بتشفير التخزين الكامل لا تشفير حقل (07 §1)، وتُحذف بعد سنتين (RT-07). وفهرس لتحقيقات الإساءة |
| ip_governorate_id | smallint | نعم | — |
| governorate_id | smallint | نعم | المحافظة المعتمدة للفحص |
| app_version | text | نعم | — |
| user_agent_hash | bytea | نعم | — |
| receipt_issued | boolean | لا | — |
| precision_reduced_at | timestamptz | نعم | نسخة من حالة موقعه (21 §5.4) |
| scan_flag | boolean | لا | نمط مسح |

**الفهارس (لكل قسم):** `ix_checks_device (device_id, checked_at)`، و`ix_checks_identifier (identifier_value)`، و`px_checks_report (report_id) WHERE report_id IS NOT NULL`، و`px_checks_tenant (actor_tenant_id, checked_at) WHERE actor_tenant_id IS NOT NULL`، و`px_checks_wa (wa_number_bidx) WHERE wa_number_bidx IS NOT NULL`، و`px_checks_sms (sms_sender_bidx) WHERE sms_sender_bidx IS NOT NULL` لتحقيقات الإساءة (K-18).

### 8.2 `check_receipts` — إيصالات الفحص
**ثابتة** · **المتطلبات:** CHECK-16، PUB-06، D-37، 06 §10.1

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| check_id | uuid | لا | فريد، FK~ → imei_checks (مقسّم، والإيصال دائم بعد حذف قسم الفحص، RT-11) |
| checked_at | timestamptz | لا | — |
| verification_code_id | uuid | لا | FK → verification_codes (`CR-`) |
| snapshot | jsonb | لا | IMEI والموديل والنتيجة والتاريخ والمحافظة، ثابتة لا تتغير |
| user_id | uuid | نعم | «إيصالاتي» |
| pdf_file_id | uuid | نعم | — |

### 8.3 `bot_sessions` — محادثات البوت والرقم القصير
**قياسية** · **الاحتفاظ:** RT-35 (30 يوماً بعد آخر رسالة) · **الفئة:** `sensitive` · **المتطلبات:** WABOT-01..07، SMS-01..04، SUPPORT-03

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| channel | text | لا | `whatsapp_check`، `whatsapp_support`، `sms` |
| sender_enc 🔐 | bytea | لا | — |
| sender_bidx #️⃣ | bytea | لا | — |
| state | text | لا | حالة المحادثة (`S-BOT-NN` في [قائمة الشاشات](18-screen-inventory.md)) |
| context | jsonb | نعم | المعرّف المنتظر وموقعه، ومعرّف الفحص |
| last_message_at | timestamptz | لا | — |
| expires_at | timestamptz | لا | — |

**الفهارس:** `uq_bot_sessions (channel, sender_bidx)`.

## 9. البلاغات والاعتراضات والمعلومات الواردة

### 9.1 `reports` — البلاغات
**قياسية** · **نطاق الأمن** · **الاحتفاظ:** RT-12 · **الفئة:** `personal` · **المتطلبات:** REPORT-01..30، ONBEHALF-01..06، POLICE-02..06، PP-04، PP-08، PP-17..19، TRUSTED-02، TRUSTED-03، THEFT-01، TIP-04، SERIAL-03، TELCO-15، 06 §3، 06 §4، D-119، D-120

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| report_number | text | نعم | فريد، `^BL-\d{4}-\d{6,7}(/\d{1,4})?$` عند الإرسال. ولكل جهاز في بلاغ سرقة المحل أو الوكيل `BL-YYYY-NNNNNN/k` من رقم دفعته (K-08) |
| batch_id | uuid | نعم | FK → report_batches (بلاغ سرقة المحل أو الوكيل) |
| batch_seq | smallint | نعم | `k` في رقم الجهاز. `CHECK ((batch_id IS NULL) = (batch_seq IS NULL))` |
| device_id | uuid | نعم | FK → devices، إلزامي من `pending_review` فصاعداً |
| device_class | text | لا | — |
| manufacturer_id | int | نعم | — |
| imei1 | text | نعم | المدخل |
| imei2 | text | نعم | — |
| serial | text | نعم | — |
| brand | text | نعم | — |
| model | text | نعم | — |
| color | text | نعم | — |
| type | text | لا | `stolen`، `lost` |
| previous_type | text | نعم | تغيير النوع بطلب المبلّغ يعيد البلاغ للمراجعة (REPORT-23) |
| source | text | لا | `user`، `police`، `on_behalf`، `trusted_contact`، `shop` (ومنه الوكيل، REPORT-20) |
| police_origin | text | نعم | `portal`، `import`، `referral` |
| via_theft_session | boolean | لا | قُدّم أو أُكّد من جلسة «بلاغ السرقة فقط» (علامة للمراجع) |
| via_support | boolean | لا | أجراه الدعم بصفة `support_on_behalf` بعد التحقق من الهوية، ويوافق على ما يحتاج موافقة موظف غيره |
| reporter_suspended_flag | boolean | لا | قدّمه صاحب حساب معلّق (قدرة `protective`، REPORT-28)، فيراجعه مشرف غير من علّق |
| status | text | لا | `draft`، `awaiting_owner`، `pending_review`، `needs_info`، `rejected`، `active`، `closure_requested`، `closed`، `cancelled` ([التصميم التقني §8.1](19-technical-design.md)) |
| competing_claim_of | uuid | نعم | FK ذاتي: **ادعاء منافس** على جهاز عليه بلاغ مفتوح لشخص آخر، يُسجَّل بمستوى ⛔ ولا يُرفض، ويراجَع مع الأول بموافق ثانٍ (G-03، REPORT-19) |
| linked_reporter_ids | uuid[] | نعم | مبلّغو البلاغات المدموجة في هذا البلاغ (`merged_duplicate`)، **للإشعار فقط** |
| trust_level | text | نعم | `documented`، `supported`، `weak`، `conflicting` |
| priority | text | لا | `urgent`، `normal` |
| reporter_user_id | uuid | نعم | FK → users |
| responsible_person_id | uuid | نعم | FK → persons (المالك المسؤول قانونياً) |
| reporter_tenant_id | uuid | نعم | FK → tenants (بلاغ المحل) |
| initiated_by_user_id | uuid | نعم | المفوّض أو الجهة الموثوقة |
| created_by_admin_id | uuid | نعم | البلاغ بالنيابة |
| police_user_id | uuid | نعم | FK → police_users |
| police_unit_id | uuid | نعم | FK → police_units |
| police_reference | text | نعم | رقم الضبط. والبلاغ الرسمي على بلاغ مواطن مفتوح **يُربط به ولا يضيع** (F-06) |
| police_reference_linked_at | timestamptz | نعم | — |
| police_import_id | uuid | نعم | FK → police_imports |
| incident_at | timestamptz | نعم | لا يسبق اليوم بأكثر من ⚙️ 5 سنوات، وليس في المستقبل |
| incident_time_approx | boolean | لا | — |
| incident_country | char(2) | لا | `SY` افتراضياً، وغيره «خارج سوريا» فيصير النطاق للإدارة المركزية وحدها (REPORT-24) |
| governorate_id | smallint | نعم | إلزامي عند الإرسال لحادثة داخل سوريا (GEO-05). `CHECK (incident_country <> 'SY' OR status = 'draft' OR governorate_id IS NOT NULL)` |
| area_id | int | نعم | — |
| has_incident_pin | boolean | لا | النقطة في `geo_private.incident_locations` |
| description | text | نعم | — |
| declaration_accepted_at | timestamptz | نعم | REPORT-08 |
| sim_in_device | boolean | نعم | THEFT-01 |
| theft_protection_at | timestamptz | نعم | — |
| owner_confirmation_required | boolean | لا | — |
| owner_confirmed_at | timestamptz | نعم | — |
| reward_amount_minor | bigint | نعم | REPORT-17: مضاعفات الخطوة ⚙️ بين الحد الأدنى والأعلى (06 §6.2)، ويُرفض نمط رقم الهاتف. `CHECK (reward_amount_minor IS NULL OR reward_amount_minor > 0)` |
| reward_currency | char(3) | نعم | `SYP` |
| reward_updated_at | timestamptz | نعم | — |
| reward_edits_count | smallint | لا | حد ⚙️ 3 تعديلات، وكل تعديل مسجّل للمراجع (G-07) |
| registered_holder_person_id | uuid | نعم | FK → persons: الحائز المسجّل غير المبلّغ عند القبول (D-119) |
| holder_notified_at | timestamptz | نعم | إشعاره المحايد مع رابط اعتراض دون هوية المبلّغ |
| holder_notice_hold_until | timestamptz | نعم | تأجيل الإشعار بطلب سرية مكتوب من الأمن، ⚙️ 30 يوماً حداً أقصى (`report.holder_notice.secrecy_max`) |
| network_request_hold | boolean | لا | المعرّف معلَّم `shared_identifier` (D-120): طلب المراقبة والحظر لا يُرسل حتى قرار الجهة |
| network_decision | text | نعم | قرار وحدة الأمن المختصة (`pp.network_request.decide`، PP-18): `approve`، `decline` |
| network_decided_by_police_user_id | uuid | نعم | FK → police_users |
| network_decided_at | timestamptz | نعم | — |
| network_decision_reason | text | نعم | — |
| submitted_at | timestamptz | نعم | — |
| info_due_at | timestamptz | نعم | 14 يوماً ⚙️ |
| accepted_at | timestamptz | نعم | تاريخ النشر الظاهر في الفحص |
| decided_by_type | text | نعم | `admin`، `police`، `system` |
| decided_by_id | uuid | نعم | — |
| reason_code | text | نعم | — |
| reason_text | text | نعم | — |
| conflict_justification | text | نعم | إلزامي لقبول ⛔ |
| closed_at | timestamptz | نعم | — |
| close_reason | text | نعم | `recovered`، `found`، `mistake`، `dispute_decision`، `police_closure`، `seizure_returned`، `released_by_authority` (إفراج الجهات لغير المالك، §11.7)، `device_destroyed`، `reversal`، `merged_duplicate`، `official_closure` |
| closed_by_type | text | نعم | — |
| closed_by_id | uuid | نعم | — |
| cancelled_at | timestamptz | نعم | — |
| cancel_reason | text | نعم | `withdrawn`، `owner_declined`، `owner_timeout`، `draft_expired`، `superseded` (حلّ محله بلاغ عاجل)، `recovered` (إرجاع مضبوط قبل القرار)، `merged_duplicate` |
| stand_down_sent_at | timestamptz | نعم | إشعار «البلاغ لم يعد نافذاً» للجهات ذات رابط النطاق عند كل خروج من النفاذ (PP-17) |
| draft_expires_at | timestamptz | نعم | 30 يوماً ⚙️ |
| client_draft_id | uuid | نعم | فريد مع `reporter_user_id` |

**الفهارس:** `px_reports_effective_device (device_id) WHERE status IN ('active','closure_requested')` فريد (**بلاغ نافذ واحد لكل جهاز**، REPORT-12)، و`px_reports_open_per_person (device_id, responsible_person_id) WHERE status IN ('awaiting_owner','pending_review','needs_info')` فريد (بلاغ مفتوح واحد لكل جهاز وشخص، وقد تُراجع عدة ادعاءات، [التصميم التقني §7.1](19-technical-design.md))، و`ix_reports_competing (competing_claim_of) WHERE competing_claim_of IS NOT NULL`، و`ix_reports_queue (status, priority, submitted_at)`، و`ix_reports_reporter (reporter_user_id)`، و`ix_reports_gov (governorate_id, status)`، و`ix_reports_batch (batch_id)`.

والرسالة لصاحب الادعاء الثاني محايدة («تلقّينا بلاغك، وسيُراجع مع المعلومات المتوفرة عن الجهاز»)، ولا خطأ يكشف وجود بلاغ مفتوح لغيره (P-4).

### 9.2 `report_batches` — بلاغ سرقة المحل أو الوكيل
**قياسية** · **RLS** (`tenant_id`) · **الاحتفاظ:** RT-12 · **الفئة:** `internal` · **المتطلبات:** REPORT-18، REPORT-20، REPORT-21، D-94

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → tenants (المحل أو الوكيل، `verified` أو `suspended`) |
| report_number | text | لا | فريد، `BL-YYYY-NNNNNN` من سلسلة `BL` نفسها: **الرقم العام للدفعة** الذي يراه المحل والأمن، والبحث به يعيد كل أجهزتها (K-08) |
| submitted_by_user_id | uuid | لا | صاحب المحل أو الوكيل |
| via_theft_session | boolean | لا | من جلسة «بلاغ السرقة فقط» (REPORT-21) |
| via_support | boolean | لا | عبر الدعم بالهوية، ويراجعه مشرف آخر |
| police_reference | text | نعم | — |
| devices_count | int | لا | — |
| status | text | لا | `submitted`، `partially_decided`، `decided` |
| decided_by_type | text | نعم | — |
| decided_by_id | uuid | نعم | — |
| decided_at | timestamptz | نعم | — |

### 9.3 `report_evidence` — أدلة البلاغ
**ثابتة** · **المتطلبات:** REPORT-04..07، SERIAL-03، D-39

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| report_id | uuid | لا | FK → reports |
| type | text | لا | `carton`، `live_photo`، `serial_label`، `invoice`، `old_photo`، `findmy_screenshot`، `other` |
| file_id | uuid | لا | FK → files |
| barcode_value | text | نعم | المقروء على الخادم |
| barcode_matches | boolean | نعم | — |
| account_number_visible | text | نعم | `yes`، `no`، `unclear` (يحدده المشرف) |
| duplicate_of_file_id | uuid | نعم | — |
| added_by_user_id | uuid | نعم | — |
| added_by_admin_id | uuid | نعم | — |

### 9.4 `report_messages`، و`report_owner_confirmations`، و`closure_requests`
**المتطلبات:** REPORT-10، REPORT-11، ADMIN-03، OWN-08، TRUSTED-03، 06 §5

| الجدول | الأعمدة |
|---|---|
| `report_messages` (ثابتة) | `report_id` FK، و`author_type` (`admin`، `reporter`، `system`)، و`author_id`، و`body text`، و`file_ids uuid[]`، و`read_at` |
| `report_owner_confirmations` (قياسية) | `report_id` FK فريد، و`owner_person_id` FK، و`owner_user_id` FK، و`kind` (`delegate`: بلاغ المفوّض في `awaiting_owner`، `trusted_contact`: البلاغ العاجل في `pending_review`)، و`channel` (`account`، `theft_session`، `support_identity`؛ **ولا تأكيد من الرقم البديل أبداً**، D-81)، و`status` (`pending`، `paused`، `confirmed`، `declined`، `expired`؛ و`pending` ⇄ `paused` ما دام طلب تأكيد بالهوية لدى الدعم مفتوحاً للنوع `trusted_contact`، [التصميم التقني §8.15](19-technical-design.md))، و`expires_at` (⚙️ 48 ساعة للمفوّض `WALL_USER`، و⚙️ 72 ساعة للبلاغ العاجل بصنف `BUSINESS_FLOOR` لا تنقضي قبل نهاية يوم الدوام الثاني)، و`paused_at`، و`paused_remaining interval` (المتبقي لحظة التوقف، `PAUSABLE`)، و`pause_ticket_id` FK → support_tickets، و`confirmed_at`، و`identity_verification_id` FK |
| `closure_requests` (قياسية) | `report_id` FK، و`requested_by_user_id` FK، و`reason` (`recovered`، `found`، `mistake`)، و`note`، و`status` (`pending`، `approved`، `rejected`، `withdrawn`؛ و`withdrawn` آلياً حين يُغلق البلاغ بطريق آخر)، و`decided_by_type`، و`decided_by_id`، و`reason_code`، و`reason_text`، و`decided_at`، و`rerequest_allowed_at` (بعد الرفض لا طلب جديد قبل ⚙️ 7 أيام إلا بتدخل الأمن). وفهرس `px_closure_pending (report_id) WHERE status='pending'` فريد |

### 9.5 `disputes` و`dispute_evidence` — الاعتراضات
**قياسية** · **المتطلبات:** DISPUTE-01..03، ADMIN-04، D-34

| العمود (`disputes`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| report_id | uuid | لا | FK → reports |
| disputant_user_id | uuid | لا | FK → users |
| disputant_person_id | uuid | لا | FK → persons |
| statement | text | لا | — |
| status | text | لا | `submitted`، `awaiting_response`، `under_review`، `upheld`، `report_closed`، `referred`، `withdrawn`، `dismissed` (ردّ بلا دليل)، `moot` (خرج البلاغ عن النفاذ بطريق آخر أو دُمج الجهاز) ([التصميم التقني §8.10](19-technical-design.md)) |
| response_due_at | timestamptz | نعم | 7 أيام ⚙️ |
| follow_up_due_at | timestamptz | نعم | `referred` بمؤقّت متابعة ⚙️ 30 يوماً |
| resubmission_of_id | uuid | نعم | FK ذاتي: إعادة التقديم من المعترض نفسه بدليل جديد بعد ⚙️ 30 يوماً (DISPUTE-04) |
| reporter_response | text | نعم | — |
| reporter_responded_at | timestamptz | نعم | — |
| no_response | boolean | لا | — |
| decided_by_admin_id | uuid | نعم | — |
| decision_reason | text | نعم | — |
| decided_at | timestamptz | نعم | — |
| police_referral_id | uuid | نعم | FK → police_referrals |

**الفهارس:** `px_dispute_open (report_id, disputant_user_id) WHERE status IN ('submitted','awaiting_response','under_review')` فريد.

`dispute_evidence` (ثابتة): `dispute_id` FK، و`party` (`disputant`، `reporter`)، و`type`، و`file_id` FK، و`note`.

### 9.6 `tips` — المعلومات الواردة
**قياسية** · **نطاق الأمن** · **الاحتفاظ:** RT-13، ووسيلة التواصل RT-15 · **الفئة:** `personal` · **المتطلبات:** TIP-01..08، REPORT-22، SHOP-16، TRACK-02

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| type | text | لا | `info`، `found` (ومنه «وجدت هذا الجهاز؟» بعد نتيجة «لا توجد بلاغات»، TIP-07)، `reporter_info` (معلومة من المبلّغ نفسه على بلاغه، REPORT-22) |
| check_id | uuid | نعم | الفحص المرتبط، FK~ |
| checked_at | timestamptz | نعم | — |
| report_id | uuid | نعم | FK → reports. فارغ لـ «وجدته» على جهاز بلا بلاغ |
| device_id | uuid | نعم | FK → devices. فارغ إن لم يكن للمعرّف سجل |
| identifier_value | text | نعم | المعرّف المفحوص حين لا سجل له |
| source_kind | text | لا | `account`، `whatsapp`، `sms`، `visitor_key`، `shop` |
| source_bidx #️⃣ | bytea | نعم | بصمة المصدر لحد ⚙️ 3 معلومات يومياً لكل مصدر ولقيد `tips` (TIP-08) |
| handover_code_hash | bytea | نعم | رمز التسليم لإرجاع جهاز مفقود (SOP-10، F-30) |
| false_flagged_at | timestamptz | نعم | أُغلقت كاذبة، وتُحسب على المصدر |
| body | text | لا | — |
| seen_governorate_id | smallint | نعم | — |
| seen_area_id | int | نعم | — |
| contact_enc 🔐 | bytea | نعم | وسيلة التواصل الاختيارية |
| contact_kind | text | نعم | `phone`، `whatsapp`، `other` |
| file_id | uuid | نعم | — |
| submitted_by_user_id | uuid | نعم | — |
| submitted_by_tenant_id | uuid | نعم | — |
| status | text | لا | `new`، `in_review`، `actioned`، `closed` ([التصميم التقني §8.15](19-technical-design.md))، وأي معلومة مفتوحة تُغلق آلياً بسبب حين ينتهي البلاغ المرتبط |
| handled_by_admin_id | uuid | نعم | — |
| notes | text | نعم | داخلية |
| governorate_id | smallint | نعم | لنطاق الأمن |

### 9.7 `police_imports` و`police_import_rows` — استيراد بلاغات قوى الأمن
**المتطلبات:** POLICE-01..06، D-52

| الجدول | الأعمدة |
|---|---|
| `police_imports` (قياسية) | `uploaded_by_admin_id` FK، و`file_id` FK (الغرض `police_import_file`، ⚙️ 250,000 سطر و⚙️ 50 ميغابايت)، و`source_reference`، و`source_key` (مصدر الملف لحفظ ربط الأعمدة)، و`column_mapping jsonb` (ربط أعمدة ملف الوزارة بأعمدة القالب في 06 §16.11، ويُعاد استعماله لكل `source_key`)، و`encoding_detected` (`utf8`، `utf8_bom`، `windows_1256`)، و`status` (`uploaded`، `validating`، `processed`، `failed`)، و`total_rows`، و`accepted_rows`، و`rejected_rows`، و`conflict_rows`، و`linked_rows`، و`rejection_report_file_id`، و`started_at`، و`finished_at` |
| `police_import_rows` (ثابتة) | أعمدة القالب ([قواعد العمل](06-business-rules.md) §16.11): `import_id` FK، و`row_no`، و`identifier_type` (`imei`، `serial`)، و`imei1`، و`imei2`، و`manufacturer_id`، و`serial`، و`brand`، و`model`، و`report_date date`، و`governorate_id` (من `governorate_code`)، و`police_reference`، و`owner_national_id_enc 🔐`، و`owner_national_id_bidx #️⃣`، و`status` (`accepted`، `rejected`، `conflict`، `linked`: رُبط ببلاغ مواطن قائم بدل الرفض، F-06)، و`reason_code` (ومنه `ROW_IDENTIFIER_EXCEL_FORMAT`)، و`report_id` FK. وفهرس `px_import_rows_owner (owner_national_id_bidx) WHERE owner_national_id_bidx IS NOT NULL` لبحث الأمن بالرقم الوطني (K-18) |

## 10. المستأجرون: المحلات والوكلاء والصيانة

### 10.1 `tenants` — المستأجرون
**ثابتة** · **الاحتفاظ:** RT-16 · **الفئة:** `internal` · **المتطلبات:** [التصميم التقني §6.1](19-technical-design.md)، TENANT-01

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| kind | text | لا | `shop`، `importer`، `supplier`، `courier` |
| display_name | text | لا | نسخة للعرض والتدقيق |

معرّف المستأجر هو نفسه معرّف المحل أو الوكيل أو المورّد أو جهة الشحن في جدولها. ودورة حياة كل مستأجر في جدول نوعه بنموذج PARENT_LIFECYCLE ([التصميم التقني §8.4](19-technical-design.md)): `pending_review`، `waitlisted` (المحلات وحدها)، `needs_changes`، `verified`، `rejected`، `withdrawn`، `suspended`، `closing`، `closed`، `revoked`. و**تغيير المالك عملية على السجل نفسه** لا حالة (D-107): يبقى رقم `SH-` وتاريخه ومخزونه، ويُسجَّل المالك في `tenant_owner_periods` (§10.14). والتعليق والتجميد قيود (`tenant_suspended`، §5.9) تجتمع مع الحالة.

### 10.2 `shops` — المحلات
**قياسية** (المعرّف FK → tenants) · **RLS** (`id`) · **الاحتفاظ:** RT-16 · **الفئة:** `internal` (والموقع 📍 عنوان عمل) · **المتطلبات:** SHOP-01..04، SHOP-29، TENANT-01..10، GEO-03، ADMIN-06، ROLLOUT-02، D-23، D-90، D-107، D-108، D-110

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| shop_code | text | نعم | فريد، `SH-NNNNN` عند التوثيق، **ولا يتغير بتغيير المالك** (D-107) |
| name | text | لا | 3 إلى 60 حرفاً بسياسة الأسماء (06 §16.1، `NAME_NOT_ALLOWED`) |
| name_norm | text | لا | — |
| owner_user_id | uuid | لا | FK → users، حساب المالك الحالي (موثّق الهوية) |
| owner_person_id | uuid | لا | FK → persons، المالك الحالي شخصاً. ويُفحص عليه `person_ban` و`staff_bar`، وتاريخ الملاك في `tenant_owner_periods` |
| governorate_id | smallint | لا | FK → governorates |
| area_id | int | نعم | FK → areas |
| city | text | نعم | **مشتق** من `area_id` للعرض، ولا يُطلب في النموذج (K-25) |
| address_detail | text | لا | الشارع والمعلم والطابق، حتى 200 حرف |
| location 📍 | geography(Point,4326) | لا | موقع عمل موثّق، وهو موقع الفرع الرئيسي (`shop_branches.is_main`) |
| location_accuracy_m | int | نعم | — |
| phone_e164 | text | لا | موبايل سوري أو هاتف أرضي `^\+963(9\d{8}\|[1-5]\d{6,8})$` (06 §16.5) |
| license_number | text | لا | — |
| license_no_norm | text | لا | الرخصة مطبَّعة، مفتاح التجربة لكل رخصة (D-113) |
| parts_purchase_allowed | boolean | لا | لمحل الصيانة فقط |
| status | text | لا | `pending_review`، `waitlisted`، `needs_changes`، `verified`، `rejected`، `withdrawn`، `suspended`، `closing`، `closed`، `revoked` ([التصميم التقني §8.4](19-technical-design.md)) |
| status_before_closing | text | نعم | `verified` أو `suspended`، ليعود إليها عند تراجع صاحب المحل |
| status_reason | text | نعم | — |
| closure_reason | text | نعم | `owner_request`، `revoked`. `CHECK ((status = 'closed') = (closure_reason IS NOT NULL))`. ويبقى للجمهور «ملغى» لمن أُلغي |
| revocation_cause | text | نعم | `fraud` (المخزون يُجمَّد بقيد `fraud_freeze` حتى قرار الجهة الأمنية)، `non_fraud` (ينتقل لصاحب المحل شخصياً بتسليم مخزون الإغلاق) (D-108). `CHECK ((revoked_at IS NULL) = (revocation_cause IS NULL))` |
| verified_by_admin_id | uuid | نعم | — |
| verified_at | timestamptz | نعم | — |
| suspended_at | timestamptz | نعم | — |
| closing_started_at | timestamptz | نعم | — |
| closed_at | timestamptz | نعم | بداية مدة الاطلاع على المحاسبة (RT-43) |
| revoked_at | timestamptz | نعم | — |
| revoked_by_admin_id | uuid | نعم | المدير العام وحده بعد اقتراح مشرف المحلات مع معاينة الآثار (D-102) |
| withdrawn_at | timestamptz | نعم | سحب صاحب الطلب قبل القرار |
| privacy_poster_file_id | uuid | نعم | FK → files: ملف PDF بحجم A4 باسم المحل يتولّد عند التوثيق ويُعاد توليده عند تغيّر بياناته (D-110) |
| privacy_poster_generated_at | timestamptz | نعم | — |
| privacy_poster_confirmed_at | timestamptz | نعم | تأكيد صاحب المحل «علّقت الملصق»، وتذكير كل ⚙️ 7 أيام حتى التأكيد (SHOP-29) |
| privacy_poster_confirmed_by_user_id | uuid | نعم | — |

**الفهارس:** `uq_shops_code`، و`ix_shops_gov_status (governorate_id, status)`، و`ix_shops_location` (GiST)، و`ix_shops_name_norm` (trgm)، و`ix_shops_owner_person (owner_person_id)`، و`ix_shops_license_norm (license_no_norm)`.

### 10.3 `shop_activities` — أنواع نشاط كل محل
**RLS** (`tenant_id`) · **المتطلبات:** D-90، SHOP-01

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | PK مركّب، FK → shops |
| activity_type | text | لا | PK مركّب، FK → shop_activity_types |
| created_at | timestamptz | لا | — |

### 10.4 `importers` — الوكلاء والمستوردون
**قياسية** (المعرّف FK → tenants) · **RLS** (`id`) · **المتطلبات:** IMPORTER-01، 06 §6.1، D-49

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| importer_code | text | نعم | فريد، `IM-NNNN` |
| company_name | text | لا | — |
| name_norm | text | لا | — |
| commercial_register_no | text | لا | — |
| license_kind | text | لا | `import`، `agency` |
| license_no | text | لا | — |
| governorate_id | smallint | لا | — |
| address_detail | text | لا | — |
| location 📍 | geography(Point,4326) | لا | — |
| admin_user_id | uuid | لا | FK → users (المسؤول المالك) |
| owner_person_id | uuid | لا | FK → persons، كما في `shops` |
| phone_e164 | text | لا | موبايل أو أرضي (06 §16.5) |
| status | text | لا | `pending_review`، `needs_changes`، `verified`، `rejected`، `withdrawn`، `suspended`، `closing`، `closed`، `revoked`. ولا `waitlisted`: قائمة الانتظار للمحلات وحدها (ROLLOUT-02) |
| status_before_closing | text | نعم | — |
| closure_reason | text | نعم | `owner_request`، `revoked` |
| revocation_cause | text | نعم | `fraud`، `non_fraud` (D-108) |
| closed_at | timestamptz | نعم | — |
| revoked_at | timestamptz | نعم | — |
| verified_by_admin_id | uuid | نعم | — |
| verified_at | timestamptz | نعم | — |
| api_enabled | boolean | لا | التسجيل عبر الربط البرمجي |

### 10.5 وثائق المستأجر وتعديلاته وفروعه
**RLS** (`tenant_id`) · **الاحتفاظ:** RT-16 · **الفئة:** `internal` · **المتطلبات:** SHOP-01، SHOP-04، IMPORTER-01، SHOPPRO-12، TENANT-06، TENANT-08، TENANT-10، D-107، D-109

| الجدول | الأعمدة |
|---|---|
| `tenant_documents` (ثابتة، يحل محل `shop_documents`) | `tenant_id` FK، و`type` (`license`، `commercial_register`، `import_license`، `facade_outside`، `facade_inside`، `supplier_contract`، `license_transfer` (وثائق انتقال الرخصة في تغيير المالك)، `other`)، و`file_id` FK (الغرض `tenant_document`)، و`uploaded_by_user_id`، و`change_request_id` FK، و`superseded_at` |
| `tenant_change_requests` (قياسية) | `tenant_id` FK، و`type` (`data`: الاسم أو الموقع أو الترخيص SHOP-04، `owner_change` (D-107)، `activity_removal` (D-90)، `governorate_move`، `branch_location` (توثيق موقع فرع D-109))، و`requested_by_user_id`، و`acting_as` (`self`، أو `heir`/`executor` للوريث المؤهل بقاعدة D-103 عند وفاة المالك)، و`changes jsonb`، و`new_owner_user_id` و`new_owner_person_id` FK (لـ `owner_change`: حساب موثّق الهوية بلا قيد `person_ban` أو `staff_bar`)، و`accounting_choice` (`hand_over` «تسليم» أو `keep` «الاحتفاظ لنفسي»، الافتراضي `keep`، يختاره المالك القديم، §15.6)، و`wallet_closed_at` (شرط التنفيذ: سحب المالك القديم رصيده كاملاً وإغلاق محفظته)، و`branch_id` FK (لـ `branch_location`)، و`expires_at` (⚙️ 30 يوماً لاكتمال شروط تغيير المالك، `tenant.owner_change.complete_within`)، و`status` (`pending`، `approved`، `rejected`، `withdrawn`، `executed`، [التصميم التقني §8.15](19-technical-design.md))، و`decided_by_admin_id` (`tenant.owner_change.decide` أو `tenant.branch.verify`)، و`reason_text`، و`decided_at`، و`executed_at`. وفهرس `px_tenant_change_owner_open (tenant_id) WHERE type = 'owner_change' AND status IN ('pending','approved')` فريد (`TENANT_OWNER_CHANGE_PENDING`). والمحل يبقى `verified` ببياناته السابقة حتى التنفيذ |
| `shop_branches` (قياسية) | الفرع تقسيم داخل المحل لا مستأجر، و**تسجيله وموقعه ومعاملاته التزام مجاني بلا حد** (D-109): `tenant_id` FK، و`name`، و`address_detail`، و`governorate_id` FK، و`area_id` FK، و`location 📍 geography`، و`location_accuracy_m`، و`location_verified_at` و`location_verified_by_admin_id` (يوثّقه مشرف المحلات كتعديل بيانات المحل بطلب `branch_location`، والفرع غير الموثّق لا تُسجَّل فيه معاملات أجهزة `SHOP_BRANCH_LOCATION_UNVERIFIED`، ونقطة البيع فيه للأصناف غير الأجهزة)، و`is_main boolean`، و`active boolean`، و`closed_at` (يخرج موقعه من فحص البعد وتُحدَّث `branch_ids` للأعضاء)، و`accounting_read_only boolean` (محاسبة الفروع الزائدة على حد الباقة للقراءة فقط، ولا يمس وظائف الالتزام، P-5). وفهرس `px_branch_main (tenant_id) WHERE is_main` فريد، و`ix_branches_location` (GiST). والفرع **شرط ثانٍ في RLS** عبر `app.branch_ids` على جداول المحل و`shoppro` المقسّمة بالفروع |

### 10.6 `shop_members` و`importer_members` — الأعضاء
**قياسية** · **RLS** (`tenant_id`، ومعه `user_id = app.user_id` للقراءة) · **الاحتفاظ:** RT-16 · **الفئة:** `personal` · **المتطلبات:** SHOP-05، IMPORTER-02، TENANT-03، TENANT-06، RESTRICT-06، D-40، D-107، 03 §2.4

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → shops أو importers |
| user_id | uuid | لا | FK → users |
| role | text | لا | `owner`، `employee` |
| permissions | text[] | لا | من قائمة نوع المستأجر ([التصميم التقني §5.5](19-technical-design.md)) |
| branch_ids | uuid[] | نعم | للمحل |
| status | text | لا | `invited`، `pending_identity`، `active`، `suspended`، `removed`، `exit_only` (صاحب محل ملغى أو مغلق أو مالك سابق بعد تغيير المالك ما بقي له رصيد أو مدة اطلاع على المحاسبة، [التصميم التقني §4.2.14](19-technical-design.md)) |
| invite_id | uuid | نعم | FK → tenant_member_invites، الدعوة التي أنشأت العضوية (§10.13) |
| invited_by_user_id | uuid | نعم | — |
| activated_at | timestamptz | نعم | — |
| suspended_at | timestamptz | نعم | — |
| removed_at | timestamptz | نعم | — |
| removed_reason | text | نعم | `owner`، `left`، `account_closed`، `account_banned`، `staff_bar`، `tenant_revoked`، `tenant_closed`، `owner_changed` |
| permissions_reset_at | timestamptz | نعم | تغيير المالك يعيد كل الصلاحيات الممنوحة للضبط الافتراضي حتى يمنحها المالك الجديد (D-107) |
| exit_only_until | timestamptz | نعم | لـ `exit_only`: حتى يصفر الرصيد وتنتهي مدة الاطلاع |

**الفهارس:** `px_members_unique (tenant_id, user_id) WHERE status NOT IN ('removed')` فريد، و`px_members_owner (tenant_id) WHERE role='owner' AND status='active'` فريد، و`ix_members_user (user_id)`.

ودعوة الموظف قبل وجود العضوية في `tenant_member_invites` (§10.13)، فلا عضوية بلا مستخدم. والجداول المقابلة للمورّد (`supplier_users`) وجهة الشحن (`courier_users`) في §14 بالحالات نفسها.

### 10.7 `shop_transactions` — معاملات المحلات
**قياسية** · **RLS** (`tenant_id`، والفرع شرط ثانٍ) · **نطاق الأمن** (`governorate_id`) · **الاحتفاظ:** RT-16، وصورة هوية البائع RT-18 · **الفئة:** `sensitive` · **المتطلبات:** SHOP-06..30، SERIAL-04، FAKE-03، GSMA-03، GSMA-06، CIVIL-03، CIVIL-04، OWN-17، D-31، D-84، D-96، D-104، D-121، 06 §6

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → shops |
| tx_number | text | نعم | فريد، `TX-YYYY-NNNNNNN` عند الإكمال (عدّاد بلا فجوات، آخر عبارة قبل الالتزام) |
| type | text | لا | `purchase`، `sale` |
| custody_kind | text | لا | نوع الحيازة: `shop_purchase` (ومنه شراء الإرجاع من المالك المسجّل)، `transfer_to_tenant` (قبول «نقل لمحل» نفسه شراء، D-121)، `shop_sale`، `remote_sale_accept` (محجوز معطّل) |
| return_of_tx_id | uuid | نعم | FK ذاتي: إرجاع الزبون جهازاً بعد مهلة الإلغاء **شراء من المالك المسجّل** مرتبط بالبيع الأصلي (SHOP-21، MC-09) |
| exchange_group_id | uuid | نعم | الاستبدال إرجاع وبيع جديد في شاشة واحدة |
| ownership_transfer_id | uuid | نعم | FK → ownership_transfers: للقبول بنوع `transfer_to_tenant` |
| condition | text | لا | `new`، `used`، `parts` |
| status | text | لا | `checked`، `blocked`، `under_review`، `completed`، `rejected`، `cancelled`، `expired` |
| hold_reason | text | نعم | `sold_to_other_registered`، `purchase_from_non_owner` (D-96)، `pending_report` (بلاغ قيد المراجعة على الجهاز)، `dual_imei_mismatch`، `account_locked` (قفل iCloud أو FRP لم يُزل أمام الموظف، SHOP-23)، `owner_deceased` (المالك المسجّل متوفى: الرسالة المحايدة ترشد لطريق الإرث). والمحل يرى رسالة محايدة فقط، والمعاملة المعلّقة تحجز الجهاز (§7.8) |
| block_reason | text | نعم | `active_report`، `gsma_listed`، `self_reg_waiting`، `card_invalid`، `held_by_authority`، `fraud_freeze`، `reserved` |
| device_id | uuid | نعم | FK → devices |
| device_class | text | لا | — |
| manufacturer_id | int | نعم | — |
| entered_imei1 | text | نعم | — |
| entered_imei2 | text | نعم | — |
| entered_serial | text | نعم | — |
| confirmed_brand | text | نعم | — |
| confirmed_model | text | نعم | — |
| tac_model_mismatch | boolean | لا | — |
| counterfeit_warning | boolean | لا | — |
| counterparty_person_id | uuid | نعم | FK → persons |
| counterparty_full_name | text | نعم | إلزامي عند الإكمال |
| counterparty_document_type | text | لا | الافتراضي `sy_national_id`، أو وثيقة بديلة (D-104) |
| non_nid_party | boolean | لا | الطرف بوثيقة بديلة: علامة للمعاينة اليدوية (PERSON-02) |
| counterparty_national_id_enc 🔐 | bytea | نعم | رقم وثيقة الطرف، إلزامي عند الإكمال |
| counterparty_national_id_bidx #️⃣ | bytea | نعم | — |
| counterparty_national_id_mask | text | نعم | ما يراه المحل دائماً |
| counterparty_phone_e164 | text | نعم | — |
| counterparty_email_enc 🔐 | bytea | نعم | اختياري (SHOP-11) |
| minor_involved | boolean | لا | الطرف الحاضر وليّ أمر لقاصر (D-97): المعاملة باسم وليّ الأمر وهويته |
| minor_authorized_user_id | uuid | نعم | FK → authorized_users، القاصر المضاف مفوّضاً في المعاملة نفسها. `CHECK (NOT minor_involved OR status <> 'completed' OR type = 'purchase' OR minor_authorized_user_id IS NOT NULL)` |
| seller_id_front_file_id | uuid | نعم | FK → files، إلزامي في الشراء من فرد |
| seller_id_back_file_id | uuid | نعم | FK → files |
| civil_status | text | لا | `verified`، `unverified_offline`، `not_enabled`، `not_applicable` (وثيقة بديلة) |
| civil_card_status | text | نعم | — |
| civil_reverify_due | boolean | لا | — |
| gsma_unverified | boolean | لا | GSMA غير متاح عند الإكمال: اكتمل بعلامة ويُعاد الاستعلام (`SHOP_GSMA_UNVERIFIED`، GSMA-06) |
| disputed_by_party_at | timestamptz | نعم | ضغط المالك السابق «لم أبِع» أو المشتري «لم أشترِ» (OWN-17): طلب دعم عاجل وعنصر SOP-22 |
| price_amount_minor | bigint | نعم | اختياري، للمشتري فقط (D-17). `CHECK (price_amount_minor IS NULL OR price_amount_minor > 0)`. والكلفة والسعر المحاسبيان للمشترك في `shoppro.registry_tx_amounts` لا هنا (§15.1) |
| price_currency | char(3) | نعم | — |
| note | text | نعم | ملاحظة المعاملة حتى 300 حرف (06 §16.1، K-25) |
| performed_by_user_id | uuid | لا | FK → users |
| performed_by_member_id | uuid | لا | FK → shop_members |
| branch_id | uuid | لا | FK → shop_branches: **فرع موثّق الموقع** لمعاملة الجهاز (محفّز يرفض غيره، `SHOP_BRANCH_LOCATION_UNVERIFIED`)، ومنه المسافة ونطاق الأمن وتقرير الالتزام (D-109) |
| check_id | uuid | نعم | FK~ → imei_checks |
| checked_at | timestamptz | نعم | — |
| governorate_id | smallint | لا | محافظة المحل |
| distance_from_shop_m | int | نعم | — |
| out_of_range | boolean | لا | — |
| low_accuracy | boolean | لا | — |
| expires_at | timestamptz | نعم | 30 دقيقة ⚙️ للحالة `checked` |
| completed_at | timestamptz | نعم | — |
| cancelled_at | timestamptz | نعم | — |
| cancelled_by_user_id | uuid | نعم | — |
| cancel_reason | text | نعم | `self_cancel`، `correction`، `employee_fraud` (SHOP-26)، `superseded` (قبل المحل نقلاً من المالك المسجّل للجهاز نفسه، D-121) |
| decided_by_admin_id | uuid | نعم | — |
| decision_reason | text | نعم | — |
| client_draft_id | uuid | نعم | فريد مع `performed_by_user_id` |

**الفهارس:** `ix_stx_tenant_time (tenant_id, created_at DESC)`، و`uq_stx_number`، و`ix_stx_device (device_id)`، و`ix_stx_counterparty (counterparty_national_id_bidx)`، و`px_stx_review (status) WHERE status='under_review'`، و`ix_stx_gov (governorate_id, completed_at)`، و`ix_stx_return_of (return_of_tx_id) WHERE return_of_tx_id IS NOT NULL`، و`px_stx_disputed (disputed_by_party_at) WHERE disputed_by_party_at IS NOT NULL`.

### 10.8 `shop_tx_corrections` — طلبات التصحيح والإلغاء
**قياسية** · **RLS** (`tenant_id`) · **المتطلبات:** SHOP-15، ADMIN-07

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | — |
| transaction_id | uuid | لا | FK → shop_transactions |
| requested_by_user_id | uuid | لا | — |
| kind | text | لا | `cancel`، `correct_counterparty`، `correct_device`، `correct_price`، `employee_fraud_cancel` (يتحقق المشرف ويعتمد المدير العام إرجاع الملكية بنمط REVERSAL-03، SHOP-26) |
| proposed | jsonb | نعم | — |
| reason_text | text | لا | — |
| status | text | لا | `pending`، `approved`، `rejected` |
| decided_by_admin_id | uuid | نعم | — |
| decided_at | timestamptz | نعم | — |
| decision_reason | text | نعم | — |

### 10.9 `invoices` — فواتير الأجهزة
**قياسية** · **RLS** (`tenant_id`، ومعه قراءة `buyer_user_id = app.user_id`) · **المتطلبات:** SHOP-10، SHOP-11، PUB-02، D-13

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | — |
| transaction_id | uuid | لا | فريد، FK → shop_transactions |
| invoice_number | text | لا | فريد، مساوٍ لـ `tx_number` |
| verification_code_id | uuid | لا | FK → verification_codes |
| buyer_person_id | uuid | لا | FK → persons |
| buyer_user_id | uuid | نعم | عند الربط |
| pdf_file_id | uuid | نعم | A4 |
| thermal_pdf_file_id | uuid | نعم | النسخة الحرارية المولّدة آخر مرة |
| thermal_width_mm | smallint | نعم | `CHECK (thermal_width_mm IN (58, 80))`: عرض الطابعة المقترنة (D-122)، وتُولَّد النسخة لكل عرض عند الطلب من القالب نفسه |
| status | text | لا | `valid`، `cancelled` |
| cancelled_at | timestamptz | نعم | — |
| cancel_reason | text | نعم | — |
| corrected_from_invoice_id | uuid | نعم | FK ذاتي |
| sent_whatsapp_at | timestamptz | نعم | — |
| sent_email_at | timestamptz | نعم | — |

### 10.10 `repair_jobs` — أوامر الصيانة
**قياسية** · **RLS** (`tenant_id`) · **نطاق الأمن** · **الاحتفاظ:** RT-20 · **الفئة:** `sensitive` · **المتطلبات:** REPAIR-01..10، SERIAL-04

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | — |
| verification_code_id | uuid | لا | إيصال الاستلام `CR-` (REPAIR-02) |
| device_id | uuid | لا | FK → devices |
| owner_person_id | uuid | لا | FK → persons |
| owner_full_name | text | لا | — |
| owner_national_id_enc 🔐 | bytea | لا | — |
| owner_national_id_bidx #️⃣ | bytea | لا | — |
| owner_phone_e164 | text | لا | — |
| issue_description | text | لا | — |
| device_condition | text | نعم | — |
| check_id | uuid | لا | — |
| civil_status | text | لا | — |
| status | text | لا | نموذج CUSTODY_CASE ([التصميم التقني §8.15](19-technical-design.md)): `received`، `in_repair`، `ready`، `delivered`، `handed_to_authority` («سُلّم للجهات المختصة»). و«متأخر» **علامة لا حالة** |
| presenter_is_registered_owner | boolean | لا | الحاضر غير المالك المسجّل: يُستلم ويُشعَر المالك إشعاراً محايداً مع «بلّغ عنه» (REPAIR-08) |
| reported_hold_at | timestamptz | نعم | علامة `reported_hold`: صار الجهاز مبلّغاً عنه فلا يُسلَّم (REPAIR-10)، وتُرفع عند انتهاء البلاغ |
| received_by_member_id | uuid | لا | — |
| received_at | timestamptz | لا | — |
| delivered_by_member_id | uuid | نعم | — |
| delivered_at | timestamptz | نعم | — |
| delivered_to_name | text | نعم | — |
| delivered_to_relation | text | نعم | `owner`، `authorized_person` |
| overdue_flagged_at | timestamptz | نعم | العلامة الأولى بعد ⚙️ 90 يوماً دون تسليم |
| second_overdue_flagged_at | timestamptz | نعم | العلامة الثانية بعد ⚙️ 180 يوماً. ولا تغيّر العلامتان الملكية ولا تنهيان الأمر (P-2) |
| last_customer_reminder_at | timestamptz | نعم | تذكيرات الحاضر بعد ⚙️ 90 و120 و150 يوماً بموافقته (REPAIR-02) |
| handed_to_station_id | uuid | نعم | FK → police_stations: «سُلّم للجهات المختصة» |
| handed_at | timestamptz | نعم | — |
| seized_device_id | uuid | نعم | FK → seized_devices: صف الضبط بغرض `unclaimed_deposit` |
| branch_id | uuid | نعم | — |
| governorate_id | smallint | لا | — |

**الفهارس:** `ix_repair_tenant_status (tenant_id, status)`، و`ix_repair_device (device_id)`، و`ix_repair_owner_nid (owner_national_id_bidx)` لبحث الأمن بالرقم الوطني (K-18)، و`px_repair_overdue (received_at) WHERE status IN ('received','in_repair','ready')`.

### 10.11 `board_replacements` — استبدال اللوحة الأم
**ثابتة** · **RLS** (`tenant_id`) · **المتطلبات:** REPAIR-04، R-22

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | — |
| repair_job_id | uuid | لا | FK → repair_jobs |
| device_id | uuid | لا | FK → devices |
| old_imei1 | text | لا | — |
| old_imei2 | text | نعم | — |
| new_imei1 | text | لا | — |
| new_imei2 | text | نعم | — |
| new_check_id | uuid | لا | FK~ → imei_checks |
| donor_device_id | uuid | نعم | FK → devices: لوحة مستعملة معرّفها لجهاز `dismantled` في حيازة المحل نفسه دون بلاغ مفتوح، فينتقل المعرّف ذرياً (`board_swap`، C-06) |
| status | text | لا | `completed`، `blocked` |
| blocked_reason | text | نعم | `stolen_board`، `possible_laundering` (لوحة من غير جهاز مفكّك في المحل نفسه) |
| performed_by_member_id | uuid | لا | — |
| performed_at | timestamptz | لا | — |

### 10.12 دفعات الوكلاء والنقل بالجملة
**RLS** · **المتطلبات:** IMPORTER-03..08، SERIAL-06، STORE-13، CUSTOMS-04

| الجدول | الأعمدة |
|---|---|
| `import_batches` (قياسية، RLS `tenant_id`) | `tenant_id` FK، و`batch_number` فريد (`BT-YYYY-NNNN`)، و`source` (`file`، `api`)، و`file_id`، و`api_client_id`، و`status` (`uploaded`، `validating`، `processed`، `failed`)، و`total_rows`، و`accepted_rows`، و`rejected_rows`، و`conflict_rows`، و`report_file_id`، و`uploaded_by_user_id`، و`started_at`، و`finished_at` |
| `import_batch_rows` (ثابتة، RLS `tenant_id`) | `tenant_id`، و`batch_id` FK، و`row_no`، و`device_class`، و`manufacturer_id`، و`imei1`، و`imei2`، و`serial`، و`brand`، و`model`، و`color`، و`status` (`accepted`، `rejected`، `conflict`)، و`reason_code`، و`device_id` FK |
| `wholesale_transfers` (قياسية، RLS `tenant_id` أو `recipient_tenant_id`) | `tenant_id` (المرسِل: الوكيل، أو المحل في `b2b` و`return` و`closure_handover`) FK، و`recipient_tenant_id` (المنشأة الموثّقة المستلمة) FK فارغ لتسليم الإغلاق لصاحب المحل شخصياً، و`recipient_person_id` FK → persons (تسليم مخزون الإغلاق لصاحب المحل شخصياً بفاتورة، D-108). `CHECK ((recipient_tenant_id IS NULL) <> (recipient_person_id IS NULL))`، و`kind` (`wholesale`، `b2b` بين محلين موثّقين، `closure_handover`، `return` للوكيل لعيب أو كفالة)، و`transfer_number` فريد (`TR-YYYY-NNNNN`)، و`source` (`manual`، `file`، `store_order`، `store_return`)، و`store_order_id`، و`store_return_id`، و`status` (`sent`، `accepted`، `partially_accepted`، `rejected`، `cancelled`، [التصميم التقني §8.15](19-technical-design.md))، و`cancel_reason` (`sender`، `auto_30d`، `recipient_suspended`، `report_withdrawn`)، و`item_count`، و`sent_by_user_id`، و`sent_at`، و`decided_by_user_id`، و`decided_at`، و`overdue_flagged_at` (⚙️ 7 أيام)، و`auto_cancel_at` (⚙️ 30 يوماً في `sent`)، و`note` |
| `wholesale_transfer_items` (ثابتة، RLS كالسابق) | `tenant_id`، و`recipient_tenant_id`، و`transfer_id` FK، و`device_id` FK، و`status` (`pending`، `accepted`، `rejected`، `withdrawn` (سُحب لبلاغ سرقة المرسِل، REPORT-20))، و`rejected_reason` (`recipient`، `device_reported`، `rechecked_block`). وفهرس `uq_wti (transfer_id, device_id)`. والبند `pending` يحجز جهازه (§7.8)، ويُعاد فحصه بحارس الحيازة عند القبول |

### 10.13 `tenant_member_invites` — دعوات الموظفين (K-04)
**قياسية** · **RLS** (`tenant_id`) · **الاحتفاظ:** مقترح جديد في 21 «دعوات الموظفين وإعادة تعيينهم» (§17.5) · **الفئة:** `sensitive` · **المتطلبات:** SHOP-05، IMPORTER-02، STORE-12، RESTRICT-06، [التصميم التقني §8.15](19-technical-design.md)

الدعوة تحمل بيانات المدعو قبل أن يكون له حساب أو عضوية، لكل أنواع المستأجرين.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → tenants |
| tenant_kind | text | لا | `shop`، `importer`، `supplier`، `courier` |
| invited_phone_e164 | text | لا | موبايل سوري |
| invited_phone_bidx #️⃣ | bytea | لا | — |
| invited_name | text | لا | — |
| invited_document_type | text | لا | كـ `persons.document_type` |
| invited_national_id_enc 🔐 | bytea | لا | — |
| invited_national_id_bidx #️⃣ | bytea | لا | بمدخل `persons.document_bidx`، للمطابقة عند التفعيل وفحص `person_ban` و`staff_bar` |
| invited_national_id_mask | text | لا | — |
| role | text | لا | `employee`، أو `manager` لمندوبي جهة الشحن، أو `staff` للمورّد |
| permissions | text[] | لا | من قائمة نوع المستأجر ([التصميم التقني §5.5](19-technical-design.md))، والمدفوعة تظهر رمادية وتُمنح |
| branch_ids | uuid[] | نعم | للمحل |
| token_hash | bytea | لا | فريد، رابط التفعيل لمرة واحدة |
| expires_at | timestamptz | لا | ⚙️ 72 ساعة (`shop.member_invite.ttl`، مهمة `tenancy.member_invite.expire`) |
| status | text | لا | `sent`، `accepted`، `expired`، `revoked` ([التصميم التقني §8.15](19-technical-design.md)) |
| invited_by_user_id | uuid | لا | — |
| accepted_user_id | uuid | نعم | FK → users: حساب بذلك الرقم، أو حساب يُنشأ عند التفعيل (`created_via = member_invite`) |
| accepted_at | timestamptz | نعم | — |
| mismatch_at | timestamptz | نعم | للحساب رقم وطني معلن أو موثّق مختلف: `SHOP_INVITE_IDENTITY_MISMATCH` وإشعار محايد للداعي |
| membership_id | uuid | نعم | العضوية التي أنشأها القبول (`pending_identity` حتى التوثيق) |

**الفهارس:** `uq_member_invite_token (token_hash)`، و`px_member_invite_open (tenant_id, invited_phone_bidx) WHERE status = 'sent'` فريد، و`px_member_invite_phone (invited_phone_bidx) WHERE status = 'sent'` لمطابقة الدعوة عند التسجيل (K-18). وإعادة دعوة الرقم نفسه بعد رفض أو انتهاء ممنوعة ⚙️ 30 يوماً.

### 10.14 `tenant_owner_periods` — فترات ملكية المستأجر (D-107)
**ثابتة** (مع `ended_at`) · **RLS** (`tenant_id`) · **الاحتفاظ:** RT-16 · **الفئة:** `personal` · **المتطلبات:** TENANT-06، SHOPWALLET-13، SHOPPRO-22، SUCCESSION-10، D-107

تغيير المالك **على السجل نفسه**: يبقى رقم المحل وتاريخه ومخزونه، ويُغلق صف المالك القديم ويُفتح صف للجديد في معاملة التنفيذ نفسها. وهذا الجدول مرجع المساءلة لكل معاملة في فترتها، ولعضوية المالك السابق `exit_only`.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → tenants |
| owner_user_id | uuid | لا | FK → users |
| owner_person_id | uuid | لا | FK → persons (يبقى بعد إغلاق الحساب) |
| started_at | timestamptz | لا | التوثيق أو تنفيذ تغيير المالك |
| ended_at | timestamptz | نعم | — |
| start_reason | text | لا | `verification`، `owner_change`، `succession` (وريث مؤهل بقاعدة D-103) |
| end_reason | text | نعم | `owner_change`، `tenant_closed`، `tenant_revoked`، `owner_deceased` |
| change_request_id | uuid | نعم | FK → tenant_change_requests |
| wallet_id | uuid | نعم | FK → shop_wallets: محفظة هذه الفترة (المحفظة تُغلق بانتهاء الفترة وتُفتح جديدة للمالك الجديد) |
| accounting_choice | text | نعم | خيار المالك المنتهية فترته: `hand_over`، `keep` (§15.6) |

**الفهارس:** `px_owner_period_current (tenant_id) WHERE ended_at IS NULL` فريد، و`ix_owner_period_person (owner_person_id)`.

### 10.15 `printer_profiles` — ملفات الطابعات الحرارية (D-122)
**قياسية** · **RLS** (`tenant_id`) · **الاحتفاظ:** يتبع المستأجر، ويُحذف بحذف الملف · **الفئة:** `internal` · **المتطلبات:** SHOP-28، SHOP-10، D-122، [التصميم التقني §16.3](19-technical-design.md)

لكل طابعة مقترنة ملف بعرضها، والطباعة على أندرويد بـ Bluetooth ESC/POS، وعلى iOS بـ AirPrint أو مشاركة PDF. وقائمة الطرز المجرّبة اختيارية ⚙️ (`printing.tested_models`، 06 §15.2).

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → shops |
| branch_id | uuid | نعم | FK → shop_branches |
| user_device_id | uuid | نعم | FK → user_devices: الجهاز الذي اقترنت به |
| label | text | لا | — |
| model | text | نعم | الطراز كما يعلنه الجهاز أو يختاره المستخدم |
| tested_model | boolean | لا | ضمن القائمة المجرّبة، وإلا تحذير «طابعة غير مدعومة» مع بديل PDF |
| paper_width_mm | smallint | لا | `CHECK (paper_width_mm IN (58, 80))` |
| dots_per_line | smallint | لا | `CHECK ((paper_width_mm = 58 AND dots_per_line = 384) OR (paper_width_mm = 80 AND dots_per_line = 576))` |
| connection | text | لا | `bluetooth_escpos`، `airprint`، `pdf_share` |
| last_test_print_at | timestamptz | نعم | — |
| is_default | boolean | لا | — |
| removed_at | timestamptz | نعم | — |

**الفهارس:** `px_printer_default (tenant_id, user_device_id) WHERE is_default AND removed_at IS NULL` فريد.

## 11. التنبيهات وبوابة الأمن

### 11.1 `security_alerts` — التنبيهات
**قياسية** · **نطاق الأمن** · **المتطلبات:** ADMIN-08، ADMIN-09، TELCO-03، TELCO-08، PP-05، SMART-06، SERIAL-05، D-85

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| type | text | لا | `shop_check_hit`، `purchase_attempt`، `sale_attempt`، `repair_intake_attempt`، `stolen_board`، `individual_check_hit`، `network_usage`، `duplicate_imei`، `far_operation`، `dismantled_reappeared`، `relinquished_reappeared`، `gsma_listed_purchase`، `counterfeit_purchase`، `card_invalid`، `civil_unused_lookups`، `registration_attempt`، `anomaly`، `wallet_anomaly`، `topup_anomaly`، `stock_device_reported` (جهاز في مخزون محل أو وكيل صار مبلّغاً عنه)، `repair_device_reported`، `store_line_withheld`، `importer_row_reported` (`ROW_REPORTED`)، `possible_laundering`، `shared_identifier_report` |
| priority | text | لا | `urgent`، `normal` |
| device_id | uuid | نعم | FK → devices |
| report_id | uuid | نعم | FK → reports |
| source_type | text | لا | — |
| source_id | uuid | لا | — |
| check_id | uuid | نعم | FK~ → imei_checks |
| subject_tenant_id | uuid | نعم | المحل أو الوكيل المعني (الجدول غير معزول بـ RLS، §1.2) |
| telecom_event_id | uuid | نعم | FK~ → telecom_events |
| governorate_id | smallint | نعم | لنطاق الأمن |
| status | text | لا | نموذج WORK: `new`، `in_progress`، `referred`، `closed` ([التصميم التقني §8.15](19-technical-design.md)) |
| follow_up_due_at | timestamptz | نعم | `referred` بمؤقّت متابعة ⚙️ 30 يوماً |
| report_ended_at | timestamptz | نعم | البلاغ لم يعد نافذاً: يُغلق إدارياً (RSN-ALR-07) ويُعلَّم «انتهى» في البوابة |
| assigned_admin_id | uuid | نعم | — |
| admin_due_at | timestamptz | نعم | بساعات الدوام |
| police_acknowledged_by_user_id | uuid | نعم | — |
| police_acknowledged_at | timestamptz | نعم | — |
| closed_at | timestamptz | نعم | — |
| close_note | text | نعم | — |
| dedup_key | text | لا | فريد، يمنع تكرار التنبيه للمصدر نفسه |

**الفهارس:** `ix_alerts_queue (status, priority, created_at)`، و`ix_alerts_gov (governorate_id, created_at)`، و`ix_alerts_device (device_id)`.

### 11.2 ملاحظات التنبيهات والإحالات والشذوذ
**المتطلبات:** ADMIN-10، SMART-06، 14 §4

| الجدول | الأعمدة |
|---|---|
| `alert_notes` (ثابتة) | `alert_id` FK، و`author_type` (`admin`، `police`)، و`author_id`، و`body` |
| `police_referrals` (قياسية) | `report_id`، و`device_id`، و`pdf_file_id`، و`recipient text`، و`recipient_unit_id` FK، و`channel` (`portal`، `official_letter`، `email`، `in_person`، `other`)، و`sent_by_admin_id`، و`sent_at`، و`follow_up_due_at` (⚙️ 30 يوماً وقائمة متابعة أسبوعية)، و`outcome`، و`outcome_recorded_at`، و`correction_sent_at` (رسالة تصحيح محايدة بعد عكس قبول البلاغ) |
| `police_referral_alerts` | `referral_id`، و`alert_id`، وPK مركّب |
| `anomaly_detections` (ثابتة) | `rule_key`، و`subject_type`، و`subject_id`، و`window_start`، و`window_end`، و`metric numeric`، و`threshold numeric`، و`alert_id` FK |

### 11.3 `police_units` — الجهات الأمنية
**قياسية** · **المتطلبات:** PP-01، PP-03، PP-05، D-58، D-80

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| kind | text | لا | `central`، `governorate_command` |
| name | text | لا | — |
| scope_all | boolean | لا | الإدارة المركزية |
| governorate_ids | smallint[] | نعم | نطاق المحافظات. `CHECK (scope_all OR governorate_ids IS NOT NULL)` |
| alert_phone_e164 | text | نعم | رقم الجهة لتنبيهات واتساب (PP-05). والجهة المعلّقة تذهب رسائل تنبيهها إلى هاتف الإدارة المركزية |
| network_allowlist | cidr[] | نعم | ⚙️ حصر الشبكات |
| status | text | لا | `active`، `suspended` |
| created_by_admin_id | uuid | لا | — |
| creation_notice_sent_at | timestamptz | نعم | إشعار معلوماتي لجهة الإدارة المركزية في الوزارة عند الإنشاء (لا موافقة، D-102) |

### 11.4 `police_stations` — الأقسام
**قياسية** · **المتطلبات:** PP-10، D-63

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| unit_id | uuid | لا | FK → police_units |
| name | text | لا | يظهر لصاحب الجهاز المضبوط |
| governorate_id | smallint | لا | — |
| area_id | int | نعم | — |
| address | text | لا | — |
| phone_e164 | text | نعم | — |
| active | boolean | لا | — |

### 11.5 `police_users` — عناصر الأمن
**قياسية** · **المتطلبات:** PP-01، PP-02، PP-13

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| unit_id | uuid | لا | FK → police_units |
| station_id | uuid | نعم | FK → police_stations |
| full_name | text | لا | — |
| rank_title | text | نعم | — |
| employee_number | text | لا | فريد ضمن الجهة |
| username | citext | لا | فريد |
| password_hash | text | لا | — |
| role | text | لا | `unit_admin`، `officer` |
| status | text | لا | `invited`، `active`، `suspended`، `disabled` |
| created_by_police_user_id | uuid | نعم | — |
| created_by_admin_id | uuid | نعم | — |
| failed_login_count | smallint | لا | — |
| locked_until | timestamptz | نعم | — |
| authz_version | int | لا | — |
| last_login_at | timestamptz | نعم | — |

**الفهارس:** `uq_police_users_emp (unit_id, employee_number)`.

وأعمدة الدخول والحضور كحسابات الإدارة (§5.1): `mfa_policy` (WebAuthn إلزامي لمسؤول الأمن ولكل من يبحث بالرقم الوطني أو يكشف أو يصدّر أو يتتبّع، D-125)، و`ip_allowlist` (إلزامية لمن يدخل بـ TOTP)، و`away_from` و`away_until`، و`disabled_reason` (ومنه `inactivity` بعد ⚙️ 60 يوماً)، و`nid_search_allowed_from` (حساب مسؤول الأمن الجديد لا يبحث بالرقم الوطني قبل ⚙️ 24 ساعة من إنشائه).

### 11.6 نطاق الأمن والقضايا والبحث
**المتطلبات:** PP-03، PP-07، DATAACCESS-02، PRIV-05، D-80

| الجدول | الأعمدة |
|---|---|
| `police_scope_links` (ثابتة) | `subject_type` (`report`، `device`، `alert`)، و`subject_id`، و`governorate_id`، و`reason` (`incident`، `alert`، `shop`، `seizure`). وفهرس `uq_scope_links (subject_type, subject_id, governorate_id)` |
| `police_case_refs` (قياسية) | `unit_id` FK، و`case_number` (يطابق التعبير ⚙️)، و`status` (`open`، `closed`)، و`opened_by_user_id`، و`closed_by_user_id`، و`closed_at`، و`secrecy_extended_until`، و`secrecy_extensions smallint` (حتى 2 ⚙️). وفهرس `uq_case (unit_id, case_number)` |
| `police_case_lookups` (ثابتة) | `police_user_id` FK، و`unit_id`، و`case_ref_id` FK، و`national_id_enc 🔐`، و`national_id_bidx #️⃣`، و`reason_text`، و`result_count`. وفهرس `ix_case_lookups_user_time (police_user_id, created_at)` لحصص البحث |

### 11.7 المضبوطات وطلبات التعليق
**نطاق الأمن** · **المتطلبات:** PP-09، PP-10، PP-11، D-63

| الجدول | الأعمدة |
|---|---|
| `seized_devices` (قياسية) | `device_id` FK، و`unit_id` FK، و`station_id` FK (يُنقل لقسم نشط إن عُطّل قسمه ويُعاد إشعار المالك)، و`police_user_id` FK، و`case_ref_id`، و`seized_at`، و`entered_identifier`، و`match_kind` (`reported`، `registered`، `unknown`)، و`purpose` (`return_to_owner` الافتراضي، `evidence_hold` صامت للمالك وإلزامي إن ضُبط من مالكه المسجّل، `unclaimed_deposit` للمسلَّم متروكاً أو مفقوداً، C-05)، و`source_repair_job_id` FK (المسلَّم من محل صيانة)، و`report_id`، و`owner_person_id`، و`notify_recipient_person_id` (المالك المسجّل الحالي، وإلا المبلّغ، وإلا الرقم الوطني المربوط، ولمخزون محل صاحبه)، و`governorate_id`، و`status` (`held`، `owner_notified`، `returned`، `released`، [التصميم التقني §8.18](19-technical-design.md))، و`owner_notified_at`، و`reminders_sent smallint` (تذكيران بعد ⚙️ 7 و30 يوماً)، و`unit_followup_due_at` (⚙️ 90 يوماً: «جهاز مضبوط لم يُستلم»)، و`returned_at`، و`returned_to_name`، و`returned_to_person_id` (المالك المسجّل وحده، بعد حسم أي ادعاء منافس)، و`return_police_user_id`، و`release_reason` (`court_order`، `handed_to_other_party`، `destroyed_by_authority`، `unclaimed_per_law`)، و`released_at`، و`released_to_name`، و`release_police_user_id`، و`release_case_ref`. **والإفراج لا يغيّر الملكية**: عنصر عمل إداري يطلب الوثيقة الرسمية، والتصحيح بـ REVERSAL-03 وحده (P-2). وفي `held` و`owner_notified` قيد `held_by_authority` على الجهاز (§5.9) |
| `seizure_bulk_checks` (ثابتة) | `police_user_id`، و`unit_id`، و`file_id`، و`total`، و`reported_count`، و`registered_count`، و`unknown_count`، و`result_file_id` |
| `police_shop_suspension_requests` (قياسية) | `subject_tenant_id` FK (الجدول غير معزول بـ RLS، §1.2)، و`police_user_id`، و`unit_id`، و`case_ref_id`، و`reason_text`، و`status` (`pending`، `executed`، `rejected`)، و`handled_by_admin_id`، و`handled_at`، و`decision_reason` |

## 12. التكاملات

### 12.1 `telecom_operators` — شركات الاتصالات
**قياسية** · **المتطلبات:** TELCO-11، 06 §15.3، C-12

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| code | text | لا | فريد: `syriatel`، `mtn`، `regulator` |
| name | text | لا | — |
| kind | text | لا | `operator`، `regulator_hub` |
| mode | text | لا | `live`، `simulator`، `disabled`. **إعداد بيئة من البنية كرمز لا من اللوحة** (N-08)، تعرضه اللوحة للقراءة. وفي مخطط الإنتاج `CHECK (mode IN ('live','disabled'))`. والفعّال = المفتاح `on` **و**الوضع `live` |
| toggle_key | text | لا | FK → feature_toggles: **المفتاح هو المفتاح التجاري الوحيد** للتكامل |
| config | jsonb | لا | الإعدادات غير السرية: الوجهات المجهّزة في البنية كرمز للاختيار بينها فقط. **والمهل في `settings` وحدها** (`integration.<partner>.<op>_timeout`)، لا هنا |
| vault_ref | text | لا | مسار الأسرار في الخزنة، لا الأسرار نفسها |
| capabilities | jsonb | لا | المراقبة، والحظر، والموقع، وسجل الشريحة، وإيقاف الخط، والتعبئة |

### 12.2 `telecom_list_states` و`telecom_list_entries` — قوائم المراقبة والحظر
**المتطلبات:** TELCO-01، TELCO-05..07، TELCO-09، TELCO-10، REVERSAL-04

`telecom_list_states` يحفظ الحالة المطلوبة والمؤكدة لكل (جهاز، شركة، قائمة)، و`telecom_list_entries` (اسمه من التصميم المبدئي) هو الطلبات الفردية.

| الجدول | الأعمدة |
|---|---|
| `telecom_list_states` | `device_id`، و`operator_id`، و`list_type` (`watch`، `block`)، وPK مركّب، و`desired` (`present`، `absent`)، و`confirmed` (`present`، `absent`، `unknown`)، و`ever_sent boolean` (استلمت الشركة يوماً بيانات هذا الجهاز: فكل تغيير مطلوب لاحق يُكتب لها ولو أُطفئ تكاملها، E-01)، و`last_entry_id`، و`updated_at` |
| `telecom_list_entries` (قياسية) | `device_id` FK، و`operator_id` FK، و`list_type`، و`action` (`add`، `remove`)، و`identifiers text[]` (أرقام IMEI لحظة الطلب)، و`report_id`، و`priority` (`critical`: الحظر بعد أول استخدام ونهاية تأجيل الحظر وكل حذف أو فك لبلاغ انتهى، `normal`: إضافة مراقبة لبلاغ مقبول، `bulk`: التحميل الأول والاستيراد وإعادة الإرسال بالمطابقة والتصحيح الجماعي، E-14)، و`bulk_batch_id`، و`status` (`pending`، `held` (الشركة غير `live`، ولا يُحسب وقته من المحاولات ولا المهل، ولا يُلغى أبداً)، `sent`، `confirmed`، `failed`، `superseded`، [التصميم التقني §8.15](19-technical-design.md))، و`attempts`، و`next_attempt_at`، و`external_ref`، و`last_error`، و`sent_at`، و`confirmed_at`. وفهرس `px_tle_open (device_id, operator_id, list_type) WHERE status IN ('pending','held','sent')` فريد، و`px_tle_dispatch (priority, next_attempt_at) WHERE status = 'pending'` |

### 12.3 `block_holds` — تأجيل الحظر
**قياسية** · **المتطلبات:** TELCO-06، PP-06

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| report_id | uuid | لا | FK → reports |
| requested_by_type | text | لا | `admin`، `police` |
| requested_by_id | uuid | لا | — |
| police_request_ref | text | نعم | — |
| case_ref_id | uuid | نعم | — |
| reason_text | text | لا | — |
| hold_until | timestamptz | لا | — |
| status | text | لا | `active`، `ended` (نموذج TIMED_GRANT) |
| ended_reason | text | نعم | `expired`، `block_requested`، `report_closed`، `integration_off` |
| ended_at | timestamptz | نعم | — |

### 12.4 `telecom_events` — أحداث الشبكة
**ثابتة** · **مقسّم** شهرياً بـ `received_at` · **المتطلبات:** TELCO-02، TELCO-03، TELCO-08، TELCO-11

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `received_at` |
| received_at | timestamptz | لا | — |
| operator_id | uuid | لا | FK → telecom_operators |
| inbound_message_id | uuid | لا | FK → ops.inbound_messages (التكرار يُمنع هناك) |
| external_event_id | text | لا | — |
| type | text | لا | `usage`، `duplicate_imei` |
| imei | text | لا | — |
| device_id | uuid | نعم | — |
| msisdn_enc 🔐 | bytea | نعم | رقم الشريحة |
| msisdn_bidx #️⃣ | bytea | نعم | — |
| imsi_enc 🔐 | bytea | نعم | — |
| imsi_bidx #️⃣ | bytea | نعم | — |
| observed_at | timestamptz | لا | — |
| has_location | boolean | لا | النقطة في `geo_private.telecom_location_updates` |
| plausibility_flag | text | نعم | `no_active_report` (لا بلاغ نافذ أو الحدث خارج فترة النفاذ: لا تنبيه ولا حظر ولا دفع للأمن، E-12)، `stale_event` (أقدم من ⚙️ 24 ساعة لبلاغ نافذ: عنصر عمل لا تنبيه حي)، `owner_sim` (شريحة رقم المبلّغ: يُؤجَّل الحظر الآلي ⚙️ 24 ساعة) |
| processed_at | timestamptz | نعم | — |
| alert_id | uuid | نعم | — |

**الفهارس:** `ix_tev_device (device_id, observed_at)`، و`ix_tev_msisdn (msisdn_bidx)`.

### 12.5 سجل الشريحة وإيقاف الخط
**المتطلبات:** TELCO-12، OWN-16، LINE-01..03، D-60

| الجدول | الأعمدة |
|---|---|
| `telecom_sim_history_queries` (قياسية) | `operator_id` FK، و`device_id` FK، و`imei`، و`msisdn_enc 🔐`، و`msisdn_bidx #️⃣`، و`purpose` (`self_registration`، `conflict`، `dispute`)، و`purpose_ref_id`، و`requested_by_admin_id`، و`answer` (`yes`، `no`، `unknown`، `error`)، و`first_used_at date`، و`answered_at` |
| `line_suspension_requests` (قياسية) | `report_id` FK، و`operator_id` FK، و`msisdn_enc 🔐`، و`msisdn_bidx #️⃣`، و`owner_person_id`، و`requested_by_user_id`، و`requested_via` (`owner`، `trusted_contact`، `support`)، و`status` (`requested`، `held`، `sent`، `executed`، `reinstated`، `rejected`، `failed`؛ و`held` ما دام المزوّد غير `live`)، و`attempts`، و`external_ref`، و`sent_at`، و`executed_at`، و`reinstated_at` (إعادة التشغيل بشريحة بدل ضائع LINE-02، وهي أحد إثباتات استعادة الرقم الأصلي في [التصميم التقني §4.2.7](19-technical-design.md))، و`report_closed_notified_at`، و`last_error` |

### 12.6 `tracking_sessions` و`tracking_session_extensions` — جلسات التتبّع
**نطاق الأمن** · **المتطلبات:** TRACK-05، TELCO-13، PP-06

| العمود (`tracking_sessions`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | FK → devices |
| report_id | uuid | لا | FK → reports |
| block_hold_id | uuid | لا | FK → block_holds |
| opened_by_type | text | لا | `admin`، `police` |
| opened_by_id | uuid | لا | — |
| police_request_ref | text | نعم | — |
| case_ref_id | uuid | نعم | — |
| reason_text | text | لا | — |
| status | text | لا | `pending_start`، `active`، `ended`، `failed` |
| started_at | timestamptz | نعم | — |
| ends_at | timestamptz | لا | 72 ساعة ⚙️ |
| extensions_count | smallint | لا | — |
| ended_at | timestamptz | نعم | — |
| end_reason | text | نعم | `expired`، `blocked`، `report_closed`، `stopped`، `failed`، `integration_off` (مع بقاء تأجيل الحظر وإشعار الأمن) |
| interval_minutes | smallint | لا | 10 ⚙️ |
| governorate_id | smallint | نعم | — |

**الفهارس:** `px_tracking_active (device_id) WHERE status IN ('pending_start','active')` فريد.

`tracking_session_extensions` (ثابتة): `session_id` FK، و`extended_by_type`، و`extended_by_id`، و`reason_text`، و`old_ends_at`، و`new_ends_at`.

### 12.7 `civil_registry_queries` — استعلامات السجل المدني
**ثابتة** · **مقسّم** شهرياً بـ `created_at` · **RLS** (`tenant_id` إدراج فقط للواجهة العامة) · **المتطلبات:** CIVIL-01..09، D-38، D-84

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| type | text | لا | `match`، `name`، `photo`، `card_status` |
| national_id_enc 🔐 | bytea | لا | — |
| national_id_bidx #️⃣ | bytea | لا | — |
| purpose | text | لا | `identity_review`، `shop_purchase`، `shop_sale`، `repair_intake`، `on_behalf`، `recovery`، `reverify`، `succession` (حالة الوفاة عند الربط) |
| purpose_ref_type | text | لا | — |
| purpose_ref_id | uuid | لا | المعاملة الجارية أو طلب التوثيق |
| requested_by_type | text | لا | `admin`، `shop_member`، `system` |
| requested_by_id | uuid | نعم | — |
| tenant_id | uuid | نعم | — |
| result | text | لا | `match`، `no_match`، `name_only_mismatch` (CIVIL-10)، `found`، `not_found`، `valid`، `lost`، `cancelled`، `deceased`، `error`، `unavailable` |
| external_ref | text | نعم | — |
| latency_ms | int | نعم | — |
| tx_completed | boolean | نعم | لتعليم CIVIL-08 |
| flagged_at | timestamptz | نعم | — |

**الفهارس:** `ix_civil_tenant_time (tenant_id, created_at)`، و`ix_civil_requester_time (requested_by_id, created_at)`. ولا عمود للصورة إطلاقاً (CIVIL-06).

### 12.8 GSMA والجمركة
**المتطلبات:** GSMA-01..05، CUSTOMS-01..04، FAKE-01

| الجدول | الأعمدة |
|---|---|
| `gsma_cache` | `imei` PK، و`listed boolean`، و`detail jsonb`، و`fetched_at`، و`expires_at` (24 ساعة ⚙️) |
| `gsma_shares` (قياسية) | `report_id` FK، و`device_id` FK، و`imei`، و`action` (`share`، `unshare`)، و`channel` (`operator`، `regulator`)، و`operator_id`، و`status` (`pending`، `sent`، `confirmed`، `failed`)، و`attempts`، و`sent_at`، و`confirmed_at` |
| `customs_cache` | `imei` PK، و`registered boolean`، و`registered_on date`، و`fetched_at`، و`expires_at` (24 ساعة ⚙️) |
| `customs_feed_runs` (ثابتة) | `started_at`، و`finished_at`، و`records`، و`devices_created`، و`mismatches`، و`status` (`running`، `completed`، `failed`) |

### 12.9 المحافظ وطلبات التجميد
**المتطلبات:** WALLET-01..04، PAY-01، D-61

| الجدول | الأعمدة |
|---|---|
| `wallet_providers` (قياسية) | `code` فريد، و`name`، و`kind` (`wallet`، `bank`)، و`enabled`، و`supports_freeze`، و`supports_payment_api`، و`supports_shop_wallet` (شام كاش، D-89)، و`mode` (إعداد بيئة للقراءة في اللوحة كـ `telecom_operators.mode`)، و`agreement_ref`، و`config jsonb` (دون مهل)، و`vault_ref`، و`display_order` |
| `wallet_freeze_requests` (قياسية) | `report_id` FK، و`provider_id` FK، و`msisdn_enc 🔐`، و`msisdn_bidx #️⃣`، و`owner_person_id`، و`requested_by_user_id`، و`requested_via`، و`status` (`requested`، `held`، `sent`، `executed`، `rejected`، `failed`)، و`attempts`، و`external_ref`، و`sent_at`، و`executed_at`، و`report_closed_notified_at`، و`last_error` |

## 13. الإشعارات والدعم والإكمال بالتطبيق والإطلاق والتصحيح والالتزام

### 13.1 قوالب الرسائل
**المتطلبات:** NOTIF-02، SMART-01، [كتالوج المحتوى](24-content-catalog.md)

| الجدول | الأعمدة |
|---|---|
| `message_templates` (قياسية) | `key` فريد (`T-WA-NN`، `T-SMS-NN`...)، و`channel` (`whatsapp`، `sms`، `push`، `inapp`، `email`، `telegram`، `pdf`)، و`name`، و`category` (`authentication`، `utility`، `marketing`)، و`sender` (`platform`، `support`، `commercial`، `shoppro_system`)، و`mandatory_channel boolean` (القنوات الإلزامية للحدث: الرموز، ولحظة السرقة، والأمن، والقانونية، تُعلن في الكود. وللمدير العام تعطيل قناة **غير إلزامية** لحدث بأرشفة قالبها فيتخطاها الإرسال إلى البديل، N-21)، و`wa_template_name`، و`meta_status` (`draft`، `submitted`، `approved`، `rejected`، `paused`)، و`current_version_id`، و`enabled`. والمفتاح ومتغيراته يملكها الكود، والنص يملكه التشغيل (§17.7) |
| `message_template_versions` (ثابتة) | `template_id` FK، و`version_no`، و`body`، و`variables jsonb`، و`status` (`draft`، `published`، `archived`)، و`created_by_admin_id`، و`published_by_admin_id`، و`published_at` |

### 13.2 `notifications` — الإشعارات
**ثابتة** (مع `read_at`) · **مقسّم** شهرياً بـ `created_at` · **الاحتفاظ:** RT-36 · **الفئة:** `personal` · **المتطلبات:** NOTIF-01..10، NOTIF-04، THEFT-02، THEFT-03، SHOPPRO-14، D-42، D-85، D-101، [التصميم التقني §9.6](19-technical-design.md)

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| recipient_type | text | لا | `user`، `person`، `admin_group`، `police_unit`، `phone_only` |
| user_id | uuid | نعم | — |
| person_id | uuid | نعم | — |
| police_unit_id | uuid | نعم | — |
| target | text | لا | `primary`، `alternate`، `unit_phone`، `admin_phone`، `security_email` (فئة `security` وحدها، D-126)، `telegram` (لمن ربطه)، `email` (إيميل الفاتورة الاختياري)، `inapp_only`. والعنوان الفعلي يُحل لحظة الإرسال |
| rule_id | text | لا | قاعدة الإشعار في موجّه الإشعارات ([التصميم التقني §9.6](19-technical-design.md)) |
| template_key | text | لا | — |
| template_version_id | uuid | نعم | FK → message_template_versions، الإصدار المرسل |
| category | text | لا | `otp`، `security`، `transactional`، `third_party` (رسالة يطلقها شخص لرقم غيره، بحصة وردّ «أوقف»)، `digest`، `commercial`، `shop_message` (رسالة المحل لزبونه) |
| sender | text | لا | `platform`، `support`، `commercial`، `shoppro_system` |
| payload | jsonb | نعم | متغيرات القالب المسموحة بفئة الحمولة فقط (FF-27): **لا رمز تحقق أبداً** (يقرؤه المرسل من خانة مؤقتة، H-01)، ولا بيانات حساسة جداً (CT-32)، ولا شيء من المحاسبة. `CHECK (sender <> 'shoppro_system' OR payload IS NULL)` |
| payload_enc 🔐 | bytea | نعم | لـ `shoppro_system` وحده: متغيرات رسالة المحل لزبونه مشفّرة بمفتاح بيانات المحل (D-101، MC-02)، **وتُمحى حين يبلغ التسليم حالة نهائية** |
| payload_key_ref | text | نعم | مرجع مفتاح المحل في `shoppro.tenant_data_keys` |
| recipient_hash | bytea | نعم | بصمة المستلم وحدها لرسائل المحل (لا رقم ولا اسم في سجل الرسائل) |
| quota_class | text | نعم | `third_party_message` لحصة المستلم ([التصميم التقني §3.8](19-technical-design.md)) |
| inapp | boolean | لا | يظهر في مركز الإشعارات |
| read_at | timestamptz | نعم | — |
| priority | text | لا | `urgent`، `normal` |
| scheduled_for | timestamptz | نعم | رسائل الإدارة خارج الدوام (D-85) |
| dedup_key | text | نعم | — |
| related_type | text | نعم | — |
| related_id | uuid | نعم | — |

**الفهارس:** `px_notif_inbox (user_id, created_at DESC) WHERE inapp`، و`px_notif_scheduled (scheduled_for) WHERE scheduled_for IS NOT NULL`.

### 13.3 `notification_deliveries` — التسليمات
**ثابتة** (مع تحديث الحالة) · **مقسّم** شهرياً · **المتطلبات:** NOTIF-03، NOTIF-07، SMART-09، SMART-10

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| notification_id | uuid | لا | FK مركّب `(notification_id, notification_created_at)` → notifications |
| notification_created_at | timestamptz | لا | — |
| channel | text | لا | `whatsapp`، `sms`، `push`، `email`، `telegram`، `inapp` |
| provider | text | لا | — |
| attempt_no | smallint | لا | — |
| status | text | لا | `queued`، `sent`، `delivered`، `read`، `failed` |
| provider_message_id | text | نعم | — |
| error_code | text | نعم | — |
| fallback_of_id | uuid | نعم | التحويل من واتساب إلى SMS |
| sent_at | timestamptz | نعم | — |
| delivered_at | timestamptz | نعم | — |
| failed_at | timestamptz | نعم | — |
| next_retry_at | timestamptz | نعم | — |

**الفهارس:** `ix_deliv_provider_msg (provider, provider_message_id)`، و`px_deliv_retry (next_retry_at) WHERE status='queued'`. وتسليمات فئة `otp` الفاشلة لا تُعاد من موظف ولا تدخل الرسائل الميتة بمحتوى (H-01)، وسجل الرسائل في اللوحة يعرض لفئتي `otp` و`security` ولرسائل المحل القالب والقناة والحالة فقط.

### 13.4 `check_notification_windows` — تجميع إشعار الفحص
**المفتاح:** `device_id` · **المتطلبات:** NOTIF-04، D-42، CT-51

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| device_id | uuid | لا | PK |
| report_id | uuid | لا | — |
| window_started_at | timestamptz | لا | — |
| window_ends_at | timestamptz | لا | 6 ساعات ⚙️ |
| hits_count | int | لا | — |
| last_wa_sent_at | timestamptz | نعم | — |

### 13.5 الدعم الفني
**المتطلبات:** SUPPORT-01..07، D-82

| العمود (`support_tickets`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| ticket_number | text | لا | فريد، `ST-YYYY-NNNNNN` |
| requester_user_id | uuid | نعم | — |
| requester_name | text | نعم | اسم مرسل نموذج «تواصل معنا» (2 إلى 80 حرفاً، K-25) |
| requester_phone_e164 | text | نعم | لطلبات واتساب الدعم |
| channel | text | لا | `app`، `web`، `whatsapp`، `contact_form`، `admin_created` |
| category | text | لا | FK → support_categories (قائمة تُدار، SUPPORT-09، N-21). البذور: `account`، `report`، `shop`، `ownership`، `payment`، `privacy`، `settlement`، `succession`، `other` |
| description | text | لا | — |
| status | text | لا | `new`، `in_progress`، `awaiting_user`، `resolved`، `closed` |
| priority | text | لا | — |
| assigned_admin_id | uuid | نعم | — |
| routed_queue | text | لا | `support`، `reports`، `shops`، `commercial`، `privacy` |
| linked_report_id | uuid | نعم | — |
| linked_device_id | uuid | نعم | — |
| linked_transaction_id | uuid | نعم | — |
| linked_tenant_id | uuid | نعم | — |
| account_number_claimed | text | نعم | من محادثة واتساب الدعم |
| sla_due_at | timestamptz | نعم | المهلة لكل تصنيف ⚙️ |
| first_response_at | timestamptz | نعم | — |
| resolved_at | timestamptz | نعم | — |
| autoclose_at | timestamptz | نعم | 7 أيام ⚙️ |
| closed_at | timestamptz | نعم | — |
| close_reason | text | نعم | `confirmed`، `auto_no_reply`، `duplicate`، `abuse`، `recovery_completed`، `account_closed` |
| error_refs | text[] | نعم | مراجع الأخطاء `ER-` التي ذكرها صاحب الطلب، فيبحث عنها الدعم ضمن هذا الطلب وحده (`ops.error_refs`، N-09) |
| rating | smallint | نعم | `CHECK (rating BETWEEN 1 AND 5)` |
| rating_comment | text | نعم | — |

**الفهارس:** `ix_tickets_queue (routed_queue, status, sla_due_at)`، و`ix_tickets_requester (requester_user_id)`، و`px_tickets_open_requester (requester_user_id) WHERE status NOT IN ('closed')` لحد ⚙️ 3 طلبات مفتوحة (SUPPORT-08).

| الجدول | الأعمدة |
|---|---|
| `support_messages` (ثابتة) | `ticket_id` FK، و`author_type` (`requester`، `agent`، `system`)، و`author_id`، و`body`، و`is_internal boolean` (ملاحظة لا يراها المستخدم)، و`file_ids uuid[]`، و`read_by_requester_at` |
| `canned_replies` (قياسية) | `key` فريد، و`title`، و`body`، و`category`، و`active` |
| `support_categories` (قياسية، المفتاح `key`) | قائمة تُدار من اللوحة (`support.categories.manage`، N-21): `key` PK (لا يتغير)، و`label_content_key`، و`routed_queue` (`support`، `reports`، `shops`، `commercial`، `privacy`)، و`sla_setting_key` (مفتاح المهلة في 06 §15)، و`sort`، و`active` (يُتقاعد ولا يُحذف). وكل تعديل في `catalog_changes` |

### 13.6 `handoff_tokens` — الإكمال بالتطبيق
**قياسية** · **المتطلبات:** HANDOFF-01..04، D-79، CT-61

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| user_id | uuid | نعم | FK → users. فارغ في الاستعادة بالهوية |
| recovery_id | uuid | نعم | FK → account_recoveries (HANDOFF-02: لا جلسة في الاستعادة). `CHECK ((user_id IS NULL) <> (recovery_id IS NULL))` |
| step | text | لا | `id_capture`، `live_photo`، `selfreg_photos`، `shop_purchase`، `shop_sale`، `repair_intake`، `evidence_capture`، `return_photos`، `recovery_id_capture` |
| context_type | text | لا | — |
| context_id | uuid | لا | — |
| token_hash | bytea | لا | فريد، سر QR بطول 128 بت |
| short_code_hash | bytea | لا | الرمز القصير |
| web_session_id | uuid | نعم | جلسة الموقع المصدرة، أو فارغ لصفحة الاستعادة دون جلسة |
| status | text | لا | `issued`، `claimed`، `completed`، `expired`، `cancelled` |
| claimed_by_user_device_id | uuid | نعم | فارغ عند المسح دون دخول في الاستعادة |
| claimed_at | timestamptz | نعم | — |
| completed_at | timestamptz | نعم | — |
| expires_at | timestamptz | لا | 10 دقائق ⚙️ |
| failed_attempts | smallint | لا | 5 تلغيه |
| result | jsonb | نعم | معرّفات الملفات أو المعاملة |

**الفهارس:** `uq_handoff_token (token_hash)`، و`px_handoff_short (short_code_hash) WHERE status IN ('issued','claimed')`.

### 13.7 التجريب والإطلاق
**المتطلبات:** ROLLOUT-01..05، D-18

| الجدول | الأعمدة |
|---|---|
| `rollout_invites` (قياسية، الاحتفاظ مقترح جديد في 21: المستهلكة والمنتهية + ⚙️ 90 يوماً، K-15) | `phone_e164`، و`invitee_kind` (`citizen`، `shop`، `importer`، `police`، `supplier`)، و`governorate_id`، و`invited_by_admin_id`، و`status` (`active`، `consumed`، `revoked`، `expired`)، و`consumed_by_user_id`، و`consumed_at`، و`expires_at`، و`note`. وفهرس `px_invites_active (phone_e164) WHERE status='active'` فريد |
| `governorate_activations` (قياسية، المفتاح `governorate_id`) | `shop_obligation_active boolean`، و`activated_at`، و`activated_by_admin_id`، و`reason_text` |
| `governorate_activation_changes` (ثابتة) | `governorate_id`، و`new_state boolean`، و`changed_by_admin_id`، و`reason_text` |
| `pilot_metric_snapshots` (ثابتة) | `captured_at`، و`metric_key`، و`value numeric`، و`target numeric`، و`governorate_id` |

### 13.8 `reversal_requests` — تصحيح القرارات
**قياسية** · **المتطلبات:** REVERSAL-01..05

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| decision_type | text | لا | `report_accept`، `report_reject`، `report_close`، `identity_approve`، `identity_reject`، `tenant_verify`، `tenant_suspend`، `tenant_revoke`، `selfreg_approve`، `selfreg_reject`، `held_tx_reject`، `dispute_decision`، `account_suspend`، `account_ban`، `device_merge`، `ownership_correction` ([التصميم التقني §8.12](19-technical-design.md)) |
| ref_type | text | نعم | سند التصحيح: `court_order` (حكم يتحقق المحامي من صحته، وحجز LH-5)، `official_document` (إفراج جهة رسمية)، `legal_agent`، `employee_fraud` |
| ref_file_id | uuid | نعم | FK → files |
| target_type | text | لا | — |
| target_id | uuid | لا | — |
| original_audit_id | uuid | لا | سطر التدقيق للقرار الأصلي |
| original_decider_type | text | لا | — |
| original_decider_id | uuid | لا | — |
| requested_outcome | text | لا | من النتائج المسموحة ([التصميم التقني §8.12](19-technical-design.md)) |
| reason_text | text | لا | — |
| evidence_file_ids | uuid[] | نعم | — |
| requested_by_admin_id | uuid | لا | — |
| status | text | لا | `requested`، `approved`، `rejected`، `withdrawn`، `executed`، `failed` |
| approved_by_admin_id | uuid | نعم | `CHECK` يختلف عن الطالب، وعن صاحب القرار حين يكون موظفاً، **إلا** قرار اتخذه المدير العام وحده (الحظر، والإلغاء النهائي للمحل) فيعتمده المدير العام (D-102) |
| rejected_target_changed | boolean | لا | الرفض لأن الهدف تغيّر منذ الطلب (سبب `target_changed`)، عند الاعتماد أو التنفيذ |
| approved_at | timestamptz | نعم | — |
| rejection_reason | text | نعم | — |
| executed_at | timestamptz | نعم | — |
| execution_summary | jsonb | نعم | — |
| last_error | text | نعم | — |

### 13.9 `compliance_reports` — تقارير التزام المحلات
**قياسية** · **المتطلبات:** COMPLIANCE-01..03، D-57

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| period_start | date | لا | — |
| period_end | date | لا | — |
| governorate_id | smallint | لا | — |
| status | text | لا | `generated`، `under_review`، `approved`، `sent` |
| metrics | jsonb | لا | من جداول السجل فقط، **ولا شيء من `shoppro`** (SHOPPRO-14) |
| pdf_file_id | uuid | لا | — |
| xlsx_file_id | uuid | لا | — |
| reviewed_by_admin_id | uuid | نعم | — |
| approved_at | timestamptz | نعم | — |
| sent_at | timestamptz | نعم | — |
| sent_channel | text | نعم | — |
| recipient | text | نعم | — |
| regenerated_from_id | uuid | نعم | — |

**الفهارس:** `uq_compliance_period (governorate_id, period_start) WHERE regenerated_from_id IS NULL`.

### 13.10 `shop_compliance_status` — حالة التزام المحل لنفسه
**قياسية** · **RLS** (`tenant_id`) · **المتطلبات:** COMPLIANCE-04

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | PK، FK → shops |
| status | text | لا | `all_recorded` (كل عملياته مسجّلة)، `gaps` (نواقص يراها)، `under_review` (ملاحظة من الإدارة قيد المتابعة) |
| open_items | jsonb | لا | النواقص بأعدادها ومراجعها للمحل نفسه فقط: معاملات منتهية دون إكمال، وأجهزة في مخزونه دون معاملة خروج، وطلبات تصحيح معلّقة |
| admin_note | text | نعم | ملاحظة الإدارة (`compliance.shop_note.write`) |
| admin_note_by_admin_id | uuid | نعم | لا يُعرض للمحل إلا «الإدارة» |
| admin_note_at | timestamptz | نعم | — |
| last_report_id | uuid | نعم | FK → compliance_reports، آخر تقرير شمله |
| last_report_period_end | date | نعم | ما يراه المحل: تاريخ آخر تقرير شمله، دون التقرير نفسه |
| computed_at | timestamptz | لا | مهمة `compliance.shop_status.refresh` |

لا مقارنة بمحلات أخرى ولا ترتيب، ولا يرى المحل التقرير المرسل للوزارة.

### 13.11 `kpi_reports` — التقرير الدوري للمؤشرات
**قياسية** · **المتطلبات:** SMART-15، D-22

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| period_month | date | لا | أول يوم من الشهر، فريد مع `regenerated_from_id IS NULL` |
| metrics | jsonb | لا | **أرقام مجمّعة فقط**: الفحوص، والبلاغات وزمن مراجعتها بساعات الدوام، والأجهزة المستردة، والتزام المحلات، وصحة التكاملات. من دور `reporting_ro`، ولا شيء من `shoppro`، ولا أي بيانات شخصية |
| pdf_file_id | uuid | لا | — |
| xlsx_file_id | uuid | لا | — |
| status | text | لا | `generated`، `sent` |
| sent_by_admin_id | uuid | نعم | المدير العام (`kpi.report.send`) |
| sent_at | timestamptz | نعم | — |
| sent_channel | text | نعم | — |
| recipient | text | نعم | الوزارة |
| regenerated_from_id | uuid | نعم | — |

ولا صفحة إحصاءات عامة تقرأ من هذا الجدول (D-22).

### 13.12 `notification_recipient_blocks` — «لا أعرف هذا الشخص — أوقف» (G-05)
**ثابتة** (مع `lifted_at`) · **الاحتفاظ:** مقترح جديد في 21 «حجب المستلمين» (مدة الحجب ثم ⚙️ 90 يوماً) · **الفئة:** `personal` (بصمات فقط) · **المتطلبات:** NOTIF-08، NOTIF-09، RESTRICT-03، [التصميم التقني §3.8](19-technical-design.md)

كل رسالة يطلقها شخص لرقم غيره (دعوة جهة موثوقة أو وصي أو موظف، أو طلب نقل) تحمل ردّاً سريعاً «لا أعرف هذا الشخص — أوقف» يحجب الزوج. والقيد المقابل على المرسل صف `restrictions` من نوع `recipient_block`، و⚙️ 3 حجوب في 30 يوماً تنشئ قيد `invites`.

| العمود | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| sender_person_id | uuid | نعم | FK → persons، الشخص المرسل (والحجب يتبع الشخص لا الحساب) |
| sender_user_id | uuid | نعم | FK → users |
| recipient_phone_bidx #️⃣ | bytea | لا | بصمة الرقم المستلم، ولا رقم صريح |
| source_notification_id | uuid | نعم | FK~ → notifications |
| blocked_at | timestamptz | لا | — |
| until | timestamptz | لا | ⚙️ 180 يوماً (`notifications.recipient_block`) |
| lifted_at | timestamptz | نعم | — |

**الفهارس:** `px_recipient_block_active (sender_person_id, recipient_phone_bidx) WHERE lifted_at IS NULL` فريد، و`ix_recipient_block_sender_time (sender_person_id, blocked_at)` لعدّ الحجوب.

## 14. الخدمات التجارية (مخطط `commerce`)

كل الجداول هنا خلف مفاتيح التشغيل التجارية ([التصميم التقني §14.3](19-technical-design.md))، ولا يصل إليها دور بوابة الأمن (D-83). والشراء من التطبيقين للخدمات الرقمية غير ممكن (D-86). **وكل حركة مال نسخة من نمط المال الموحّد** (MONEY_OP، [التصميم التقني §11.5](19-technical-design.md)): المعلّق ومهلة حسمه، ومرجع عدم التكرار، والتأكيد بالاستعلام لا بالإشعار الوارد، والمطابقة، و**التصحيح بعملية مرتبطة** (`corrects_id`) لا بتعديل صف نهائي، والمال غير المخصّص، والإعادة الآلية (`void`) قبل بدء الخدمة أو تأكيد الطلب (D-116) مقابل الاسترداد بأربع عيون. وكل المبالغ أعداد صحيحة بالوحدة الرسمية الحالية مع `currency` (§1.2، D-118)، ولا أجور توصيل منفصلة لطلبات المتجر (D-117).

### 14.1 الباقات والاستحقاق (D-93)
**الاحتفاظ:** RT-41 · **الفئة:** `internal` · **المتطلبات:** PAY-09، PAY-10..16، SHOPPRO-01، SHOPWALLET-01، BIZAPI-03، D-109، D-111..D-114

| الجدول | الأعمدة |
|---|---|
| `features` (المفتاح `key`، يملكه الكود) | `key` PK، و`name_ar`، و`kind` (`compliance`، `paid_eligible`)، و`limit_type` (`none`، `count`)، و`depends_on text[]` (مثل `shop.topup` ← `shop.wallet`، تفرضه اللوحة)، و`description`. والبذور في §17.6 |
| `packages` (قياسية، يملكها التشغيل) | `code` فريد، و`name_ar`، و`audience` (`shop`، `business_api`)، و`is_free boolean` (**لا تنكمش أبداً**: الخادم يرفض حذف ميزة منها أو خفض حدودها، `PACKAGE_FREE_CANNOT_SHRINK`)، و`monthly_price_minor`، و`yearly_price_minor`، و`currency`، و`trial_days smallint` ⚙️، و`status` (`draft`، `active`، `archived`)، و`successor_package_id` FK ذاتي (إلزامي عند الأرشفة لباقة لها مشتركون: يُجدَّد إليها، PAY-16)، و`approved_by_admin_id` |
| `package_features` | `package_id` FK، و`feature_key` FK، وPK مركّب، و`limit_value int` (مثل عدد الفروع). ومحفّز يرفض ميزة `compliance` |
| `shop_subscriptions` (قياسية، RLS `tenant_id`) | `tenant_id` FK، و`package_id` FK، و`package_snapshot jsonb` (الميزات والحدود لحظة التفعيل، P-13)، و`period` (`monthly`، `yearly`، `trial`)، و`status` (`trial`، `queued`، `active`، `grace`، `expired`، `cancelled`، [التصميم التقني §8.11 ج](19-technical-design.md))، و`starts_at` (للمدفوع أثناء التجربة = `ends_at` للتجربة دون فجوة ولا سماح)، و`ends_at` (الشهري = اليوم نفسه من الشهر التالي محصوراً بآخر الشهر، والسنوي = التاريخ نفسه من السنة التالية، بالوقت المحلي لدمشق)، و`grace_until` (`PAUSABLE` ما دام تجديد `awaiting_payment` قُدّم رقم دفعته قبله)، و`queued_after_id` FK ذاتي، و`upgraded_from_id` FK ذاتي (D-114)، و`activated_by_admin_id`، و`last_activation_id`، و`reminder_sent_at`، و`cancel_cause` (`platform`، `violation`، `customer`، `tenant_closed`: يقرر الاسترجاع حسب D-111)، و`read_only_until` (المحاسبة ⚙️ 12 شهراً بعد الانتهاء أو الإلغاء)، و`read_only_paused_at` (تتوقف المدة ما دام الوصول مستحيلاً بسبب المنصة، `hard_off`). وفهرس `px_shop_sub_live (tenant_id) WHERE status IN ('trial','active','grace')` فريد، و`px_shop_sub_queued (tenant_id) WHERE status = 'queued'` فريد. **ومدة الاشتراك تستمر أثناء تعليق المحل** (D-112)، والأيام تُعاد آلياً إن أُلغي التعليق بالتصحيح لأنه خطأ (`subscription_adjustments`) |
| `api_subscriptions` (قياسية) | `api_client_id` FK، و`package_id`، و`package_snapshot`، و`status` (`trial`، `queued`، `active`، `grace`، `expired`، `cancelled`)، و`starts_at`، و`ends_at`، و`grace_until`، و`quota jsonb` (الحصة الشهرية والمعدل) |
| `trial_grants` (ثابتة، D-113) | التجربة **مرة واحدة لكل محل ولكل صاحب محل برقمه الوطني ولكل رخصة**، عبر كل الباقات: `tenant_id` FK، و`owner_person_id` FK، و`license_no_norm`، و`package_id` FK، و`subscription_id` FK، و`granted_at`، و`granted_without_payment_by_admin_id` (الاستثناء الوحيد: تفعيل المدير العام دون دفعة بسبب). وثلاثة فهارس فريدة: `uq_trial_tenant (tenant_id)`، و`uq_trial_owner (owner_person_id)`، و`uq_trial_license (license_no_norm)`، والرفض `PACKAGE_TRIAL_USED`. وتغيير المالك لا يمنح تجربة جديدة |
| `subscription_adjustments` (ثابتة) | كل تغيير في مدة اشتراك قائم **بلا حركة مال**: `subscription_id` FK، و`tenant_id`، و`kind` (`days_restored`: أيام تعليق خاطئ أُلغي بالتصحيح D-112، `upgrade_conversion`: الأيام الباقية بنسبة سعري اليوم `floor(أيام × سعر القديمة ÷ سعر الجديدة)` D-114، `platform_extension`: تمديد اختاره الزبون لأيام فقدها بسبب المنصة D-111)، و`days_delta int`، و`from_package_id`، و`to_package_id`، و`old_ends_at`، و`new_ends_at`، و`cause_ref_type` (`reversal_request`، `toggle_hard_off`، `service_order`)، و`cause_ref_id`، و`created_by_type`، و`created_by_id`، و`reason_code`. وحدث `billing.subscription.days_restored` أو `.upgraded` |

### 14.2 الطلبات والمدفوعات والتفعيل (D-86)
**الاحتفاظ:** RT-41 · **الفئة:** `personal` · **المتطلبات:** PAY-01..18، HISTORY-03، ADS-04، BIZAPI-03، STORE-16، STORE-17، D-111، D-116

| العمود (`service_orders`، قياسية، RLS `tenant_id` إن وُجد) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| order_number | text | لا | فريد، `SV-YYYY-NNNNNN` |
| kind | text | لا | `package`، `history_report`، `ad_campaign`، `bizapi_plan` |
| subject_type | text | لا | `user`، `tenant`، `api_client` |
| user_id | uuid | نعم | — |
| tenant_id | uuid | نعم | — |
| api_client_id | uuid | نعم | — |
| package_id | uuid | نعم | — |
| period | text | نعم | `monthly`، `yearly` |
| target_ref_type | text | نعم | الحملة أو التقرير |
| target_ref_id | uuid | نعم | — |
| amount_minor | bigint | نعم | يُحدد عند التسعير. `CHECK (amount_minor IS NULL OR amount_minor > 0)` |
| currency | char(3) | نعم | — |
| paid_minor | bigint | لا | مجموع الدفعات المؤكدة المرتبطة: الطلب يصير `paid` حين يبلغ المبلغ، والناقص يعرض «مدفوع X من Y» |
| partial_expires_at | timestamptz | نعم | إن لم يكتمل الناقص خلال ⚙️ 7 أيام يُعاد المدفوع لمصدره آلياً (`payment_voids`)، والزائد ينشئ طلب استرداد للفرق |
| channel | text | لا | `web_request_button`، `admin_whatsapp` |
| status | text | لا | `requested`، `awaiting_payment`، `paid`، `activated`، `expired`، `cancelled`، `refunded` ([التصميم التقني §8.11 أ](19-technical-design.md)) |
| expires_at | timestamptz | نعم | ⚙️ 7 أيام للطلب من الموقع بصنف `BUSINESS_FLOOR` (لا ينقضي قبل نهاية يوم الدوام الخامس) |
| paid_payment_id | uuid | نعم | — |
| activated_at | timestamptz | نعم | — |
| created_by_admin_id | uuid | نعم | — |
| cancel_reason | text | نعم | — |

| العمود (`payments`، قياسية، RLS `tenant_id` إن وُجد) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| purpose_type | text | لا | `service_order`، `store_order`، `unallocated` (مال بلا مطابقة نظيفة: بلا مرجع، أو مبلغ خاطئ، أو لطلب ملغى، أو لحساب مغلق أو محل ملغى، MC-03) |
| service_order_id | uuid | نعم | — |
| store_order_id | uuid | نعم | — |
| payer_type | text | لا | `user`، `tenant`، `api_client` |
| user_id | uuid | نعم | — |
| tenant_id | uuid | نعم | — |
| api_client_id | uuid | نعم | — |
| method | text | لا | `wallet_reference`، `bank_transfer`، `wallet_api`، `cash_on_delivery`، `shop_wallet` |
| provider_id | uuid | نعم | FK → wallet_providers |
| amount_minor | bigint | لا | `CHECK (amount_minor > 0)` |
| currency | char(3) | لا | — |
| status | text | لا | `initiated`، `pending_confirmation`، `pending_collection`، `collected`، `confirmed`، `rejected`، `failed`، `expired`، `disputed`، `written_off` (عجز المندوب بموافقة المدير العام)، `cancelled` (فشل التسليم نهائياً أو إلغاء الطلب)، `unallocated`، `allocated`، `refunded`، `partially_refunded` ([التصميم التقني §8.11 ب](19-technical-design.md)) |
| statement_line_ref | text | نعم | سطر كشف الحساب المستلم الذي سُجّل منه المال غير المخصّص |
| allocated_to_type | text | نعم | `service_order`، `store_order` |
| allocated_to_id | uuid | نعم | — |
| allocated_at | timestamptz | نعم | — |
| allocated_by_admin_id | uuid | نعم | `billing.unallocated.allocate` |
| unallocated_escalated_at | timestamptz | نعم | **لا يُصادر أبداً**: بعد ⚙️ 90 يوماً يُصعَّد للمدير العام والمحاسب |
| reference_raw | text | نعم | الرقم المرجعي كما أدخله الزبون أو المشرف |
| reference_normalized | text | نعم | — |
| provider_ref | text | نعم | — |
| wallet_operation_id | uuid | نعم | للدفع من محفظة المحل |
| courier_collection_id | uuid | نعم | للدفع عند الاستلام |
| confirmed_by_admin_id | uuid | نعم | — |
| confirmed_at | timestamptz | نعم | — |
| rejected_reason | text | نعم | — |
| reconciled_by_admin_id | uuid | نعم | يختلف عن المفعِّل (CT-53) |
| reconciled_at | timestamptz | نعم | — |

**الفهارس:** `px_payments_reference (method, reference_normalized) WHERE reference_normalized IS NOT NULL` فريد، و`ix_payments_status (status, created_at)`، و`px_payments_unallocated (created_at) WHERE status = 'unallocated'`.

| الجدول | الأعمدة |
|---|---|
| `refunds` (قياسية) | **الاسترداد التقديري بأربع عيون** (D-102، D-116): `payment_id` FK، و`return_id` FK، و`amount_minor` (`CHECK (amount_minor > 0)`، ومحفّز مؤجل: Σ المسترد لكل دفعة ≤ المدفوع)، و`cause` (`platform` إطفاء أو عطل طويل أو خطأ: تمديد أو استرجاع نسبي باختيار الزبون، `customer_cancel`، `tenant_closed` (الشهري بلا استرجاع والسنوي ما بقي من أشهر كاملة)، `overpayment`، `order_cancel_after_confirm`، `store_return`، `line_cancel`، D-111)، و`basis` (`pro_rata_days`، `remaining_full_months`، `full`، `difference`)، و`customer_choice` (`refund`، `extend`)، و`reason_text`، و`status` (`requested`، `approved`، `rejected`، `paid`)، و`prefilled boolean` (عنصر معبّأ آلياً عند إلغاء طلب مدفوع بعد تأكيده)، و`requested_by_admin_id`، و`approved_by_admin_id` (المدير العام)، و`approved_at`، و`escalated_at` (المعتمد غير المدفوع ينبّه بعد ⚙️ يومي دوام)، و`paid_reference`، و`paid_at`. و`CHECK (approved_by_admin_id <> requested_by_admin_id)` |
| `payment_voids` (قياسية، D-116) | **الإعادة الآلية** للمبلغ نفسه إلى المصدر نفسه قبل بدء أي التزام خدمة (طلب مدفوع مسبقاً أُلغي قبل تأكيده، أو خدمة أُلغيت قبل تفعيلها، أو دفعة ناقصة انقضت مهلتها): ليست استرداداً ولا موافقات فيها، مدقّقة: `payment_id` FK، و`amount_minor` (`CHECK (amount_minor > 0)`، ويُحسب في Σ المسترد)، و`currency`، و`cause` (`order_cancelled_before_confirm`، `service_cancelled_before_activation`، `partial_payment_expired`، `paid_after_cancel`)، و`cause_ref_type`، و`cause_ref_id`، و`status` (نمط MONEY_OP: `initiated`، `pending`، `succeeded`، `failed`، `under_investigation`)، و`wallet_operation_id` (للمصدر محفظة المحل)، و`provider_ref`، و`executed_by_admin_id` (للمصادر اليدوية: تنفيذ التحويل دون قرار)، و`executed_at`. وحدث `billing.void.completed` |
| `service_activations` (ثابتة) | `service_order_id` FK، و`payment_id` FK فريد (فارغ للتفعيل دون دفعة)، و`subject_type`، و`subject_id`، و`kind`، و`target_ref_type`، و`target_ref_id`، و`period_start`، و`period_end`، و`payment_reference`، و`without_payment boolean`، و`reason_text`، و`activated_by_admin_id` (PAY-07) |
| `commercial_invoices` (قياسية، RLS `billed_tenant_id`) | `invoice_number` فريد (`IN-YYYY-NNNNNN`، عدّاد بلا فجوات)، و`kind` (`service`، `store_order`، `bizapi_usage`، `ad`، `credit_note`: مستند منفصل للاسترداد الكلي أو الجزئي بعد التسليم)، و`credits_invoice_id` FK ذاتي (للإشعار الدائن)، و`voided_at`، و`service_order_id`، و`store_order_id`، و`billed_type`، و`billed_tenant_id`، و`billed_user_id`، و`billed_api_client_id`، و`billed_name`، و`supplier_name` (STORE-08)، و`lines jsonb`، و`subtotal_minor`، و`tax_minor`، و`total_minor`، و`currency`، و`verification_code_id`، و`pdf_file_id`، و`issued_at`، و`status` (`issued`، `voided`: الإلغاء قبل التسليم برقمها نفسه، وإلغاء سطر يعيد إصدارها)، و`void_reason`. وحدثا `billing.invoice.voided` و`billing.credit_note.issued` يرحّلان القيود العكسية في محاسبة المحل آلياً (D-101) |

### 14.3 المورّدون والمنتجات (D-87، D-88)
**الاحتفاظ:** RT-16 للمورّد، RT-41 للتجاري · **الفئة:** `internal` · **المتطلبات:** STORE-01..03، STORE-06، STORE-12، STORE-13، STORE-21، STORE-22

| العمود (`suppliers`، قياسية، المعرّف FK → tenants، RLS `id`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| supplier_code | text | نعم | فريد، `SP-NNNN` |
| legal_name | text | لا | — |
| display_name | text | لا | يظهر في الفاتورة |
| name_norm | text | لا | — |
| is_platform | boolean | لا | سجل المنصة نفسها لمنتجاتها |
| importer_tenant_id | uuid | نعم | FK → importers. وحده يستطيع عرض الأجهزة (STORE-13) |
| commercial_register_no | text | نعم | — |
| tax_number | text | نعم | حتى 30 حرفاً (K-06) |
| contact_name | text | لا | — |
| contact_phone_e164 | text | لا | موبايل أو أرضي (06 §16.5) |
| contract_file_id | uuid | نعم | — |
| application_source | text | لا | `self_applied` (من الموقع، `tenant.apply`)، `created_by_commercial` (بعد التعاقد) (STORE-22) |
| status | text | لا | `pending_review`، `needs_changes`، `verified`، `rejected`، `withdrawn`، `suspended`، `closing`، `closed`، `revoked` (بلا قائمة انتظار) |
| closure_reason | text | نعم | `owner_request`، `revoked` |
| fraud_freeze_review_at | timestamptz | نعم | تجميد احتيال بقرار المدير العام على تسوية الأسطر بموعد مراجعة ⚙️ 30 يوماً قابل للتجديد |
| verified_by_admin_id | uuid | نعم | — |

| الجدول | الأعمدة |
|---|---|
| `supplier_users` (قياسية، RLS `tenant_id`) | `tenant_id` FK، و`user_id` FK، و`role` (`owner`، `staff`)، و`permissions text[]`، و`status` (`invited`، `active`، `suspended`، `removed`، `exit_only`)، و`invite_id` FK → tenant_member_invites |
| `supplier_payout_accounts` (قياسية، RLS `tenant_id`) | تغيير حساب الاستلام **مؤجّل بمهلة ومُعلن** (H-03، F-09): `tenant_id`، و`method` (`bank`، `sham_cash`، `syriatel_cash`، `mtn_cash`)، و`holder_name`، و`holder_national_id_bidx #️⃣` (المطابقة بالرقم الوطني لا بالاسم)، و`account_ref_enc 🔐`، و`account_ref_mask`، و`status` (`pending_verification` (تحويل اختباري)، `prepared` (المشرف التجاري)، `approved` (المدير العام، أربع عيون)، `active` (بعد ⚙️ 72 ساعة، مهمة `store.payout_account.activate`)، `retired`، `objected` («لم أكن أنا» في أي خطوة يجمّد التغيير والتسويات)، [التصميم التقني §8.15](19-technical-design.md))، و`test_transfer_ref`، و`verified_out_of_band_at`، و`requested_by_user_id`، و`prepared_by_admin_id`، و`approved_by_admin_id`، و`active_from`، و`objected_at`، و`retired_at`. و`CHECK (approved_by_admin_id <> prepared_by_admin_id)`، وفهرس `px_payout_active (tenant_id) WHERE status='active'` فريد، و`px_payout_pending (tenant_id) WHERE status IN ('pending_verification','prepared','approved')` فريد |
| `supplier_commission_rules` (قياسية، RLS `supplier_tenant_id` للقراءة) | `supplier_tenant_id` FK، و`category_id` FK فارغ (للمورّد كله)، و`share_bp int` (حصة المنصة بنقاط الأساس ⚙️، `CHECK (share_bp BETWEEN 0 AND 10000)`)، و`effective_from`، و`effective_to`، و`agreement_ref`، و`set_by_admin_id` |
| `supplier_categories` (RLS `supplier_tenant_id`، K-06) | `supplier_tenant_id` FK، و`category_id` FK → product_categories، وPK مركّب. الأصناف التي يبيعها المورّد، وتُعدَّل بطلب تعديل |
| `supplier_delivery_areas` (RLS `supplier_tenant_id`، K-06) | `supplier_tenant_id` FK، و`governorate_id` FK، و`area_id` FK فارغ (المحافظة كلها)، و`active`. وقاعدة الدفع: كل سطر في الطلب يجب أن يخدم مورّده محافظة التوصيل (ومنطقتها إن وُجدت صفوف مناطق)، وإلا `STORE_DELIVERY_AREA_UNSUPPORTED`. **ولا عمود أجرة توصيل** (D-117). وفهرس `uq_supplier_area (supplier_tenant_id, governorate_id, area_id)` |
| `product_categories` (قياسية) | `parent_id` FK ذاتي، و`name_ar`، و`is_prohibited boolean` (D-70، D-99)، و`system_locked boolean` (لا يُحذف)، و`is_device_category boolean`، و`sort` |

| العمود (`products`، قياسية، RLS `supplier_tenant_id` للكتابة) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| supplier_tenant_id | uuid | لا | FK → suppliers |
| category_id | uuid | لا | FK → product_categories، ومحفّز يرفض قسماً ممنوعاً |
| name | text | لا | — |
| name_norm | text | لا | — |
| description | text | لا | — |
| image_file_ids | uuid[] | لا | في `public-assets` بعد الاعتماد |
| price_minor | bigint | لا | — |
| currency | char(3) | لا | — |
| stock_qty | int | لا | `CHECK (stock_qty BETWEEN 0 AND 100000)`، و`stock_qty >= reserved_qty`: لا يخفض المورّد المخزون تحت المحجوز |
| reserved_qty | int | لا | الكمية المحجوزة لطلبات قبل التسليم (تُخصم عند `new` وتُعاد عند الإلغاء أو فشل التسليم) |
| warranty_days | int | لا | مدة الكفالة ⚙️ (الافتراضي 0)، ومنها نافذة إرجاع `warranty` (MC-14) |
| recalled_at | timestamptz | نعم | «سحب منتج» بقرار المشرف: يُشعر المشترين ويقبل إرجاعه دون مهلة على حساب المورّد |
| current_revision_no | int | لا | آخر مراجعة معتمدة منشورة (§`product_revisions`) |
| compatible_badge | boolean | لا | «متوافق مع المنصة» |
| is_device | boolean | لا | `CHECK` بالمحفّز: المورّد وكيل (STORE-13) |
| status | text | لا | `draft`، `pending_review`، `published`، `rejected`، `removed` ([التصميم التقني §8.15](19-technical-design.md)) |
| reviewed_by_admin_id | uuid | نعم | — |
| reviewed_at | timestamptz | نعم | — |
| rejection_reason | text | نعم | — |
| deleted_at | timestamptz | نعم | — |

**الفهارس:** `ix_products_published (category_id) WHERE status='published'`، و`ix_products_name_norm` (trgm).

`product_revisions` (قياسية، RLS `supplier_tenant_id`، K-07): **التعديل بعد النشر مراجعة جديدة والنسخة المنشورة باقية حتى الاعتماد**: `product_id` FK، و`supplier_tenant_id`، و`revision_no`، و`snapshot jsonb` (الحقول القابلة للتعديل: الاسم والوصف والصور والسعر والصنف والكفالة)، و`status` (`pending_review`، `approved`، `rejected`)، و`reviewed_by_admin_id`، و`reviewed_at`، و`rejection_reason`. وفهرس `uq_product_revision (product_id, revision_no)`، و`px_product_revision_pending (product_id) WHERE status = 'pending_review'` فريد. والاعتماد ينسخ المراجعة ذرياً إلى `products` ويرفع `current_revision_no`، وتحديث الكمية لا يحتاج مراجعة، والسعر الجديد لا يمس `order_items` القائمة (لقطات).

### 14.4 طلبات المتجر والشحن والإرجاع
**RLS** (`buyer_tenant_id` أو `supplier_tenant_id`، والمورّد عبر العرض `commerce.v_supplier_orders`) · **الاحتفاظ:** RT-41 · **الفئة:** `personal` · **المتطلبات:** STORE-04، STORE-05، STORE-08..22، D-116، D-117

| العمود (`store_orders`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| order_number | text | لا | فريد، `OR-YYYY-NNNNNN` |
| buyer_tenant_id | uuid | لا | FK → tenants (محل أو وكيل) |
| buyer_user_id | uuid | نعم | — |
| supplier_tenant_id | uuid | لا | FK → suppliers (طلب واحد لكل مورّد) |
| channel | text | لا | `app_cart`، `web_cart`، `admin_whatsapp` |
| delivery_address | jsonb | لا | اسم المحل والعنوان والهاتف (ما يراه المورّد) |
| payment_method | text | لا | `cash_on_delivery` (يمنعه قيد `cod_blocked`، `STORE_COD_NOT_AVAILABLE`)، `wallet_reference`، `bank_transfer`، `shop_wallet` (يحتاج ميزة `store.wallet_payment`) |
| payment_id | uuid | نعم | — |
| subtotal_minor | bigint | لا | — |
| platform_share_minor | bigint | لا | كلفة التوصيل منها (D-117) |
| total_minor | bigint | لا | **لا أجرة توصيل منفصلة** في الطلب ولا الفاتورة. `CHECK (total_minor >= 0)` |
| currency | char(3) | لا | — |
| replacement_of_return_id | uuid | نعم | FK → returns: طلب استبدال مرتبط بسعر صفر (`returns.outcome = replace`) |
| status | text | لا | `new`، `confirmed`، `preparing`، `shipped`، `delivered`، `cancelled`، `returned` ([التصميم التقني §8.11 د](19-technical-design.md)). و`returned` حين تُسترد كل الأسطر وحدها |
| auto_cancel_at | timestamptz | نعم | `new` غير المؤكد: الأبعد من ⚙️ 48 ساعة ونهاية يوم الدوام الثاني (`BUSINESS_FLOOR`)، مع إعادة آلية للمسبق |
| confirmed_by_admin_id | uuid | نعم | — |
| confirmed_at | timestamptz | نعم | — |
| delivered_at | timestamptz | نعم | — |
| return_window_ends_at | timestamptz | نعم | 7 أيام ⚙️ |
| cancel_requested_at | timestamptz | نعم | طلب إلغاء من المحل بعد «قيد التجهيز» يقرّه المشرف التجاري |
| cancel_requested_by_user_id | uuid | نعم | — |
| cancelled_at | timestamptz | نعم | — |
| cancel_reason | text | نعم | — |
| commercial_invoice_id | uuid | نعم | — |
| created_by_admin_id | uuid | نعم | طلب من واتساب الإدارة |

**الفهارس:** `ix_orders_buyer (buyer_tenant_id, created_at DESC)`، و`ix_orders_supplier (supplier_tenant_id, status)`.

| الجدول | الأعمدة |
|---|---|
| `order_items` (ثابتة مع تحديث الإرجاع) | `order_id` FK، و`buyer_tenant_id`، و`supplier_tenant_id`، و`product_id` FK، و`product_revision_no` (لقطة)، و`name_snapshot`، و`unit_price_minor` (`>= 0`)، و`qty` (`> 0`)، و`cancelled_qty` (إلغاء سطر بموافقة المحل المسجّلة، يعيد إصدار الفاتورة)، و`line_total_minor`، و`share_bp` (لقطة)، و`warranty_days` (لقطة من المنتج)، و`returned_qty` (`CHECK (returned_qty + cancelled_qty <= qty)`: Σ المرتجع ≤ المسلّم)، و`settlement_eligible_at` (= `delivered_at` + مهلة الإرجاع ⚙️ 7 أيام، ويُؤجَّل ما دام عليه طلب إرجاع مفتوح) |
| `order_item_devices` | `order_item_id`، و`device_id`، وPK مركّب، و`buyer_tenant_id`، و`supplier_tenant_id`، و`assigned_at` (يعيّنها الوكيل بأرقامها عند `preparing` فتُحجز في `device_reservations`)، و`withheld_at` (صار الجهاز مبلّغاً عنه أو خرج من المخزون: لا يُسلَّم وتُخفض الفاتورة)، و`withheld_reason`. والتسليم ينقلها لمخزون المحل بنوع الحيازة `store_delivery` (STORE-13) |
| `couriers` (قياسية، المعرّف FK → tenants) | `name`، و`kind` (`company`، `platform_own`)، و`integration_mode` (`none`، `api`)، و`contact_phone_e164`، و`cash_cap_minor` ⚙️ حسب الاتفاقية، و`status` (`verified`، `suspended`، `revoked`) |
| `courier_users` (قياسية، RLS `tenant_id`) | `tenant_id` FK، و`user_id` FK، و`role` (`courier`، `manager`: مسؤول جهة الشحن يطلب حسابات مندوبيها ويعلّقها، F-33)، و`status` (`invited`، `active`، `suspended`، `removed`)، و`invite_id` FK → tenant_member_invites. والدخول من الموقع فقط |
| `shipments` (قياسية، RLS `courier_tenant_id` وطرفا الطلب للقراءة) | `order_id` FK، و`direction` (`delivery`، `return`: إعادة البضاعة من المحل إلى المورّد، F-26)، و`return_id` FK (لـ `return`)، و`courier_tenant_id` FK، و`courier_user_id`، و`status` (`created`، `ready_for_pickup`، `picked_up`، `out_for_delivery`، `delivered`، `delivery_failed`، `returned_to_supplier`، [التصميم التقني §8.11 د](19-technical-design.md))، و`attempts` (محاولة ثانية بعد فشل الأولى ⚙️، SOP-41)، و`cod_amount_minor` (يُخفض آلياً بأسطر محجوبة)، و`picked_up_at`، و`delivered_at`، و`failed_reason`، و`external_ref`. وفهرس `px_shipment_delivery (order_id) WHERE direction = 'delivery'` فريد، و`px_shipment_return (return_id) WHERE direction = 'return'` فريد |
| `shipment_codes` (قياسية، RLS `holder_tenant_id` فقط، ولا يقرؤه المندوب) | `shipment_id` FK، و`kind` (`pickup`: يعطيه المورّد للمندوب، أو المحل في شحنة الإرجاع، `delivery`: يعطيه المحل للمندوب، أو المورّد في شحنة الإرجاع، STORE-09)، و`holder_tenant_id`، و`code_enc 🔐` (للعرض في لوحة صاحبه حتى الاستخدام)، و`code_hash` (للتحقق)، و`attempts` (قفل بعد 5 ⚙️، `STORE_DELIVERY_CODE_LOCKED`)، و`used_at` (لمرة واحدة)، و`locked_at`، و`invalidated_at` (أعاد صاحبه توليد رمز جديد بإعادة تحقق فأبطل القديم). وفهرس `px_shipment_code_live (shipment_id, kind) WHERE invalidated_at IS NULL` فريد (CT-102) |
| `courier_collections` (قياسية، RLS `courier_tenant_id`) | `shipment_id` FK فريد، و`courier_tenant_id`، و`courier_user_id`، و`amount_minor` (`> 0`)، و`currency`، و`collected_at`، و`remittance_id` FK → courier_remittances، و`remitted_at`، و`reconciliation_run_id`، و`status` (`collected`، `remitted`، `reconciled`، `disputed`) |
| `courier_remittances` (قياسية، RLS `courier_tenant_id`، K-25) | تسليم المندوب النقد للمنصة بمرجع: `courier_tenant_id`، و`courier_user_id`، و`business_date`، و`amount_minor` (`> 0`)، و`currency`، و`reference`، و`status` (نمط MONEY_OP: `initiated`، `pending`، `succeeded`، `failed`، `under_investigation`)، و`confirmed_by_admin_id`، و`confirmed_at` |
| `returns` (قياسية، RLS الطرفان) | `return_number` فريد (`RN-YYYY-NNNNNN`)، و`order_id` FK، و`buyer_tenant_id`، و`supplier_tenant_id`، و`requested_by_user_id`، و`kind` (`standard` خلال ⚙️ 7 أيام من التسليم، `warranty` حتى نهاية `warranty_days`، `recall` لمنتج مسحوب دون مهلة، `missing_item` «صنف ناقص» بلا صورة يحسمه بيان المندوب)، و`reason_text`، و`photo_file_ids uuid[]` (التقاط حي بالكاميرا فقط، `files.purpose = return_photo`)، و`status` (`requested`، `approved_in_principle`، `rejected`، `awaiting_pickup`، `received`، `inspected`، `refunded`، `replaced`، `rejected_after_inspection`، `expired`، [التصميم التقني §8.11 هـ](19-technical-design.md))، و`outcome` (`refund`، `replace`)، و`pickup_due_at` (⚙️ 7 أيام من الموافقة المبدئية، وإلا `expired` وتعود الأسطر مؤهلة للتسوية)، و`return_shipment_id` FK → shipments، و`supplier_fault boolean` (العيب خصم في كشف المورّد التالي ولو بعد تسويات سابقة)، و`decided_by_admin_id`، و`decided_at`، و`refund_id` (يُنشأ عند `received` ونجاح الفحص فقط) |
| `return_items` (ثابتة) | `return_id` FK، و`order_item_id` FK، و`qty` (`> 0`)، و`amount_minor`. وأسطر الأجهزة تنتقل عند `received` بنقل عكسي بنوع `store_return` بعد إعادة الفحص، والجهاز المبيع لا يُرجَع (`STORE_RETURN_DEVICE_SOLD`) |

### 14.5 تسويات المورّدين (STORE-10)
**RLS** (`supplier_tenant_id`، والمورّد يرى الكشف من `prepared` للقراءة) · **الاحتفاظ:** RT-41 · **الفئة:** `internal` · **المتطلبات:** STORE-10، STORE-11، STORE-21، CT-103

| العمود (`supplier_settlements`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| settlement_number | text | لا | فريد، `SE-YYYY-NNNNN` |
| supplier_tenant_id | uuid | لا | FK → suppliers |
| period_start | date | لا | — |
| period_end | date | لا | أسبوعياً ⚙️ |
| opening_balance_minor | bigint | لا | الرصيد السالب المرحَّل من الكشف السابق (صفر أو سالب) |
| gross_minor | bigint | لا | أسطر انتهت مهلة إرجاعها فقط (`order_items.settlement_eligible_at`) |
| platform_share_minor | bigint | لا | — |
| returns_minor | bigint | لا | — |
| adjustments_minor | bigint | لا | — |
| net_minor | bigint | لا | يشمل الرصيد المرحَّل |
| carried_forward_minor | bigint | لا | إن كان الصافي سالباً: يُرحَّل كله للكشف التالي ولا يُحوَّل شيء (STORE-10) |
| currency | char(3) | لا | — |
| status | text | لا | `draft`، `prepared`، `approved`، `held` (تغيير حساب الاستلام معلّق أو في مهلته، فلا يُدفع لأي من الحسابين حتى التفعيل، `STORE_PAYOUT_CHANGE_PENDING`)، `paid`، `carried_forward` (صافٍ سالب أو صفر بلا تحويل)، `cancelled` ([التصميم التقني §8.11 هـ](19-technical-design.md)). `CHECK (status <> 'paid' OR net_minor > 0)` |
| held_reason | text | نعم | `payout_change_pending`، `payout_objected`، `fraud_freeze` |
| is_final | boolean | لا | كشف نهائي بعد آخر مهلة إرجاع أو كفالة عند إلغاء المورّد |
| prepared_by_admin_id | uuid | نعم | — |
| prepared_at | timestamptz | نعم | — |
| approved_by_admin_id | uuid | نعم | `CHECK (approved_by_admin_id <> prepared_by_admin_id)` |
| approved_at | timestamptz | نعم | — |
| payout_account_id | uuid | نعم | الحساب المعتمد النشط فقط |
| paid_reference | text | نعم | — |
| paid_at | timestamptz | نعم | — |
| pdf_file_id | uuid | نعم | — |

`settlement_lines` (ثابتة): `settlement_id` FK، و`supplier_tenant_id`، و`line_type` (`order_item`، `platform_share`، `return`، `defect`، `adjustment`، `carried_forward`)، و`order_item_id`، و`return_id`، و`amount_minor`، و`reason_code` (RSN-STL لسطر `adjustment`)، و`note`. وفهرس `px_settlement_item (order_item_id) WHERE line_type='order_item'` فريد (لا دفع مزدوج)، ومحفّز: سطر `adjustment` لا يتجاوز إرجاعه أو عيبه المرتبط.

`settlement_remarks` (ثابتة، RLS `supplier_tenant_id`، MC-17): ملاحظة المورّد على كشف `prepared`: `settlement_id` FK، و`supplier_tenant_id`، و`author_user_id`، و`body`، و`resolution` (`resolved`، `deferred`)، و`resolved_by_admin_id`، و`resolved_at`. ويحسمها المشرف أو يؤجلها قبل الإرسال للمدير العام، وبعد `paid` يفتح الاعتراض طلب دعم بتصنيف `settlement`.

`supplier_receivables` (قياسية، RLS `supplier_tenant_id`، MC-07): الرصيد السالب الباقي بعد الكشف النهائي لمورّد ملغى **ذمة مسجّلة** تطالب بها المنصة حسب العقد: `supplier_tenant_id`، و`settlement_id` FK، و`amount_minor` (`> 0`)، و`currency`، و`status` (نمط MONEY_OP: `initiated`، `pending`، `succeeded`، `failed`، `under_investigation`)، و`claimed_at`، و`settled_at`، و`note`.

### 14.6 محفظة المحل (D-89)
**RLS** (`tenant_id`) · **الاحتفاظ:** RT-51، RT-52 (رمز المحفظة والحدود)، RT-55 (ملفات المطابقة) · **الفئة:** `sensitive` للمراجع المشفّرة · **المتطلبات:** SHOPWALLET-01..08، D-100، D-115

| العمود (`shop_wallets`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | FK → shops. وفهرس `px_shop_wallet_live (tenant_id) WHERE status <> 'closed'` فريد: محفظة حية واحدة، وتغيير المالك يغلق القديمة ويفتح جديدة للمالك الجديد |
| owner_person_id | uuid | لا | FK → persons: صاحب المحل الذي فُتحت باسمه، ولا يتغير |
| provider_id | uuid | لا | FK → wallet_providers (شام كاش) |
| external_account_ref_enc 🔐 | bytea | نعم | رقم الحساب لدى شام كاش |
| external_account_mask | text | نعم | — |
| status | text | لا | **دورة الحياة وحدها**: `pending_activation`، `active`، `closed` ([التصميم التقني §8.11 ح](19-technical-design.md)). و`closed` بعد سحب الرصيد كله فقط، بفاعل النظام. أما التجميدات وتعليق المحل وفرق المطابقة والتجميد الخارجي والتأخير الأمني فهي **صفوف في `restrictions`** (§5.9: `wallet_admin_freeze`، `wallet_owner_freeze`، `wallet_not_me`، `wallet_recon_hold`، `wallet_external_freeze`، `cooldown`) يُرفع كل منها وحده، وإيقاف السحب (D-100) مفتاح تشغيل `emergency.wallet_withdrawal_stop` بمهلة. وقيم `frozen` و`held` و`suspended` و`external_frozen` القديمة لم تعد حالات |
| display_restriction | text | نعم | **إسقاط للعرض**: نوع القيد الأعلى أسبقية النافذ الآن، يعيد حسابه مستهلك أحداث القيود. لا يقرأه أي فحص صلاحية |
| closed_reason | text | نعم | `tenant_closed`، `tenant_revoked`، `owner_change` |
| closed_at | timestamptz | نعم | — |
| owner_deceased_at | timestamptz | نعم | وفاة صاحب المحل: يبقى المال لدى شام كاش باسم المحل ويُصرف للورثة بإجراءاتها، ويُعرض كذلك |
| unsettled_minor | bigint | لا | «مبلغ قيد التسوية» بعد عملية تصحيح لم يكفها الرصيد (الافتراضي 0): التعبئة والدفع مجمّدان إدارياً حتى يسوّيه صاحب المحل (SOP-47)، ولا يُقتطع آلياً من شحن وارد لاحق. `CHECK (unsettled_minor >= 0)` |
| pin_hash | text | نعم | Argon2id لرمز المحفظة (6 أرقام) |
| pin_failed_count | smallint | لا | — |
| pin_locked_until | timestamptz | نعم | بعد 5 ⚙️ |
| pin_set_at | timestamptz | نعم | — |
| balance_mirror_minor | bigint | نعم | **للعرض فقط**: ما أكدته شام كاش |
| currency | char(3) | لا | — |
| balance_synced_at | timestamptz | نعم | — |
| owner_destination_enc 🔐 | bytea | نعم | محفظة شام كاش باسم صاحب المحل |
| owner_destination_mask | text | نعم | — |
| owner_destination_match | text | نعم | `national_id` (مطابقة بالرقم الوطني لصاحب المحل أو بهوية KYC لدى شام كاش المربوطة به)، `name_only` (لم يطابق الشريك بالرقم الوطني: كل وجهة أول مرة تحتاج ⚙️ 72 ساعة واتصالاً راجعاً لرقم صاحب المحل) |
| owner_destination_verified_at | timestamptz | نعم | — |
| owner_destination_usable_from | timestamptz | نعم | بداية صلاحية الوجهة للسحب بعد المهلة عند `name_only` |
| alert_threshold_minor | bigint | نعم | حد التنبيه ⚙️ |
| activated_at | timestamptz | نعم | — |

| الجدول | الأعمدة |
|---|---|
| `wallet_member_limits` (RLS `tenant_id`) | `tenant_id`، و`member_id` FK، وPK مركّب، و`can_topup boolean`، و`can_pay boolean`، و`daily_topup_limit_minor` ⚙️، و`daily_pay_limit_minor`، و`updated_by_user_id`، و`updated_at` |
| `wallet_operation_refs` (جدول مفاتيح غير مقسّم، §1.4) | `provider_ref text` PK، و`operation_id`، و`created_at`: يمنع تكرار مرجع المزوّد عبر الأقسام. و`wallet_operation_client_refs` بالنمط نفسه: `(tenant_id, client_request_id)` PK لمرجع عدم التكرار من العميل |

| العمود (`wallet_operations`، ثابتة مع تحديث الحالة، **مقسّم** شهرياً) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| operation_number | text | لا | `WL-YYYY-NNNNNNNN` |
| tenant_id | uuid | لا | — |
| wallet_id | uuid | لا | FK → shop_wallets |
| type | text | لا | `fund_in`، `withdraw`، `topup_debit`، `topup_refund`، `store_payment`، `service_payment`، `payment_refund`، `void_return` (إعادة آلية D-116)، وعمليات التصحيح المرتبطة: `correction_debit`، `correction_credit`، `fund_in_reversal`، `topup_clawback` |
| direction | text | لا | `credit`، `debit` |
| amount_minor | bigint | لا | `CHECK (amount_minor > 0)` |
| currency | char(3) | لا | — |
| client_request_id | uuid | نعم | مرجع عدم التكرار للعمليات التي يبدؤها المحل (فريد عبر `wallet_operation_client_refs`) |
| corrects_id | uuid | نعم | FK~ → wallet_operations: العملية التي يصححها هذا الصف. **لا يتغير صف نهائي أبداً**، والتصحيح صف جديد بعد `billing.correction.approve`. `CHECK ((type IN ('correction_debit','correction_credit','fund_in_reversal','topup_clawback')) = (corrects_id IS NOT NULL))` |
| status | text | لا | `pending`، `succeeded`، `failed`، `refunded`، `under_investigation` ([التصميم التقني §8.11 و](19-technical-design.md)) |
| resolve_due_at | timestamptz | نعم | مهلة الحسم ⚙️ 24 ساعة (`wallet.pending.resolve`)، ثم `under_investigation` |
| reference_code | text | نعم | المرجع المعروض للدافع (رمز QR في نقطة البيع أو مرجع دفع طلب)، لمطابقة شحن وارد بالمرجع والمبلغ |
| initiated_by_user_id | uuid | نعم | فارغ للشحن الوارد |
| counterparty_ref_enc 🔐 | bytea | نعم | للشحن الوارد (`fund_in`): رقم محفظة شام كاش المرسِلة كما تبلّغه شام كاش |
| counterparty_ref_bidx #️⃣ | bytea | نعم | لعدّ المحافظ المرسِلة المختلفة يومياً في رصد الأنماط (SMART-06) دون فك التشفير |
| counterparty_mask | text | نعم | **ما يراه صاحب المحل:** رقم المرسِل مخفياً جزئياً واسمه بأحرفه الأولى إن أرسلته شام كاش. ولا يُعرض الرقم الكامل في أي واجهة للمحل |
| member_id | uuid | نعم | — |
| related_type | text | نعم | `topup_order`، `store_order`، `service_order` |
| related_id | uuid | نعم | — |
| reverses_operation_id | uuid | نعم | العملية التي تعكسها |
| provider_ref | text | نعم | — |
| provider_status | text | نعم | — |
| failure_code | text | نعم | — |
| settled_at | timestamptz | نعم | — |
| reconciliation_status | text | لا | `unreconciled`، `matched`، `diff`، `late_result` |
| reconciliation_run_id | uuid | نعم | — |
| destination_mask | text | نعم | للسحب: آخر 4 أرقام من وجهة صاحب المحل الموثّقة (تظهر في نص رمز التحقق مع المبلغ) |

**الفهارس:** `ix_wallet_ops_wallet (wallet_id, created_at DESC)`، و`px_wallet_ops_open (resolve_due_at) WHERE status IN ('pending','under_investigation')`، و`ix_wallet_ops_member_day (member_id, created_at)` لحدود الموظف، و`px_wallet_ops_corrects (corrects_id) WHERE corrects_id IS NOT NULL`، و`px_wallet_ops_ref (wallet_id, reference_code, created_at) WHERE reference_code IS NOT NULL` لمطابقة الشحن الوارد.

### 14.7 تعبئة الرصيد (D-89)
**الاحتفاظ:** RT-53 (الرقم)، RT-54 (السجل المالي)، RT-55 (ملفات المطابقة) · **الفئة:** `personal` للرقم المعبّأ · **المتطلبات:** TOPUP-01..06

| الجدول | الأعمدة |
|---|---|
| `topup_products` (قياسية) | `operator_code` (`syriatel`، `mtn`)، و`product_code`، و`kind` (`credit`، `bundle`)، و`name_ar`، و`face_value_minor`، و`price_minor`، و`shop_commission_bp` ⚙️ حسب الاتفاقية، و`active`، و`agreement_ref`. وفهرس `uq_topup_product (operator_code, product_code)` |
| `operator_prefixes` (المفتاح `prefix`، يملكه التشغيل، بذور §17.6) | `prefix text` PK (مثل `093`)، و`operator_code`، و`active`، و`review_flagged_at` (ردّت الشركة أن الرقم ليس من مشتركيها، فتُعلَّم البادئة للمراجعة دون إعادة الطلب على الشركة الأخرى)، و`updated_at` ⚙️. والتعديل عبر `catalog_changes` (§16.7) |

| العمود (`topup_orders`، قياسية، RLS `tenant_id`، **مقسّم** شهرياً) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| topup_number | text | لا | `TP-YYYY-NNNNNNN` |
| tenant_id | uuid | لا | — |
| member_id | uuid | لا | — |
| user_id | uuid | لا | المنفّذ |
| operator_code | text | لا | من البادئة |
| product_id | uuid | لا | FK → topup_products |
| msisdn_enc 🔐 | bytea | نعم | رقم الزبون، يُرسل لشركته وحدها. يُمحى عند الإخفاء |
| msisdn_bidx #️⃣ | bytea | نعم | لحد الرقم في الساعة (TOPUP-05) وطلب الزبون سجل تعبئاته. يُمحى عند الإخفاء |
| msisdn_mask | text | لا | ما يُعرض في الإيصال والكشف: مخفي جزئياً، وآخر 4 خانات فقط بعد الإخفاء |
| masked_at | timestamptz | نعم | تنفيذ RT-53: بعد ⚙️ سنة من التعبئة يُمحى `msisdn_enc` و`msisdn_bidx`، ويبقى السجل المالي (RT-54). `CHECK (masked_at IS NOT NULL OR msisdn_enc IS NOT NULL)` |
| face_value_minor | bigint | لا | — |
| debit_amount_minor | bigint | لا | القيمة ناقص العمولة |
| commission_minor | bigint | لا | ربح المحل (TOPUP-04). `CHECK (commission_minor >= 0 AND debit_amount_minor + commission_minor = face_value_minor)` |
| platform_commission_minor | bigint | نعم | حصة المنصة من عمولة الشركة، تُطابق مع كشف عمولة الشركة (MC-28) |
| status | text | لا | `pending`، `succeeded`، `failed`، `refunded`، `under_investigation` ([التصميم التقني §8.11 ز](19-technical-design.md)) |
| resolve_due_at | timestamptz | نعم | ⚙️ 24 ساعة دون حسم ثم `under_investigation` (`topup.pending.resolve`) |
| late_result_at | timestamptz | نعم | نتيجة متأخرة متعارضة بعد الحسم: لا تُسقط ولا تحرّك مالاً، بل فرق مطابقة `late_result` ثم تصحيح مرتبط بعد الاعتماد |
| wallet_operation_id | uuid | نعم | الخصم |
| refund_operation_id | uuid | نعم | الاسترداد |
| client_request_id | uuid | لا | مرجع عدم التكرار للشركة، فريد عبر `topup_order_refs` |
| provider_ref | text | نعم | — |
| provider_status | text | نعم | — |
| attempts | smallint | لا | — |
| resolved_by | text | نعم | `realtime`، `callback`، `poll`، `reconciliation`، `admin` |
| settled_at | timestamptz | نعم | — |

**الفهارس:** `ix_topup_tenant_time (tenant_id, created_at DESC)`، و`ix_topup_msisdn (msisdn_bidx, created_at) WHERE msisdn_bidx IS NOT NULL`، و`px_topup_to_mask (created_at) WHERE masked_at IS NULL`، و`px_topup_open (resolve_due_at) WHERE status IN ('pending','under_investigation')`. **والتفرّد عبر الأقسام بجدولي مفاتيح غير مقسّمين** (§1.4) بدل الفهرس القديم `uq_topup_client_request` الذي كان يضم `created_at` فلا يمنع التكرار فعلاً:

| الجدول | الأعمدة |
|---|---|
| `topup_order_refs` (RLS `tenant_id`) | `tenant_id`، و`client_request_id`، وPK مركّب، و`topup_id`، و`created_at`. يُدرج في معاملة إنشاء الطلب نفسها، فالتكرار يعيد الطلب الأول |
| `topup_provider_refs` | `operator_code`، و`provider_ref`، وPK مركّب، و`topup_id`، و`created_at`. يمنع ربط مرجع شركة واحد بطلبين |

### 14.8 الإعلانات والتقارير والربط البرمجي
**الاحتفاظ:** RT-41 للحملات وتقارير السجل وعملاء الربط، وRT-44 لإحصاءات الإعلانات وسجل الاستخدام · **الفئة:** `internal` · **المتطلبات:** ADS-01..08، HISTORY-01..04، BIZAPI-01..05، PAY-08

| الجدول | الأعمدة |
|---|---|
| `ad_placements` (المفتاح `key`) | `key` PK، و`name_ar`، و`surface` (`shop_dashboard`، `home`، `store`)، و`toggle_key`، و`max_slots`، و`allows_digital_promotions boolean` (على الموقع فقط، PAY-08) |
| `ad_campaigns` (قياسية، RLS بسياسة المعلِن على `advertiser_tenant_id`، وحملات المنصة `advertiser_tenant_id IS NULL` للإدارة وحدها) | `advertiser_kind` (`platform`، `supplier`، `shop`)، و`advertiser_tenant_id` (`CHECK ((advertiser_kind = 'platform') = (advertiser_tenant_id IS NULL))`)، و`title`، و`creative_file_id`، و`body_text`، و`link_url`، و`audience` (`shops`، `public`)، و`governorate_ids smallint[]`، و`activity_types text[]` (الاستهداف المسموح فقط، ADS-06)، و`placements text[]`، و`promotes_digital_service boolean`، و`starts_at`، و`ends_at`، و`service_order_id`، و`status` (`draft`، `submitted`، `approved`، `rejected`، `scheduled`، `running`، `paused`، `ended`، `expired`، [التصميم التقني §8.15](19-technical-design.md))، و`payment_due_at` (⚙️ 7 أيام من الموافقة، ثم `expired`)، و`paused_by` (`advertiser`، `admin`، `system`)، و`pause_reason` (`advertiser_request`، `violation`، `advertiser_suspended`، `placement_off`)، و`platform_paused_days int` (أيام الإيقاف بسبب المنصة، تمد `ends_at` عند الاستئناف، D-111)، و`reviewed_by_admin_id`، و`review_reason`، و`frequency_cap` |
| `ad_stats_daily` | `campaign_id`، و`day date`، و`placement_key`، و`governorate_id`، وPK مركّب، و`impressions`، و`clicks`. مجمّعة دون أي تتبّع فردي |
| `history_reports` (قياسية) | `verification_code_id` FK (`CR-`)، و`identifier_type`، و`identifier_value`، و`device_id`، و`requested_by_user_id`، و`api_client_id`، و`free_for_owner boolean`، و`service_order_id`، و`snapshot jsonb` (دون أي بيانات شخصية، HISTORY-02)، و`pdf_file_id`، و`issued_at` |
| `api_clients` (قياسية) | `company_name`، و`legal_reg_no`، و`contact_name`، و`contact_phone_e164`، و`contact_email`، و`kind` (`business`، `importer_integration`)، و`client_tenant_id` FK → tenants (للوكيل المربوط، والاسم القديم `importer_tenant_id`، والجدول غير معزول بـ RLS، §1.2؛ `CHECK ((kind = 'importer_integration') = (client_tenant_id IS NOT NULL))`)، و`status` (`pending`، `active`، `suspended`، `revoked`)، و`contract_ref`، و`allowed_ips cidr[]`، و`approved_by_admin_id` |
| `api_client_users` (قياسية) | `api_client_id` FK، و`user_id` FK (حساب شخصي مؤكَّد الرقم)، و`role` (`owner`، `developer`)، و`status` (`invited`، `active`، `removed`). لوحة الربط في الموقع فقط |
| `api_keys` (قياسية) | `api_client_id` FK، و`key_id` فريد (`bk_live_...`)، و`secret_enc 🔐`، و`key_version`، و`scopes text[]`، و`status` (`active`، `revoked`، `expired`)، و`created_by_user_id` (مسؤول العميل من لوحته)، و`secret_shown_at` (عُرض السر مرة واحدة، ولا يُعرض بعدها أبداً)، و`expires_at`، و`last_used_at`، و`revoked_at`، و`revoked_by_type` (`client`، `admin`)، و`revoked_reason`. وحد مفتاحين نشطين لكل عميل |
| `api_usage_events` (ثابتة، **مقسّم** شهرياً بـ `occurred_at`) | `api_client_id`، و`key_id`، و`endpoint`، و`status_code`، و`billable boolean`، و`latency_ms`، و`request_id`، و`check_id` |
| `api_usage_daily` | `api_client_id`، و`day`، و`endpoint`، وPK مركّب، و`calls`، و`billable_calls`، و`errors` |

## 15. المحاسبة وإدارة المحل (مخطط `shoppro`)

**كل جداول هذا المخطط: RLS (`tenant_id`)**، ولا يملك أي دور غير `api_public` (لمستأجره) و`shoppro_system` صلاحية عليه، فلا وصول للإدارة ولا الدعم ولا الأمن ولا التقارير ولا الوصول التقني للحوادث، ولا حتى بإذن صاحب المحل (D-101، [التصميم التقني §6.8](19-technical-design.md)). والكتابة من المحل نفسه، أو من القيود الآلية بدور `shoppro_system`. **المتطلبات العامة:** SHOPPRO-01..15، D-92، D-101، D-107. **الاحتفاظ:** RT-43 (مدة الاشتراك ثم ⚙️ 12 شهراً للقراءة والتصدير، ثم حذف بإنذار قبل ⚙️ 30 يوماً، والعدّ متوقف ما دام الوصول مستحيلاً بسبب المنصة) · **الفئة:** `tenant_private`.

**قواعد التخزين في هذا المخطط (D-101، H-02، K-17):**

| القاعدة | التفصيل |
|---|---|
| التشفير بمفتاح المحل | **كل أعمدة المحتوى** (المبالغ، والكميات، والأسعار والكلف، وأسماء الأصناف والزبائن والمورّدين، والهواتف، والملاحظات، وعدّ الصندوق، والمصاريف، والرواتب، والتصدير، وحمولات القيود المعلّقة) مخزّنة `bytea` مشفّرة في طبقة التطبيق بمفتاح بيانات المحل (`shoppro.tenant_data_keys`). والأسماء في الجداول أدناه أسماء منطقية: العمود الفعلي للمحتوى يحمل اللاحقة `_enc`. **ويبقى صريحاً** ما يلزم للعزل والفهرسة والقيود فقط: `tenant_id`، و`branch_id`، والمعرّفات والمراجع، والأوقات والتواريخ، والحالات، والأرقام المرجعية (`PS-`، `PR-`)، ومفاتيح التفرّد |
| البحث | بصمات بمفتاح مشتق من مفتاح المحل (`sku_bidx`، و`barcode_bidx`، و`phone_bidx`) للمطابقة التامة، والبحث بالاسم في ذاكرة التطبيق أو على الجهاز (كتالوج المحل صغير). ولا فهرس `pg_trgm` على أي محتوى هنا |
| الثوابت | ثوابت المبالغ والكميات (الكمية أكبر من صفر، والسعر صفر أو أكثر، والخصم لا يتجاوز السطر، وتوازن القيد) **تُفرض في طبقة خدمة `shoppro` قبل التشفير**، ويتحقق منها `shoppro.pos.integrity` بدور `shoppro_system` دون أي اطلاع بشري، لأن قيود `CHECK` لا ترى نصاً مشفّراً. والثوابت على الأعمدة الصريحة (التفرّد، والحالات، والمراجع) قيود عادية |
| التقسيم | الجداول الكبيرة **مقسّمة بالتجزئة على `tenant_id`** (`PARTITION BY HASH`، بعدد أقسام ثابت يحدده الترحيل): `pos_sales`، و`pos_sale_lines`، و`pos_payments`، و`stock_movements`، و`cash_movements`، و`journal_entries`، و`journal_lines`، و`pending_postings`. فيصير حذف مستأجر عملاً بدفعات داخل قسمه، وكل فهرس فريد يبدأ بـ `tenant_id` |
| الفرع | `branch_id` شرط ثانٍ في RLS على الجداول التي تحمله (`app.branch_ids`، [التصميم التقني §6.6](19-technical-design.md)) |
| الحذف والمحو التشفيري | انتهاء RT-43 أو إغلاق المحل بعد مدته أو «الاحتفاظ لنفسي» عند تغيير المالك (D-107) **يُتلف مفتاح البيانات** فتصير كل صفوفه ونسخه الاحتياطية غير مقروءة، ثم تُحذف الصفوف بدفعات لكل قسم |
| لا مرجع خارج المخطط | لا FK من `shoppro` إلى مخططات أخرى ولا العكس: معرّفات السجل والمتجر والمحفظة تصل بالأحداث وتُخزَّن مراجع منطقية (FK~) |

### 15.1 الإعداد والأصناف والمخزون
**المتطلبات:** SHOPPRO-02، SHOPPRO-12، SHOPPRO-13، D-107

| الجدول | الأعمدة |
|---|---|
| `shoppro.tenant_data_keys` (D-101) | `tenant_id`، و`key_version smallint`، وPK مركّب، و`wrapped_dek bytea` (مفتاح البيانات مغلّفاً بمفتاح التغليف `kek:shoppro` في الخزنة، وسياستها تسمح بفكّه لهويتي `api-public` و`shoppro_system` وحدهما)، و`kek_version`، و`status` (`active`، `retired`، `destroyed`)، و`created_at`، و`destroyed_at`، و`destroy_reason` (`owner_kept_data` D-107، `retention_expired`، `tenant_purged`). وفهرس `px_tdk_active (tenant_id) WHERE status = 'active'` فريد. والصف المُتلف يبقى بلا `wrapped_dek` (`CHECK (status <> 'destroyed' OR wrapped_dek IS NULL)`) دليلاً على المحو التشفيري |
| `shoppro.tenant_settings` (المفتاح `tenant_id`) | `tenant_id` PK، و`data_key_version` (المفتاح النشط)، و`cost_method` (`weighted_average`)، و`installment_reminders boolean`، و`default_warranty_days`، و`receipt_footer` 🔐، و`read_only_since` (بعد انتهاء الاشتراك أو إلغائه)، و`retention_delete_at` (نهاية RT-43)، و`retention_paused_at` (الوصول مستحيل بسبب المنصة)، و`retention_warned_at`، و`device_units_seeded_at` (أول تفعيل: تُبذر وحدات الأجهزة من مخزون السجل بكلفة «غير محددة»)، و`updated_at`، و`version` |
| `shoppro.item_categories` (قياسية) | `tenant_id`، و`name`، و`parent_id` |
| `shoppro.items` (قياسية) | `tenant_id`، و`sku` 🔐 و`sku_bidx`، و`barcodes` 🔐 و`barcode_bidx bytea[]`، و`name` 🔐، و`category_id`، و`unit`، و`avg_cost_minor` 🔐، و`price_minor` 🔐، و`is_registry_device boolean` (الأجهزة المسجّلة تُتابع بالوحدة)، و`low_stock_threshold` 🔐، و`archived_at`. وفهرس `ix_items_barcode` (GIN على `barcode_bidx`)، و`uq_items_sku (tenant_id, sku_bidx)` |
| `shoppro.stock_levels` | `tenant_id`، و`item_id`، و`branch_id`، وPK مركّب، و`qty numeric`، و`needs_count boolean` (كمية سالبة بعد مزامنة)، و`updated_at` |
| `shoppro.stock_movements` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`item_id`، و`branch_id`، و`qty_delta` 🔐، و`unit_cost_minor` 🔐، و`reason` (`purchase`، `pos_sale`، `registry_purchase`، `registry_sale`، `store_delivery`، `store_return`، `sales_return`، `adjustment`، `count`، `transfer_out`، `transfer_in`، `repair_use`، `return_in`، `return_out`، `seized`)، و`source_type`، و`source_id`، و`source_event_id` (للآلية، مع فهرس `uq_stock_mv_event (tenant_id, source_event_id, item_id) WHERE source_event_id IS NOT NULL` فريد)، و`created_by_user_id` |
| `shoppro.device_units` | `tenant_id`، و`device_id` (FK~)، وPK مركّب، و`branch_id`، و`item_id`، و`cost_minor` 🔐، و`cost_unknown boolean` (وحدة بُذرت عند أول تفعيل)، و`status` (`in_stock`، `blocked` (صار مبلّغاً عنه: خارج المخزون القابل للبيع بقيمة كلفته)، `sold`، `returned`، `dismantled`، `seized` (ضُبط أو سُلّم للجهات، فتُرحَّل كلفته إلى «خسارة أجهزة مضبوطة»))، و`blocked_at`، و`in_source_type`، و`in_source_id`، و`out_source_type`، و`out_source_id`، و`updated_at`. تُدار آلياً من أحداث السجل (SHOPPRO-02)، ورفض البلاغ أو إغلاقه يعيد `blocked` إلى `in_stock`. **وكمياتها مشتقة من السجل دائماً** فلا تنحرف |
| `shoppro.registry_tx_amounts` (المفتاح `(tenant_id, shop_transaction_id)`) | الكلفة والسعر المحاسبيان لمعاملة شراء أو بيع في السجل للمحل المشترك، تلتقطهما شاشة السجل في حقل محاسبي خاص **لا في `shop_transactions`** (§10.6): `tenant_id`، و`shop_transaction_id` (FK~)، و`device_id` (FK~)، و`direction` (`purchase`، `sale`)، و`cost_minor` 🔐، و`price_minor` 🔐، و`captured_by_user_id`، و`created_at` |
| `shoppro.stock_counts` و`shoppro.stock_count_lines` | الجرد: (`tenant_id`، و`branch_id`، و`status` `open` أو `closed`، و`counted_by_user_id`، و`closed_at`)، وأسطره (`count_id`، و`item_id`، و`expected_qty`، و`counted_qty`، و`difference`) |
| `shoppro.branch_transfers` و`shoppro.branch_transfer_lines` | التحويل بين الفروع: (`tenant_id`، و`from_branch_id`، و`to_branch_id`، و`status` (`sent`، `received`، `rejected`، `cancelled`، [التصميم التقني §8.19](19-technical-design.md))، و`sent_at`، و`received_at`، و`decided_by_user_id`)، وأسطره (`transfer_id`، و`item_id`، و`qty` 🔐) |

### 15.2 المشتريات والزبائن والمورّدون
**المتطلبات:** SHOPPRO-04، SHOPPRO-08

| الجدول | الأعمدة |
|---|---|
| `shoppro.vendors` (قياسية) | `tenant_id`، و`name`، و`phone_e164`، و`is_platform_store boolean` (المتجر)، و`notes` |
| `shoppro.purchase_invoices` (قياسية) | `tenant_id`، و`vendor_id`، و`source` (`manual`، `store_order`، `registry_purchase`)، و`source_ref_id`، و`invoice_no`، و`invoice_date`، و`branch_id`، و`total_minor`، و`paid_minor`، و`status` (`open`، `paid`)، و`file_id`. وفهرس `uq_purchase_source (tenant_id, source, source_ref_id) WHERE source <> 'manual'` فريد لعدم تكرار القيد الآلي |
| `shoppro.purchase_invoice_lines` (ثابتة) | `tenant_id`، و`invoice_id`، و`item_id`، و`qty`، و`unit_cost_minor`، و`line_total_minor` |
| `shoppro.vendor_payments` (قياسية) | `tenant_id`، و`vendor_id`، و`amount_minor`، و`method` (`cash`، `wallet`، `transfer`)، و`cash_session_id`، و`paid_at`، و`reference` |
| `shoppro.customers` (قياسية) | `tenant_id`، و`name` 🔐، و`phone_enc 🔐`، و`phone_bidx #️⃣` (بمفتاح مشتق من مفتاح المحل)، و`phone_mask` 🔐، و`whatsapp_reminders boolean`، و`notes` 🔐 |

### 15.3 نقطة البيع والصندوق
**المتطلبات:** SHOPPRO-03، SHOPPRO-05، [التصميم التقني §7.9](19-technical-design.md)

| العمود (`shoppro.pos_sales`، قياسية، مقسّمة بالتجزئة) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| tenant_id | uuid | لا | — |
| client_sale_id | uuid | لا | يولّده الجهاز (UUIDv7)، و`UNIQUE (tenant_id, client_sale_id)` |
| terminal_id | uuid | لا | FK → pos_terminals |
| local_seq | bigint | لا | التسلسل المحلي للجهاز، وفهرس `uq_pos_local_seq (tenant_id, terminal_id, local_seq)` فريد، والفجوات يرصدها `shoppro.pos.integrity` |
| temp_receipt_no | text | لا | «مؤقت-{الجهاز}-{التسلسل المحلي}» المطبوع دون اتصال |
| sale_number | text | نعم | `PS-YYYY-NNNNNN` بلا فجوات لكل محل وسنة عند التطبيق في الخادم (عدّاد `number_sequences` بنطاق المحل)، والسنة سنة دمشق لوقت الجهاز إن كان ضمن نافذة الانحراف وإلا لوقت الاستلام، والإلغاء يبقي رقمه. وفهرس `uq_pos_sale_number (tenant_id, sale_number) WHERE sale_number IS NOT NULL` فريد |
| branch_id | uuid | لا | — |
| member_id | uuid | لا | — |
| customer_id | uuid | نعم | — |
| device_time | timestamptz | لا | وقت الجهاز |
| received_at | timestamptz | لا | وقت الاستلام في الخادم |
| offline | boolean | لا | — |
| subtotal_minor | bytea 🔐 | لا | الثوابت تُفرض قبل التشفير (§15) |
| discount_minor | bytea 🔐 | لا | لا يتجاوز الإجمالي |
| total_minor | bytea 🔐 | لا | — |
| payment_kind | text | لا | `cash`، `wallet`، `debt`، `mixed` (دون اتصال: `cash` فقط) |
| cash_session_id | uuid | نعم | — |
| status | text | لا | `awaiting_wallet` (ينتظر شحناً وارداً بالمرجع والمبلغ)، `completed`، `cancelled`، `voided` ([التصميم التقني §8.19](19-technical-design.md)) |
| wallet_reference_code | text | نعم | المرجع المعروض في رمز QR، يطابقه `wallet_operations.reference_code` (FK~) |
| wallet_operation_id | uuid | نعم | FK~: الشحن الوارد المطابق، آلياً أو بربط يدوي من عضو بـ `shop.wallet.pay` |
| awaiting_since | timestamptz | نعم | بعد ⚙️ 15 دقيقة يمكن تحويله نقداً أو إلغاؤه |
| sync_flags | text[] | نعم | `negative_stock`، `clock_skew`، `closed_session`، `after_offline_token_expiry` (وصل رغم انتهاء رمز العمل دون اتصال: يبقى معلَّماً ولا يُحذف)، `removed_member` (مبيعات موظف أُزيل، قُبلت بجلسة صاحب المحل لأن وقتها قبل `removed_at`)، `line_rejected` (سطر خالف الثوابت فرُفض وحده بـ `POS_SYNC_REJECTED`) |
| voided_at | timestamptz | نعم | — |
| void_reason | text | نعم | 🔐 |

| الجدول | الأعمدة |
|---|---|
| `shoppro.pos_sale_lines` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`sale_id`، و`line_no`، و`item_id`، و`qty` 🔐 (أكبر من صفر)، و`unit_price_minor` 🔐 (سعر لحظة البيع، صفر أو أكثر)، و`discount_minor` 🔐 (لا يتجاوز السطر)، و`unit_cost_minor` 🔐، و`line_total_minor` 🔐، و`returned_qty` 🔐 (Σ المرتجع ≤ المبيع، يُفرض في الخدمة) |
| `shoppro.pos_payments` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`sale_id`، و`method` (`cash`، `wallet`، `debt`)، و`amount_minor` 🔐، و`wallet_operation_id` (FK~)، و`receivable_id` |
| `shoppro.sales_returns` (ثابتة، MC-09) | مرتجع نقطة البيع مقابل البيع الأصلي: `tenant_id`، و`return_number` (`PR-YYYY-NNNNNN` بلا فجوات لكل محل وسنة، و`UNIQUE (tenant_id, return_number)`)، و`client_return_id uuid` (و`UNIQUE (tenant_id, client_return_id)`)، و`sale_id`، و`branch_id`، و`member_id`، و`refund_method` (`cash` من الصندوق، `debt_credit` خصم من الدين)، و`cash_session_id`، و`receivable_id`، و`total_minor` 🔐، و`reason` 🔐، و`exchange_sale_id` (الاستبدال إرجاع وبيع جديد في شاشة واحدة)، و`approved_by_user_id` (صاحب المحل أو عضو بصلاحيته)، و`created_at`. وإرجاع **جهاز** بعد مهلة الإلغاء ليس هنا: معاملة شراء في السجل من المالك المسجّل |
| `shoppro.sales_return_lines` (ثابتة) | `tenant_id`، و`return_id`، و`sale_line_no`، و`item_id`، و`qty` 🔐، و`amount_minor` 🔐، و`restock boolean` (إدخال للمخزون)، مع عكس الإيراد والكلفة في القيد |
| `shoppro.pos_terminals` (قياسية) | `tenant_id`، و`branch_id`، و`user_device_id`، و`last_sync_at`، و`last_local_seq`، و`offline_since` (حد ⚙️ 72 ساعة)، و`offline_token_expires_at` (`min(الآن + ⚙️ 72 ساعة، نهاية مهلة السماح أو التجربة)`)، و`app_version` (للإعفاء من التحديث الإجباري ⚙️ 30 يوماً ما دام له طابور)، و`unsynced_count_reported` |
| `shoppro.cash_sessions` (قياسية) | `tenant_id`، و`branch_id`، و`member_id`، و`client_session_id uuid` (و`UNIQUE (tenant_id, client_session_id)`)، و`opened_at`، و`opening_float_minor` 🔐، و`closed_at`، و`expected_cash_minor` 🔐، و`counted_cash_minor` 🔐، و`difference_minor` 🔐، و`status` (`open`، `closed`، `closed_by_system` (انتهاء الاستحقاق أو إزالة الموظف: «بانتظار العدّ» والفرق لصاحب المحل وحده)، `correction`، [التصميم التقني §8.19](19-technical-design.md))، و`corrects_session_id` (جلسة التصحيح لصندوق مغلق يستقبل بيعاً متأخراً) |
| `shoppro.cash_movements` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`cash_session_id`، و`direction` (`in`، `out`)، و`amount_minor` 🔐، و`reason` (`pos_sale`، `sales_return`، `topup_cash`، `debt_payment`، `expense`، `vendor_payment`، `salary`، `advance`، `withdrawal`، `deposit`، `adjustment`)، و`source_type`، و`source_id`، و`created_by_user_id` |

### 15.4 المصاريف والموظفون والديون والكفالات والصيانة
**المتطلبات:** SHOPPRO-06..10

| الجدول | الأعمدة |
|---|---|
| `shoppro.expense_categories` و`shoppro.expenses` | التصنيفات (`tenant_id`، و`name`)، والمصاريف (قياسية: `tenant_id`، و`category_id`، و`amount_minor`، و`expense_date`، و`branch_id`، و`cash_session_id`، و`note`، و`file_id`) |
| `shoppro.salary_profiles` | `tenant_id`، و`member_id`، وPK مركّب، و`base_salary_minor`، و`sales_commission_bp`، و`repair_commission_bp`، و`updated_at`. مخفية عن الموظفين افتراضياً (SHOPPRO-13) |
| `shoppro.salary_advances` (قياسية) | `tenant_id`، و`member_id`، و`amount_minor`، و`advance_date`، و`cash_session_id`، و`settled_in_payslip_id` |
| `shoppro.payslips` (قياسية) | `tenant_id`، و`member_id`، و`month date`، و`base_minor` 🔐، و`commissions_minor` 🔐، و`advances_minor` 🔐، و`deductions_minor` 🔐، و`net_minor` 🔐، و`status` (`draft`، `approved`، `paid`، [التصميم التقني §8.19](19-technical-design.md))، و`approved_by_user_id` (صاحب المحل أو عضو بـ `shoppro.view_payroll`)، و`paid_at`، و`cash_session_id`. و`UNIQUE (tenant_id, member_id, month)` |
| `shoppro.receivables` (قياسية) | `tenant_id`، و`customer_id`، و`source_type` (`pos_sale`، `repair`، `manual`)، و`source_id`، و`principal_minor` 🔐، و`balance_minor` 🔐، و`due_date`، و`status` (`open`، `settled`، `written_off`: صاحب المحل وحده)، و`installment_plan_id` |
| `shoppro.installment_plans` (قياسية) | `tenant_id`، و`customer_id`، و`receivable_id`، و`total_minor` 🔐، و`installments_count` (حتى ⚙️ 24، `shoppro.installments.max`)، و`frequency` (`weekly`، `monthly`)، و`start_date`، و`status` (`active`، `completed`، `defaulted` (علامة لا تحصيل، والتحصيل شأن مدني)، `cancelled`) |
| `shoppro.installments` | `tenant_id`، و`plan_id`، و`due_date`، و`amount_minor` 🔐، و`paid_minor` 🔐، و`status` (`due`، `paid`، `overdue`: بمؤقّت `shoppro.installment.overdue` عند الموعد + ⚙️ يوم)، و`reminder_sent_at` (تذكير واتساب بمسار `shoppro_system`، ومتغيراته مشفّرة بمفتاح المحل) |
| `shoppro.customer_payments` (قياسية) | `tenant_id`، و`customer_id`، و`receivable_id`، و`installment_id`، و`amount_minor`، و`method`، و`cash_session_id`، و`paid_at` |
| `shoppro.warranties` (قياسية) | `tenant_id`، و`customer_id`، و`item_id`، و`device_id`، و`source_type` (`registry_sale`، `pos_sale`، `repair`)، و`source_id`، و`starts_on`، و`ends_on`، و`terms`، و`reminder_sent_at` |
| `shoppro.repair_tasks` (قياسية) | `tenant_id`، و`repair_job_id` (أمر الصيانة في السجل)، و`technician_member_id`، و`status` (`assigned`، `in_progress`، `done`)، و`price_minor`، و`notes`، و`customer_notified_at` |
| `shoppro.repair_parts_used` (ثابتة) | `tenant_id`، و`repair_task_id`، و`item_id`، و`qty`، و`unit_cost_minor` |

### 15.5 الدفتر (القيد المزدوج المبسّط)
**المتطلبات:** SHOPPRO-05، SHOPPRO-11

لا يكتب المستخدم قيوداً مباشرة: كل وثيقة عمل (بيع، وشراء، ومصروف، ودفعة دين، وراتب، وفرق صندوق، وتعبئة، ومعاملة سجل، وتسليم متجر) تولّد قيدها آلياً من دليل حسابات ثابت. والتقارير تُشتق من الدفتر.

| الجدول | الأعمدة |
|---|---|
| `shoppro.ledger_accounts` (قياسية) | `tenant_id`، و`system_key` (`cash`، `wallet`، `inventory`، `receivables`، `payables`، `sales`، `cogs`، `topup_commission`، `repair_income`، `salaries`، `expense:<تصنيف>`)، و`name`، و`type` (`asset`، `liability`، `equity`، `income`، `expense`)، و`branch_id`. وفهرس `uq_ledger_account (tenant_id, system_key, branch_id)` |
| `shoppro.journal_entries` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`entry_date date`، و`source_type`، و`source_id`، و`posting_kind`، و`memo` 🔐، و`reversal_of_id`، و`posted_while_lapsed boolean` (علامة «سُجّلت أثناء توقف الاشتراك» لمراجعة صاحب المحل)، و`pending_posting_id`، و`created_by` (`system` أو مستخدم). وفهرس `uq_journal_source (tenant_id, source_type, source_id, posting_kind)` فريد يجعل القيد الآلي قابلاً للتكرار دون أثر. والفاتورة الملغاة والإشعار الدائن (`billing.invoice.voided`، `billing.credit_note.issued`) يرحّلان قيوداً عكسية بـ `reversal_of_id` |
| `shoppro.journal_lines` (ثابتة، مقسّمة بالتجزئة) | `tenant_id`، و`entry_id`، و`account_id`، و`debit_minor` 🔐، و`credit_minor` 🔐، و`branch_id`. وثابتا «طرف واحد غير صفري لكل سطر» و«تساوي المدين والدائن لكل قيد» **يُفرضان في خدمة الترحيل قبل التشفير** ويتحقق منهما `shoppro.pos.integrity` (لا يرى `CHECK` نصاً مشفّراً) |
| `shoppro.pending_postings` (مقسّمة بالتجزئة) | أحداث السجل والمتجر والتعبئة والمحفظة التي يستهلكها `shoppro_system` لمحل في وضع القراءة فقط ضمن مدة بياناته: `tenant_id`، و`source_event_id`، و`source_type`، و`source_id`، و`occurred_at`، و`payload` 🔐، و`status` (`pending`، `posted`، `discarded`)، و`posted_entry_id`، و`posted_at`. و`UNIQUE (tenant_id, source_event_id)`. وتُرحَّل آلياً عند التجديد بعلامة `posted_while_lapsed`، وتُحذف مع بيانات المحل عند نهاية RT-43 |

### 15.6 التصدير (ولا إذن لأي أحد من المنصة، D-101)
**المتطلبات:** SHOPPRO-11، SHOPPRO-14، SHOPPRO-15

| الجدول | الأعمدة |
|---|---|
| `shoppro.report_exports` (ثابتة) | `tenant_id`، و`kind` (التقارير، و`full_backup`، و`owner_keep_export`: التصدير الكامل المشفّر الذي يُولَّد في الحساب الشخصي للمالك السابق عند اختياره «الاحتفاظ لنفسي» قبل إتلاف المفتاح، D-107)، و`params` 🔐، و`file_id` (ملف مشفّر بمفتاح المحل، أو بمفتاح الحساب الشخصي لـ `owner_keep_export`)، و`recipient_user_id`، و`requested_by_user_id`، و`expires_at` (⚙️ 24 ساعة، `shoppro.export_ttl_hours`، ولـ `owner_keep_export` ما يحدده [الخصوصية وتقييم الأثر](21-privacy-dpia.md))، و`purged_at` (`shoppro.exports.purge`) |

## 16. البنية المشتركة

### 16.1 الإعدادات ومفاتيح التشغيل والمحتوى
**المتطلبات:** ADMIN-16، SMART-01، SMART-02، SMART-04، SMART-11، SMART-12، SMART-14، ROLLOUT-06، ROLLOUT-07، APPVER-01، D-43، D-95، D-111، N-01، N-04، H-03 · **الاحتفاظ:** دائم (سجل إعداد بلا بيانات شخصية) · **الفئة:** `internal`

**تعريف الإعداد يملكه الكود وقيمته يملكها التشغيل (N-01، §1.4):** أعمدة التعريف (`group_key`، و`value_type`، و`default_value`، والحدود، والصنف، وسياسة السريان، وصنف المهلة، و`time_locked`) يكتبها سجل الإعدادات المولَّد من [قواعد العمل](06-business-rules.md) §15 مع كل إصدار. أما `current_value` فيدرجه البذر إن غاب فقط ولا يحدّثه إصدار أبداً، والافتراضي الجديد لإعداد قائم يصل في `proposed_default` ولا يسري حتى ينشره المدير العام.

| العمود (`settings`، المفتاح `key`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| key | text | لا | PK، مثل `report.needs_info_days` |
| group_key | text | لا | المجموعة في الشاشة |
| value_type | text | لا | `int`، `duration`، `percent`، `bool`، `text`، `enum`، `list`، `regex`، `json` |
| current_value | jsonb | لا | القيمة الحية (يملكها التشغيل) |
| default_value | jsonb | لا | افتراضي 06 §15 (يملكه الكود)، واللوحة تعلّم «يختلف عن الافتراضي» |
| proposed_default | jsonb | نعم | افتراضي جديد وصل بإصدار ولم ينشره المدير العام بعد |
| min_value | jsonb | نعم | الخادم يرفض أي قيمة خارج الحدود ولو من المدير العام منفرداً (ضابط معوّض لـ D-102) |
| max_value | jsonb | نعم | — |
| setting_class | text | لا | `protection` (تخفيفه إجراء خطر بإعادة تحقق وإشعار فوري)، `legal`، `agreement`، `operational` (أصناف 06 §15) |
| agreement_ref | text | نعم | مرجع الاتفاقية لصنف `agreement`، وإلا «تُضبط عند توقيع الاتفاقية» والوحدة `off`. `CHECK (setting_class = 'agreement' OR agreement_ref IS NULL)` |
| inflight_policy | text | لا | `new_only` (الافتراضي)، `recompute_open`، `immediate` |
| timer_class | text[] | نعم | للمؤقّتات فقط: `WALL_SECURITY`، `WALL_USER`، `BUSINESS`، `BUSINESS_FLOOR`، `PAUSABLE` (قد يجتمع اثنان، مثل `BUSINESS_FLOOR` و`PAUSABLE`) |
| time_locked | boolean | لا | من القائمة المغلقة لتوجيه المال وهوية المنصة (H-03): التغيير يمر بـ `scheduled_setting_changes` |
| allowed_values | jsonb | نعم | — |
| unit | text | نعم | — |
| description_ar | text | لا | — |
| is_public | boolean | لا | يصل للواجهات في `bootstrap` |
| requires_dpo_note | boolean | لا | مدد الاحتفاظ (21 §5.5): يُسجَّل رأي مسؤول حماية البيانات مع التغيير. ولا موافقة ثانية على المدير العام (D-102) |
| current_version_no | int | لا | — |
| updated_at | timestamptz | لا | — |

| الجدول | الأعمدة |
|---|---|
| `settings_history` (ثابتة) | `setting_key` FK، و`version_no`، و`value jsonb`، و`effective_from`، و`changed_by_admin_id`، و`dpo_note`، و`reason_text`، و`rolled_back_from_version`، و`scheduled_change_id` (لما سرى بعد مهلة)، و`risky_relaxation boolean` (تخفيف صنف `protection`) |
| `scheduled_setting_changes` (قياسية، H-03) | تغيير إعداد من القائمة المغلقة بمهلة: `setting_key` FK، و`new_value jsonb`، و`old_value jsonb` (نافذة حتى الموعد)، و`apply_at` (بعد ⚙️ 72 ساعة `governance.money_routing.time_lock`، أو ⚙️ 24 ساعة لرقم واتساب الاحتياطي أثناء PB-06 `governance.backup_whatsapp.time_lock`)، و`status` (`scheduled`، `applied`، `cancelled`، [التصميم التقني §8.15](19-technical-design.md))، و`requested_by_admin_id`، و`cancelled_by_type` (`gm`، `sealed_emergency`)، و`cancelled_by_id`، و`applied_at`، و`notified_at` (`config.setting.scheduled` للمدير العام وجهة الرقابة وممثل مالك المنصة)، و`reason_text`. وفهرس `px_ssc_pending (setting_key) WHERE status = 'scheduled'` فريد، وتطبّقه `config.setting.apply_scheduled` (`WALL_SECURITY`). ولا موافق ثانٍ (D-102) |
| `feature_toggles` (المفتاح `key`، المفتاح يملكه الكود والحالة يملكها التشغيل) | `key` PK (الأسماء المعتمدة في [التصميم التقني §14.3](19-technical-design.md))، و`kind` (`module`، `integration`، `commerce`، `kill_switch`، `rollout`)، و`state` (`on`، `draining` (أُطفئ وما زال له بنود غير نهائية، وينتقل إلى `off` آلياً حين يصير العدّاد صفراً، `config.toggle.drain_watch`)، `off`، `hard_off` (إطفاء طارئ بـ `RSN-FTR-02` أو `RSN-FTR-03`)، `awaiting_agreement`، `terminated` (للتكاملات))، و`compensation_policy` (`none`، `extend_or_refund`، D-111)، و`hard_off_at`، و`hard_off_reason_code`، و`compensation_offer_at` (إن لم يُفتح خلال ⚙️ 30 يوماً يُعرض الاسترجاع مجدداً، `config.toggle.hard_off_compensate`)، و`open_items_count` (إسقاط لعدّاد التصفية الحي)، و`previous_state` (يعود إليه عند `expires_at`)، و`rules jsonb` (محافظات، وجمهور، ومنصات، وأدنى إصدار، ومعرّفات مستأجرين لإيقاف السحب)، و`depends_on text[]`، و`description_ar`، و`expires_at` (يعود المفتاح لحالته السابقة آلياً، مثل إيقاف السحب ⚙️ 24 ساعة)، و`requested_by_admin_id`، و`second_approver_admin_id` (لما يتطلب شخصين: `emergency.wallet_withdrawal_stop` فقط، D-100. `CHECK (second_approver_admin_id IS DISTINCT FROM requested_by_admin_id)`)، و`renewed_by_admin_id` (المدير العام وحده)، و`renewal_count`، و`current_version_no`، و`updated_at` |
| `feature_toggle_versions` (ثابتة) | `toggle_key`، و`version_no`، و`state`، و`rules`، و`expires_at`، و`changed_by_admin_id`، و`second_approver_admin_id`، و`reason_text` |
| `content_entries` (المفتاح `key`) | `key` PK، و`kind` (`ui_text`، `legal_page`، `guidance`، `protect_step`، `rejection_reason`، `bot_reply`، `sms_reply`، `error_text`، `permission_text`، `empty_state`، `brand`)، و`surfaces text[]`، و`current_version_id`، و`updated_at` |
| `content_versions` (ثابتة) | `entry_key`، و`version_no`، و`body text`، و`status` (`draft`، `published`، `archived`)، و`created_by_admin_id`، و`published_by_admin_id`، و`published_at` |
| `maintenance_windows` (قياسية) | `kind` (`banner`، `maintenance`، `incident`: نافذة عطل تنشرها المناوبة بلافتة أزمة)، و`surfaces text[]`، و`journeys text[]` (الرحلات المتأثرة: مهلة `WALL_USER` يقع موعدها داخل نافذة تمس رحلتها أو خلال ⚙️ 24 ساعة بعدها تنتقل إلى نهاية النافذة + ⚙️ 24 ساعة، ويُكتب النقل في `state_transitions` بـ `trigger = deadline_shift`. ولا يُنقل `WALL_SECURITY` أبداً)، و`content_key`، و`starts_at`، و`ends_at` (فارغ لعطل جارٍ)، و`created_by_type` (`admin`، `oncall`)، و`created_by_id`، و`active`. ولا تُقبل نافذة `maintenance` تمس بوابة الأمن ومسار التنبيهات ونقاط استقبال الشركاء وصفحات `/v` وجلسة `theft_only` (لافتة فقط) |

### 16.2 الملفات ورموز التحقق
**المتطلبات:** 06 §11، REPORT-05، REPORT-06، PUB-02، PUB-03، PUB-06، CIVIL-06، [التصميم التقني §12](19-technical-design.md)

| العمود (`files`، قياسية) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| purpose | text | لا | الأغراض في [التصميم التقني §12.1](19-technical-design.md)، ومنها الجديدة: `death_certificate`، `guardianship_document`، `alt_identity_document` (التقاط حي إلزامي، 🔐 مفتاح لكل ملف، D-103، D-104)، `tenant_document`، `brand_asset`، `seizure_bulk_file` |
| bucket | text | لا | `quarantine`، `evidence`، `documents`، `imports`، `exports`، `public-assets` |
| object_key | text | لا | فريد |
| status | text | لا | `pending_upload`، `uploaded`، `processing`، `ready`، `rejected`، `purged` |
| declared_mime | text | لا | — |
| sniffed_mime | text | نعم | — |
| size_bytes | bigint | لا | 10 ميغابايت ⚙️ حداً |
| sha256 | bytea | لا | — |
| phash | bigint | نعم | بصمة إدراكية |
| phash_bands | smallint[] | نعم | أربع شرائح للبحث عن المتشابه |
| dhash | bigint | نعم | — |
| width | int | نعم | — |
| height | int | نعم | — |
| page_count | int | نعم | — |
| uploader_type | text | لا | `user`، `admin`، `police`، `system` |
| uploader_id | uuid | نعم | — |
| actor_tenant_id | uuid | نعم | المستأجر الذي رفع الملف (الجدول غير معزول بـ RLS، §1.2، والاسم القديم `tenant_id`) |
| capture_nonce_id | uuid | نعم | الالتقاط داخل التطبيق |
| captured_in_app | boolean | لا | — |
| encryption | text | لا | `storage`، `object_envelope` |
| dek_enc 🔐 | bytea | نعم | مفتاح الملف مغلّفاً |
| key_version | int | نعم | — |
| cohort_key_ref | text | نعم | مفتاح المجموعة للمحو التشفيري |
| scan_status | text | لا | `pending`، `clean`، `infected`، `error` |
| rejection_reason | text | نعم | — |
| barcode_values | text[] | نعم | — |
| retention_class | text | نعم | — |
| retain_until | timestamptz | نعم | — |
| attached_type | text | نعم | — |
| attached_id | uuid | نعم | يُرفق مرة واحدة |
| processed_at | timestamptz | نعم | — |
| purged_at | timestamptz | نعم | — |

**الفهارس:** `ix_files_sha256 (sha256)`، و`ix_files_phash_bands` (GIN على `phash_bands`)، و`px_files_retention (retain_until) WHERE status='ready'`.

| الجدول | الأعمدة |
|---|---|
| `capture_nonces` (ثابتة) | `user_id` (فارغ في الاستعادة)، و`recovery_id` (FK → account_recoveries)، و`purpose` (كل غرض «التقاط إلزامي» في §12.1: `id_card_front`، `id_card_back`، `seller_id_photo`، `live_photo`، `carton_photo`، `serial_label_photo`، `return_photo`، `death_certificate`، `guardianship_document`، `alt_identity_document`)، و`nonce_hash bytea` فريد، و`expires_at` (10 دقائق)، و`used_at`. `CHECK ((user_id IS NULL) <> (recovery_id IS NULL))` |
| `file_duplicates` (ثابتة) | `file_id`، و`duplicate_of_file_id`، و`kind` (`exact`، `perceptual`)، و`distance smallint`، و`context_type`، و`context_id` |
| `verification_codes` (ثابتة) | `code text` فريد (`CR-` أو رقم الوثيقة)، و`kind` (`certificate`، `check_receipt`، `transfer_receipt`، `repair_receipt`، `history_report`، `invoice`، `commercial_invoice`)، و`ref_id`، و`token_hash bytea` فريد (رمز QR بطول 128 بت)، و`revoked_at` |
| `link_tokens` (قياسية) | رموز الروابط في الرسائل ([التصميم التقني §13.3](19-technical-design.md)): `prefix` (`n`، `t`)، و`token_hash bytea` فريد (رمز 128 بت، 22 حرفاً base64url)، و`purpose` (`notification`، `transfer_accept`، `recovery_start`، `tip_followup`، `receipt`، `security_email_verify`)، و`action` (`open` دائماً، و`email_verify` لصفحة «أؤكد هذا العنوان» بطلب POST دون دخول ولمرة واحدة ⚙️ 24 ساعة، و`not_me_freeze` يعمل دون دخول ويخوّل التجميد فقط). **وطلب GET أو HEAD لا يغيّر حالة الرمز أبداً**: `used_count` يزيد بطلب POST الذي يكمل الإجراء فقط، و`notification_id`، و`target_type`، و`target_id`، و`recipient_user_id` (فارغ لمستلم بلا حساب)، و`recipient_phone_bidx #️⃣`، و`expires_at` (⚙️ 30 يوماً، و7 أيام لـ «لم أكن أنا»)، و`max_uses`، و`used_count`، و`first_opened_at`، و`revoked_at`. ولا يحمل الرابط أي معرّف مقروء |

### 16.3 الخصوصية والموافقات والاحتفاظ
**المتطلبات:** DATAACCESS-01..03، PRIV-01..10، PP-14 و§5 و§9 في [الخصوصية وتقييم الأثر](21-privacy-dpia.md)، D-67. وPRIV-11 (D-101) قيد صلاحيات على مخطط `shoppro` لا جدول (§15)

| العمود (`data_access_events`، ثابتة، **مقسّم** شهرياً) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `created_at` |
| person_id | uuid | لا | صاحب البيانات |
| accessor_type | text | لا | `shop`، `admin`، `police`، `support`، `system` |
| accessor_tenant_id | uuid | نعم | — |
| accessor_admin_id | uuid | نعم | — |
| accessor_police_user_id | uuid | نعم | — |
| accessor_display | text | لا | ما يظهر للمستخدم: اسم المحل أو «الإدارة» أو «جهة مختصة» |
| purpose_code | text | لا | — |
| purpose_ref_type | text | نعم | — |
| purpose_ref_id | uuid | نعم | — |
| fields | text[] | لا | ما اطُّلع عليه |
| visible_from | timestamptz | نعم | فارغ حتى إغلاق القضية لاطلاع الأمن |
| case_ref_id | uuid | نعم | — |
| secrecy_extended_until | timestamptz | نعم | ⚙️ 180 يوماً لكل تمديد |
| secrecy_extensions | smallint | لا | حتى 2 ⚙️ |
| flagged_suspicious_at | timestamptz | نعم | DATAACCESS-03 |
| support_ticket_id | uuid | نعم | — |

**الفهارس:** `ix_dae_person (person_id, created_at DESC)`، و`px_dae_hidden (case_ref_id) WHERE visible_from IS NULL`.

| الجدول | الأعمدة |
|---|---|
| `consent_purposes` (المفتاح `code`) | `code` PK (`CN-...`)، و`description_ar`، و`legal_basis`، و`default_state` (دائماً معطّلة) |
| `consent_texts` (ثابتة) | `purpose_code`، و`version_no`، و`body`، و`sha256`، و`approved_by_admin_id`، و`published_at` |
| `consents` (ثابتة، للإضافة فقط) | `subject_type` (`user`، `person`، `anonymous`)، و`user_id`، و`person_id`، و`anonymous_ref_hash`، و`purpose_code`، و`text_version_id`، و`action` (`grant`، `withdraw`)، و`channel` (`web`، `app`، `whatsapp`، `shop`، `support`)، و`screen_id`، و`app_version`، و`entered_by_type` (`self`، `shop_member`، `guardian`)، و`entered_by_id` |
| `terms_acceptances` (ثابتة) | `user_id`، و`actor_tenant_id` (الجدول غير معزول بـ RLS، §1.2)، و`document` (`terms`، `privacy_policy`، `shop_agreement`، `importer_agreement`، `supplier_agreement`، `courier_agreement`، `bizapi_terms`)، و`version`، و`content_version_id`، و`channel`، و`accepted_at` (PRIV-10) |
| `retention_policies` (المفتاح `code`، يملكه الكود ويُولَّد من خريطة §17.5) | `code` PK (`RT-NN`)، و`table_name`، و`columns text[]`، و`duration_setting_key`، و`anchor_column` (بداية العدّ)، و`action` (`delete`، `anonymize`، `reduce_precision`، `archive`، `crypto_erase`: إتلاف مفتاح المجموعة أو المحل)، و`data_class` (§1.3)، و`hold_types text[]`، و`pausable boolean` (يتوقف العدّ ما دام الوصول مستحيلاً بسبب المنصة، مثل RT-43)، و`active`، و`description`. وفحص في CI يرفض جدولاً بلا صف في الخريطة |
| `retention_holds` (قياسية) | `subject_type`، و`subject_id`، و`hold_type` (`LH-1` إلى `LH-5`)، و`reference` (رقم القضية أو الطلب)، و`case_ref_id` (FK → police_case_refs لحجز LH-2 من البوابة، PP-14)، و`placed_by_type` (`system`، `admin`، `police`)، و`placed_by_id`، و`review_due_at` (180 يوماً ⚙️)، و`released_at`، و`released_by_id`، و`reason_text`. وفهرس `px_holds_active (subject_type, subject_id) WHERE released_at IS NULL` |
| `purge_runs` (ثابتة) | `policy_code`، و`started_at`، و`finished_at`، و`dry_run boolean`، و`counts jsonb`، و`excluded_by_hold int`، و`errors int`، و`status` (`running`، `completed`، `failed`، `halted`: توقف آلي عند تجاوز الحد)، و`triggered_by` |
| `data_subject_requests` (قياسية) | `user_id`، و`person_id`، و`kind` (`access`، `export`، `correction`، `closure`، `objection`، `human_review`، `complaint`)، و`support_ticket_id`، و`status` (`received`، `in_progress`، `completed`، `rejected`)، و`due_at` ⚙️، و`completed_at`، و`handled_by_admin_id`، و`outcome_text` (PRIV-06) |
| `privacy_incidents` (قياسية) | `title`، و`severity` (`critical`، `high`، `medium`، `low`)، و`description`، و`data_categories text[]`، و`affected_count`، و`discovered_at`، و`confirmed_at`، و`notification_decision`، و`notifications jsonb`، و`root_cause`، و`actions`، و`status` (`open`، `contained`، `notified`، `closed`) (PRIV-07) |
| `external_disclosures` (قياسية) | `requester`، و`legal_basis_ref`، و`request_file_id`، و`approved_by_admin_id`، و`second_approver_admin_id`، و`data_scope`، و`person_ids uuid[]`، و`delivered_at`، و`channel`، و`visible_from` (PRIV-08) |

### 16.4 سجل الانتقالات
**ثابتة** · **مقسّم** شهرياً بـ `occurred_at` · **المتطلبات:** [التصميم التقني §7.8 و§8](19-technical-design.md)، REVERSAL-05، SMART-05

| العمود (`state_transitions`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | uuid | لا | PK مع `occurred_at` |
| occurred_at | timestamptz | لا | — |
| entity_type | text | لا | — |
| entity_id | uuid | لا | — |
| from_status | text | نعم | — |
| to_status | text | لا | — |
| trigger | text | لا | `command`، `timer`، `event`، `cascade` (أثر تتابع من أب، §8.16)، `correction` (مهمة تصحيح أو تصحيح قرار)، `deadline_shift` (نقل مهلة `WALL_USER` بنافذة عطل)، `system` |
| actor_type | text | لا | `user`، `admin`، `police`، `system`، `partner` |
| actor_id | uuid | نعم | — |
| acting_as | text | لا | الصفة (M-14، [التصميم التقني §5.1 و§20.14](19-technical-design.md)): `self` (الافتراضي)، `guardian`، `delegate`، `trusted_contact`، `support_on_behalf`، `representative`، `heir`، `executor`، `legal_agent`، `authority`. والفاعل النظامي `self` مع `actor_type = system` |
| principal_type | text | نعم | الأصيل حين `acting_as <> 'self'`: `user`، `person`، `tenant` |
| principal_id | uuid | نعم | `CHECK ((acting_as = 'self') = (principal_id IS NULL))` |
| cause_event_id | uuid | نعم | الحدث الذي سبّب الانتقال في تتابع |
| correction_ref | text | نعم | مرجع مهمة التصحيح أو طلب تصحيح القرار، لـ `trigger = correction` |
| reason_code | text | نعم | — |
| reason_text | text | نعم | — |
| request_id | uuid | نعم | — |

**الفهارس:** `ix_transitions_entity (entity_type, entity_id, occurred_at)`، و`px_transitions_cause (cause_event_id) WHERE cause_event_id IS NOT NULL`، و`px_transitions_correction (correction_ref) WHERE correction_ref IS NOT NULL`.

### 16.5 مخطط `ops`
**المتطلبات:** [التصميم التقني §3.6 و§9 و§10 و§11 و§13](19-technical-design.md)، TELCO-11، SMART-09

| الجدول | الأعمدة |
|---|---|
| `ops.outbox_events` (**مقسّم** يومياً بـ `occurred_at`، 7 أيام وتُحذف الأقسام كاملة) | `id bigint` تسلسل، و`event_id uuid` (فريد عبر الأقسام بـ `ops.reference_keys` بالنوع `event`)، و`event_type`، و`schema_version`، و`aggregate_type`، و`aggregate_id`، و`aggregate_seq`، و`payload jsonb` (**معرّفات وملخص غير حساس فقط**، ولا فئة `secret_ephemeral` أبداً، FF-30)، و`headers jsonb` (الفاعل و`actingAs` و`causeEventId` والتتبّع)، و`actor_tenant_id` (الاسم القديم `tenant_id`، §1.2)، و`governorate_id`، و`occurred_at`، و`published_at`. وفهرس `px_outbox_unpublished (id) WHERE published_at IS NULL` |
| `ops.consumed_events` (**مقسّم** يومياً بـ `consumed_at`، 14 يوماً) | `consumer text`، و`event_id uuid`، و`consumed_at`، وPK `(consumer, event_id, consumed_at)`. والتفرّد عبر الأقسام مضمون لأن المستهلك يفحص الأقسام الحية ضمن نافذة إعادة النشر (أقل من 14 يوماً) |
| `ops.parked_events` (قياسية) | لمستهلكي فئة `every_event` (§9.4 في التصميم التقني): حين يفشل الحدث k لكيان تُوقف أحداث ذلك الكيان التالية لذلك المستهلك هنا حتى ينجح k أو يُحسم: `consumer`، و`aggregate_type`، و`aggregate_id`، و`event_id`، و`aggregate_seq`، و`blocked_by_event_id`، و`parked_at`، و`released_at`. وفهرس `uq_parked (consumer, event_id)`، و`ix_parked_chain (consumer, aggregate_type, aggregate_id, aggregate_seq) WHERE released_at IS NULL` |
| `ops.dead_letters` (قياسية، المعالَج ⚙️ 90 يوماً) | `source` (`event`، `job`)، و`queue`، و`job_name`، و`consumer`، و`family` (`money`، `accounting`، `telecom_commands`، `security_alerts`، `codes`، `other`)، و`delivery_class` (`latest_state`، `every_event`)، و`critical boolean` (عائلات «كل حدث» الحرجة: تستدعي المناوبة فوراً)، و`event_id`، و`payload jsonb` (معرّفات فقط)، و`error_code`، و`error_human`، و`attempts`، و`first_failed_at`، و`last_failed_at`، و`status` (`open`، `retried`، `resolved`، `discarded`)، و`discard_reason_code` (RSN-DLQ، `system.dead_letters.discard` للمدير العام)، و`handled_by_admin_id`، و`handled_at`. و`CHECK (status <> 'discarded' OR (NOT critical AND discard_reason_code IS NOT NULL))`: **الإسقاط ممنوع** لعائلات «كل حدث» الحرجة، وتُحسم بالنجاح أو المطابقة أو التصحيح فقط |
| `ops.idempotency_keys` | `scope_hash bytea` (النطاق والفاعل والطريقة والمسار)، و`idem_key text`، وPK مركّب، و`request_hash bytea`، و`status` (`in_progress`، `completed`)، و`response_status smallint`، و`response_body jsonb`، و`response_headers jsonb`، و`resource_type`، و`resource_id`، و`created_at`، و`expires_at` (24 ساعة ⚙️) |
| `ops.scheduled_tasks` | `id`، و`task_name`، و`subject_type`، و`subject_id`، و`due_at`، و`dedup_key` فريد، و`payload jsonb`، و`status` (`pending`، `done`، `cancelled`، `failed`)، و`attempts`، و`last_error`، و`created_at`. وفهرس `px_tasks_due (due_at) WHERE status='pending'` |
| `ops.job_runs` (ثابتة) | `job_name`، و`period_key text` (التاريخ المحلي أو الفترة للمهام الدورية)، و`run_mode` (`singleton`، `per_tenant`، `timer`)، و`started_at`، و`finished_at`، و`status`، و`processed_count`، و`cursor jsonb`، و`error`، و`triggered_by` (`schedule`، `catch_up`، `admin`، `correction`)، و`late_generated boolean` («وُلّد متأخراً في …»)، و`dry_run boolean`، و`correction_ref` (مهام التصحيح، §17.8)، و`counts jsonb` و`sample_refs text[]` (أعداد ومراجع عيّنات دون بيانات شخصية). وفهرس `uq_job_period (job_name, period_key) WHERE period_key IS NOT NULL AND NOT dry_run` فريد: تعمل الدورية مرة لكل تاريخ محلي |
| `ops.number_sequences` | `scope text`، و`period smallint` (السنة أو 0)، وPK مركّب، و`last_value bigint`، و`gap_reason` (`restore`: الفجوة الوحيدة المسموحة في `TX-` و`IN-`، قفز ⚙️ 10,000 بعد استعادة)، و`gap_at`، و`gap_restore_event_id`، و`updated_at` |
| `ops.reference_keys` (جدول مفاتيح غير مقسّم، §1.4) | `kind` (`event`، `wallet_operation_number`، `topup_number`، `check_number`، `audit_event`، …)، و`value text`، وPK مركّب، و`table_name`، و`row_id`، و`created_at`. يُدرج في معاملة الصف المقسّم نفسها، فيضمن تفرّد الأرقام المرجعية (`WL-`، و`TP-`) عبر الأقسام |
| `ops.restore_events` (للإدراج فقط) | «إعادة الفتح بعد فقد بيانات»: `kind` (`pitr`، `failover`، `dr_site`، `restore_discontinuity`)، و`restore_point_at` (T0)، و`reopened_at` (T1)، و`last_anchor_id` (آخر تثبيت خارجي باقٍ)، و`last_seal_seq`، و`sequence_jump int` (⚙️ 10,000)، و`steps jsonb` (حالة خطوات دليل التشغيل السبع)، و`performed_by`، و`signature bytea` (صف موقّع) |
| `ops.error_refs` (**مقسّم** يومياً، RT-69 ⚙️ 30 يوماً) | `ref` (`ER-XXXXXXXX`، فريد مع اليوم)، و`request_id`، و`occurred_at`، و`actor_type`، و`actor_id`، و`route_template`، و`error_code`، و`http_status`، و`deployable`، و`server_version`، و`client_platform`، و`client_version`. **لا جسم طلب ولا نص حر ولا شيء من `shoppro`** (D-101)، ويبحث فيه الدعم الفني بـ `error_ref.lookup` لمراجع فاعلها صاحب الطلب المفتوح فقط، ويحذفه `platform.error_refs.purge` |
| `ops.inbound_messages` (ثابتة) | `source` (`telecom:<op>`، `whatsapp`، `sms:<gw>`، `shamcash`، `topup:<op>`، `wallet:<p>`، `courier:<c>`، `customs`)، و`external_id`، و`received_at`، و`signature_valid boolean`، و`mtls_fingerprint`، و`payload_enc 🔐`، و`payload_hash`، و`processing_status`، و`processed_at`، و`error`. وفهرس `uq_inbound (source, external_id)` |
| `ops.integration_calls` (ثابتة، **مقسّم** شهرياً) | `integration`، و`operation`، و`direction`، و`partner_code`، و`correlation_id`، و`request_hash`، و`status_code`، و`outcome` (`ok`، `error`، `timeout`، `circuit_open`)، و`latency_ms`، و`error_code`، و`payload_enc 🔐` (للاتصالات والمزوّدين الماليين فقط) |
| `ops.health_status` (المفتاح `integration_key`) | `status` (`green`، `amber`، `red`)، و`circuit_state`، و`last_success_at`، و`last_error_at`، و`last_error_human`، و`updated_at` |
| `ops.rate_limit_overrides` (قياسية) | `subject_kind` (`cidr`، `api_client`، `tenant`)، و`subject_value`، و`policy_key`، و`limit_value`، و`reason_text`، و`expires_at` |
| `ops.probe_identifiers` (قياسية) | أرقام الطُعم (CT-39): `identifier_type` (`imei`، `serial`)، و`manufacturer_id` (للتسلسلي)، و`value_bidx #️⃣` (البصمة فقط، **ولا يُخزَّن الرقم نفسه** في أي جدول)، و`created_by_admin_id`، و`active`، و`retired_at`، و`retired_reason` (`collision_with_real_device`، `rotated`)، و`hits_count`، و`last_hit_at`. وفهرس `uq_probe (identifier_type, value_bidx)`. لا يقرؤه إلا `worker` ومسؤول الأمن، وتُحمَّل البصمات النشطة في Redis ([التصميم التقني §3.8](19-technical-design.md)) |
| `ops.encryption_keys` | `key_class`، و`key_version`، وPK مركّب، و`kms_ref`، و`status` (`active`، `decrypt_only`، `retired`)، و`activated_at`، و`retired_at`. **بيانات وصفية فقط** |
| `ops.reconciliation_runs` (قياسية) | `domain` (`telecom_lists`، `shamcash_wallets`، `topup`، `courier_cash`، `manual_payments`، `bizapi_usage`، `integrity`: فحص الخصم المكرر والعمليات اليتيمة)، و`partner_code`، و`business_date date`، و`status` (`running`، `completed`، `failed`)، و`expected_count`، و`partner_count`، و`matched_count`، و`diff_count`، و`auto_fixed_count`، و`report_file_id`، و`performed_by_admin_id` (للمطابقة اليدوية). وفهرس `uq_recon_run (domain, partner_code, business_date)` |
| `ops.reconciliation_diffs` (قياسية) | `run_id` FK، و`kind` (`missing_at_partner`، `extra_at_partner`، `amount_mismatch`، `status_mismatch`، `late_result`، `duplicate_debit`، `orphan_operation`)، و`subject_type`، و`subject_id`، و`partner_ref`، و`expected jsonb`، و`actual jsonb`، و`status` (`open`، `auto_fixed`، `resolved`)، و`resolved_by_admin_id`، و`resolution_text`، و`resolved_at` |

### 16.6 مخطط `audit`
**للإدراج فقط** · **المتطلبات:** ADMIN-15، PP-13، SMART-14، 07 §4، CT-89، [التصميم التقني §17](19-technical-design.md)

| العمود (`audit.audit_logs`، **مقسّم** شهرياً بـ `occurred_at`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| id | bigint | لا | تسلسل، PK مع `occurred_at` |
| event_id | uuid | لا | فريد مع `occurred_at` |
| occurred_at | timestamptz | لا | — |
| actor_type | text | لا | `user`، `admin`، `police`، `system`، `partner`، `api_client` |
| actor_id | uuid | نعم | — |
| actor_display | text | نعم | الاسم لحظتها |
| identity_domain | text | لا | `public`، `admin`، `police`، `machine` |
| session_ref | text | نعم | — |
| on_behalf_of | uuid | نعم | الأصيل (يساوي `principal_id`، ويبقى للتوافق) |
| acting_as | text | لا | الصفة (M-14، §16.4)، و`self` افتراضياً |
| principal_type | text | نعم | `user`، `person`، `tenant` |
| principal_id | uuid | نعم | — |
| acting_document_ref | uuid | نعم | مستند الصفة (وثيقة الوصاية، أو كتاب التمثيل، أو شهادة الوفاة) |
| cause_event_id | uuid | نعم | — |
| correction_ref | text | نعم | مهمة التصحيح (`actor_type = system`) |
| action | text | لا | مفتاح الصلاحية أو اسم الحدث |
| entity_type | text | نعم | — |
| entity_id | uuid | نعم | — |
| entity_ref | text | نعم | المرجع المقروء |
| actor_tenant_id | uuid | نعم | الاسم القديم `tenant_id` (الجدول غير معزول، §1.2) |
| governorate_id | smallint | نعم | — |
| police_unit_id | uuid | نعم | لسجل نشاط الجهة |
| reason_code | text | نعم | — |
| reason_text | text | نعم | — |
| outcome | text | لا | `success`، `denied`، `failed` |
| request_id | uuid | نعم | — |
| ip | inet | نعم | — |
| user_agent_hash | bytea | نعم | — |
| changes | jsonb | نعم | قبل وبعد، والحقول الحساسة ببصماتها |

**الفهارس:** `ix_audit_actor (actor_id, occurred_at)`، و`ix_audit_entity (entity_type, entity_id, occurred_at)`، و`ix_audit_unit (police_unit_id, occurred_at)`، و`px_audit_principal (principal_id, occurred_at) WHERE principal_id IS NOT NULL`، و`px_audit_correction (correction_ref) WHERE correction_ref IS NOT NULL`.

| الجدول | الأعمدة |
|---|---|
| `audit.seals` (للإدراج فقط، **مقسّم** شهرياً بـ `event_month`) | `event_month date`، و`seq bigint`، وPK `(event_month, seq)` (الختّام واحد والتسلسل رتيب عبر الأقسام)، و`event_id uuid` و`UNIQUE (event_month, event_id)` (كاف لأن شهر الحدث دالة ثابتة فيه: كل سطر يُختم مرة واحدة، والسطر المتأخر يُختم في دورة لاحقة بتسلسل أعلى)، و`prev_hash bytea`، و`hash bytea`، و`sealed_at`. ويُؤرشف كل قسم مع قسم `audit_logs` المقابل بعد سنتين (RT-39) |
| `audit.anchors` (للإدراج فقط) | `id`، و`up_to_seq`، و`head_hash`، و`signature`، و`anchor_location` (مفتاح الكائن في المخزن غير القابل للتعديل)، و`anchored_at`، و`verified_at` (آخر تحقق ناجح: `audit.chain.verify` يومياً **تزايدياً من آخر تثبيت متحقَّق منه**، وكاملاً لكل شهر عند أرشفته) |

### 16.7 التقويم والعملة وسجل تغييرات القوائم
**المتطلبات:** D-85، D-98، D-118، D-123، N-06 · **الاحتفاظ:** دائم (بلا بيانات شخصية) · **الفئة:** `internal` · **المالك:** التشغيل (بذور تُدرج إن غابت، §17.6)

| العمود (`business_calendar`، المفتاح `day`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| day | date | لا | PK، بتقويم دمشق |
| kind | text | لا | `closed`، `custom_hours` (والأيام غير المدرجة تتبع الأساس الأسبوعي ⚙️ «الأحد إلى الخميس 08:00 إلى 16:00»، الإعداد `backoffice.hours`، وهذا الجدول هو قيمة `backoffice.calendar`) |
| opens_at | time | نعم | لـ `custom_hours`. `CHECK ((kind = 'custom_hours') = (opens_at IS NOT NULL AND closes_at IS NOT NULL))` |
| closes_at | time | نعم | `CHECK (closes_at > opens_at)` |
| label_ar | text | لا | «عيد الفطر»، «دوام رمضان»، «إغلاق طارئ» |
| official_ref | text | نعم | مرجع القرار الرسمي |
| provisional | boolean | لا | العطل القمرية مبدئية قابلة للتعديل |
| version | int | لا | — |
| updated_by_admin_id | uuid | لا | `calendar.manage` بإعادة تحقق، وكل تعديل يشغّل `config.calendar.recompute` ويُكتب في `catalog_changes` |

| العمود (`currency_units`، المفتاح `code`) | النوع | فارغ | القيود والوصف |
|---|---|---|---|
| code | char(3) | لا | PK بصيغة ISO 4217 |
| name_ar | text | لا | — |
| minor_exponent | smallint | لا | أس الوحدة الصغرى (`CHECK (minor_exponent BETWEEN 0 AND 3)`) |
| valid_from | date | لا | بداية الوحدة الرسمية |
| previous_code | char(3) | نعم | الوحدة السابقة |
| ratio_from_previous | bigint | نعم | نسبة التحويل عن السابقة (مثل 100 لحذف صفرين). `CHECK ((previous_code IS NULL) = (ratio_from_previous IS NULL))` |
| transition_from | date | نعم | نافذة الفترة الانتقالية الرسمية: يظهر المقابل بالوحدة القديمة بخط صغير في شاشات الإدخال والإيصالات والفواتير |
| transition_to | date | نعم | — |
| is_current | boolean | لا | فهرس `px_currency_current (is_current) WHERE is_current` فريد. **ولا يُحوَّل أي صف قديم في مكانه** (D-118)، وهذا الجدول الطريق الوحيد للعرض بوحدة أخرى |

| الجدول | الأعمدة |
|---|---|
| `catalog_changes` (للإدراج فقط، N-06) | **مجموعة تغيير لكل حفظ** في قائمة تُدار من اللوحة (المحافظات والمناطق، والشركات المصنّعة وأنماطها، وأنواع النشاط، والباقات وأسعارها، والتقويم، وبادئات المشغّلين، وحدود الطلبات، والأدوار، وتصنيفات الدعم): `change_set_id`، و`entity_type`، و`entity_id`، و`entity_version int`، و`before jsonb`، و`after jsonb`، و`actor_admin_id`، و`permission_key` (صلاحية القائمة)، و`reason_code`، و`reason_text`، و`request_id`، و`reverts_change_set_id` (الرجوع تغيير جديد بالتحقق نفسه)، و`created_at`. والحدث `catalog.changed`. **والرموز لا تتغير**: يُتقاعد الصف (`active = false`) ولا يُحذف. وفهرس `ix_catalog_changes_entity (entity_type, entity_id, created_at)` |

## 17. التقسيم والاحتفاظ والحذف

### 17.1 الجداول المقسّمة

| الجدول | عمود التقسيم | الحجم | ما يحدث للأقسام القديمة |
|---|---|---|---|
| `imei_checks` | `checked_at` | شهري | حذف أو إخفاء هوية بسياسة الاحتفاظ، قسماً كاملاً حيث أمكن |
| `geo_private.check_locations` | `checked_at` | شهري | تخفيض الدقة بعد 90 يوماً ⚙️، ثم الحذف بالسياسة |
| `geo_private.telecom_location_updates` | `received_at` | شهري | بالسياسة، والمرتبط ببلاغ محجوز يبقى |
| `telecom_events` | `received_at` | شهري | بالسياسة |
| `civil_registry_queries` | `created_at` | شهري | بالسياسة والاتفاقية (CIVIL-07) |
| `notifications`، `notification_deliveries` | `created_at` | شهري | بالسياسة |
| `data_access_events` | `created_at` | شهري | بالسياسة |
| `state_transitions` | `occurred_at` | شهري | أرشفة |
| `wallet_operations`، `topup_orders` | `created_at` | شهري | السجلات المالية بمدتها القانونية (RT-41 في 21) |
| `api_usage_events`، `ops.integration_calls` | `occurred_at`، `created_at` | شهري | بالسياسة |
| `ops.outbox_events` | `occurred_at` | يومي | حذف بعد 7 أيام |
| `audit.audit_logs` | `occurred_at` | شهري | **لا حذف أبداً**، وأرشفة بعد سنتين (07 §4) |
| `device_timeline_entries` | `occurred_at` | سنوي | يتبع الجهاز |

- الأقسام تُنشأ قبل 3 أشهر من موعدها بمهمة `platform.partitions.maintain`، وغياب قسم قادم تنبيه فوري.
- الفهارس محلية لكل قسم. والتفرّد العابر للأقسام يُضمن بجدول مرجعي غير مقسّم حيث يلزم (`ops.inbound_messages`، و`wallet_operation_refs`).
- الأرشفة: فصل القسم ثم تصديره موقّعاً إلى تخزين بارد في الولاية القضائية نفسها، مع بصمة تُسجَّل في `purge_runs`.

### 17.2 الاحتفاظ

- **المدد** في [الخصوصية وتقييم الأثر](21-privacy-dpia.md) §5 برموز `RT-NN`، وكل مدة إعداد ⚙️ بموافقة شخصين.
- **الآلية** في `retention_policies` (§16.3): الجدول والأعمدة ومفتاح المدة وعمود البداية والإجراء (`delete`، `anonymize`، `reduce_precision`، `archive`). ومحرك الاحتفاظ ([التصميم التقني §10](19-technical-design.md)) يقرأ السياسات ولا مدة مكتوبة في الكود.
- **الحجز** في `retention_holds` يستثني الكيان وما يرتبط به (البلاغ مع أدلته وفحوص جهازه وأحداث شبكته، والشخص مع معاملاته).
- **الملفات** تُحذف من المخزن مع الصف (`files.status = purged`)، ومفاتيح المجموعات تتيح المحو التشفيري للنسخ الاحتياطية ([التصميم التقني §12.5](19-technical-design.md)).
- **المحاسبة** (`shoppro`) تبقى للقراءة والتصدير ⚙️ 12 شهراً بعد انتهاء الاشتراك ثم تُحذف ما لم يُجدَّد (SHOPPRO-15).

### 17.3 الحذف

| الفئة | القاعدة |
|---|---|
| لا حذف أبداً | `ownerships`، و`shop_transactions`، و`invoices`، و`reports` بعد الإرسال، و`security_alerts`، و`state_transitions`، و`reversal_requests`، و`payments`، و`service_activations`، و`commercial_invoices`، و`supplier_settlements`، و`shoppro.journal_*` ما دام الاشتراك أو مهلة القراءة قائمة، و`audit.*` |
| إخفاء ثم حذف بالسياسة (`deleted_at`) | `saved_filters`، و`products` المسحوبة، والمسودات (`reports` بحالة `draft` تُلغى ثم تُحذف بالسياسة) |
| حذف بمحرك الاحتفاظ فقط | كل ما سواها حسب `retention_policies`، ولا حذف يدوي خارجه إلا بإجراء موثّق ضمن طلب صاحب بيانات أو حادث |
| إغلاق الحساب (PRIV-02) | يُحذف من `users` بيانات الدخول، ومن `sessions` و`refresh_tokens` و`user_devices` و`alternate_contacts` و`trusted_contacts` كل الصفوف، وصور الهوية ما لم يوجد حجز. ويبقى `persons` وملكياته ومعاملاته وبلاغاته في السجل الوطني |

### 17.4 الترحيلات والبيانات الأولية

الترحيلات للأمام فقط بنمط «توسيع ثم تقليص» ([التصميم التقني ADR-03](19-technical-design.md)). والبذور ترحيلات مرقّمة قابلة للتكرار:

| البذرة | الجداول |
|---|---|
| المرجعيات الجغرافية | `governorates` بمضلّعاتها، و`areas`، و`governorate_activations` (كلها غير مفعّلة) |
| الأجهزة | `manufacturers`، و`tac_entries` الأولية |
| الأنشطة | `shop_activity_types` |
| الصلاحيات | `permissions`، و`roles` الخمسة، و`role_permissions`، و`permission_sod_rules` |
| الإعدادات | `settings` بافتراضات 06 §15 و[التصميم التقني](19-technical-design.md) |
| المفاتيح | `feature_toggles` بحالة يوم الإطلاق (ROLLOUT-06) |
| المحتوى | `content_entries` و`message_templates` من [كتالوج المحتوى](24-content-catalog.md) |
| التجارة | `features`، والباقتان الافتراضيتان في `packages` (D-93)، و`product_categories` مع الأقسام الممنوعة المقفلة (`is_prohibited` و`system_locked`): خطوط D-70، ومعها حسب D-99 اللوحات الأم المستعملة مجهولة المصدر، وأدوات التجسّس والتتبّع، وأجهزة التشويش على الشبكات، والبرامج غير المرخّصة، و`ad_placements`، و`operator_prefixes` |
| الخصوصية | `consent_purposes`، و`retention_policies` |
| الدفتر | دليل حسابات `shoppro.ledger_accounts` يُبذر لكل محل عند أول تفعيل للباقة |

## 18. ملخص العزل والتشفير والمواقع

### 18.1 الجداول المعزولة بـ RLS

| المستأجر | الجداول |
|---|---|
| المحل | `shops`، و`shop_activities`، و`shop_branches`، و`shop_members`، و`shop_transactions`، و`shop_tx_corrections`، و`shop_compliance_status`، و`invoices`، و`repair_jobs`، و`board_replacements`، و`report_batches`، و`shop_subscriptions`، و`shop_wallets`، و`wallet_member_limits`، و`wallet_operations`، و`topup_orders`، وكل مخطط `shoppro` |
| الوكيل | `importers`، و`importer_members`، و`import_batches`، و`import_batch_rows` |
| طرفان | `wholesale_transfers` و`wholesale_transfer_items` (الوكيل والمحل)، و`store_orders` و`order_items` و`order_item_devices` و`returns` (المشتري والمورّد) |
| المورّد | `suppliers`، و`supplier_users`، و`supplier_payout_accounts`، و`products` (للكتابة)، و`supplier_settlements`، و`settlement_lines` |
| مندوب الشحن | `couriers`، و`courier_users`، و`shipments`، و`courier_collections` |
| صاحب الرمز | `shipment_codes` (المورّد لرمز الاستلام، والمحل المشتري لرمز التسليم، ولا يقرؤه المندوب) |
| كل الأنواع | `tenant_documents`، و`tenant_change_requests`، و`civil_registry_queries` (إدراج)، و`service_orders`، و`payments`، و`commercial_invoices` |

### 18.2 نطاق الأمن

`reports`، و`tips`، و`security_alerts`، و`shop_transactions`، و`repair_jobs`، و`seized_devices`، و`tracking_sessions`، و`device_timeline_entries`، وجداول `geo_private`، عبر `governorate_id` و`police_scope_links`. والبحث الوطني برقم IMEI عبر دالة الملخص الوحيدة ([التصميم التقني §6.2](19-technical-design.md)). ولا وصول لـ `commerce` و`shoppro`.

### 18.3 الحقول المشفّرة 🔐

| فئة المفتاح | الحقول |
|---|---|
| `pii.national_id` | `persons.national_id_enc`، و`identity_verifications.declared_national_id_enc`، و`ownership_transfers.to_national_id_enc`، و`shop_transactions.counterparty_national_id_enc`، و`repair_jobs.owner_national_id_enc`، و`police_case_lookups.national_id_enc`، و`police_import_rows.owner_national_id_enc`، و`civil_registry_queries.national_id_enc` |
| `pii.msisdn` | `telecom_events.msisdn_enc` و`imsi_enc`، و`geo_private.telecom_location_updates.msisdn_enc`، و`telecom_sim_history_queries.msisdn_enc`، و`line_suspension_requests.msisdn_enc`، و`wallet_freeze_requests.msisdn_enc`، و`alternate_contacts.phone_enc`، و`imei_checks.wa_number_enc` و`sms_sender_enc`، و`bot_sessions.sender_enc`، و`otp_challenges.target_enc`، و`topup_orders.msisdn_enc`، و`shoppro.customers.phone_enc` |
| عناوين الشبكة | لا تشفير حقل: `imei_checks.ip` و`sessions.ip` و`staff_sessions.ip` و`audit.audit_logs.ip` بتشفير التخزين الكامل، ويحكمها الاحتفاظ |
| `pii.contact` | `tips.contact_enc`، و`shop_transactions.counterparty_email_enc`، و`identity_verifications.extra_field_enc` |
| `wallet.destination` | `shop_wallets.external_account_ref_enc` و`owner_destination_enc`، و`supplier_payout_accounts.account_ref_enc`، و`wallet_operations.counterparty_ref_enc` (المحفظة المرسِلة في الشحن الوارد) |
| `secret.code` | `shipment_codes.code_enc` (رمزا الاستلام والتسليم لمرة واحدة) |
| `secret.totp`، `secret.api` | `staff_mfa_factors.totp_secret_enc`، و`api_keys.secret_enc` |
| `partner.payload` | `ops.inbound_messages.payload_enc`، و`ops.integration_calls.payload_enc` |
| `file.dek` | `files.dek_enc` لصور الهويات وهوية البائع والأدلة والاستيراد والتصدير |

ولكل حقل بحث بصمته #️⃣ بمفتاح منفصل لكل فئة (CT-27).

### 18.4 المواقع 📍

مواقع الأشخاص والأجهزة في `geo_private` فقط: `check_locations`، و`operation_locations`، و`incident_locations`، و`findmy_locations`، و`telecom_location_updates`. ومواقع العمل الموثّقة في جداولها: `shops.location`، و`importers.location`، و`shop_branches.location`. ولا يُعرض أي موقع لصاحب الجهاز أبداً (D-46).

## 19. تغطية المتطلبات

| الوحدة في 04 | الجداول |
|---|---|
| AUTH | §4، و`admin_users` و`staff_*` (§5) |
| CHECK، WABOT، SMS | `imei_checks`، و`check_receipts`، و`bot_sessions`، و`geo_private.check_locations`، و`gsma_cache`، و`customs_cache` |
| REPORT، ONBEHALF، TRUSTED، THEFT | §9، و`alternate_contacts`، و`trusted_contacts`، و`line_suspension_requests`، و`wallet_freeze_requests` |
| SHOP، REPAIR، IMPORTER | §10، و`geo_private.operation_locations` |
| OWN، PROTECT | §7 |
| NOTIF | §13.1 إلى §13.4 |
| TIP، DISPUTE | `tips`، و`disputes`، و`dispute_evidence` |
| ADMIN، SMART | §5، و§16.1، و`admin_work_items`، و`ops.health_status`، و`ops.dead_letters`، و`audit.*` |
| TELCO، TRACK | §12.1 إلى §12.6، و`geo_private.telecom_location_updates` |
| GEO | `governorates`، و`areas`، و`geo_private.*` |
| PUB | `verification_codes`، و`invoices`، و`certificates`، و`check_receipts` |
| CIVIL | `civil_registry_queries` |
| POLICE، PP | `police_imports`، و`police_import_rows`، و§11.3 إلى §11.7 |
| GSMA، CUSTOMS، FAKE | §12.8، و`tac_entries`، و`device_conflicts` |
| APPVER، THEME، ROLLOUT | `settings`، و`feature_toggles`، و`content_entries`، و§13.7 |
| COMPLIANCE | `compliance_reports`، و`shop_compliance_status` (COMPLIANCE-04) |
| SMART-15 | `kpi_reports` |
| ADMIN-18 | `device_merges`، و`devices.merged_into_id`، و`device_timeline_entries` |
| PRIV-01..11 | §16.3، و`users.minor_managed` و`authorized_users.is_minor` (PRIV-09)، وغياب أي صلاحية على `shoppro` لغير المحل (PRIV-11، D-101) |
| PP-14 | `retention_holds` (LH-2 بـ `case_ref_id`)، و`data_access_events.secrecy_extended_until` |
| D-96، D-97 | `shop_transactions.hold_reason` و`minor_involved`، و`authorized_users.source` |
| المراجعة الثانية | الاستعادة الذاتية (`account_recoveries.initiated_by_type` و`recovery_token_hash`، و`handoff_tokens.recovery_id`، و`capture_nonces.recovery_id`)، وجلسة «بلاغ السرقة فقط» (`sessions.scope`، و`reports.via_theft_session`)، و«نسيت كلمة المرور» للموظفين (`staff_credential_resets`)، وحساب الطوارئ (`admin_users.is_break_glass`)، والروابط (`link_tokens`)، وD-100 (`feature_toggles.expires_at` و`second_approver_admin_id`)، وحالات المحفظة (`external_frozen`)، و`returns.return_number`، ومسؤولو عملاء الربط (`api_client_users`)، وD-101 (حذف جداول إذن الدعم) |
| DATAACCESS | `data_access_events` |
| LINE، WALLET | `line_suspension_requests`، و`wallet_providers`، و`wallet_freeze_requests` |
| STORE، PAY | §14.1 إلى §14.5 |
| ADS، HISTORY، BIZAPI | §14.8 |
| SHOPWALLET، TOPUP | §14.6، و§14.7، و`ops.reconciliation_*` |
| SHOPPRO | §15، و`shop_subscriptions` |
| SUPPORT | §13.5 |
| HANDOFF | `handoff_tokens`، و`capture_nonces` |
| REVERSAL | `reversal_requests`، و`state_transitions` |
| SERIAL | `manufacturers`، و`devices.device_class`، و`device_identifiers` (`serial`) |
| الخصوصية (21) | §16.3 |

## 20. تغطية بنود مراجعة الجاهزية

| البند في [مراجعة الجاهزية](16-readiness-review.md) | ما يغلقه هنا | القسم |
|---|---|---|
| **B-08** نموذج البيانات الفيزيائي المكتمل | كل جدول بأعمدته وأنواعها وقابليتها للفراغ وقيودها وفهارسها، مع علامات التشفير والمواقع والعزل والمتطلبات، ومخططات العلاقات حسب المجال | §1 إلى §16 |
| ب.8 نموذج البيانات الفيزيائي | كما في B-08 | §1 إلى §16 |
| ب.10 التفرّد ودمج الأجهزة (جانب البيانات) | الفهارس الفريدة والجزئية، و`device_merges`، و`device_conflicts` | §6، §7، §9 |
| ب.18 الحذف المنطقي والإصدارات | `version`، وجداول الإصدارات، وقواعد الحذف | §1.2، §16.1، §17.3 |
| ب.19 الاحتفاظ والأرشفة والتقسيم | الجداول المقسّمة، وجداول الاحتفاظ والحجز وتشغيلاتها | §17، §16.3 |
| ب.20 ترحيلات قاعدة البيانات والبيانات الأولية | سياسة الترحيل والبذور | §17.4 |
| ب.22 سجل التدقيق وإصدارات المفاتيح | مخطط `audit` والختم، و`ops.encryption_keys` | §16.5، §16.6 |
| هـ.10 التشفير وتصنيف البيانات | علامات 🔐 و#️⃣ و📍 لكل حقل، وفئات المفاتيح | §1.3، §18.3، §18.4 |
| هـ.15 آلية الاحتفاظ والحذف (جانب البيانات) | `retention_policies`، و`retention_holds`، و`purge_runs` | §16.3، §17 |
| هـ.17 الأساس القانوني وسجلات الموافقة | `consent_purposes`، و`consent_texts`، و`consents`، و`terms_acceptances` | §16.3 |
| أ.22 سجل قبول الشروط | `terms_acceptances` | §16.3 |
| و.14 التحكم بالدفعات حسب المحافظة والتجريب بدعوة (جانب البيانات) | `rollout_invites`، و`governorate_activations` | §13.7 |
