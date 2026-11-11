// i18n.js - Bilingual English / Arabic Localization for Voixt

const translations = {
  en: {
    siteTitle: 'Voixt — Intelligent Voice to Text',
    brandName: 'Voixt',
    brandTagline: 'Speech to Text Studio',
    
    // Intro Section
    introBadge: 'AI-Powered Audio Transcription',
    introTitle: 'Transform Spoken Voice into Flawless Text',
    introDesc: 'Voixt records your voice directly in the browser and intelligently slices lengthy recordings at natural pauses without cutting words. Powered by advanced Gemini AI for unmatched accuracy in English and Arabic.',
    introActionRecord: 'Start Recording',
    introActionUpload: 'Upload Audio File',

    // Features
    feat1Title: 'Natural Word Boundary Chunking',
    feat1Desc: 'Analyzes audio energy pauses to prevent splitting words mid-syllable.',
    feat2Title: 'Bilingual Mastery',
    feat2Desc: 'Native comprehension of Arabic (MSA & dialects) and English.',
    feat3Title: 'Server-Side Privacy',
    feat3Desc: 'API keys remain secured in serverless functions, never in client browsers.',

    // Studio / Recording Console
    studioTitle: 'Voice Recording Console',
    studioSubtitle: 'Speak naturally. Long recordings will be sliced cleanly at pauses.',
    statusReady: 'Ready to record',
    statusRecording: 'Recording in progress...',
    statusPaused: 'Recording paused',
    statusProcessing: 'Analyzing audio pauses & chunking...',
    statusTranscribing: 'Transcribing chunk {current} of {total} via Gemini AI...',
    statusDone: 'Transcription complete!',
    statusError: 'Error occurred during processing',

    // Controls
    btnRecord: 'Record',
    btnPause: 'Pause',
    btnResume: 'Resume',
    btnStop: 'Stop & Transcribe',
    btnCancel: 'Cancel',
    uploadPrompt: 'Or drop an audio file here (.mp3, .wav, .m4a, .webm)',
    uploadBrowse: 'Browse Files',

    // Settings
    settingsTitle: 'Transcription Settings',
    targetLanguageLabel: 'Target Language:',
    langAuto: 'Auto-Detect (Original Spoken)',
    langEn: 'English (Transcribe / Translate)',
    langAr: 'Arabic (العربية - فصحى ولغات)',
    chunkSizeLabel: 'Target Chunk Length:',
    chunkSec: 'seconds (at natural pauses)',

    // Transcription Output
    outputTitle: 'Transcribed Text',
    outputPlaceholder: 'Your transcribed text will appear here with natural punctuation and paragraph formatting...',
    wordsCount: 'Words',
    charsCount: 'Characters',
    chunksCount: 'Chunks',
    btnCopy: 'Copy Text',
    btnCopied: 'Copied!',
    btnDownload: 'Download .TXT',
    btnClear: 'Clear',

    // Alerts & Notifications
    micPermissionError: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
    noAudioError: 'No audio was recorded. Please speak into your microphone and try again.',
    chunkNotification: 'Audio split into {count} natural chunks without cutting words.',
    singleChunkNotification: 'Audio recorded smoothly as 1 continuous chunk.',
    apiError: 'Transcription request failed. Please check server logs and configuration.',
    copiedSuccess: 'Text successfully copied to clipboard!'
  },

  ar: {
    siteTitle: 'Voixt — تحويل الصوت إلى نصوص بالذكاء الاصطناعي',
    brandName: 'فوكست | Voixt',
    brandTagline: 'استوديو تحويل الصوت إلى نص',
    
    // Intro Section
    introBadge: 'تحويل الصوت إلى نصوص بالذكاء الاصطناعي',
    introTitle: 'حوّل صوتك إلى نصوص دقيقة واحترافية',
    introDesc: 'يقوم Voixt بتسجيل صوتك مباشرة عبر المتصفح، وتقسيم التسجيلات الطويلة بذكاء عند فترات الصمت الطبيعية دون قطع أي كلمة في المنتصف، مع معالجة دقيقة وسريعة عبر أحدث نماذج Gemini AI باللغتين العربية والإنجليزية.',
    introActionRecord: 'ابدأ التسجيل الصوتي',
    introActionUpload: 'رفع ملف صوتي',

    // Features
    feat1Title: 'تقسيم ذكي بدون قطع الكلمات',
    feat1Desc: 'يرصد فترات السكون الطبيعية في نبرة الصوت لتجزئة التسجيل دون بتر الكلمات.',
    feat2Title: 'دعم كامل للغة العربية والإنجليزية',
    feat2Desc: 'فهم عميق للفصحى ومختلف اللهجات العامية والإنجليزية بدقة فائقة.',
    feat3Title: 'أمان وحماية تامة للبيانات',
    feat3Desc: 'مفاتيح الربط البرمجي محفوظة داخل خوادم سحابية محمية دون أي كشف للمتصفح.',

    // Studio / Recording Console
    studioTitle: 'لوحة التسجيل الصوتي',
    studioSubtitle: 'تحدّث بحرية، وسيتم تجزئة الصوت الطويل تلقائياً عند الوقفات الطبيعية.',
    statusReady: 'جاهز لبدء التسجيل',
    statusRecording: 'جاري تسجيل الصوت الآن...',
    statusPaused: 'التسجيل متوقف مؤقتاً',
    statusProcessing: 'تحليل نبرات الصوت وتحديد فواصل الوقفات الطبيعية...',
    statusTranscribing: 'جاري تحويل الجزء {current} من {total} عبر الذكاء الاصطناعي...',
    statusDone: 'اكتمل التحويل بنجاح!',
    statusError: 'حدث خطأ أثناء معالجة الصوت',

    // Controls
    btnRecord: 'تسجيل',
    btnPause: 'إيقاف مؤقت',
    btnResume: 'استئناف',
    btnStop: 'إنهاء والتحويل إلى نص',
    btnCancel: 'إلغاء',
    uploadPrompt: 'أو اسحب وأفلت ملفاً صوتياً هنا (.mp3, .wav, .m4a, .webm)',
    uploadBrowse: 'استعراض الملفات',

    // Settings
    settingsTitle: 'إعدادات التحويل اللغوي',
    targetLanguageLabel: 'لغة المخرجات المطلوبة:',
    langAuto: 'اكتشاف تلقائي (نفس لغة الحديث)',
    langEn: 'الإنجليزية (تفريغ / ترجمة إلى English)',
    langAr: 'العربية (تفريغ / ترجمة إلى العربية)',
    chunkSizeLabel: 'طول المقطع المستهدف:',
    chunkSec: 'ثانية (عند فترات الصمت الطبيعي)',

    // Transcription Output
    outputTitle: 'النص المفرّغ',
    outputPlaceholder: 'سيظهر النص المستخرج هنا منسقاً بعلامات الترقيم والفقرات المناسبة...',
    wordsCount: 'الكلمات',
    charsCount: 'الحروف',
    chunksCount: 'المقاطع',
    btnCopy: 'نسخ النص',
    btnCopied: 'تم النسخ!',
    btnDownload: 'تحميل (.TXT)',
    btnClear: 'مسح',

    // Alerts & Notifications
    micPermissionError: 'تم رفض إذن الوصول إلى الميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح.',
    noAudioError: 'لم يتم تسجيل أي صوت. يرجى التحدث والمحاولة مرة أخرى.',
    chunkNotification: 'تم تجزئة الصوت بنجاح إلى {count} مقاطع عند وقفات الصمت الطبيعية دون بتر أي كلمة.',
    singleChunkNotification: 'تم حفظ التسجيل في مقطع صوتي نقي واحد.',
    apiError: 'تعذر الاتصال بخدمة التحويل. يرجى التحقق من الخادم وإعدادات المفتاح.',
    copiedSuccess: 'تم نسخ النص إلى الحافظة بنجاح!'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('voixt_lang') || 'en';
  }

  init() {
    this.setLanguage(this.currentLang);
  }

  t(key, params = {}) {
    const dict = translations[this.currentLang] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('voixt_lang', lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Update active state on language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Fire custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }
}

window.i18n = new I18nManager();

