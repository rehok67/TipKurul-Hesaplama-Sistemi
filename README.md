# 🏥 Tıp Fakültesi Not Hesaplama Sistemi

**Kapsamlı tıp fakültesi dönem notu hesaplama sistemi** - İKÇÜ Sistem 1 desteği, finalsiz dönem hesaplama ve özel sistem oluşturma.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-tipkurul--hesaplama.web.app-blue)](https://tipkurul-hesaplama.web.app)
[![License](https://img.shields.io/badge/📄_License-MIT-green.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/🔥_Firebase-Hosting-orange)](https://firebase.google.com/)

## ✨ Özellikler

### 🎯 **Sistem Desteği**
- **İKÇÜ Sistem 1**: Önceden tanımlı katsayılar (5 Kur + ITS + TMB + Final)
- **Özel Sistem Oluşturma**: Kendi fakülten için özel hesaplama sistemi
- **Firebase Veritabanı**: Oluşturulan sistemler online paylaşım

### 📊 **Hesaplama Özellikleri**
- **Finalsiz Dönem**: Final katsayısını diğer derslere orantılı dağıtma
- **Dinamik Katsayılar**: 0.00001 hassasiyetinde ondalık destek
- **Gerekli Final Notu**: Final öncesi geçmek için gerekli not hesaplama
- **Harf Notu Sistemi**: Configurable harf notu desteği

### 🔧 **Kurs Yönetimi**
- **Dinamik Kurs Ekleme**: BASIC, FIXED, EXTRA kurs tipleri
- **Kurs Sıralama**: Drag & drop benzeri sıralama (⬆️⬇️)
- **Kurs Kaldırma**: İstediğin kursu geçici olarak devre dışı bırakma
- **Otomatik Katsayı Dağılımı**: Toplam %100 kontrolü

## 🚀 Canlı Demo

**🌐 [tipkurul-hesaplama.web.app](https://tipkurul-hesaplama.web.app)**

## 📱 Ekran Görüntüleri

### Ana Hesaplama Ekranı
- Modern gradient tasarım
- Responsive mobile uyumlu
- Real-time hesaplama

### Sistem Oluşturma Paneli
- Template kurs desteği
- Geçme notu ayarları
- Firebase veritabanı entegrasyonu

## 🛠️ Teknolojiler

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Styling**: Modern CSS Grid/Flexbox, Gradients

## ⚡ Hızlı Başlangıç

### Gereksinimler
- Node.js 16+
- Firebase hesabı (opsiyonel, database için)

### Kurulum

```bash
# Repository'yi klonla
git clone https://github.com/[username]/tip-hesaplama-sistemi.git
cd tip-hesaplama-sistemi

# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev

# Production build
npm run build
```

### Firebase Konfigürasyonu

1. Firebase Console'da yeni proje oluştur
2. Firestore Database aktif et
3. `script.js` dosyasında Firebase config'i güncelle:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    // ... diğer ayarlar
};
```

## 📋 Kullanım

### 1. İKÇÜ Sistem 1
- Önceden tanımlı katsayılar ile hızlı hesaplama
- 5 Kur (%10 her biri) + ITS (%15) + TMB (%15) + Final (%20)
- Geçme notu: 59.5 (finalli), 84.5 (finalsiz)

### 2. Özel Sistem Oluşturma
```javascript
// Örnek sistem template'i
{
    systemName: "Ankara Tıp Sistemi",
    university: "Ankara Üniversitesi", 
    normalGecmeNotu: 60,
    finalsizGecmeNotu: 85,
    hasFixedCourses: true,
    hasHarfNotu: true,
    templateCourses: [...]
}
```

### 3. Finalsiz Dönem
- Final checkbox'ını işaretle
- Final katsayısı otomatik olarak diğer derslere dağıtılır
- Geçme notu finalsiz değere güncellenir

## 🔗 API Referansı

### Ana Fonksiyonlar

```javascript
// Hesaplama
hesapla()                          // Ana hesaplama fonksiyonu
updateKatsayilar()                 // Katsayı toplamını güncelle
calculateRequiredFinalGrade()      // Gerekli final notunu hesapla

// Sistem Yönetimi  
selectSystem(systemType)           // Sistem değiştir
saveCustomSystem()                 // Özel sistem kaydet
loadSavedSystem(systemId)          // Kaydedilen sistemi yükle

// Kurs Yönetimi
addNewCourse(type, name)           // Yeni kurs ekle
removeCourse(courseId)             // Kurs kaldır
moveCourse(courseId, direction)    // Kurs sırala
```

## 🌐 SEO & Erişilebilirlik

- **Meta Tags**: Title, Description, Keywords optimizasyonu
- **Open Graph**: Sosyal medya paylaşım desteği
- **JSON-LD**: Structured data ile arama motoru optimizasyonu
- **Sitemap**: XML sitemap ile indexing
- **Mobile First**: Responsive tasarım

## 📊 Tarayıcı Desteği

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile Safari/Chrome

## 🤝 Katkıda Bulunma

1. Repository'yi fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Değişiklikleri commit et (`git commit -m 'Add amazing feature'`)
4. Branch'i push et (`git push origin feature/amazing-feature`)
5. Pull Request oluştur

## 📝 Lisans

Bu proje MIT lisansı altında yayınlanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Katkıda Bulunanlar

- **Ana Geliştirici**: [Adın] - İlk sürüm ve tüm core features
- **Tasarım**: Modern gradient theme ve responsive design
- **SEO Optimizasyonu**: Meta tags ve structured data

## 📞 İletişim

- **Website**: https://tipkurul-hesaplama.web.app
- **Issues**: [GitHub Issues](https://github.com/[username]/tip-hesaplama-sistemi/issues)
- **Email**: [email@domain.com]

## 🙏 Teşekkürler

- Firebase ekibine hosting ve database için
- Vite.js ekibine hızlı build tool için  
- Tıp fakültesi öğrencilerine feedback için

---

⭐ **Bu proje faydalıysa star vermeyi unutma!**

📚 **Tıp fakültesi arkadaşlarınla paylaş!** 