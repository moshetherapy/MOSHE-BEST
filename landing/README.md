# בין לבין · דף נחיתה

דף סטטי, בלי build ובלי תלויות: `index.html` + `styles.css` + `app.js` + **`config.js`**.
אפשר להעלות את התיקייה `landing/` כמו שהיא ל-Netlify / Vercel / Cloudflare Pages / GitHub Pages או לכל אחסון.

## מה מחליפים ואיפה

**כמעט הכל נמצא ב-`config.js`:**

| מה | שדה |
|---|---|
| מספר וואטסאפ + הודעות פתיחה | `contact.whatsappNumber`, `whatsappMessage`, `whatsappBookingMessage` |
| טלפון / מייל / אינסטגרם | `contact.phone`, `contact.email`, `contact.instagramUrl` |
| קישור לקביעת סדנה (יומן) | `links.bookingUrl` (ריק = וואטסאפ) |
| **[PAYMENT LINK]** קישור תשלום | `links.paymentUrl` (ריק = וואטסאפ) |
| **[FORM ENDPOINT]** טופס לידים | `leadForm.endpoint` (ריק = הליד נפתח כהודעת וואטסאפ אליך) |
| **[META PIXEL ID]** / **[GA4 ID]** | `tracking.metaPixelId`, `tracking.ga4Id` |
| וידאו / תמונת רקע לפתיחה | `hero.video`, `hero.image` |
| **[MOSHE PHOTO]** | `about.image` |
| **[VIDEO 1–3]** שלושת הסרטונים | `videos[].url` (+ `poster`) |
| מיקום / משך / **מחיר** | `details.*` |

ערך ב-`details` שמתחיל ב-`[` מוצג מסומן בדף כ-placeholder.

**מחוץ ל-config (רק פעם אחת, לפני העלייה):** ב-`index.html` להחליף את `https://YOUR-DOMAIN.co.il`
בכתובת האמיתית (canonical + Open Graph). פייסבוק ווואטסאפ לא מריצים JavaScript, לכן זה חייב להיות בתוך ה-HTML.

## סרטונים
נתמך: קובץ `mp4`/`webm` ישיר, YouTube (כולל Shorts), Vimeo, Instagram Reel.
הנגן נטען רק בלחיצה, כדי שהדף יישאר מהיר. לקבצי mp4 מומלץ להוסיף `poster`.
ברגע שיש לפחות סרטון אחד, משבצות ריקות מוסתרות אוטומטית.

## אירועי מדידה
| אירוע | מתי | Meta | GA4 |
|---|---|---|---|
| PageView | טעינה | PageView | page_view |
| ViewContent | גלילה לאזור "אז מה בעצם עושים?" | ViewContent | ViewContent |
| Lead | שליחת טופס | Lead | Lead + generate_lead |
| WhatsAppClick | כל כפתור וואטסאפ | WhatsAppClick + Contact | WhatsAppClick |
| BookingClick | "קובעים סדנה" / "אני רוצה לקבוע סדנה" | BookingClick + Schedule | BookingClick |
| PaymentClick | "להזמנת הסדנה" (כשיש paymentUrl) | PaymentClick + InitiateCheckout | PaymentClick |
| VideoPlay | הפעלת סרטון | VideoPlay | VideoPlay |

כל אירוע נדחף גם ל-`dataLayer` (מוכן ל-GTM). לבדיקה: להוסיף `?debug=1` לכתובת ולפתוח console.
פרמטרי UTM / fbclid נשמרים ונשלחים יחד עם הליד.

## בדיקה מקומית
```
npx http-server landing -p 8080
```
