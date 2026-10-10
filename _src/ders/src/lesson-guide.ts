export type ArchiveLesson = {
  number: number;
  sourceNumber: number;
  title: string;
  strands: string[];
  sourceText: string;
};

export type ArchivePlan = {
  documentId: string;
  sourceName: string;
  lessons: ArchiveLesson[];
  isExtended: boolean;
  extensionNote?: string;
};

export type ArchivePage = { number: number; text: string };

export type ArchiveDocument = {
  id: string;
  name: string;
  path: string;
  month: number;
  band: string;
  kind: "plan" | "content";
  extension: string;
  pageCount: number;
  charCount: number;
  pages: ArchivePage[];
};

export type ArchiveData = {
  meta: {
    title: string;
    fileCount: number;
    pdfCount: number;
    docxCount: number;
    pageCount: number;
    characterCount: number;
    scope: string;
  };
  plans: Record<string, Record<string, ArchivePlan>>;
  documents: ArchiveDocument[];
};

export type GradeLevel = "early" | "primary" | "middle" | "upper";
export type TopicCategory = "worship" | "faith" | "character" | "history" | "social" | "dua";

const gradeDetails = [
  { age: "6-7 yaş", duration: 30, level: "early" as GradeLevel, product: "resim, eşleştirme ve kısa canlandırma" },
  { age: "7-8 yaş", duration: 30, level: "early" as GradeLevel, product: "seçim kartı, rol oyunu ve tek cümle" },
  { age: "8-9 yaş", duration: 35, level: "primary" as GradeLevel, product: "neden-sonuç kartı ve küçük grup ürünü" },
  { age: "9-10 yaş", duration: 40, level: "primary" as GradeLevel, product: "kavram haritası, istasyon ve akran anlatımı" },
  { age: "10-11 yaş", duration: 40, level: "middle" as GradeLevel, product: "örnek olay, gerekçeli karar ve poster" },
  { age: "11-12 yaş", duration: 40, level: "middle" as GradeLevel, product: "kaynak kartı, vaka çözümü ve öz değerlendirme" },
  { age: "12-13 yaş", duration: 45, level: "upper" as GradeLevel, product: "ahlaki ikilem, kaynaklı tartışma ve yansıtma" },
  { age: "13-14 yaş", duration: 45, level: "upper" as GradeLevel, product: "seminer, kaynak inceleme ve özgün uygulama" },
];

const lower = (value: string) => value.toLocaleLowerCase("tr-TR");

export function bandForGrade(grade: number) {
  if (grade <= 3) return "1-2-3";
  if (grade <= 6) return "4-5-6";
  return "7-8";
}

export function levelForGrade(grade: number) {
  return gradeDetails[Math.min(8, Math.max(1, grade)) - 1].level;
}

export function classifyTopic(topic: string): TopicCategory {
  const text = lower(topic);
  if (/dua|tevekkül|hayırlı|inşallah|niyet|ihlas|rıza/.test(text)) return "dua";
  if (/namaz|abdest|teyemmüm|gusül|taharet|ezan|kıble|secde|rüku|kıyam|kıraat|rek[aâ]t|cuma|teravih|misvak|ibadet/.test(text)) return "worship";
  if (/iman|allah|peygamber|melek|kitaplara|ahiret|kader|kelime-i|tevh[iî]d|şehadet|mezhep|sünnet|bid.?at|din nedir|islam.?ın şart|farz|küfr/.test(text)) return "faith";
  if (/osmanlı|hazreti|eshab|ehl-i beyt|ibrahim|gazali|fatih|somuncu|ayasofya|mescid|bilal|eyüp|nuh|alim|evliya|atalarımız/.test(text)) return "history";
  if (/rızık|vatan|rüşvet|vakıf|misafir|yetim|anne|baba|aile|dünya mal|helal|komşu|fakir|hizmet|toplum|ağaç|gençlik/.test(text)) return "social";
  return "character";
}

const categoryLabels: Record<TopicCategory, string> = {
  worship: "İbadet bilgisi ve uygulama",
  faith: "İnanç ve kavram bilgisi",
  character: "Ahlak ve davranış",
  history: "Siyer, şahsiyet ve tarih",
  social: "Toplumsal sorumluluk",
  dua: "Niyet, dua ve manevi farkındalık",
};

