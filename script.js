// Firebase NPM import'ları
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';

// Firebase yapılandırması - Environment Variables ile güvenli
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase bağlantısı kuruldu (NPM)!');

// Global değişkenler
let currentSystem = 'ikcu';
let finalsizMod = false;
let originalKatsayilar = {};
let currentKatsayilar = {}; // Kullanıcının girdiği katsayıları saklar
let courseCounter = 0;
let allCourses = []; // Tüm kurslar (temel + sabit + ek)
let savedSystems = []; // Kaydedilen sistemler
let templateCourses = []; // Sistem oluştururken template kurlar
let templateCounter = 0;

// İKÇÜ sistem state'ini kalıcı korumak için
let ikcuSystemState = {
    courses: [],
    settings: {
        name: 'İKÇÜ Sistem 1',
        gecmeNotu: 59.5,
        finalsizGecmeNotu: 84.5,
        minFinalNot: 60,
        hasFixedCourses: true,
        hasHarfNotu: false,
        hasShartliGecme: false
    },
    initialized: false
};

// Temel kurs tipleri
const COURSE_TYPES = {
    BASIC: 'basic',     // 1-5 kurlar
    FIXED: 'fixed',     // ITS, TMB
    FINAL: 'final',     // Final
    EXTRA: 'extra'      // Kullanıcı eklediği
};

// Sistem ayarları
const systemSettings = {
    ikcu: {
        name: 'İKÇÜ Sistem 1',
        gecmeNotu: 59.5,
        finalsizGecmeNotu: 84.5,
        minFinalNot: 60,
        hasFixedCourses: true,
        hasHarfNotu: false,
        hasShartliGecme: false
    },
    custom: {
        name: 'Özel Sistem',
        gecmeNotu: 60,
        finalsizGecmeNotu: 85,
        minFinalNot: 60,
        hasFixedCourses: false,
        hasHarfNotu: true,
        hasShartliGecme: true
    }
};

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    
    // DOM render işlemlerinin tamamlanması için kısa gecikme
    setTimeout(() => {
        updateKatsayilar();
        hesapla();
    }, 50);
    
    // Template final durumunu kontrol et
    toggleTemplateFinal();
    
    // Firebase yüklendi, sistemleri çek
    loadSavedSystems();
});

// Sistemi başlat
function initializeSystem() {
    console.log('🔄 Sistem başlatılıyor...');
    
    // Varsayılan olarak İKÇÜ sistemini yükle
    if (!currentSystem || currentSystem === 'ikcu') {
        // İlk kez açılışta İKÇÜ sistemi kur
        initializeDefaultCourses(); // Bu İKÇÜ state'ini de oluşturacak
        currentSystem = 'ikcu';
        renderAllCourses();
        renderNotInputs(); // Not input'larını render et - EKSİK OLAN!
        saveOriginalKatsayilar();
        
        // İKÇÜ butonunu aktif göster
        document.getElementById('ikcuBtn').classList.add('active');
        
        console.log('✅ İKÇÜ sistem başlatıldı ve korunuyor!');
    }
}

// Varsayılan kursları başlat
function initializeDefaultCourses() {
    const defaultCourses = [
        // Temel 5 kur
        { id: 'kur1', type: COURSE_TYPES.BASIC, name: '1. Kur', defaultKatsayi: 10, isActive: true, order: 1 },
        { id: 'kur2', type: COURSE_TYPES.BASIC, name: '2. Kur', defaultKatsayi: 10, isActive: true, order: 2 },
        { id: 'kur3', type: COURSE_TYPES.BASIC, name: '3. Kur', defaultKatsayi: 10, isActive: true, order: 3 },
        { id: 'kur4', type: COURSE_TYPES.BASIC, name: '4. Kur', defaultKatsayi: 10, isActive: true, order: 4 },
        { id: 'kur5', type: COURSE_TYPES.BASIC, name: '5. Kur', defaultKatsayi: 10, isActive: true, order: 5 },
        
        // Sabit dersler
        { id: 'its', type: COURSE_TYPES.FIXED, name: 'ITS', defaultKatsayi: 15, isActive: true, order: 6 },
        { id: 'tmb', type: COURSE_TYPES.FIXED, name: 'TMB', defaultKatsayi: 15, isActive: true, order: 7 },
        
        // Final
        { id: 'final', type: COURSE_TYPES.FINAL, name: 'Final', defaultKatsayi: 20, isActive: true, order: 8 }
    ];
    
    allCourses = [...defaultCourses];
    
    // İKÇÜ sistem state'ini kaydet (ilk kez)
    if (!ikcuSystemState.initialized) {
        ikcuSystemState.courses = JSON.parse(JSON.stringify(defaultCourses)); // Deep copy
        ikcuSystemState.initialized = true;
        console.log('🏛️ İKÇÜ sistem state\'i kaydedildi:', ikcuSystemState);
    }
}

// İKÇÜ sistemini restore et
function restoreIkcuSystem() {
    console.log('🔄 İKÇÜ sistemi restore ediliyor...');
    
    // İKÇÜ sistem state'ini ana sisteme kopyala
    allCourses = JSON.parse(JSON.stringify(ikcuSystemState.courses));
    
    // İKÇÜ sistem ayarlarını restore et
    systemSettings['ikcu'] = JSON.parse(JSON.stringify(ikcuSystemState.settings));
    
    // UI'ı güncelle
    renderAllCourses();
    renderNotInputs();
    
    // Sabit dersleri göster
    const fixedCourses = document.getElementById('fixedCourses');
    const fixedNotlari = document.getElementById('fixedNotlariContainer');
    fixedCourses.style.display = 'block';
    fixedNotlari.style.display = 'block';
    
    console.log('✅ İKÇÜ sistemi restore edildi!');
    console.log('📋 Restore edilen kurslar:', allCourses);
}

// Tüm kursları render et
function renderAllCourses() {
    renderBasicCourses();
    renderFixedCourses();
    renderExtraCourses();
}

