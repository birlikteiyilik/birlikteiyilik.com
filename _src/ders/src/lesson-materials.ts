import {
  type ArchiveData,
  type ArchiveLesson,
  type ArchivePlan,
  type TopicCategory,
  bandForGrade,
  buildLessonGuide,
  levelForGrade,
} from "./lesson-guide";

type LessonGuide = ReturnType<typeof buildLessonGuide>;

export type LessonSourceBundle = {
  documentName: string;
  pages: Array<{ number: number; text: string }>;
  text: string;
};

export type MaterialKit = {
  teachingTitle: string;
  teachingParagraphs: string[];
  boardPlan: Array<{ label: string; text: string }>;
  conceptCards: Array<{ term: string; meaning: string; prompt: string }>;
  scenarioCards: Array<{ title: string; situation: string; prompt: string; suggested: string }>;
  sequenceCards: Array<{ label: string; detail: string }>;
  matchPairs: Array<{ id: string; left: string; right: string }>;
  quiz: Array<{ question: string; choices: string[]; correctIndex: number; feedback: string }>;
  emotionCards: Array<{ label: string; cue: string }>;
  exitTicket: string[];
  observation: string[];
  teacherLanguage: string[];
};

const trLower = (value: string) => value.toLocaleLowerCase("tr-TR");