function focusText(category: TopicCategory, topic: string, secondary?: string) {
  const second = secondary ? ` “${secondary}” başlığı da aynı ders içinde anlam-davranış bağlantısıyla ele alınır.` : "";
  const texts: Record<TopicCategory, string> = {
    worship: `“${topic}” konusu, yalnızca ezberlenecek bir sıra olarak değil; niyet, anlam, hazırlık, doğru uygulama ve ibadet adabı bütünlüğünde işlenir.${second}`,
    faith: `“${topic}” konusu yaşa uygun kavramlarla açıklanır; öğrencinin merak etmesine, soru sormasına ve öğrendiği inancı sorumluluk davranışlarıyla ilişkilendirmesine alan açılır.${second}`,
    character: `“${topic}” konusu tanım vermekle bırakılmaz; duygu, niyet, seçim, davranışın başkalarına etkisi ve gerektiğinde onarım adımları üzerinden somutlaştırılır.${second}`,
    history: `“${topic}” anlatısı, kişi veya olayı yüceltme metni olarak değil; tarihî bağlam, doğrulanabilir bilgi, örnek davranış ve bugüne taşınabilecek ilke ayrımıyla ele alınır.${second}`,
    social: `“${topic}” konusu bireysel iyilikten toplumsal sorumluluğa uzanan bir çizgide; hak, ihtiyaç, emanet, adalet ve karşıdakinin onurunu koruma ölçütleriyle işlenir.${second}`,
    dua: `“${topic}” konusu; niyet, emek, tedbir, dua, sonucu kabullenme ve yeniden deneme arasındaki dengeyi görünür kılacak günlük durumlarla işlenir.${second}`,
  };
  return texts[category];
}

function contentPoints(category: TopicCategory, topic: string, secondary: string | undefined, level: GradeLevel) {
  const conceptDepth = level === "upper"
    ? "Kavramın farklı yorumları ve günlük sonuçları kaynak türleri ayrıştırılarak incelenir."
    : level === "middle"
      ? "Kavram, karşı örnek ve örnek olayla sınanır; doğru davranış için ölçüt çıkarılır."
      : "Kavram kısa cümle, resim, hikâye ve çocuğun bildiği bir durumla somutlaştırılır.";
  const shared = [
    `Kavramın özü: “${topic}” ifadesinin öğrencinin anlayacağı karşılığı açıklanır; bilinmeyen terimler ayrı bir sözlük kutusunda verilir.`,
    `Bilginin türü: Ayet, hadis, siyer/tarih, menkıbe ve öğretmen açıklaması birbirine karıştırılmadan açık bir dille sunulur.`,
    `Hayata aktarım: Öğrenci konuyu okul, aile, arkadaşlık ve dijital ortamdan güvenli bir davranış örneğine dönüştürür.`,
    conceptDepth,
  ];
  const categorySpecific: Record<TopicCategory, string> = {
    worship: "Uygulamada doğru sıra kadar anlam, mahremiyet, sağlık durumu, erişilebilirlik ve israf etmeme de gözetilir; öğrenci ibadet pratiği üzerinden utandırılmaz.",
    faith: "Soyut ve metafizik konularda kesin cevabı bilinmeyen sorular bastırılmaz; güvenilir kaynağa başvurma ve 'birlikte araştıralım' yaklaşımı modellenir.",
    character: "Davranış kişilik etiketiyle karıştırılmaz; 'kötü çocuk' denmez, davranışın etkisi konuşulur ve düzeltme/onarma fırsatı verilir.",
    history: "Tarihî bilgi ile öğüt amacı taşıyan menkıbe açıkça ayrılır; zaman, mekân, kişi ve kaynak bilgisi mümkün olduğunca kontrol edilir.",
    social: "Yardım ve hizmet karşıdakini küçültmeden, ihtiyacı dinleyerek ve hak-sorumluluk dengesini koruyarak planlanır.",
    dua: "Tevekkül ve dua pasif bekleyiş gibi sunulmaz; öğrencinin kontrolündeki emek ve tedbir adımları açıkça gösterilir.",
  };
  return [...shared, categorySpecific[category], ...(secondary ? [`Paralel konu: “${secondary}” için temel tanım, uygulama şartları ve ana konuyla bağlantı ayrıca açıklanır.`] : [])];
}

