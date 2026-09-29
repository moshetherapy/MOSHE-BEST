---
name: "publish-post"
description: "מפרסם בפייסבוק פוסט מאושר אחד בכל הרצה – הפוסט הראשון ב Tracker שה Approval Status שלו APPROVED ושעוד לא פורסם. מעדכן ב Tracker את Publish Status ו Publish Date. רץ בימי שני וחמישי ב 08:00."
---

מטרה

לפרסם בכל הרצה פוסט אחד בלבד בפייסבוק, לפי הסדר שבו הפוסטים מופיעים ב FB content tracker.xlsx.

תזמון

ה Skill רץ בכל יום שני ובכל יום חמישי בשעה 08:00 (שעון ישראל, Asia/Jerusalem).

ביום שני מתפרסם הפוסט המאושר הבא בתור, וביום חמישי הפוסט המאושר הבא אחריו. הסדר נקבע רק לפי סדר השורות בקובץ.

בחירת הפוסט

פתח את FB content tracker.xlsx (גיליון Tracker).

עבור על השורות לפי הסדר, מלמעלה למטה.

בחר את השורה הראשונה שעומדת בשני התנאים:
Approval Status = APPROVED
Publish Status אינו PUBLISHED

לעולם אל תפרסם שוב פוסט ש Publish Status שלו PUBLISHED.

פרסם פוסט אחד בלבד בכל הרצה, גם אם יש כמה פוסטים מוכנים.

אם אין פוסט שעומד בתנאים, אל תפרסם דבר, אל תשנה את הקובץ, ודווח: "אין כרגע פוסט מאושר שמוכן לפרסום."

עמודות

אם העמודות Publish Status ו Publish Date לא קיימות ב Tracker, הוסף אותן בסוף שורת הכותרות.

ערך ברירת מחדל ל Publish Status הוא PENDING. Publish Date ריק עד לפרסום.

תוכן הפוסט

פתח את קובץ posts/WXX PXX.md של אותו Idea ID.

הטקסט לפרסום הוא התוכן של השדה Post Content בלבד, כפי שהוא, בלי שינויים ובלי כותרות ה Markdown.

אם בקובץ יש גם Caption או Hashtags, הוסף אותם בסוף הטקסט.

אם Post Content חסר או ריק, אל תפרסם ואל תדלג לפוסט הבא. עצור את ההרצה ודווח על הבעיה.

פרסום

הפרסום מתבצע דרך Metricool.

1. הפעל getBrandSettings ומצא את המותג moshetherapy (ה id שלו הוא ה blogId).
2. ודא ש Facebook מחובר למותג (מופיע ב networksData). אם Facebook לא מחובר, אל תפרסם, אל תעדכן את הקובץ, ודווח שצריך לחבר את עמוד הפייסבוק ל Metricool.
3. הפעל createScheduledPost עם:
   - providers: [{"network":"facebook"}]
   - facebookData: {"type":"POST"}
   - text: תוכן הפוסט
   - autoPublish: true, draft: false
   - publicationDate: השעה הנוכחית ועוד כ 2 דקות, timezone Asia/Jerusalem
4. פרסום נחשב מוצלח רק אם Metricool החזיר תשובה תקינה בלי שגיאה.

עדכון ה Tracker

רק לאחר פרסום מוצלח, עדכן באותה שורה:
Publish Status = PUBLISHED
Publish Date = תאריך ושעת הפרסום בפורמט YYYY-MM-DD HH:MM (שעון ישראל)

אל תשנה עמודות אחרות.

אם הפרסום נכשל, אל תסמן PUBLISHED. השאר את השורה כפי שהיא ודווח על השגיאה.

שמירה

שמור את הקובץ, בצע commit עם הודעה ברורה (למשל: Publish W40 P01 to Facebook), ובצע push.

Output

דווח את ה Idea ID, נושא הרעיון, תאריך ושעת הפרסום, ושה Tracker עודכן.

אם לא פורסם דבר, דווח את הסיבה.