const normalize = (value: string) => trLower(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9çğıöşü\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const stopWords = new Set([
  "ve", "ile", "bir", "bu", "icin", "için", "nin", "nın", "nun", "nün", "mi", "mı",
  "mu", "mü", "ne", "nedir", "anlami", "anlamı", "onemi", "önemi", "fazileti", "hakkinda",
  "hakkında", "olarak", "olan", "etmek", "etmenin", "bizim", "dini", "dîni",
]);

function topicTokens(lesson: ArchiveLesson) {
  return normalize(lesson.strands.join(" "))
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function cleanExtractedText(text: string) {
  return text
    .replace(/([A-Za-zÇĞİÖŞÜçğıöşü])-\s*\n\s*([A-Za-zÇĞİÖŞÜçğıöşü])/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function findLessonSource(
  archive: ArchiveData,
  plan: ArchivePlan,
  lesson: ArchiveLesson,
  grade: number,
  month: number,
): LessonSourceBundle | null {
  const sourceBand = plan.isExtended ? "7-8" : bandForGrade(grade);
  const documents = archive.documents.filter(
    (document) => document.kind === "content" && document.band === sourceBand && document.month === month,
  );
  if (!documents.length) return null;

  const exactTitles = lesson.strands.map(normalize).filter(Boolean);
  const tokens = topicTokens(lesson);
  const candidates = documents.flatMap((document) => document.pages.map((page) => {
    const pageText = normalize(page.text);
    const exactScore = exactTitles.reduce((score, title) => score + (title.length > 5 && pageText.includes(title) ? 180 : 0), 0);
    const tokenScore = tokens.reduce((score, token) => score + (pageText.includes(token) ? Math.min(24, token.length * 3) : 0), 0);
    const headingBonus = exactTitles.some((title) => pageText.slice(0, 220).includes(title)) ? 120 : 0;
    return { document, page, score: exactScore + tokenScore + headingBonus };
  }));

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (!best) return null;
  const pages = [best.page];
  const following = best.document.pages.find((page) => page.number === best.page.number + 1);
  if (following && /^(menkıbe|menkibe|hikâye|hikaye|örnek olay|etkinlik|şiir)/i.test(following.text.trim())) {
    pages.push(following);
  }

  return {
    documentName: best.document.name,
    pages: pages.map((page) => ({ number: page.number, text: cleanExtractedText(page.text) })),
    text: pages.map((page) => cleanExtractedText(page.text)).join("\n\n"),
  };
}

const harmfulTopicPattern = /gıybet|dedikodu|iftira|yalan|kibir|haset|rüşvet|israf|alay|zorbalık|öfke|kin|intikam|riya|haram|kötü|hırsız|kul hakkı|karşı gel|nankör|emanete hıyanet|zina|şirk|küfr|bid.?at/i;

function isHarmfulTopic(topic: string) {
  return harmfulTopicPattern.test(topic);
}

function topicEssence(category: TopicCategory, topic: string) {
  const harmful = isHarmfulTopic(topic);
  if (harmful) {
    return `“${topic}”, insanın kendisine veya başkasına zarar verebilen bir tutum ya da davranışı fark etmeyi gerektirir. Amacımız kimseyi etiketlemek değil; davranışın etkisini görmek ve daha güzel, güvenli bir seçenek bulmaktır.`;
  }
  const texts: Record<TopicCategory, string> = {
    worship: `“${topic}”, ibadet hayatımızla ilgili bir konudur. Öğrenirken yalnızca adımları değil; niyeti, anlamı, hazırlığı ve güzel davranışla kurduğu bağı da birlikte düşünürüz.`,
    faith: `“${topic}”, inancımızı anlamaya yardımcı olan bir konudur. Merak etmek, saygıyla soru sormak ve öğrendiğimiz bilgiyi güzel davranışlara dönüştürmek bu öğrenmenin parçasıdır.`,
    character: `“${topic}”, güzel ahlakın günlük hayatta nasıl görünür olduğunu düşünmemize yardım eder. Bir değeri bilmek kadar onu sözümüzde, seçimimizde ve davranışımızda göstermek de önemlidir.`,
    history: `“${topic}”, geçmişte yaşamış bir kişi ya da gerçekleşmiş bir olay üzerinden güzel ahlakı düşünmemize yardım eder. Olayın ne olduğunu, hangi davranışın öne çıktığını ve bugün ne yapabileceğimizi birlikte inceleriz.`,
    social: `“${topic}”, birlikte yaşarken hakları, sorumlulukları ve insanların onurunu korumayı düşünmemize yardım eder. İyi bir seçim hem bize hem çevremize güven ve iyilik taşır.`,
    dua: `“${topic}”, niyet, emek, tedbir, dua ve sabır arasındaki bağı görmemize yardım eder. Dua ederken elimizden geleni yapar, sonucu güzel bir kalple karşılar ve gerektiğinde yeniden deneriz.`,
  };
  return texts[category];
}

function teachingParagraphs(guide: LessonGuide) {
  const { title: topic, category, secondary, grade } = guide;
  const level = levelForGrade(grade);
  const start = topicEssence(category, topic);
  const second = secondary
    ? `Bu derste “${secondary}” başlığını da öğreneceğiz. İki başlık arasındaki bağı örnekler, sorular ve küçük uygulamalarla görünür hâle getireceğiz.`
    : `Önce konunun temel anlamını bulacağız. Sonra bir örnek ve bir karşı örnek üzerinde düşünecek, hangi davranışın neden daha güzel olduğunu konuşacağız.`;
  const transfer = category === "worship"
    ? "Bir uygulamayı öğrenirken hata yapabiliriz. Birbirimize gülmeden, kıyaslamadan ve mahremiyeti koruyarak doğru sırayı birlikte tekrar ederiz."
    : category === "faith"
      ? "Aklımıza gelen soruları saygıyla sorabiliriz. Bilmediğimiz bir noktada acele hüküm vermek yerine güvenilir bilgiye başvurur ve düşünmeye devam ederiz."
      : category === "history"
        ? "Bir anlatıdan ders çıkarırken kişileri taklit etmekten çok; doğruluk, merhamet, sabır, adalet ve sorumluluk gibi ilkeleri bugünün hayatına taşırız."
        : "Bir davranışın niyetine, başkaları üzerindeki etkisine ve sonucuna bakarız. Hata olduğunda özür, telafi ve yeniden deneme ile durumu onarmak mümkündür.";
  const close = level === "early"
    ? `Şimdi gözlerimizi ve kulaklarımızı öğrenmeye hazırlayalım: “${topic}” için bugün yapabileceğimiz küçük ama güzel bir davranış bulalım.`
    : level === "primary"
      ? `Dersin sonunda “${topic}” konusunu kendi cümlemizle açıklayacak, uygun davranışı seçip nedenini söyleyeceğiz.`
      : level === "middle"
        ? `Dersin sonunda bir örnek olayı “niyet–hak–etki–sonuç–onarım” basamaklarıyla çözümleyip uygulanabilir bir karar oluşturacağız.`
        : `Dersin sonunda bilgiyi, yorumu ve örneği ayırt edecek; görüşümüzü açık bir gerekçe ve hayata aktarılabilir bir ilkeyle ifade edeceğiz.`;
  return [start, second, transfer, close];
}

function scenarioCards(category: TopicCategory, topic: string) {
  const common = [
    {
      title: "Bir arkadaşım zorlanıyor",
      situation: `Bir öğrenci “${topic}” konusunu anlamadığını söylüyor. İki arkadaşı gülüyor, bir arkadaşı ise yanına oturup yardım teklif ediyor.`,
      prompt: "Hangi davranış öğrenmeyi ve arkadaşlığı güçlendirir?",
      suggested: "Gülmeden dinlemek, neyi anlamadığını sormak ve küçük bir adımla yardımcı olmak.",
    },
    {
      title: "Kimse görmüyorken",
      situation: `Sınıfta “${topic}” ile ilgili bir sorumluluk veriliyor. Öğretmen dışarı çıktığında bazı öğrenciler görevi bırakıyor.`,
      prompt: "Doğru davranış yalnızca biri bizi görürken mi önemlidir?",
      suggested: "Güzel ahlak, denetlenmediğimiz zamanda da doğru olanı seçmeye çalışmaktır.",
    },
  ];
  const specific: Record<TopicCategory, Array<{ title: string; situation: string; prompt: string; suggested: string }>> = {
    worship: [
      { title: "Adımı karıştırınca", situation: `Bir öğrenci “${topic}” uygulamasında bir adımı karıştırıyor ve yeniden denemek istiyor.`, prompt: "Arkadaşları ve öğretmeni nasıl destek olabilir?", suggested: "Kıyaslamadan, mahremiyeti koruyarak, adımı sakin biçimde gösterip tekrar fırsatı vermek." },
      { title: "Anlam mı, hız mı?", situation: `İki öğrenci “${topic}” çalışıyor. Biri çok hızlı bitiriyor, diğeri her adımın anlamını soruyor.`, prompt: "Öğrenmenin amacı yalnızca hızlı bitirmek midir?", suggested: "Doğru uygulama; niyet, anlam, sıra ve özenle birlikte öğrenilir." },
    ],
    faith: [
      { title: "Merak edilen soru", situation: `Bir öğrenci “${topic}” hakkında içten bir soru soruyor. Sınıfta kısa bir sessizlik oluyor.`, prompt: "Bu soruya nasıl güvenli ve saygılı alan açarız?", suggested: "Soruyu küçümsemeden dinler, bildiğimizi açıklar, bilmediğimiz noktayı birlikte araştırmak üzere not ederiz." },
      { title: "Bilgi mi tahmin mi?", situation: `İki arkadaş “${topic}” hakkında farklı cümleler kuruyor; biri öğrendiği bilgiyi, diğeri kendi tahminini söylüyor.`, prompt: "İkisini nasıl ayırabiliriz?", suggested: "Cümlenin bilgi mi, yorum mu, soru mu olduğunu açıkça belirtiriz." },
    ],
    character: [
      { title: "Bir hata oldu", situation: `Bir öğrenci “${topic}” konusunda doğru olmayan bir seçim yaptığını fark ediyor.`, prompt: "Hatasını onarmak için hangi üç adımı atabilir?", suggested: "Etkisini fark etmek, içtenlikle özür/telafi etmek ve daha güzel davranışı yeniden denemek." },
      { title: "İki seçenek", situation: `Kolay fakat başkasını incitebilecek bir yol ile emek isteyen ama adil bir yol arasında seçim yapılması gerekiyor.`, prompt: `“${topic}” bu seçimde bize hangi ölçüyü verir?`, suggested: "Kimin etkileneceğine, haklara ve uzun vadeli sonuca bakarak güvenli ve adil yolu seçmek." },
    ],
    history: [
      { title: "Geçmişten bugüne", situation: `Sınıf “${topic}” anlatısında öne çıkan bir davranışı bugünün okul hayatına taşımak istiyor.`, prompt: "Kişiyi taklit etmek yerine hangi ilkeyi uygulayabiliriz?", suggested: "Anlatıdaki doğruluk, sabır, merhamet, cesaret veya sorumluluk ilkesini somut bir sınıf davranışına çevirmek." },
      { title: "Anlatı ve ders", situation: `Bir grup olayın ayrıntılarını, başka bir grup olaydan çıkarılabilecek güzel davranışı anlatıyor.`, prompt: "İki çalışma birbirinden nasıl farklıdır?", suggested: "Biri ne olduğunu açıklar; diğeri olayın düşündürdüğü değeri bugüne taşır." },
    ],
    social: [
      { title: "Adil paylaşım", situation: `Bir sınıf çalışmasında görevlerin çoğu aynı öğrencilere veriliyor. “${topic}” için yeni bir plan gerekiyor.`, prompt: "Görevleri nasıl daha adil ve onur koruyucu paylaşırız?", suggested: "İhtiyaçları ve becerileri dinler, söz hakkını paylaşır ve herkesin katkı sunabileceği görevler belirleriz." },
      { title: "Yardım ederken", situation: `Bir öğrenci yardım etmek istiyor fakat yardım ettiği kişiyi herkesin içinde utandırıyor.`, prompt: "İyilik yaparken nelere dikkat etmeliyiz?", suggested: "İhtiyacı sorar, izni önemser, gizliliği ve karşıdakinin onurunu koruruz." },
    ],
    dua: [
      { title: "Emek ve dua", situation: `Bir öğrenci “${topic}” için dua ediyor fakat yapabileceği hazırlıkları erteliyor.`, prompt: "Dua ile sorumluluğumuzu nasıl birlikte yürütürüz?", suggested: "Niyet eder, elimizden gelen hazırlığı yapar, tedbir alır, dua eder ve sabırla devam ederiz." },
      { title: "Sonuç farklı olunca", situation: `Bir öğrenci emek verdiği hâlde beklediği sonucu alamıyor ve çok üzülüyor.`, prompt: "Kendisine nasıl destekleyici bir cümle kurabilir?", suggested: "Üzüntümü kabul edebilirim; ne öğrendiğime bakar, yardım ister ve yeni bir adım denerim." },
    ],
  };
  return [...common, ...specific[category]];
}

function sequenceCards(category: TopicCategory) {
  const sequences: Record<TopicCategory, Array<[string, string]>> = {
    worship: [["Niyet", "Ne yaptığımı ve neden yaptığımı bilirim."], ["Hazırlık", "Gerekli koşulları güvenli biçimde hazırlarım."], ["Doğru sıra", "Adımları sakin ve özenli uygularım."], ["Anlam", "Uygulamanın kalbimde ve davranışımda karşılığını düşünürüm."], ["Tekrar", "Hata olursa utanmadan yeniden denerim."]],
    faith: [["Merak", "Aklımdaki soruyu fark ederim."], ["Soru", "Saygılı ve açık bir cümle kurarım."], ["Temel bilgi", "Kavramın yaşa uygun anlamını öğrenirim."], ["Ayırt et", "Bilgi, yorum ve soruyu birbirine karıştırmam."], ["Yansıt", "Öğrendiğimi güzel davranışla ilişkilendiririm."]],
    character: [["Durum", "Ne olduğunu yargılamadan anlatırım."], ["Duygu", "Kendimin ve başkasının duygusunu fark ederim."], ["Hak ve ihtiyaç", "Kim neye ihtiyaç duyuyor, hangi hak etkileniyor?"], ["Seçim", "Güvenli ve güzel davranışı seçerim."], ["Onarım", "Hata varsa özür, telafi ve yeniden deneme yaparım."]],
    history: [["Kim / ne?", "Kişiyi veya olayı tanırım."], ["Bağlam", "Zamanı, yeri ve durumu belirlerim."], ["Davranış", "Öne çıkan seçimi fark ederim."], ["Sonuç", "Davranışın etkisini düşünürüm."], ["Bugün", "Değeri güncel bir adıma dönüştürürüm."]],
    social: [["Kim etkileniyor?", "Durumdaki kişileri belirlerim."], ["Hak", "Korunması gereken hakkı görürüm."], ["İhtiyaç", "İhtiyacı varsaymak yerine dinlerim."], ["Adil seçim", "Onuru koruyan çözümü seçerim."], ["Birlikte uygula", "Görev ve sorumlulukları paylaşırım."]],
    dua: [["Niyet", "Kalbimdeki amacı belirlerim."], ["Emek", "Yapabileceğim işi yaparım."], ["Tedbir", "Zorlukları düşünüp hazırlanırım."], ["Dua", "İyilik ve yardım dilerim."], ["Sabır", "Sonucu karşılar, öğrenir ve yeniden denerim."]],
  };
  return sequences[category].map(([label, detail]) => ({ label, detail }));
}

function conceptCards(guide: LessonGuide) {
  const cards = [
    { term: guide.title, meaning: topicEssence(guide.category, guide.title), prompt: `Bunu kendi cümlenle nasıl açıklarsın?` },
    { term: "Niyet", meaning: "Bir davranışı hangi amaçla yaptığımızı fark etmektir.", prompt: "Aynı davranış farklı niyetlerle yapılabilir mi?" },
    { term: "Etki", meaning: "Sözümüzün veya davranışımızın kendimizde ve başkalarında oluşturduğu sonuçtur.", prompt: "Bu seçimden kimler, nasıl etkilenir?" },
    { term: "Onarım", meaning: "Bir hata veya zarar olduğunda özür, telafi ve yeniden deneme ile durumu düzeltmektir.", prompt: "Onarmak için atılabilecek ilk küçük adım nedir?" },
  ];
  if (guide.secondary) cards.splice(1, 0, { term: guide.secondary, meaning: `Bu başlık “${guide.title}” konusu ile birlikte ele alınır ve iki kavram arasındaki bağ örneklerle kurulur.`, prompt: "İki başlık arasında nasıl bir bağ görüyorsun?" });
  return cards;
}

function quiz(category: TopicCategory, topic: string) {
  const categoryQuestion: Record<TopicCategory, { question: string; choices: string[]; correctIndex: number; feedback: string }> = {
    worship: { question: `“${topic}” öğrenilirken hangisi en doğru yaklaşımdır?`, choices: ["Yalnızca hızlı yapmak", "Niyet, anlam ve doğru adımları birlikte öğrenmek", "Hata yapanla alay etmek"], correctIndex: 1, feedback: "İbadet bilgisi; niyet, anlam, doğru uygulama ve güzel davranışla bir bütündür." },
    faith: { question: `“${topic}” hakkında bilmediğimiz bir noktada ne yapmalıyız?`, choices: ["Tahmini kesin bilgi gibi söylemek", "Soruyu saklamak", "Saygıyla sormak ve güvenilir bilgiye başvurmak"], correctIndex: 2, feedback: "Merak etmek ve güvenilir bilgiye ulaşmak öğrenmenin doğal parçasıdır." },
    character: { question: `“${topic}” ile ilgili bir seçimde önce neyi düşünmeliyiz?`, choices: ["Yalnızca bana kolay gelmesini", "Niyet, haklar, etki ve sonucu", "Başkalarının beni alkışlamasını"], correctIndex: 1, feedback: "Güzel ahlaki seçim, davranışın başkaları üzerindeki etkisini de gözetir." },
    history: { question: `“${topic}” anlatısını işlerken en önemli amaç hangisidir?`, choices: ["Yalnızca isimleri ezberlemek", "Olayı anlayıp güzel davranış ilkesini bugüne taşımak", "Ayrıntıları karıştırmak"], correctIndex: 1, feedback: "Tarihî anlatı, olayın bağlamını ve bugüne taşınabilecek güzel davranışı birlikte düşündürür." },
    social: { question: `“${topic}” konusunda çözüm üretirken hangisi önemlidir?`, choices: ["İhtiyacı sormadan karar vermek", "Hakları, ihtiyaçları ve insan onurunu korumak", "Görevi hep aynı kişiye vermek"], correctIndex: 1, feedback: "Toplumsal sorumlulukta adalet, dinleme ve insan onurunu koruma birlikte düşünülür." },
    dua: { question: `“${topic}” ile ilgili dengeli davranış hangisidir?`, choices: ["Hiç hazırlık yapmadan beklemek", "Yalnızca kendimize güvenmek", "Emek vermek, tedbir almak, dua etmek ve sabretmek"], correctIndex: 2, feedback: "Dua; niyet, emek, tedbir ve sabırla birlikte yürütülür." },
  };
  return [
    categoryQuestion[category],
    { question: "Bir arkadaşımız bu konuda hata yaptığında ne yapmalıyız?", choices: ["Onu etiketlemek", "Sakin biçimde destek olmak ve yeniden deneme fırsatı vermek", "Hatasını sınıfa duyurmak"], correctIndex: 1, feedback: "Davranışı konuşuruz; kişiyi etiketlemez, güvenli bir onarım fırsatı veririz." },
    { question: "Dersi gerçekten anladığımızı nasıl gösterebiliriz?", choices: ["Cümleyi aynen tekrar ederek", "Bir örnek verip nedenini açıklayarak ve uygun davranışı deneyerek", "Hiç soru sormayarak"], correctIndex: 1, feedback: "Anlama; açıklama, gerekçelendirme ve yeni bir duruma aktarma ile görünür olur." },
  ];
}

export function buildMaterialKit(guide: LessonGuide): MaterialKit {
  const sequence = sequenceCards(guide.category);
  return {
    teachingTitle: `${guide.title}: birlikte öğrenelim`,
    teachingParagraphs: teachingParagraphs(guide),
    boardPlan: [
      { label: "Bugünkü konu", text: guide.title },
      { label: "Öğrenme hedefi", text: guide.outcomes[0].replace(/^Öğrenci\s+/i, "") },
      { label: "Ana soru", text: guide.questions[1] || guide.questions[0] },
      { label: "Ders sonunda", text: `Bir örnek, bir gerekçe ve uygulanabilir bir güzel davranış göstereceğiz.` },
    ],
    conceptCards: conceptCards(guide),
    scenarioCards: scenarioCards(guide.category, guide.title),
    sequenceCards: sequence,
    matchPairs: sequence.slice(0, 4).map((item, index) => ({ id: `pair-${index}`, left: item.label, right: item.detail })),
    quiz: quiz(guide.category, guide.title),
    emotionCards: [
      { label: "Meraklı", cue: "Bir soru sormak istiyorum." },
      { label: "Sevinçli", cue: "Güzel bir davranış fark ettim." },
      { label: "Üzgün", cue: "Bir davranış beni incitti." },
      { label: "Kaygılı", cue: "Yardım ve güvenceye ihtiyacım var." },
      { label: "Sakin", cue: "Düşünmeye ve dinlemeye hazırım." },
    ],
    exitTicket: [
      `“${guide.title}” konusunu bir cümleyle açıkla.`,
      "Bugünkü bir örneği ve neden doğru/güzel olduğunu yaz veya çiz.",
      "Bu hafta deneyebileceğin küçük, güvenli bir davranış seç.",
    ],
    observation: [
      "Kavramı kendi sözü, resmi veya örneğiyle ifade etti.",
      "Davranışın başka bir kişi üzerindeki etkisini fark etti.",
      "Seçimini bir değer veya gerekçeyle açıkladı.",
      "Öğrendiğini yeni ve güvenli bir duruma aktardı.",
    ],
    teacherLanguage: [
      "Burada tek bir hız yok; düşünmek için zaman kullanabilirsin.",
      "Sorun değerli. Bildiğimiz kısmı konuşalım, bilmediğimizi not edip doğrulayalım.",
      "Seni değil, davranışın etkisini konuşuyoruz. Bunu onarmak için ne yapabiliriz?",
      "Yanıtını sözle, resimle, işaret ederek veya yazarak gösterebilirsin.",
    ],
  };
}