function stageActivity(level: GradeLevel, topic: string, category: TopicCategory) {
  if (level === "early") {
    return `Resimli “${topic}” öyküsünü üç durakta durdurun: Ne oldu? Kahraman ne hissetti? Daha güzel ne yapabilirdi? Ardından öğrenciler doğru davranışı kukla veya rol kartıyla canlandırsın.`;
  }
  if (level === "primary") {
    return `Öğrenciler “${topic}” ile ilgili dört durum kartını doğru / desteğe ihtiyacı var / onarılmalı başlıklarında sınıflandırsın; seçtikleri bir kart için gerekçeli çözüm posteri hazırlasın.`;
  }
  if (level === "middle") {
    return `Gruplar “${topic}” vakasında kişileri, niyetleri, hakları, davranışın etkisini ve olası sonuçları belirlesin; ${category === "worship" ? "doğru uygulama ölçütleri" : "ahlaki karar ölçütleri"} ile çözüm üretsin.`;
  }
  return `Öğrenciler “${topic}” konusunda kısa kaynak kartlarını karşılaştırsın; iddia-kanıt-gerekçe yapısıyla görüş oluştursun, bir karşı görüşü saygılı biçimde yanıtlasın ve uygulanabilir ilke yazsın.`;
}

function questions(level: GradeLevel, topic: string, category: TopicCategory) {
  const base = [
    `“${topic}” deyince aklımıza hangi anlam ve davranışlar gelir?`,
    `Bu konuda doğru olduğunu düşündüğümüz bir davranış başkasını nasıl etkiler?`,
    `Zorlandığımızda kimden, hangi cümleyle yardım isteyebiliriz?`,
  ];
  if (level === "upper") {
    base.push("Bilgi, yorum ve menkıbe arasındaki farkı nasıl anlarız?");
    base.push("Bu ilkenin dijital ortamda veya güncel bir toplumsal sorunda karşılığı nedir?");
  } else if (level === "middle") {
    base.push("Aynı kavramın yanlış anlaşıldığı bir örnek verebilir miyiz?");
    base.push(category === "worship" ? "Doğru uygulamayı kolaylaştıran ve zorlaştıran etkenler nelerdir?" : "Bir hata olduğunda onarım için hangi adımlar gerekir?");
  } else {
    base.push("Bu davranışı bugün sınıfta nerede deneyebiliriz?");
  }
  return base;
}

function learningOutcomes(level: GradeLevel, topic: string, secondary?: string) {
  const verbs: Record<GradeLevel, [string, string, string]> = {
    early: ["tanır ve kendi sözüyle söyler", "resim veya canlandırmada gösterir", "günlük bir durumda dener"],
    primary: ["açıklar ve örnek verir", "neden-sonuç ilişkisi kurar", "uygun davranışı seçip gerekçelendirir"],
    middle: ["kavramları ayırt eder", "örnek olayı ölçütlerle çözümler", "öğrendiğini yeni bir duruma aktarır"],
    upper: ["kaynak ve yorumu ayırt ederek açıklar", "farklı bakışları etik ilkelerle değerlendirir", "kanıta dayalı ve uygulanabilir bir öneri geliştirir"],
  };
  return [
    `Öğrenci “${topic}” konusunun temel anlamını ${verbs[level][0]}.`,
    `Konuya ilişkin doğru, eksik ve zarar verebilecek davranışları ${verbs[level][1]}.`,
    `Öğrendiği değeri okul, aile veya arkadaşlık ortamında ${verbs[level][2]}.`,
    ...(secondary ? [`“${secondary}” bilgi hattını ana konuyla ilişkilendirerek temel düzeyde açıklar.`] : []),
  ];
}

