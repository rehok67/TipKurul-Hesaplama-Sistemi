# 🔥 Firebase Database Kurulum Talimatları

Bu doküman, Tıp Fakültesi Not Hesaplama Sistemi için Firebase Database kurulumunu açıklar.

## 📋 Gereksinimler

1. Google hesabı
2. Firebase konsol erişimi
3. İnternet bağlantısı

## 🚀 Adım Adım Kurulum

### 1. Firebase Projesi Oluşturun

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" (Proje ekle) butonuna tıklayın
3. Proje adı girin: `tip-not-hesaplama`
4. Google Analytics'i etkinleştirin (isteğe bağlı)
5. "Create project" butonuna tıklayın

### 2. Firestore Database Oluşturun

1. Sol menüden "Firestore Database" seçin
2. "Create database" butonuna tıklayın
3. **Test mode** seçin (30 gün geçici erişim)
4. **Lokasyon**: `europe-west1` (Hollanda) veya `europe-west3` (Frankfurt) seçin
5. "Done" butonuna tıklayın

### 3. Web App Yapılandırması

1. Sol menüden "Project settings" (⚙️ ikonu) seçin
2. "General" sekmesinde, "Your apps" bölümüne gidin
3. "Web" ikonu (`</>`) tıklayın
4. App nickname: `tip-hesaplama-web`
5. **Firebase Hosting'i etkinleştirmeyin** (şimdilik)
6. "Register app" butonuna tıklayın

### 4. Yapılandırma Kodunu Alın

Firebase size aşağıdaki gibi bir kod verecek:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tip-not-hesaplama.firebaseapp.com",
  projectId: "tip-not-hesaplama",
  storageBucket: "tip-not-hesaplama.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5. index.html Dosyasını Güncelleyin

`index.html` dosyasında, Firebase config kısmını güncelleyin:

```javascript
// Firebase SDKs
<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
    
    // BURAYA KENDI FIREBASE CONFIG'INIZI YAPIŞTIRIN
    const firebaseConfig = {
        apiKey: "buraya-kendi-api-key-inizi-yazın",
        authDomain: "tip-not-hesaplama.firebaseapp.com",
        projectId: "tip-not-hesaplama",
        storageBucket: "tip-not-hesaplama.firebasestorage.app",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:demo"
    };
    
    const app = initializeApp(firebaseConfig);
    window.db = getFirestore(app);
</script>
```

### 6. Güvenlik Kuralları (İsteğe Bağlı)

Eğer herkese okuma/yazma izni vermek istiyorsanız:

1. Firebase Console'da "Firestore Database" bölümüne gidin
2. "Rules" sekmesine tıklayın
3. Kuralları şu şekilde değiştirin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sistemler koleksiyonuna herkes okuyabilir ve yazabilir
    match /systems/{document} {
      allow read, write: if true;
    }
  }
}
```

4. "Publish" butonuna tıklayın

## ⚠️ Güvenlik Notları

- **Test mode** sadece 30 gün geçerlidir
- Gerçek kullanım için güvenlik kurallarını sıkılaştırın
- API anahtarlarınızı güvende tutun
- Proje ayarlarından faturalandırmayı kontrol edin

## 🧪 Test Etme

1. Sunucuyu başlatın: `python -m http.server 8000`
2. Tarayıcıda `http://localhost:8000` adresine gidin
3. "Özel Sistem Oluştur" butonuna tıklayın
4. Sistem bilgilerini doldurun ve "Sistemi Kaydet" butonuna tıklayın
5. Başarı mesajı görünmeli ve sistem kaydedilmeli

## 🔧 Sorun Giderme

### Firebase bağlanamıyor
- İnternet bağlantınızı kontrol edin
- API anahtarının doğru olduğunu kontrol edin
- Browser console'da hata mesajlarına bakın

### Sistem kaydedilmiyor
- Firestore Database'in aktif olduğunu kontrol edin
- Güvenlik kurallarının doğru olduğunu kontrol edin
- Network sekmesinde Firebase isteklerini kontrol edin

### Sistemler görünmüyor
- Sayfa yenileme yapmayı deneyin
- Firebase proje ID'nin doğru olduğunu kontrol edin
- Console'da hata mesajlarına bakın

## 📊 Database Yapısı

Sistemler şu şekilde kaydedilir:

```
Collection: systems
Document: {auto-generated-id}
{
  name: "Ankara Tıp Sistemi",
  university: "Ankara Üniversitesi", 
  creator: "Ali Veli",
  settings: {
    gecmeNotu: 60,
    finalsizGecmeNotu: 85,
    minFinalNot: 60,
    hasFixedCourses: true,
    hasHarfNotu: false,
    hasShartliGecme: true
  },
  createdAt: "2024-01-01T12:00:00Z",
  version: "2.0"
}
```

## 🎯 Başarılı Kurulum Sonrası

✅ Firebase projesi oluşturuldu  
✅ Firestore Database aktif  
✅ Web app yapılandırıldı  
✅ Güvenlik kuralları ayarlandı  
✅ Sistem kaydetme test edildi  
✅ Sistemler yükleme test edildi  

Artık diğer üniversitelerden öğrenciler kendi sistemlerini oluşturup paylaşabilir! 🎉 