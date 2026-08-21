export function defaultFieldInfo(label: string) {
  const normalized = label.toLocaleLowerCase("az-AZ");

  if (normalized.includes("şifrəni təkrar")) return "Yazdığınız şifrənin düzgün olduğunu yoxlamaq üçün eyni şifrəni yenidən daxil edin.";
  if (normalized.includes("şifrə")) return "Hesabınıza təhlükəsiz giriş üçün istifadə edəcəyiniz şifrəni daxil edin.";
  if (normalized.includes("telefon")) return "Əlaqə, hesabın tanınması və lazım olduqda sizinlə əlaqə saxlanılması üçün telefon nömrəsini daxil edin.";
  if (normalized.includes("ad və soyad")) return "Şəxsin sistemdə necə göstəriləcəyini müəyyən edən ad və soyadı daxil edin.";
  if (normalized === "ad" || normalized.startsWith("ad (")) return "Şəxsin adını daxil edin; bu məlumat hesabda və aidiyyəti əməliyyatlarda göstərilir.";
  if (normalized.includes("soyad")) return "Şəxsin soyadını daxil edin; bu məlumat hesab sahibini düzgün tanımağa kömək edir.";
  if (normalized.includes("biznes adı")) return "Müştərilərin və komandanın görəcəyi rəsmi və ya gündəlik biznes adını daxil edin.";
  if (normalized.includes("filial adı")) return "Bu məkanı digər filiallardan ayırmaq üçün tanınan filial adını daxil edin.";
  if (normalized.includes("otaq") && normalized.includes("adı")) return "Müştərilərin axtarışda və rezervasiya zamanı görəcəyi otaq və ya mütəxəssis adını daxil edin.";
  if (normalized.includes("iş sahəsinin adı")) return "Fərdi iş sahənizin sistemdə və idarəetmə panelində görünəcək adını daxil edin.";
  if (normalized.includes("nömrəsi") || normalized.includes("qeyd/kod") || normalized.includes("nömrəsi və ya kodu")) return "Otağı daxildə daha rahat ayırmaq üçün nömrə, qısa kod və ya tanıdıcı qeyd daxil edin.";
  if (normalized.includes("iş rejimi")) return "Otağın canlı növbə ilə, yoxsa əvvəlcədən planlanan rezervasiya ilə işləyəcəyini seçin.";
  if (normalized.includes("görünürlük")) return "Otağın axtarışda hamıya, yalnız link və QR ilə, yaxud yalnız səlahiyyətli şəxslərə görünməsini seçin.";
  if (normalized.includes("standart") && normalized.includes("müddət")) return "Bir iştirakçı üçün ayrılan standart növbə müddətini dəqiqə ilə göstərin.";
  if (normalized.includes("fasilə")) return "Ardıcıl rezervasiyalar arasında hazırlanmaq üçün saxlanacaq əlavə vaxtı dəqiqə ilə göstərin.";
  if (normalized.includes("rezervasiya pəncərəsi")) return "Müştərilərin bu gündən maksimum neçə gün sonrakı tarixə rezervasiya edə biləcəyini müəyyən edin.";
  if (normalized.includes("minimum əvvəlcədən")) return "Rezervasiyanın başlanmasına ən az neçə dəqiqə qalmış qəbul edilə biləcəyini müəyyən edin.";
  if (normalized.includes("ləğv üçün son")) return "Müştərinin rezervasiyanı başlamazdan neçə dəqiqə əvvələdək ləğv edə biləcəyini müəyyən edin.";
  if (normalized.includes("sıfırlan")) return "Canlı növbənin nə vaxt və ya hansı aralıqla təmizlənərək yeni dövrə başlayacağını müəyyən edin.";
  if (normalized.includes("iştirakçı limiti")) return "Eyni canlı növbəyə maksimum neçə iştirakçının qoşula biləcəyini müəyyən edin; boş saxlasanız limit olmayacaq.";
  if (normalized.includes("tarix")) return "Məlumatın və ya əməliyyatın tətbiq olunacağı tarixi seçin.";
  if (normalized.includes("başlayır") || normalized === "başlanğıc" || normalized.includes("bitir") || normalized === "bitmə" || normalized.includes("saat")) return "Vaxtı 24 saat formatında daxil edin, məsələn 09:00 və ya 18:30.";
  if (normalized.includes("ünvan")) return "Müştərilərin məkanı tapması üçün tam və aydın ünvanı daxil edin.";
  if (normalized.includes("şəhər")) return "Filialın və ya qəbul məkanının yerləşdiyi şəhəri daxil edin.";
  if (normalized.includes("rayon")) return "Axtarış nəticələrini dəqiqləşdirmək üçün məkanın yerləşdiyi rayonu daxil edin.";
  if (normalized.includes("kateqoriya") || normalized.includes("biznes sahəsi")) return "Biznesi müştərilərin düzgün tapa bilməsi üçün uyğun fəaliyyət sahəsini seçin.";
  if (normalized.includes("əlaqə mənbəyi")) return "Müştərinin növbə və ya rezervasiya üçün hansı kanalla müraciət etdiyini seçin.";
  if (normalized.includes("rol")) return "İstifadəçinin biznes daxilində hansı səlahiyyətlərə malik olacağını seçin.";
  if (normalized.includes("owner seç")) return "Bu otağı idarə edə biləcək komanda üzvünü seçin.";
  if (normalized.includes("filial")) return "Otağın aid olacağı filialı seçin.";
  if (normalized.includes("hüquqi ad")) return "Rəsmi sənədlərdə istifadə olunan hüquqi biznes adını daxil edin.";
  if (normalized.includes("vöen")) return "Biznesin vergi ödəyicisinin eyniləşdirmə nömrəsini daxil edin.";
  if (normalized.includes("qərar")) return "Müraciət üzrə tətbiq ediləcək inzibati qərarı seçin və ya onun əsaslandırmasını yazın.";
  if (normalized.includes("səbəb")) return "Əməliyyatın niyə edildiyini sonradan anlamaq üçün aydın səbəb yazın.";
  if (normalized.includes("qeyd") || normalized.includes("açıqlama") || normalized.includes("haqqında") || normalized.includes("izah")) return "Aidiyyəti şəxslərə əlavə kontekst vermək üçün qısa və aydın məlumat yazın.";
  if (normalized.includes("admin istifadəçi")) return "Platforma administrator hesabınız üçün təyin olunmuş istifadəçi adını daxil edin.";
  if (normalized.includes("müştəri user id")) return "Əməliyyatın tətbiq ediləcəyi müştərinin sistem identifikatorunu daxil edin.";

  return `“${label}” sahəsinə bu əməliyyat üçün tələb olunan uyğun məlumatı daxil edin və ya seçim edin.`;
}