function assessment(level: GradeLevel, topic: string) {
  const checks: Record<GradeLevel, string> = {
    early: "Öğrenci bir görsel seçer ve 'Bu davranış güzel çünkü…' cümlesini tamamlar. Öğretmen: tanıdı / destekle yaptı / henüz göstermedi şeklinde gözlem kaydı tutar.",
    primary: "Üç soruluk çıkış bileti uygulanır: Kavram ne demek? Bir doğru örnek yaz. Zor durumda hangi adımı atarsın? Ürün; doğruluk, gerekçe ve uygulanabilirlik ölçütleriyle incelenir.",
    middle: "Örnek olay cevabı 0-2 puanlık dört ölçütle değerlendirilir: kavram doğruluğu, etkiyi fark etme, gerekçe, çözüm. Öğrenci ayrıca güçlü yön ve sonraki adımını yazar.",
    upper: "Kaynaklı kısa yanıt; iddia, güvenilir kanıt, ahlaki gerekçe, karşı görüşe saygı ve uygulanabilir sonuç başlıklarında analitik rubrikle değerlendirilir.",
  };
  return `${checks[level]} Değerlendirme kişisel dindarlığı değil, “${topic}” konusundaki öğrenme ve düşünme becerisini ölçer.`;
}

function differentiation(level: GradeLevel, topic: string) {
  const common = `Kavram kartında “${topic}” başlığının sade tanımı, bir örnek ve bir karşı örnek birlikte bulunsun.`;
  if (level === "early") return `${common} Yönergeleri tek adım verin; resim sırası, tekrar, hareket ve güvenilir akran desteği kullanın. Konuşmak istemeyen öğrenci resim seçerek yanıt verebilir.`;
  if (level === "primary") return `${common} Metni parçalara bölün, anahtar sözcükleri renklendirin ve cümle başlangıçları sunun. İleri düzey öğrenci kendi karşı örneğini üretsin.`;
  if (level === "middle") return `${common} Okuma güçlüğü için sesli/özetlenmiş metin ve terim sözlüğü verin. Ürün; yazı, ses kaydı veya görsel düzenleyici olarak sunulabilir.`;
  return `${common} Kaynak sayısını ihtiyaca göre azaltın; araştırma sorusunu daraltın ve not alma şablonu verin. İleri düzey öğrenci kaynak güvenilirliğini ayrıca karşılaştırsın.`;
}

function familyTask(level: GradeLevel, topic: string) {
  if (level === "early") return `Evde bir yetişkinle “${topic}” konusunda görülen güzel bir davranışı bulun; çocuk ertesi derste resmini veya tek cümlesini paylaşsın.`;
  if (level === "primary") return `Aileden “${topic}” ile ilgili bir günlük hayat örneği dinleyin; olay, davranış ve sonuç başlıklarında üç cümlelik not alın.`;
  if (level === "middle") return `Evde “${topic}” için uygulanabilir küçük bir sorumluluk seçin; bir hafta gözlemleyip neyin işe yaradığını ve neyin zor olduğunu kaydedin.`;
  return `Aile veya yakın çevreden bir kişiyle “${topic}” hakkında kısa görüşme yapın; görüşü kaynak bilgisi gibi değil deneyim olarak kaydedin ve derste öğrendiğiniz ölçütlerle karşılaştırın.`;
}

function materials(level: GradeLevel, category: TopicCategory, secondary?: string) {
  const base = ["bu sayfadaki çocuklara uygun ders anlatım metni", "hazır kavram ve durum kartları", "ekrana yansıtılabilir sınıf akışı", "hazır çıkış bileti ve gözlem formu"];
  if (level === "early") base.push("resim sırası, duygu kartı ve kukla/rol nesnesi");
  if (level === "primary") base.push("örnek olay kartı ve renkli sınıflandırma başlıkları");
  if (level === "middle") base.push("vaka çözüm şablonu ve kısa rubrik");
  if (level === "upper") base.push("kaynak türü kartları, iddia-kanıt-gerekçe formu");
  if (category === "worship") base.push("uygulama sıra kartı; gerekiyorsa susuz prova düzeni");
  if (secondary) base.push(`“${secondary}” için ayrı bilgi kartı`);
  return base;
}