// Temel kursları render et
function renderBasicCourses() {
    const basicCourses = allCourses
        .filter(c => c.type === COURSE_TYPES.BASIC && c.isActive)
        .sort((a, b) => a.order - b.order);
    
    const container = document.getElementById('kurContainer');
    container.innerHTML = '';
    
    basicCourses.forEach((course, index) => {
        const isFirst = index === 0;
        const isLast = index === basicCourses.length - 1;
        
        const courseHTML = `
            <div class="input-group kur-group" data-kur="${course.id}">
                <div class="course-header">
                    <label for="${course.id}">${course.name} Katsayısı (%)</label>
                    <div class="order-controls">
                        <button class="order-btn ${isFirst ? 'disabled' : ''}" 
                                onclick="moveCourse('${course.id}', 'up')" 
                                ${isFirst ? 'disabled' : ''} 
                                title="Yukarı Taşı">⬆️</button>
                        <button class="order-btn ${isLast ? 'disabled' : ''}" 
                                onclick="moveCourse('${course.id}', 'down')" 
                                ${isLast ? 'disabled' : ''} 
                                title="Aşağı Taşı">⬇️</button>
                        <button class="remove-course-btn" onclick="removeCourse('${course.id}')" title="Kursu Kaldır">🗑️</button>
                    </div>
                </div>
                <div class="input-with-controls">
                    <input type="number" id="${course.id}" min="0" max="100" step="0.00001" value="${course.defaultKatsayi}" oninput="updateKatsayilar()">
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', courseHTML);
    });
    
    // Temel kur ekleme butonu
    const addButtonHTML = `
        <div class="add-course-section">
            <button class="add-course-btn" onclick="showAddCourseDialog('${COURSE_TYPES.BASIC}')">➕ Kur Ekle</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', addButtonHTML);
}

// Sabit kursları render et
function renderFixedCourses() {
    const fixedCourses = allCourses
        .filter(c => c.type === COURSE_TYPES.FIXED && c.isActive)
        .sort((a, b) => a.order - b.order);
    
    const container = document.getElementById('fixedCourses');
    
    // Başlık
    let fixedHTML = '<h4>📚 Sabit Dersler</h4>';
    
    fixedCourses.forEach((course, index) => {
        const isFirst = index === 0;
        const isLast = index === fixedCourses.length - 1;
        
        fixedHTML += `
            <div class="input-group kur-group" id="${course.id}Group">
                <div class="course-header">
                    <label for="${course.id}">${course.name} Katsayısı (%)</label>
                    <div class="order-controls">
                        <button class="order-btn ${isFirst ? 'disabled' : ''}" 
                                onclick="moveCourse('${course.id}', 'up')" 
                                ${isFirst ? 'disabled' : ''} 
                                title="Yukarı Taşı">⬆️</button>
                        <button class="order-btn ${isLast ? 'disabled' : ''}" 
                                onclick="moveCourse('${course.id}', 'down')" 
                                ${isLast ? 'disabled' : ''} 
                                title="Aşağı Taşı">⬇️</button>
                        <button class="remove-course-btn" onclick="removeCourse('${course.id}')" title="Dersi Kaldır">🗑️</button>
                    </div>
                </div>
                <div class="input-with-controls">
                    <input type="number" id="${course.id}" min="0" max="100" step="0.00001" value="${course.defaultKatsayi}" oninput="updateKatsayilar()">
                </div>
            </div>
        `;
    });
    
    // Final dersi
    const finalCourse = allCourses.find(c => c.type === COURSE_TYPES.FINAL);
    if (finalCourse && finalCourse.isActive) {
        fixedHTML += `
            <div class="input-group kur-group" id="finalGroup">
                <div class="course-header">
                    <label for="${finalCourse.id}">Final Katsayısı (%)</label>
                    <div class="order-controls">
                        <button class="remove-course-btn" onclick="removeCourse('${finalCourse.id}')" title="Final'i Kaldır">🗑️</button>
                    </div>
                </div>
                <div class="input-with-controls">
                    <input type="number" id="${finalCourse.id}" min="0" max="100" step="0.00001" value="${finalCourse.defaultKatsayi}" oninput="updateKatsayilar()">
                </div>
            </div>
        `;
    }
    
    // Sabit ders ekleme butonu
    fixedHTML += `
        <div class="add-course-section">
            <button class="add-course-btn" onclick="showAddCourseDialog('${COURSE_TYPES.FIXED}')">➕ Sabit Ders Ekle</button>
            <button class="add-course-btn" onclick="addRemovedCourse('final')" id="addFinalBtn" style="display: ${finalCourse && finalCourse.isActive ? 'none' : 'block'}">➕ Final Ekle</button>
        </div>
    `;
    
    container.innerHTML = fixedHTML;
}

// Ek kursları render et
function renderExtraCourses() {
    const extraCourses = allCourses
        .filter(c => c.type === COURSE_TYPES.EXTRA && c.isActive)
        .sort((a, b) => a.order - b.order);
    
    const container = document.getElementById('extraCoursesContainer');
    container.innerHTML = '';
    
    extraCourses.forEach((course, index) => {
        const isFirst = index === 0;
        const isLast = index === extraCourses.length - 1;
        
        const courseHTML = `
            <div class="extra-course-item" id="${course.id}Group">
                <div class="input-group">
                    <label for="${course.id}Name">Ders Adı:</label>
                    <input type="text" id="${course.id}Name" placeholder="Ders adı" value="${course.name || ''}" oninput="updateExtraCourseName('${course.id}', this.value)">
                </div>
                <div class="input-group">
                    <label for="${course.id}">Katsayı (%):</label>
                    <input type="number" id="${course.id}" min="0" max="100" step="0.00001" value="${course.defaultKatsayi || 0}" oninput="updateKatsayilar()">
                </div>
                <div class="extra-course-controls">
                    <button class="order-btn ${isFirst ? 'disabled' : ''}" 
                            onclick="moveCourse('${course.id}', 'up')" 
                            ${isFirst ? 'disabled' : ''} 
                            title="Yukarı Taşı">⬆️</button>
                    <button class="order-btn ${isLast ? 'disabled' : ''}" 
                            onclick="moveCourse('${course.id}', 'down')" 
                            ${isLast ? 'disabled' : ''} 
                            title="Aşağı Taşı">⬇️</button>
                    <button class="remove-course-btn" onclick="removeCourse('${course.id}')">🗑️</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', courseHTML);
    });
}

// Sistem seç
function selectSystem(systemType) {
    // Özel sistem oluştur butonuna tıklandıysa
    if (systemType === 'custom') {
        toggleCreateSystemPanel();
        return;
    }
    
    // Kaydedilen sistemlerden birini seçmek
    if (systemType.startsWith('saved_')) {
        const systemId = systemType.substring(6); // 'saved_' kısmını çıkar
        console.log('🔗 Kaydedilen sisteme yönlendiriliyor:', systemType, '->', systemId);
        loadSavedSystem(systemId);
        return;
    }
    
    currentSystem = systemType;
    
    // Tüm butonların active sınıfını kaldır
    document.querySelectorAll('.system-btn, .saved-system-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Buton görünümlerini güncelle
    if (systemType === 'ikcu') {
        document.getElementById('ikcuBtn').classList.add('active');
    }
    
    // Panel'i gizle
    document.getElementById('createSystemPanel').style.display = 'none';
    
    // Özel ayarları göster/gizle
    const customSettings = document.getElementById('customSettings');
    customSettings.classList.remove('show');
    
    // Sabit dersleri (ITS, TMB) göster/gizle
    const fixedCourses = document.getElementById('fixedCourses');
    const fixedNotlari = document.getElementById('fixedNotlariContainer');
    
    if (systemType === 'ikcu') {
        fixedCourses.style.display = 'block';
        fixedNotlari.style.display = 'block';
    } else {
        fixedCourses.style.display = 'none';
        fixedNotlari.style.display = 'none';
    }
    
    // İKÇÜ sistemine özel kurları yükle ve ayarları koru
    if (systemType === 'ikcu') {
        // İKÇÜ sistemini restore et (her zaman korunmalı)
        restoreIkcuSystem();
    }
    
    // Sistem ayarlarını uygula
    updateSystemSettings();
    updateKatsayilar();
    hesapla();
}

// Sistem ayarlarını güncelle
function updateSystemSettings() {
    const settings = systemSettings[currentSystem];
    
    if (currentSystem === 'ikcu') {
        // İKÇÜ sistemi için sabit değerler
        document.getElementById('gecmeNotu').value = finalsizMod ? settings.finalsizGecmeNotu : settings.gecmeNotu;
    } else {
        // Özel sistem için kullanıcı değerleri
        settings.gecmeNotu = parseFloat(document.getElementById('gecmeNotu').value) || 60;
    }
}

// Ayarları güncelle
function updateSettings() {
    if (currentSystem === 'custom') {
        systemSettings.custom.gecmeNotu = parseFloat(document.getElementById('gecmeNotu').value) || 60;
    }
    hesapla();
}

// Orijinal katsayıları kaydet
function saveOriginalKatsayilar() {
    originalKatsayilar = {};
    
    // Tüm aktif kursların defaultKatsayi değerlerini sakla
    const activeCourses = allCourses.filter(c => c.isActive);
    
    activeCourses.forEach(course => {
        originalKatsayilar[course.id] = course.defaultKatsayi || 0;
    });
    
    console.log('🏛️ Orijinal katsayılar kaydedildi:', originalKatsayilar);
}

// Mevcut katsayıları sakla (kullanıcının girdiği değerler)
function saveCurrentKatsayilar() {
    currentKatsayilar = {};
    
    // Tüm aktif kursları sakla (BASIC, FIXED, EXTRA, FINAL)
    const activeCourses = allCourses.filter(c => c.isActive);
    
    activeCourses.forEach(course => {
        const element = document.getElementById(course.id);
        if (element) {
            currentKatsayilar[course.id] = parseFloat(element.value) || 0;
        }
    });
    
    console.log('💾 Mevcut katsayılar kaydedildi:', currentKatsayilar);
}

// Finalsiz dönem toggle
function toggleFinalOrani() {
    const checkbox = document.getElementById('finalsizDonem');
    const finalGroup = document.getElementById('finalGroup');
    const finalNotGroup = document.getElementById('finalNotGroup');
    
    finalsizMod = checkbox.checked;
    
    if (finalsizMod) {
        // Mevcut katsayıları sakla
        saveCurrentKatsayilar();
        
        // Sadece Final'i gizle
        finalGroup.classList.add('hidden');
        finalNotGroup.classList.add('hidden');
        
        // Final oranını diğer katsayılara ağırlıklarına göre dağıt
        redistributeKatsayilarWithWeight();
        
        // İKÇÜ sisteminde geçme notunu güncelle
        if (currentSystem === 'ikcu') {
            document.getElementById('gecmeNotu').value = systemSettings.ikcu.finalsizGecmeNotu;
        }
    } else {
        // Final'i göster
        finalGroup.classList.remove('hidden');
        finalNotGroup.classList.remove('hidden');
        
        // Saklanan katsayıları geri yükle
        restoreCurrentKatsayilar();
        
        // İKÇÜ sisteminde geçme notunu güncelle
        if (currentSystem === 'ikcu') {
            document.getElementById('gecmeNotu').value = systemSettings.ikcu.gecmeNotu;
        }
    }
    
    updateKatsayilar();
    hesapla();
}

// Katsayıları yeniden dağıt (Final hariç tüm katsayıları orantılı olarak 100'e getir)
function redistributeKatsayilar() {
    let activeElements = [];
    let totalKatsayi = 0;
    
    // Tüm aktif kursları al (FINAL hariç)
    const activeCourses = allCourses.filter(c => 
        c.isActive && 
        c.type !== COURSE_TYPES.FINAL
    );
    
    activeCourses.forEach(course => {
        const katsayi = originalKatsayilar[course.id] || 0;
        activeElements.push({id: course.id, value: katsayi});
        totalKatsayi += katsayi;
    });
    
    // Orantılı dağıtım
    if(totalKatsayi > 0) {
        const carpan = 100 / totalKatsayi;
        
        activeElements.forEach(element => {
            const newValue = Math.round(element.value * carpan * 100000) / 100000;
            document.getElementById(element.id).value = newValue;
        });
    }
    
    // Final'i sıfırla (güvenli)
    const finalElement = document.getElementById('final');
    if (finalElement) {
        finalElement.value = 0;
    }
}

// Final oranını ağırlıklara göre dağıt (Kullanıcının girdiği katsayıları kullan)
function redistributeKatsayilarWithWeight() {
    const finalOrani = currentKatsayilar.final || 0;
    if (finalOrani === 0) return;
    
    let activeElements = [];
    let totalCurrentKatsayi = 0;
    
    // Tüm aktif kursları al (BASIC, FIXED, EXTRA - FINAL hariç)
    const activeCourses = allCourses.filter(c => 
        c.isActive && 
        c.type !== COURSE_TYPES.FINAL && 
        currentKatsayilar[c.id] !== undefined
    );
    
    activeCourses.forEach(course => {
        const katsayi = currentKatsayilar[course.id] || 0;
        activeElements.push({id: course.id, value: katsayi});
        totalCurrentKatsayi += katsayi;
    });
    
    // Final oranını diğer katsayılara ağırlık oranında dağıt
    if(totalCurrentKatsayi > 0) {
        activeElements.forEach(element => {
            const agirlikOrani = element.value / totalCurrentKatsayi;
            const ekOran = finalOrani * agirlikOrani;
            const yeniDeger = element.value + ekOran;
            document.getElementById(element.id).value = Math.round(yeniDeger * 100000) / 100000;
        });
    }
    
    // Final'i sıfırla (güvenli)
    const finalElement = document.getElementById('final');
    if (finalElement) {
        finalElement.value = 0;
    }
}

// Orijinal katsayıları geri yükle
function restoreOriginalKatsayilar() {
    // Tüm aktif kursları geri yükle (güvenli)
    const activeCourses = allCourses.filter(c => c.isActive);
    
    activeCourses.forEach(course => {
        const element = document.getElementById(course.id);
        if (element && originalKatsayilar[course.id] !== undefined) {
            element.value = originalKatsayilar[course.id];
        }
    });
}

// Saklanan katsayıları geri yükle (kullanıcının girdiği değerler)
function restoreCurrentKatsayilar() {
    if (Object.keys(currentKatsayilar).length === 0) {
        restoreOriginalKatsayilar();
        return;
    }
    
    // Tüm aktif kursları geri yükle (BASIC, FIXED, EXTRA, FINAL)
    const activeCourses = allCourses.filter(c => c.isActive);
    
    activeCourses.forEach(course => {
        if (currentKatsayilar[course.id] !== undefined) {
            const element = document.getElementById(course.id);
            if (element) {
                element.value = currentKatsayilar[course.id];
            }
        }
    });
}

// Ek ders ekle (yeni sistem)
function addExtraCourse() {
    addNewCourse(COURSE_TYPES.EXTRA, 'Ek Ders');
}

// Ek ders adını güncelle
function updateExtraCourseName(courseId, name) {
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
        course.name = name;
        // Label'ı güncelle
        const label = document.querySelector(`label[for="${courseId}Not"]`);
        if (label) {
            label.textContent = name ? `${name} Notu` : 'Ders Notu';
        }
    }
}

// Kurs kaldır (universal)
function removeCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
        course.isActive = false;
        
        // HTML elementlerini kaldır
        const katsayiElement = document.getElementById(`${courseId}Group`) || document.querySelector(`[data-kur="${courseId}"]`);
        if (katsayiElement) {
            katsayiElement.remove();
        }
        
        const notElement = document.getElementById(`${courseId}NotGroup`) || document.querySelector(`[data-not="${courseId}"]`);
        if (notElement) {
            notElement.remove();
        }
        
        // Özel durumlar
        if (courseId === 'final') {
            document.getElementById('addFinalBtn').style.display = 'block';
        }
        
        // Re-render gerekli bölümleri
        if (course.type === COURSE_TYPES.BASIC) {
            renderBasicCourses();
        } else if (course.type === COURSE_TYPES.FIXED || course.type === COURSE_TYPES.FINAL) {
            renderFixedCourses();
        }
        
        renderNotInputs();
        updateKatsayilar();
        hesapla();
    }
}

// Ders ekleme dialogunu göster
function showAddCourseDialog(courseType) {
    const courseName = prompt(`Yeni ${courseType === COURSE_TYPES.BASIC ? 'kur' : 'ders'} adı:`);
    if (courseName && courseName.trim()) {
        addNewCourse(courseType, courseName.trim());
    }
}

// Kaldırılan dersi geri ekle
function addRemovedCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
        course.isActive = true;
        
        if (courseId === 'final') {
            document.getElementById('addFinalBtn').style.display = 'none';
        }
        
        renderAllCourses();
        renderNotInputs();
        updateKatsayilar();
        hesapla();
    }
}

// Yeni kurs ekle
function addNewCourse(courseType, courseName) {
    courseCounter++;
    const courseId = `${courseType}${courseCounter}`;
    
    // En büyük order'ı bul ve 1 ekle
    const maxOrder = Math.max(...allCourses.map(c => c.order || 0));
    
    const newCourse = {
        id: courseId,
        type: courseType,
        name: courseName,
        defaultKatsayi: 0,
        isActive: true,
        order: maxOrder + 1
    };
    
    allCourses.push(newCourse);
    
    // Re-render
    if (courseType === COURSE_TYPES.BASIC) {
        renderBasicCourses();
    } else if (courseType === COURSE_TYPES.FIXED) {
        renderFixedCourses();
    } else if (courseType === COURSE_TYPES.EXTRA) {
        renderExtraCourses();
    }
    
    renderNotInputs();
    updateKatsayilar();
    hesapla();
}

// Kursu taşı (yukarı/aşağı)
function moveCourse(courseId, direction) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    // Aynı tipte ve aktif olan kursları al
    const sameCourses = allCourses
        .filter(c => c.type === course.type && c.isActive)
        .sort((a, b) => a.order - b.order);
    
    const currentIndex = sameCourses.findIndex(c => c.id === courseId);
    
    if (direction === 'up' && currentIndex > 0) {
        // Üstteki kursla order'ları değiştir
        const targetCourse = sameCourses[currentIndex - 1];
        const tempOrder = course.order;
        course.order = targetCourse.order;
        targetCourse.order = tempOrder;
    } else if (direction === 'down' && currentIndex < sameCourses.length - 1) {
        // Alttaki kursla order'ları değiştir
        const targetCourse = sameCourses[currentIndex + 1];
        const tempOrder = course.order;
        course.order = targetCourse.order;
        targetCourse.order = tempOrder;
    }
    
    // Re-render
    renderAllCourses();
    renderNotInputs();
    updateKatsayilar();
    hesapla();
}

// Not input'larını render et
function renderNotInputs() {
    // Temel kurlar (order'a göre sıralı)
    const basicContainer = document.getElementById('kurNotlariContainer');
    basicContainer.innerHTML = '';
    
    allCourses
        .filter(c => c.type === COURSE_TYPES.BASIC && c.isActive)
        .sort((a, b) => a.order - b.order)
        .forEach(course => {
            const notHTML = `
                <div class="input-group" data-not="${course.id}">
                    <label for="${course.id}Not">${course.name} Notu</label>
                    <input type="number" id="${course.id}Not" min="0" max="100" step="0.1" oninput="hesapla()">
                </div>
            `;
            basicContainer.insertAdjacentHTML('beforeend', notHTML);
        });
    
    // Sabit dersler (order'a göre sıralı)
    const fixedContainer = document.getElementById('fixedNotlariContainer');
    fixedContainer.innerHTML = '';
    
    allCourses
        .filter(c => (c.type === COURSE_TYPES.FIXED || c.type === COURSE_TYPES.FINAL) && c.isActive)
        .sort((a, b) => a.order - b.order)
        .forEach(course => {
            const notHTML = `
                <div class="input-group" id="${course.id}NotGroup" data-not="${course.id}">
                    <label for="${course.id}Not">${course.name} Notu</label>
                    <input type="number" id="${course.id}Not" min="0" max="100" step="0.1" oninput="hesapla()">
                </div>
            `;
            fixedContainer.insertAdjacentHTML('beforeend', notHTML);
        });
    
    // Ek dersler (order'a göre sıralı)
    const extraContainer = document.getElementById('extraNotlariContainer');
    extraContainer.innerHTML = '';
    
    allCourses
        .filter(c => c.type === COURSE_TYPES.EXTRA && c.isActive)
        .sort((a, b) => a.order - b.order)
        .forEach(course => {
            const notHTML = `
                <div class="input-group" id="${course.id}NotGroup" data-not="${course.id}">
                    <label for="${course.id}Not">${course.name || 'Ders'} Notu</label>
                    <input type="number" id="${course.id}Not" min="0" max="100" step="0.1" oninput="hesapla()">
                </div>
            `;
            extraContainer.insertAdjacentHTML('beforeend', notHTML);
        });
}

// Ek dersi kaldır
function removeExtraCourse(courseId) {
    // Katsayı alanını kaldır
    const groupElement = document.getElementById(`${courseId}Group`);
    if (groupElement) {
        groupElement.remove();
    }
    
    // Not alanını kaldır
    const notGroupElement = document.getElementById(`${courseId}NotGroup`);
    if (notGroupElement) {
        notGroupElement.remove();
    }
    
    // Array'den kaldır
    extraCourses = extraCourses.filter(c => c.id !== courseId);
    
    updateKatsayilar();
    hesapla();
}

// Katsayıları güncelle
function updateKatsayilar() {
    let toplam = 0;
    
    // Tüm aktif kursları topla
    allCourses.forEach(course => {
        if (course.isActive) {
            // Final finalsiz modda dahil edilmez
            if (finalsizMod && course.type === COURSE_TYPES.FINAL) {
                return;
            }
            
            const element = document.getElementById(course.id);
            if (element) {
                toplam += parseFloat(element.value) || 0;
            }
        }
    });
    
    document.getElementById('toplamKatsayi').textContent = toplam.toFixed(5);
    
    const toplamContainer = document.querySelector('.toplam-container');
    if (Math.abs(toplam - 100) > 0.00001) {
        toplamContainer.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else {
        toplamContainer.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    hesapla();
}

// Ana hesaplama fonksiyonu
function hesapla() {
    let toplamKatsayi = 0;
    let donemNotu = 0;
    let finalGirildi = false;
    
    // Tüm aktif kursları işle
    allCourses.forEach(course => {
        if (course.isActive) {
            // Final finalsiz modda dahil edilmez
            if (finalsizMod && course.type === COURSE_TYPES.FINAL) {
                return;
            }
            
            const katsayiElement = document.getElementById(course.id);
            const notElement = document.getElementById(`${course.id}Not`);
            
            if (katsayiElement && notElement) {
                const katsayi = parseFloat(katsayiElement.value) || 0;
                const not = parseFloat(notElement.value);
                
                toplamKatsayi += katsayi;
                
                // Final özel kontrolü
                if (course.type === COURSE_TYPES.FINAL) {
                    if (not !== null && not !== '' && !isNaN(not)) {
                        donemNotu += (parseFloat(not) * katsayi) / 100;
                        finalGirildi = true;
                    }
                } else {
                    // Diğer dersler için normal hesaplama
                    donemNotu += ((not || 0) * katsayi) / 100;
                }
            }
        }
    });
    
    // Toplam katsayı kontrolü (0.00001 tolerans ile)
    if (Math.abs(toplamKatsayi - 100) > 0.00001) {
        document.getElementById('donemNotu').textContent = 'Hatalı Katsayı';
        document.getElementById('harfNotu').textContent = '-';
        document.getElementById('durum').textContent = '-';
        updateCalculationDetails('Hatalı katsayı');
        return;
    }
    
    // Final girilmemişse, geçmek için gerekli final notunu hesapla
    const finalCourse = allCourses.find(c => c.type === COURSE_TYPES.FINAL && c.isActive);
    if (!finalsizMod && finalCourse && !finalGirildi) {
        calculateRequiredFinalGrade(donemNotu);
    } else {
        updateResults(donemNotu);
    }
}

// Sonuçları güncelle
function updateResults(donemNotu) {
    document.getElementById('donemNotu').textContent = donemNotu.toFixed(2);
    
    const harfNotu = getHarfNotu(donemNotu);
    document.getElementById('harfNotu').textContent = harfNotu;
    
    const durum = getDurum(donemNotu);
    document.getElementById('durum').textContent = durum;
    
    setResultColors(donemNotu);
    updateCalculationDetails(donemNotu);
}

// Harf notu hesapla
function getHarfNotu(not) {
    // İKÇÜ sistemi veya kaydedilen sistemlerde harf notu kontrolü
    if (currentSystem === 'ikcu') {
        return '-'; // İKÇÜ sisteminde harf notu yok
    }
    
    // Kaydedilen sistemlerde harf notu kontrolü
    if (currentSystem.startsWith('saved_')) {
        const settings = systemSettings[currentSystem];
        if (!settings || !settings.hasHarfNotu) {
            return '-'; // Bu sistemde harf notu yok
        }
    }
    
    // Harf notu olan sistemlerde
    if (not >= 90) return 'AA';
    if (not >= 85) return 'BA';
    if (not >= 80) return 'BB';
    if (not >= 75) return 'CB';
    if (not >= 70) return 'CC';
    if (not >= 65) return 'DC';
    if (not >= 60) return 'DD';
    if (not >= 50) return 'FD';
    return 'FF';
}

// Durum belirle
function getDurum(not) {
    const settings = systemSettings[currentSystem];
    if (!settings) return 'Sistem Hatası';
    
    const gecmeNotu = finalsizMod ? settings.finalsizGecmeNotu : settings.gecmeNotu;
    
    // İKÇÜ sistemi - sadece geçer/geçmez
    if (currentSystem === 'ikcu') {
        return not >= gecmeNotu ? 'Geçer' : 'Geçmez';
    }
    
    // Kaydedilen sistemler
    if (currentSystem.startsWith('saved_')) {
        if (not >= gecmeNotu) {
            return 'Geçer';
        } else if (settings.hasShartliGecme && not >= 50) {
            return 'Şartlı Geçer';
        } else {
            return 'Geçmez';
        }
    }
    
    // Diğer özel sistemler
    if (not >= gecmeNotu) return 'GEÇTİ';
    if (not >= 50) return 'ŞARTLI GEÇTİ';
    return 'KALDI';
}

// Geçmek için gerekli final notunu hesapla
function calculateRequiredFinalGrade(currentPoints) {
    const settings = systemSettings[currentSystem];
    const gecmeNotu = settings.gecmeNotu; // Finalli durumda geçme notu
    const finalKatsayi = parseFloat(document.getElementById('final').value) || 0;
    
    if (finalKatsayi === 0) {
        updateResults(currentPoints);
        return;
    }
    
    // Geçmek için gereken toplam puan
    const gerekliToplam = gecmeNotu;
    
    // Final'den gereken puan
    const gerekliFromFinal = gerekliToplam - currentPoints;
    
    // Final'den gereken not (0-100 arası)
    const gerekliFinalNot = (gerekliFromFinal * 100) / finalKatsayi;
    
    // Sonuçları göster
    document.getElementById('donemNotu').textContent = `Şu anki: ${currentPoints.toFixed(2)}`;
    document.getElementById('harfNotu').textContent = '-';
    
    if (gerekliFinalNot <= 100 && gerekliFinalNot >= 0) {
        document.getElementById('durum').textContent = `Finale ${Math.ceil(gerekliFinalNot)} gerekir`;
        document.getElementById('durum').classList.remove('success', 'danger');
        document.getElementById('durum').classList.add('warning');
    } else if (gerekliFinalNot < 0) {
        document.getElementById('durum').textContent = 'Zaten Geçmiş';
        document.getElementById('durum').classList.remove('warning', 'danger');
        document.getElementById('durum').classList.add('success');
    } else {
        document.getElementById('durum').textContent = 'Final ile Geçemez';
        document.getElementById('durum').classList.remove('success', 'warning');
        document.getElementById('durum').classList.add('danger');
    }
    
    updateCalculationDetailsForRequired(currentPoints, gerekliFinalNot);
}

// Sonuç renklerini ayarla
function setResultColors(not) {
    const elements = [
        document.getElementById('donemNotu'),
        document.getElementById('harfNotu'),
        document.getElementById('durum')
    ];
    
    const settings = systemSettings[currentSystem];
    const gecmeNotu = finalsizMod ? 
        (currentSystem === 'ikcu' ? settings.finalsizGecmeNotu : 85) : 
        settings.gecmeNotu;
    
    elements.forEach(el => {
        el.classList.remove('success', 'warning', 'danger');
        if (not >= gecmeNotu) {
            el.classList.add('success');
        } else if (currentSystem !== 'ikcu' && not >= 50) {
            el.classList.add('warning');
        } else {
            el.classList.add('danger');
        }
    });
}

// Hesaplama detayını güncelle
function updateCalculationDetails(donemNotu) {
    const detayContainer = document.getElementById('detayIcerik');
    
    if (typeof donemNotu === 'string') {
        detayContainer.innerHTML = `<div class="calculation-step error">${donemNotu}</div>`;
        return;
    }
    
    let detayHTML = `
        <div class="calculation-step">
            <strong>${systemSettings[currentSystem].name} - ${finalsizMod ? 'Finalsiz' : 'Normal'} Dönem:</strong>
        </div>
    `;
    
    // 5 Kur (güvenli erişim)
    for (let i = 1; i <= 5; i++) {
        const katsayiElement = document.getElementById(`kur${i}`);
        const notElement = document.getElementById(`kurNot${i}`);
        
        if (katsayiElement && notElement) {
            const katsayi = parseFloat(katsayiElement.value) || 0;
            const not = parseFloat(notElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    ${i}. Kur: ${not} × ${katsayi}% = ${(not * katsayi / 100).toFixed(2)}
                </div>
            `;
        }
    }
    
    // İKÇÜ sisteminde ITS, TMB (güvenli erişim)
    if(currentSystem === 'ikcu') {
        const itsElement = document.getElementById('its');
        const itsNotElement = document.getElementById('itsNot');
        const tmbElement = document.getElementById('tmb');
        const tmbNotElement = document.getElementById('tmbNot');
        
        if (itsElement && itsNotElement) {
            const itsKatsayi = parseFloat(itsElement.value) || 0;
            const itsNot = parseFloat(itsNotElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    ITS: ${itsNot} × ${itsKatsayi}% = ${(itsNot * itsKatsayi / 100).toFixed(2)}
                </div>
            `;
        }
        
        if (tmbElement && tmbNotElement) {
            const tmbKatsayi = parseFloat(tmbElement.value) || 0;
            const tmbNot = parseFloat(tmbNotElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    TMB: ${tmbNot} × ${tmbKatsayi}% = ${(tmbNot * tmbKatsayi / 100).toFixed(2)}
                </div>
            `;
        }
    }
    
    // Final (finalsiz değilse)
    if(!finalsizMod) {
        const finalElement = document.getElementById('final');
        const finalNotElement = document.getElementById('finalNot');
        
        if (finalElement && finalNotElement) {
            const finalKatsayi = parseFloat(finalElement.value) || 0;
            const finalNot = parseFloat(finalNotElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    Final: ${finalNot} × ${finalKatsayi}% = ${(finalNot * finalKatsayi / 100).toFixed(2)}
                </div>
            `;
        }
    }
    
    // Ek dersler (yeni sistem)
    const activeCourses = allCourses ? allCourses.filter(c => c.type === COURSE_TYPES.EXTRA && c.isActive) : [];
    activeCourses.forEach(course => {
        const katsayiElement = document.getElementById(course.id);
        const notElement = document.getElementById(`${course.id}Not`);
        
        if (katsayiElement && notElement) {
            const katsayi = parseFloat(katsayiElement.value) || 0;
            const not = parseFloat(notElement.value) || 0;
            const courseName = course.name || 'Ek Ders';
            detayHTML += `
                <div class="calculation-step">
                    ${courseName}: ${not} × ${katsayi}% = ${(not * katsayi / 100).toFixed(2)}
                </div>
            `;
        }
    });
    
    const settings = systemSettings[currentSystem];
    const gecmeNotu = finalsizMod ? 
        (currentSystem === 'ikcu' ? settings.finalsizGecmeNotu : 85) : 
        settings.gecmeNotu;
    
    detayHTML += `
        <div class="calculation-step">
            <strong>Dönem Notu = ${donemNotu.toFixed(2)}</strong>
        </div>
        <div class="calculation-step">
            <strong>Geçme Notu: ${gecmeNotu}</strong>
        </div>
    `;
    
    detayContainer.innerHTML = detayHTML;
}

// Final gerekli hesaplama detayını güncelle
function updateCalculationDetailsForRequired(currentPoints, requiredFinalGrade) {
    const detayContainer = document.getElementById('detayIcerik');
    const settings = systemSettings[currentSystem];
    const gecmeNotu = settings.gecmeNotu;
    
    // Final elementini güvenli şekilde al
    const finalElement = document.getElementById('final');
    const finalKatsayi = finalElement ? parseFloat(finalElement.value) || 0 : 0;
    
    let detayHTML = `
        <div class="calculation-step">
            <strong>${systemSettings[currentSystem].name} - Final Öncesi Durum:</strong>
        </div>
    `;
    
    // 5 Kur (güvenli erişim)
    for (let i = 1; i <= 5; i++) {
        const katsayiElement = document.getElementById(`kur${i}`);
        const notElement = document.getElementById(`kurNot${i}`);
        
        if (katsayiElement && notElement) {
            const katsayi = parseFloat(katsayiElement.value) || 0;
            const not = parseFloat(notElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    ${i}. Kur: ${not} × ${katsayi}% = ${(not * katsayi / 100).toFixed(2)}
                </div>
            `;
        }
    }
    
    // İKÇÜ sisteminde ITS, TMB (güvenli erişim)
    if(currentSystem === 'ikcu') {
        const itsElement = document.getElementById('its');
        const itsNotElement = document.getElementById('itsNot');
        const tmbElement = document.getElementById('tmb');
        const tmbNotElement = document.getElementById('tmbNot');
        
        if (itsElement && itsNotElement) {
            const itsKatsayi = parseFloat(itsElement.value) || 0;
            const itsNot = parseFloat(itsNotElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    ITS: ${itsNot} × ${itsKatsayi}% = ${(itsNot * itsKatsayi / 100).toFixed(2)}
                </div>
            `;
        }
        
        if (tmbElement && tmbNotElement) {
            const tmbKatsayi = parseFloat(tmbElement.value) || 0;
            const tmbNot = parseFloat(tmbNotElement.value) || 0;
            detayHTML += `
                <div class="calculation-step">
                    TMB: ${tmbNot} × ${tmbKatsayi}% = ${(tmbNot * tmbKatsayi / 100).toFixed(2)}
                </div>
            `;
        }
    }
    
    // Ek dersler (yeni sistem)
    const activeCourses = allCourses ? allCourses.filter(c => c.type === COURSE_TYPES.EXTRA && c.isActive) : [];
    activeCourses.forEach(course => {
        const katsayiElement = document.getElementById(course.id);
        const notElement = document.getElementById(`${course.id}Not`);
        
        if (katsayiElement && notElement) {
            const katsayi = parseFloat(katsayiElement.value) || 0;
            const not = parseFloat(notElement.value) || 0;
            const courseName = course.name || 'Ek Ders';
            detayHTML += `
                <div class="calculation-step">
                    ${courseName}: ${not} × ${katsayi}% = ${(not * katsayi / 100).toFixed(2)}
                </div>
            `;
        }
    });
    
    detayHTML += `
        <div class="calculation-step">
            <strong>Şu Anki Toplam = ${currentPoints.toFixed(2)} puan</strong>
        </div>
        <div class="calculation-step">
            <strong>Geçme Notu: ${gecmeNotu} puan</strong>
        </div>
        <div class="calculation-step">
            <strong>Gereken Puan: ${(gecmeNotu - currentPoints).toFixed(2)}</strong>
        </div>
        <div class="calculation-step">
            <strong>Final Katsayısı: ${finalKatsayi}%</strong>
        </div>
    `;
    
    if (requiredFinalGrade <= 100 && requiredFinalGrade >= 0) {
        detayHTML += `
            <div class="calculation-step success">
                <strong>🎯 Geçmek için finale ${Math.ceil(requiredFinalGrade)} puan gerekir</strong>
            </div>
        `;
    } else if (requiredFinalGrade < 0) {
        detayHTML += `
            <div class="calculation-step success">
                <strong>🎉 Zaten geçmiş durumdasınız!</strong>
            </div>
        `;
    } else {
        detayHTML += `
            <div class="calculation-step error">
                <strong>❌ Final ile bile geçmek mümkün değil</strong>
            </div>
        `;
    }
    
    // Final minimum not uyarısı
    detayHTML += `
        <div class="calculation-step" style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; margin-top: 15px;">
            <strong>⚠️ Not: Finalden en az 60 almak zorunludur</strong>
        </div>
    `;
    
    detayContainer.innerHTML = detayHTML;
}

// Temizle fonksiyonu
function temizle() {
    // 5 Kur notlarını temizle (güvenli)
    for (let i = 1; i <= 5; i++) {
        const notElement = document.getElementById(`kurNot${i}`);
        if (notElement) {
            notElement.value = '';
        }
    }
    
    // İKÇÜ sisteminde ITS, TMB notlarını temizle (güvenli)
    if(currentSystem === 'ikcu') {
        const itsNotElement = document.getElementById('itsNot');
        const tmbNotElement = document.getElementById('tmbNot');
        
        if (itsNotElement) itsNotElement.value = '';
        if (tmbNotElement) tmbNotElement.value = '';
    }
    
    // Final notunu temizle (güvenli)
    const finalNotElement = document.getElementById('finalNot');
    if (finalNotElement) {
        finalNotElement.value = '';
    }
    
    // Ek ders notlarını temizle (yeni sistem)
    const activeCourses = allCourses ? allCourses.filter(c => c.type === COURSE_TYPES.EXTRA && c.isActive) : [];
    activeCourses.forEach(course => {
        const notElement = document.getElementById(`${course.id}Not`);
        if (notElement) {
            notElement.value = '';
        }
    });
    
    // Sonuçları sıfırla
    document.getElementById('donemNotu').textContent = '-';
    document.getElementById('harfNotu').textContent = '-';
    document.getElementById('durum').textContent = '-';
    
    const resultElements = document.querySelectorAll('.result-value');
    resultElements.forEach(el => {
        el.classList.remove('success', 'warning', 'danger');
    });
    
    document.getElementById('detayIcerik').innerHTML = '<p>Notları girin ve hesaplama detayını görün.</p>';
}

// Örnek doldur fonksiyonu
function ornekDoldur() {
    // 5 Kur notlarını doldur (güvenli)
    const kurValues = ['75', '80', '85', '70', '78'];
    for (let i = 1; i <= 5; i++) {
        const element = document.getElementById(`kurNot${i}`);
        if (element) {
            element.value = kurValues[i-1];
        }
    }
    
    // İKÇÜ sisteminde ITS, TMB (güvenli)
    if(currentSystem === 'ikcu') {
        const itsNotElement = document.getElementById('itsNot');
        const tmbNotElement = document.getElementById('tmbNot');
        
        if (itsNotElement) itsNotElement.value = '90';
        if (tmbNotElement) tmbNotElement.value = '85';
    }
    
    // Final (finalsiz değilse) (güvenli)
    if (!finalsizMod) {
        const finalNotElement = document.getElementById('finalNot');
        if (finalNotElement) {
            finalNotElement.value = '82';
        }
    }
    
    hesapla();
}

console.log('🏥 Tıp Fakültesi Not Hesaplama Sistemi yüklendi!');
console.log('💡 Yapı: 5 Kur + ITS + TMB + Final = 8 element');

// ================= GLOBAL FONKSIYON EXPORTLARİ =================
// HTML'deki onclick çağrıları için fonksiyonları global scope'a ekle

window.selectSystem = selectSystem;
window.updateKatsayilar = updateKatsayilar;
window.hesapla = hesapla;
window.toggleFinalOrani = toggleFinalOrani;
window.updateSettings = updateSettings;
window.addExtraCourse = addExtraCourse;
window.removeExtraCourse = removeExtraCourse;
window.updateExtraCourseName = updateExtraCourseName;
window.removeCourse = removeCourse;
window.showAddCourseDialog = showAddCourseDialog;
window.addRemovedCourse = addRemovedCourse;
window.addNewCourse = addNewCourse;
window.moveCourse = moveCourse;
window.renderNotInputs = renderNotInputs;
window.temizle = temizle;
window.ornekDoldur = ornekDoldur;
window.saveCustomSystem = saveCustomSystem;
window.cancelSystemCreation = cancelSystemCreation;
window.restoreIkcuSystem = restoreIkcuSystem;

// ================= FIREBASE SISTEM YÖNETİMİ =================

// Sistem oluşturma panelini aç/kapat
function toggleCreateSystemPanel() {
    const panel = document.getElementById('createSystemPanel');
    const isVisible = panel.style.display !== 'none';
    
    if (isVisible) {
        panel.style.display = 'none';
        document.getElementById('customBtn').classList.remove('active');
    } else {
        panel.style.display = 'block';
        document.getElementById('customBtn').classList.add('active');
        
        // Tüm diğer butonların active sınıfını kaldır
        document.querySelectorAll('.system-btn:not(#customBtn), .saved-system-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
}

// Sistem oluşturmayı iptal et
function cancelSystemCreation() {
    document.getElementById('createSystemPanel').style.display = 'none';
    document.getElementById('customBtn').classList.remove('active');
    
    // Formu temizle
    document.getElementById('systemName').value = '';
    document.getElementById('universityName').value = '';
    document.getElementById('creatorName').value = '';
    document.getElementById('normalGecmeNotu').value = '60';
    document.getElementById('finalsizGecmeNotu').value = '85';
    document.getElementById('minFinalNot').value = '60';
    document.getElementById('hasFixedCourses').checked = false;
    document.getElementById('hasHarfNotu').checked = false;
    document.getElementById('hasShartliGecme').checked = false;
    document.getElementById('templateHasFinal').checked = true;
    
    // Template kurları temizle
    console.log('🧹 Template kurları temizleniyor...');
    templateCourses = [];
    templateCounter = 0;
    renderTemplateCourses();
    console.log('✅ Template kurları temizlendi');
}

// Özel sistemi kaydet
async function saveCustomSystem() {
    // Form verilerini al
    const systemName = document.getElementById('systemName').value.trim();
    const universityName = document.getElementById('universityName').value.trim();
    const creatorName = document.getElementById('creatorName').value.trim();
    const normalGecmeNotu = parseFloat(document.getElementById('normalGecmeNotu').value);
    const finalsizGecmeNotu = parseFloat(document.getElementById('finalsizGecmeNotu').value);
    const minFinalNot = parseFloat(document.getElementById('minFinalNot').value);
    const hasFixedCourses = document.getElementById('hasFixedCourses').checked;
    const hasHarfNotu = document.getElementById('hasHarfNotu').checked;
    const hasShartliGecme = document.getElementById('hasShartliGecme').checked;
    
    // Validasyon
    if (!systemName || !universityName) {
        showMessage('Sistem adı ve üniversite adı zorunludur!', 'error');
        return;
    }
    
    if (normalGecmeNotu < 0 || normalGecmeNotu > 100 || 
        finalsizGecmeNotu < 0 || finalsizGecmeNotu > 100 ||
        minFinalNot < 0 || minFinalNot > 100) {
        showMessage('Notlar 0-100 arasında olmalıdır!', 'error');
        return;
    }
    
    // Template verilerini al
    const templateHasFinal = document.getElementById('templateHasFinal').checked;
    const templateFinalWeight = templateHasFinal ? parseFloat(document.getElementById('templateFinalWeight').value) || 20 : 0;
    
    console.log('💾 Template kaydetme debug:');
    console.log('📚 Template kurları:', templateCourses);
    console.log('🎓 Template final var mı:', templateHasFinal);
    console.log('📝 Template courses array:', templateCourses.map(c => ({
        id: c.id,
        type: c.type,
        name: c.name,
        defaultKatsayi: c.defaultKatsayi,
        order: c.order
    })));
    
    // Validasyon: Template kurları kontrol et
    if (templateCourses.length === 0 && !templateHasFinal) {
        console.warn('⚠️ Template tamamen boş! En az bir kurs veya final olmalı');
    }
    
    // Sistem objesi oluştur
    const systemData = {
        name: systemName,
        university: universityName,
        creator: creatorName || 'Anonim',
        settings: {
            gecmeNotu: normalGecmeNotu,
            finalsizGecmeNotu: finalsizGecmeNotu,
            minFinalNot: minFinalNot,
            hasFixedCourses: hasFixedCourses,
            hasHarfNotu: hasHarfNotu,
            hasShartliGecme: hasShartliGecme
        },
        template: {
            hasFinal: templateHasFinal,
            finalWeight: templateFinalWeight,
            courses: templateCourses.map(course => ({
                id: course.id,
                type: course.type,
                name: course.name,
                defaultKatsayi: course.defaultKatsayi,
                order: course.order
            }))
        },
        createdAt: new Date().toISOString(),
        version: '2.0'
    };
    
    // Firebase'e kaydet
    if (!db) {
        showMessage('Firebase bağlantısı kurulamadı. Lütfen sayfayı yenileyin.', 'error');
        return;
    }
    
    try {
        showMessage('Sistem kaydediliyor...', 'info');
        
        console.log('🔥 Firebase\'e kaydedilecek systemData:', systemData);
        console.log('🔥 systemData.template:', systemData.template);
        
        // Firebase'e dokuman ekle
        const docRef = await addDoc(collection(db, 'systems'), systemData);
        
        console.log('✅ Firebase\'e kaydedildi, docRef.id:', docRef.id);
        showMessage(`✅ "${systemName}" sistemi başarıyla kaydedildi!`, 'success');
        
        // Formu temizle ve paneli kapat
        cancelSystemCreation();
        
        // Sistemleri yeniden yükle
        setTimeout(() => {
            loadSavedSystems();
        }, 1000);
        
    } catch (error) {
        console.error('Sistem kaydetme hatası:', error);
        showMessage('❌ Sistem kaydedilemedi: ' + error.message, 'error');
    }
}

// Kaydedilen sistemleri yükle
async function loadSavedSystems() {
    if (!db) return;
    
    try {
        // Sistemleri çek (en yeni önce)
        const q = query(collection(db, 'systems'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        savedSystems = [];
        querySnapshot.forEach((doc) => {
            savedSystems.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sistem butonlarını güncelle
        updateSystemButtons();
        
        console.log(`✅ ${savedSystems.length} kaydedilen sistem yüklendi.`);
        
    } catch (error) {
        console.error('Sistemler yüklenirken hata:', error);
        showMessage('Sistemler yüklenemedi: ' + error.message, 'error');
    }
}

// Sistem butonlarını güncelle
function updateSystemButtons() {
    const systemButtons = document.getElementById('systemButtons');
    
    // Mevcut kaydedilen sistem butonlarını kaldır
    const existingButtons = systemButtons.querySelectorAll('.saved-system-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Yeni butonları ekle
    savedSystems.forEach(system => {
        const button = document.createElement('button');
        button.className = 'saved-system-btn';
        button.setAttribute('data-system-id', system.id);
        button.onclick = () => {
            console.log('🔘 Sistem butonu tıklandı:', system.id, system.name);
            selectSystem(`saved_${system.id}`);
        };
        
        button.innerHTML = `
            <div class="system-name">${system.name}</div>
            <div class="system-info">
                🏛️ ${system.university}<br/>
                👤 ${system.creator}
            </div>
        `;
        
        systemButtons.appendChild(button);
    });
}

// Kaydedilen sistemi yükle
function loadSavedSystem(systemId) {
    console.log('🔄 loadSavedSystem çağrıldı, systemId:', systemId);
    console.log('📋 Mevcut savedSystems:', savedSystems);
    
    const system = savedSystems.find(s => s.id === systemId);
    if (!system) {
        console.error('❌ Sistem bulunamadı! systemId:', systemId);
        showMessage('Sistem bulunamadı!', 'error');
        return;
    }
    
    console.log('✅ Sistem bulundu:', system);
    
    // Sistemi aktif et
    currentSystem = `saved_${systemId}`;
    
    // Buton görünümlerini güncelle
    document.querySelectorAll('.system-btn, .saved-system-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Aktif butonu bul ve işaretle
    const activeButton = document.querySelector(`[data-system-id="${systemId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        console.log('✅ Aktif buton bulundu ve işaretlendi');
    } else {
        console.warn('⚠️ Aktif buton bulunamadı:', systemId);
    }
    
    // Panel'i gizle
    document.getElementById('createSystemPanel').style.display = 'none';
    
    // Sistem ayarlarını uygula
    systemSettings[currentSystem] = {
        name: system.name,
        gecmeNotu: system.settings.gecmeNotu,
        finalsizGecmeNotu: system.settings.finalsizGecmeNotu,
        minFinalNot: system.settings.minFinalNot,
        hasFixedCourses: system.settings.hasFixedCourses,
        hasHarfNotu: system.settings.hasHarfNotu,
        hasShartliGecme: system.settings.hasShartliGecme
    };
    
    // Özel ayarları göster
    const customSettings = document.getElementById('customSettings');
    customSettings.classList.add('show');
    document.getElementById('gecmeNotu').value = system.settings.gecmeNotu;
    
    // Sabit dersleri göster/gizle (Fixed course'lar VEYA Final varsa göster)
    const fixedCourses = document.getElementById('fixedCourses');
    const fixedNotlari = document.getElementById('fixedNotlariContainer');
    
    const hasAnyFixedContent = system.settings.hasFixedCourses || 
                              (system.template && system.template.hasFinal);
    
    if (hasAnyFixedContent) {
        fixedCourses.style.display = 'block';
        fixedNotlari.style.display = 'block';
        // Başlığı güncelle
        const title = fixedCourses.querySelector('h4');
        if (title) {
            title.textContent = `📚 ${system.settings.hasFixedCourses ? 'Sabit Dersler' : 'Final Sınavı'} (${system.university})`;
        }
    } else {
        fixedCourses.style.display = 'none';
        fixedNotlari.style.display = 'none';
    }
    
    // Template kurları yükle
    console.log('🔍 System template debug:', system.template);
    console.log('🔍 System template courses length:', system.template?.courses?.length);
    console.log('🔍 System template hasFinal:', system.template?.hasFinal);
    
    if (system.template && system.template.courses && system.template.courses.length > 0) {
        console.log('✅ Template kursları yükleniyor:', system.template.courses);
        loadSystemTemplate(system.template);
    } else if (system.template && system.template.courses) {
        console.log('⚠️ Template var ama kurs yok, sadece final ayarı uygulanıyor');
        // Template var ama kurs yok - sadece final ayarını uygula
        allCourses = [];
        courseCounter = 0;
        
        // Final kursunu ekle (template ayarına göre)
        if (system.template.hasFinal) {
            allCourses.push({
                id: 'final',
                type: 'FINAL',
                name: 'Final',
                defaultKatsayi: 20,
                isActive: true,
                order: 1000
            });
        }
        
        renderAllCourses();
        renderNotInputs();
    } else {
        console.log('🔄 Eski sistem formatı, varsayılan kurlar yükleniyor');
        // Eski sisteme uyumlu: Varsayılan template
        initializeDefaultCourses();
    }
    
    updateKatsayilar();
    hesapla();
    
    showMessage(`✅ "${system.name}" sistemi yüklendi!`, 'success');
}

// Mesaj göster
function showMessage(message, type = 'info') {
    // Mevcut mesajları kaldır
    const existingMessage = document.querySelector('.system-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Yeni mesaj oluştur
    const messageDiv = document.createElement('div');
    messageDiv.className = `system-message system-${type}`;
    messageDiv.textContent = message;
    
    // CSS sınıflarını ayarla
    if (type === 'success') {
        messageDiv.className = 'system-message system-success';
    } else if (type === 'error') {
        messageDiv.className = 'system-message system-error';
    } else {
        messageDiv.className = 'system-message loading-systems';
    }
    
    // Sistem seçimi panelinin altına ekle
    const systemSelection = document.querySelector('.system-selection');
    systemSelection.appendChild(messageDiv);
    
    // 3 saniye sonra mesajı kaldır
    if (type !== 'info') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// ================= TEMPLATE KURS YÖNETİMİ =================

// Sistem template'ını yükle
function loadSystemTemplate(template) {
    console.log('🔧 loadSystemTemplate çağrıldı:', template);
    
    // Mevcut kursları temizle
    allCourses = [];
    courseCounter = 0;
    
    let basicCounter = 0;
    let fixedCounter = 0;
    let extraCounter = 0;
    
    // Template kursları sisteme ekle
    template.courses.forEach((templateCourse) => {
        let newCourse;
        
        if (templateCourse.type === 'basic') {
            basicCounter++;
            newCourse = {
                id: `kur${basicCounter}`,
                type: COURSE_TYPES.BASIC,
                name: templateCourse.name,
                defaultKatsayi: templateCourse.defaultKatsayi,
                isActive: true,
                order: templateCourse.order || basicCounter
            };
        } else if (templateCourse.type === 'fixed') {
            fixedCounter++;
            // Fixed course'lar için özel ID'ler kullan
            const fixedId = templateCourse.name.toLowerCase() === 'its' ? 'its' : 
                           templateCourse.name.toLowerCase() === 'tmb' ? 'tmb' : 
                           `fixed${fixedCounter}`;
            newCourse = {
                id: fixedId,
                type: COURSE_TYPES.FIXED,
                name: templateCourse.name,
                defaultKatsayi: templateCourse.defaultKatsayi,
                isActive: true,
                order: templateCourse.order || (100 + fixedCounter)
            };
        } else if (templateCourse.type === 'extra') {
            extraCounter++;
            courseCounter++;
            newCourse = {
                id: `extra${courseCounter}`,
                type: COURSE_TYPES.EXTRA,
                name: templateCourse.name,
                defaultKatsayi: templateCourse.defaultKatsayi,
                isActive: true,
                order: templateCourse.order || (500 + extraCounter)
            };
        }
        
        if (newCourse) {
            allCourses.push(newCourse);
            console.log('➕ Template kurs eklendi:', newCourse);
        }
    });
    
    // Final kursunu ekle (template ayarına göre)
    if (template.hasFinal) {
        const finalWeight = template.finalWeight || 20; // Template'dan katsayıyı al, yoksa 20 kullan
        const finalCourse = {
            id: 'final',
            type: COURSE_TYPES.FINAL, 
            name: 'Final',
            defaultKatsayi: finalWeight,
            isActive: true,
            order: 1000
        };
        allCourses.push(finalCourse);
        console.log('🎓 Final kursu eklendi:', finalCourse, 'Katsayı:', finalWeight);
    } else {
        console.log('❌ Final kursu eklenmedi (template.hasFinal = false)');
    }
    
    console.log('📋 Toplam yüklenen kurslar:', allCourses);
    
    // Kursları render et ve sistemi güncelle
    renderAllCourses();
    renderNotInputs();
    
    // Final varsa container'ı kesinlikle göster
    const finalCourse = allCourses.find(c => c.type === COURSE_TYPES.FINAL && c.isActive);
    if (finalCourse) {
        const fixedCourses = document.getElementById('fixedCourses');
        const fixedNotlari = document.getElementById('fixedNotlariContainer');
        if (fixedCourses) fixedCourses.style.display = 'block';
        if (fixedNotlari) fixedNotlari.style.display = 'block';
        console.log('🎓 Final container gösterildi');
    }
    
    updateKatsayilar();
    hesapla();
}

// Template kurs ekle
function addTemplateCourse(courseType) {
    const courseName = prompt(`${courseType === 'basic' ? 'Temel kur' : 'Sabit ders'} adını girin:`);
    if (!courseName || !courseName.trim()) return;
    
    const defaultWeight = courseType === 'basic' ? 10 : 15;
    const courseWeight = prompt(`${courseName} katsayısını (%) girin:`, defaultWeight);
    if (courseWeight === null) return; // İptal edildi
    
    const weightValue = parseFloat(courseWeight);
    if (isNaN(weightValue) || weightValue < 0 || weightValue > 100) {
        alert('Geçerli bir katsayı değeri girin (0-100 arası)!');
        return;
    }
    
    templateCounter++;
    
    // Aynı tipte olan kursların maksimum order değerini bul
    const sameCourses = templateCourses.filter(c => c.type === courseType);
    const maxOrder = sameCourses.length > 0 ? Math.max(...sameCourses.map(c => c.order)) : 0;
    
    const newTemplateCourse = {
        id: `template_${courseType}_${templateCounter}`,
        type: courseType,
        name: courseName.trim(),
        defaultKatsayi: weightValue,
        order: maxOrder + 1
    };
    
    templateCourses.push(newTemplateCourse);
    renderTemplateCourses();
}

// Template kurs kaldır
function removeTemplateCourse(courseId) {
    const courseToRemove = templateCourses.find(c => c.id === courseId);
    if (!courseToRemove) return;
    
    // Kursu kaldır
    templateCourses = templateCourses.filter(c => c.id !== courseId);
    
    // Adjust order values of courses that come after the removed course in the same type
    const sameCourses = templateCourses.filter(c => c.type === courseToRemove.type && c.order > courseToRemove.order);
    sameCourses.forEach(course => {
        course.order--;
    });
    
    renderTemplateCourses();
}

// Template kursu taşı
function moveTemplateCourse(courseId, direction) {
    const courseIndex = templateCourses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return;
    
    const course = templateCourses[courseIndex];
    
    // Get courses of the same type
    const sameCourses = templateCourses.filter(c => c.type === course.type);
    const sameTypeIndex = sameCourses.findIndex(c => c.id === courseId);
    
    if (direction === 'up' && sameTypeIndex > 0) {
        // Üstteki kursla yer değiştir
        const targetCourse = sameCourses[sameTypeIndex - 1];
        const tempOrder = course.order;
        course.order = targetCourse.order;
        targetCourse.order = tempOrder;
    } else if (direction === 'down' && sameTypeIndex < sameCourses.length - 1) {
        // Alttaki kursla yer değiştir
        const targetCourse = sameCourses[sameTypeIndex + 1];
        const tempOrder = course.order;
        course.order = targetCourse.order;
        targetCourse.order = tempOrder;
    }
    
    renderTemplateCourses();
}

// Template course güncelle
function updateTemplateCourse(courseId, field, value) {
    const course = templateCourses.find(c => c.id === courseId);
    if (!course) return;
    
    if (field === 'name') {
        course.name = value.trim();
    } else if (field === 'weight') {
        const weightValue = parseFloat(value);
        if (isNaN(weightValue) || weightValue < 0 || weightValue > 100) {
            alert('Geçerli bir katsayı değeri girin (0-100 arası)!');
            // Eski değeri geri yükle
            renderTemplateCourses();
            return;
        }
        course.defaultKatsayi = weightValue;
    }
}

// Template kursları render et
function renderTemplateCourses() {
    renderTemplateBasicCourses();
    renderTemplateFixedCourses();
}

// Template temel kursları render et
function renderTemplateBasicCourses() {
    const basicCourses = templateCourses
        .filter(c => c.type === 'basic')
        .sort((a, b) => a.order - b.order);
    
    const container = document.getElementById('templateBasicCourses');
    container.innerHTML = '';
    
    basicCourses.forEach((course, index) => {
        const isFirst = index === 0;
        const isLast = index === basicCourses.length - 1;
        
        const courseHTML = `
            <div class="template-course-item">
                <div class="template-course-info">
                    <input type="text" class="template-course-name-input" value="${course.name}" 
                           onchange="updateTemplateCourse('${course.id}', 'name', this.value)" 
                           placeholder="Kurs adı">
                    <input type="number" class="template-course-weight-input" value="${course.defaultKatsayi}" 
                           onchange="updateTemplateCourse('${course.id}', 'weight', this.value)" 
                           min="0" max="100" step="0.00001" placeholder="Katsayı %">
                </div>
                <div class="template-course-controls">
                    <button class="template-order-btn ${isFirst ? 'disabled' : ''}" 
                            onclick="moveTemplateCourse('${course.id}', 'up')" 
                            ${isFirst ? 'disabled' : ''} 
                            title="Yukarı">⬆️</button>
                    <button class="template-order-btn ${isLast ? 'disabled' : ''}" 
                            onclick="moveTemplateCourse('${course.id}', 'down')" 
                            ${isLast ? 'disabled' : ''} 
                            title="Aşağı">⬇️</button>
                    <button class="template-remove-btn" onclick="removeTemplateCourse('${course.id}')" title="Kaldır">🗑️</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', courseHTML);
    });
}

// Template sabit kursları render et
function renderTemplateFixedCourses() {
    const fixedCourses = templateCourses
        .filter(c => c.type === 'fixed')
        .sort((a, b) => a.order - b.order);
    
    const container = document.getElementById('templateFixedCourses');
    container.innerHTML = '';
    
    fixedCourses.forEach((course, index) => {
        const isFirst = index === 0;
        const isLast = index === fixedCourses.length - 1;
        
        const courseHTML = `
            <div class="template-course-item">
                <div class="template-course-info">
                    <input type="text" class="template-course-name-input" value="${course.name}" 
                           onchange="updateTemplateCourse('${course.id}', 'name', this.value)" 
                           placeholder="Kurs adı">
                    <input type="number" class="template-course-weight-input" value="${course.defaultKatsayi}" 
                           onchange="updateTemplateCourse('${course.id}', 'weight', this.value)" 
                           min="0" max="100" step="0.00001" placeholder="Katsayı %">
                </div>
                <div class="template-course-controls">
                    <button class="template-order-btn ${isFirst ? 'disabled' : ''}" 
                            onclick="moveTemplateCourse('${course.id}', 'up')" 
                            ${isFirst ? 'disabled' : ''} 
                            title="Yukarı">⬆️</button>
                    <button class="template-order-btn ${isLast ? 'disabled' : ''}" 
                            onclick="moveTemplateCourse('${course.id}', 'down')" 
                            ${isLast ? 'disabled' : ''} 
                            title="Aşağı">⬇️</button>
                    <button class="template-remove-btn" onclick="removeTemplateCourse('${course.id}')" title="Kaldır">🗑️</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', courseHTML);
    });
}

// Template final checkbox toggle
function toggleTemplateFinal() {
    const checkbox = document.getElementById('templateHasFinal');
    const weightContainer = document.getElementById('templateFinalWeightContainer');
    
    if (checkbox.checked) {
        weightContainer.style.display = 'block';
    } else {
        weightContainer.style.display = 'none';
    }
}

// Global fonksiyonları window nesnesine ekle
window.selectSystem = selectSystem;
window.updateSettings = updateSettings;
window.toggleFinalOrani = toggleFinalOrani;
window.removeCourse = removeCourse;
window.addNewCourse = addNewCourse;
window.addRemovedCourse = addRemovedCourse;
window.moveCourse = moveCourse;
window.updateExtraCourseName = updateExtraCourseName;
window.hesapla = hesapla;
window.temizle = temizle;
window.ornekDoldur = ornekDoldur;
window.toggleCreateSystemPanel = toggleCreateSystemPanel;
window.cancelSystemCreation = cancelSystemCreation;
window.saveCustomSystem = saveCustomSystem;
window.addTemplateCourse = addTemplateCourse;
window.removeTemplateCourse = removeTemplateCourse;
window.moveTemplateCourse = moveTemplateCourse;
window.updateTemplateCourse = updateTemplateCourse;
window.toggleTemplateFinal = toggleTemplateFinal; 