function teacherPreparation(category: TopicCategory, topic: string, secondary?: string) {
  const steps = [
    `Bu derse eklenen özgün “${topic}” metnini ve çocuklara okunacak sade anlatımı birlikte gözden geçirin.`,
    "Kullanılacak ayet/hadis/menkıbe/tarih bilgisinin kaynağını kurumun ilim heyetiyle doğrulayın.",
    "Dersin ölçmek istediği davranış veya düşünme becerisini tahtada görünür olacak tek cümleye indirin.",
    "Öğrencilerin kişisel ibadet veya aile yaşantısını açıklamak zorunda kalmayacağı güvenli örnekler hazırlayın.",
  ];
  if (category === "worship") steps.push("Uygulama yapılacaksa mahremiyet, erişilebilirlik, sağlık ve su/israf koşullarını önceden düzenleyin.");
  if (secondary) steps.push(`Paralel bilgi hattı “${secondary}” için temel tanım, sıra ve sık karıştırılan noktaları ayrıca kontrol edin.`);
  return steps;
}

export function buildLessonGuide(lesson: ArchiveLesson, grade: number, month: number) {
  const detail = gradeDetails[grade - 1];
  const [topic, secondary, ...extra] = lesson.strands;
  const extraStrands = [...(secondary ? [secondary] : []), ...extra];
  const secondaryText = extraStrands.length ? extraStrands.join(" · ") : undefined;
  const category = classifyTopic(`${topic} ${secondaryText || ""}`);
  const short = detail.duration <= 30;
  const timings = short ? [4, 6, 7, 9, 4] : detail.duration <= 40 ? [5, 8, 8, 13, 6] : [5, 10, 10, 14, 6];
  const activity = stageActivity(detail.level, topic, category);

  return {
    grade,
    month,
    week: Math.ceil(lesson.number / 5),
    lessonNumber: lesson.number,
    title: topic,
    sourceStrands: lesson.strands,
    secondary: secondaryText,
    category,
    categoryLabel: categoryLabels[category],
    age: detail.age,
    duration: detail.duration,
    product: detail.product,
    purpose: focusText(category, topic, secondaryText),
    outcomes: learningOutcomes(detail.level, topic, secondaryText),
    preparation: teacherPreparation(category, topic, secondaryText),
    materials: materials(detail.level, category, secondaryText),
    content: contentPoints(category, topic, secondaryText, detail.level),
    questions: questions(detail.level, topic, category),
    flow: [
      {
        time: timings[0],
        title: "Karşılama ve önceki öğrenme",
        detail: `Öğrencilere “${topic}” ile ilgili yargılamayan bir günlük durum gösterin. Ne gördüklerini ve ne merak ettiklerini alın; doğru cevabı hemen vermeyin.`,
      },
      {
        time: timings[1],
        title: "Kavramı açıkla",
        detail: `${focusText(category, topic, secondaryText)} En fazla üç yeni terim kullanın ve her terimi örnek/karşı örnekle açıklayın.`,
      },
      {
        time: timings[2],
        title: "Ders metni, hikâye veya vaka",
        detail: `Bu sayfadaki yaşa uygun ders metnini doğrudan okuyun. Ardından öğrencilerden “ne oldu / hangi değer görünür oldu / sonuç ne oldu” notları almalarını isteyin.`,
      },
      {
        time: timings[3],
        title: "Uygulama ve ürün",
        detail: activity,
      },
      {
        time: timings[4],
        title: "Ölçme ve kapanış",
        detail: assessment(detail.level, topic),
      },
    ],
    activity,
    assessment: assessment(detail.level, topic),
    differentiation: differentiation(detail.level, topic),
    familyTask: familyTask(detail.level, topic),
    safetyNote: category === "worship"
      ? "Öğrenciyi ibadet uygulaması üzerinden kıyaslamayın veya utandırmayın. Özel durum, sağlık ve mahremiyet açıklaması istemeyin."
      : category === "faith"
        ? "Soruları bastırmayın; korkutucu ahiret/ceza tasvirlerinden ve yaşa uygun olmayan kesin hükümlerden kaçının."
        : "Davranışı eleştirin, çocuğun kişiliğini etiketlemeyin. Zorbalık veya zarar durumunda güvenli yetişkine başvurmayı öğretin.",
    sourceLabel: `${bandForGrade(grade)} grubu · ${month}. ay · özgün sıra ${lesson.sourceNumber}`,
  };
}

export function monthlyOverview(lessons: ArchiveLesson[], grade: number, month: number) {
  const categoryCounts = lessons.reduce<Record<TopicCategory, number>>(
    (result, lesson) => {
      const category = classifyTopic(lesson.sourceText);
      result[category] += 1;
      return result;
    },
    { worship: 0, faith: 0, character: 0, history: 0, social: 0, dua: 0 },
  );
  const dominant = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => categoryLabels[category as TopicCategory]);
  return {
    title: `${grade}. Sınıf · ${month}. Ay Tam Program`,
    description: `Özgün konu sırası korunarak hazırlanmış 20 ayrıntılı ders; 4 haftaya, her hafta 5 derse bölünmüştür.`,
    dominant,
    categoryCounts,
    weekly: [1, 2, 3, 4].map((week) => ({
      week,
      lessons: lessons.slice((week - 1) * 5, week * 5),
    })),
  };
}

export const rubricRows = [
  {
    criterion: "Kavram doğruluğu",
    beginning: "Kavramı karıştırıyor veya yalnızca tekrar ediyor.",
    developing: "Temel anlamı destekle açıklıyor; örnek kısmen uygun.",
    achieved: "Kavramı doğru açıklıyor ve uygun örnek/karşı örnek veriyor.",
    advanced: "Kavramı yeni duruma aktarıyor; sınırlarını ve olası yanlış anlamayı açıklıyor.",
  },
  {
    criterion: "Davranışın etkisi",
    beginning: "Davranışın başkasına etkisini fark etmiyor.",
    developing: "Belirgin sonucu söylüyor ancak duygu/ihtiyaç bağlantısı sınırlı.",
    achieved: "Kişiler, duygular, haklar ve sonuçlar arasında ilişki kuruyor.",
    advanced: "Kısa ve uzun vadeli etkileri, farklı bakışları ve toplumsal sonucu değerlendiriyor.",
  },
  {
    criterion: "Gerekçe ve kaynak",
    beginning: "Kararını gerekçesiz belirtiyor.",
    developing: "Kişisel örnekle gerekçe sunuyor.",
    achieved: "Değer/ilke ve güvenilir bilgiyle gerekçe kuruyor.",
    advanced: "Kaynak türünü ayırt ediyor, karşı görüşü değerlendiriyor ve tutarlı savunu kuruyor.",
  },
  {
    criterion: "Hayata aktarma",
    beginning: "Uygulanabilir bir adım belirleyemiyor.",
    developing: "Genel bir iyi davranış söylüyor.",
    achieved: "Kim, ne zaman, nasıl sorularını cevaplayan güvenli adım planlıyor.",
    advanced: "Uyguluyor, etkisini gözlüyor, geri bildirimle iyileştiriyor ve sürdürülebilir hâle getiriyor.",
  },
];

export const monthlyChecklist = [
  "Derslerde özgün plandaki 20 başlığın tamamı işlendi veya gerekçeli olarak yeniden zamanlandı.",
  "Her ders için en az bir gözlenebilir öğrenme kanıtı kaydedildi.",
  "Ayet, hadis, siyer, fıkıh ve menkıbe kaynakları yayın/uygulama öncesinde doğrulandı.",
  "Korkutma, utandırma, kıyaslama ve kişisel ibadet sorgulaması yapılmadı.",
  "Özel gereksinim, okuma güçlüğü ve farklı katılım biçimleri için uyarlama sunuldu.",
  "Öğrencilerin soruları ve kavram yanılgıları sonraki ayın planına not edildi.",
  "Aile çalışması notlandırma veya mahrem bilgi toplama aracı olarak kullanılmadı.",
  "Ay sonunda öğrenci kendi güçlü yönünü ve bir sonraki adımını belirledi.",
];
