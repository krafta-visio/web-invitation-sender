/**
 * Krafta - Web Invitation Sender
 * Meniru fungsionalitas dan logika antispam dari versi Android (WebInvitationSenderActivity.kt)
 */

$(document).ready(() => {
    // ── KONSTANTA & DEFAULT PREFERENSI ──
    const STORAGE_KEYS = {
        DIRECTORY: "key_directory",
        PESAN_1: "key_pesan_1",
        PESAN_2: "key_pesan_2",
        USE_ROTARY: "key_use_rotary",
        LAST_SEND_TIME: "key_last_send_time",
        THEME: "key_theme"
    };

    const DEFAULTS = {
        PESAN_1: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara(i) untuk menghadiri acara pernikahan kami.",
        PESAN_2: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara(i) berkenan untuk hadir dan memberikan doa restu.\nAtas kehadiran dan do'a restunya kami ucapkan terima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.",
        DIRECTORY: "fullan-fullannah",
        USE_ROTARY: true,
        COOLDOWN_MS: 33000, // 33 Detik Cooldown Anti-Spam
        THEME: "light" // Default theme yang aktif adalah theme light
    };

    // ── DATASET SEGMEN ROTARY (DIPEROLEH DARI VERSI ANDROID) ──
    // SEGMEN 3 - Salam Pembuka (Universal)
    const segmen3 = [
        "Dengan hormat,",
        "Yang terhormat,",
        "Salam sejahtera,",
        "Kami sampaikan hormat kami,",
        "Dengan penuh rasa hormat,"
    ];

    // SEGMEN 4 - Frasa Pengantar 1
    const segmen4 = [
        "Tanpa mengurangi rasa hormat,",
        "Dengan penuh hormat,",
        "Dengan rendah hati,",
        "Izinkan kami,",
        "Perkenankan kami,"
    ];

    // SEGMEN 5 - Kalimat Inti Undangan
    const segmen5 = [
        "mengundang Bapak/Ibu/Saudara(i) untuk menghadiri acara pernikahan kami.",
        "kami mengundang Bapak/Ibu/Saudara(i) untuk hadir pada acara pernikahan kami.",
        "kami bermaksud mengundang Bapak/Ibu/Saudara(i) untuk menghadiri acara pernikahan kami.",
        "dengan ini kami mengundang Bapak/Ibu/Saudara(i) pada acara pernikahan kami.",
        "kami mengajak Bapak/Ibu/Saudara(i) untuk hadir dalam acara pernikahan kami."
    ];

    // SEGMEN 6 - Pengantar Link
    const segmen6 = [
        "Berikut link untuk informasi lengkap acara kami:",
        "Informasi lengkap acara dapat dilihat melalui link berikut:",
        "Untuk detail lebih lanjut, silakan kunjungi link berikut:",
        "Link berikut berisi informasi lengkap tentang acara kami:",
        "Selengkapnya mengenai acara kami dapat diakses melalui link di bawah ini:"
    ];

    // SEGMEN 8 - Frasa Harapan 1
    const segmen8 = [
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami",
        "Kami merasa sangat terhormat dan berbahagia",
        "Ini adalah suatu kehormatan besar bagi kami",
        "Kami sungguh merasa terhormat dan bahagia",
        "Kebahagiaan dan kehormatan bagi kami"
    ];

    // SEGMEN 9 - Frasa Harapan 2
    const segmen9 = [
        "apabila Bapak/Ibu/Saudara(i) berkenan hadir dan memberikan doa restu.",
        "jika Bapak/Ibu/Saudara(i) bersedia meluangkan waktu untuk hadir dan memberikan restu.",
        "sekiranya Bapak/Ibu/Saudara(i) berkenan hadir dan mendoakan kami.",
        "bila Bapak/Ibu/Saudara(i) berkenan untuk hadir dan memberikan doa restunya.",
        "apabila Bapak/Ibu/Saudara(i) sudi hadir dan memberikan berkah restu."
    ];

    // SEGMEN 10 - Ucapan Terima Kasih
    const segmen10 = [
        "Atas kehadiran dan doa restunya, kami ucapkan terima kasih.",
        "Kami mengucapkan terima kasih atas kehadiran dan doa restu yang diberikan.",
        "Terima kasih kami sampaikan atas perhatian dan doa restu Bapak/Ibu/Saudara(i).",
        "Sebelumnya, kami ucapkan terima kasih atas waktu dan perhatian yang Bapak/Ibu berikan.",
        "Kami menyampaikan terima kasih yang sebesar-besarnya atas kehadiran dan doa restu Bapak/Ibu/Saudara(i)."
    ];

    // SEGMEN 11 - Penutup (Universal)
    const segmen11 = [
        "Hormat kami,",
        "Dengan hormat,",
        "Demikian undangan ini kami sampaikan.",
        "Atas perhatiannya, kami ucapkan terima kasih.",
        "Sekian undangan yang dapat kami sampaikan."
    ];

    // Variabel indeks segmen terpilih
    let indexSeg3 = 0;
    let indexSeg4 = 0;
    let indexSeg5 = 0;
    let indexSeg6 = 0;
    let indexSeg8 = 0;
    let indexSeg9 = 0;
    let indexSeg10 = 0;
    let indexSeg11 = 0;

    // Cooldown state
    let cooldownTimer = null;
    let isCooldownActive = false;

    // ── STORAGE MANAGER ──
    const Storage = {
        get(key, defaultVal) {
            try {
                const val = localStorage.getItem(key);
                if (val === null || val === undefined) {
                    // Cek fallback legacy key jika ada
                    if (key === STORAGE_KEYS.DIRECTORY) return localStorage.getItem("direktoriUndangan") || defaultVal;
                    if (key === STORAGE_KEYS.PESAN_1) return localStorage.getItem("pesan1") || defaultVal;
                    if (key === STORAGE_KEYS.PESAN_2) return localStorage.getItem("pesan2") || defaultVal;
                    return defaultVal;
                }
                return val;
            } catch (e) {
                console.warn("Storage get failed:", e);
                return defaultVal;
            }
        },
        set(key, val) {
            try {
                localStorage.setItem(key, val);
            } catch (e) {
                console.warn("Storage set failed:", e);
            }
        },
        getBoolean(key, defaultVal) {
            const val = this.get(key, null);
            if (val === null) return defaultVal;
            return val === "true" || val === true;
        },
        setBoolean(key, val) {
            this.set(key, Boolean(val).toString());
        }
    };

    // ── HELPER FUNCTIONS ──
    function escapeHtml(str) {
        if (!str) return "";
        return $("<div>").text(str).html();
    }

    // Memastikan indeks baru selalu berbeda dari indeks sebelumnya agar rotasi terlihat nyata
    function getRandomDifferentIndex(currentIndex, arrayLength) {
        if (arrayLength <= 1) return 0;
        let nextIndex = Math.floor(Math.random() * arrayLength);
        if (nextIndex === currentIndex) {
            nextIndex = (currentIndex + 1 + Math.floor(Math.random() * (arrayLength - 1))) % arrayLength;
        }
        return nextIndex;
    }

    function randomizeSegments() {
        indexSeg3 = getRandomDifferentIndex(indexSeg3, segmen3.length);
        indexSeg4 = getRandomDifferentIndex(indexSeg4, segmen4.length);
        indexSeg5 = getRandomDifferentIndex(indexSeg5, segmen5.length);
        indexSeg6 = getRandomDifferentIndex(indexSeg6, segmen6.length);
        indexSeg8 = getRandomDifferentIndex(indexSeg8, segmen8.length);
        indexSeg9 = getRandomDifferentIndex(indexSeg9, segmen9.length);
        indexSeg10 = getRandomDifferentIndex(indexSeg10, segmen10.length);
        indexSeg11 = getRandomDifferentIndex(indexSeg11, segmen11.length);
    }

    function formatBrideGroomNames(slug) {
        const cleanSlug = (slug || DEFAULTS.DIRECTORY).trim();
        return cleanSlug.split("-")
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" - ");
    }

    function formatPhoneNumberForWhatsApp(phone) {
        let digits = (phone || "").replace(/[^0-9]/g, "");
        if (digits.startsWith("08")) {
            return "628" + digits.substring(2);
        } else if (digits.startsWith("0")) {
            return "62" + digits.substring(1);
        } else if (!digits.startsWith("62") && digits.length > 0) {
            return "62" + digits;
        }
        return digits;
    }

    function showToast(message) {
        const toast = $(`
            <div class="toast-item">
                <svg class="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>${escapeHtml(message)}</span>
            </div>
        `);
        $("#toastContainer").append(toast);
        setTimeout(() => toast.addClass("show"), 10);
        setTimeout(() => {
            toast.removeClass("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ── BUILD PESAN & LIVE PREVIEW ──
    function buildFullInvitationMessage() {
        const directoryInput = $("#direktoriUndangan").val().trim();
        const guestInput = $("#namaPenerima").val().trim();

        const directory = directoryInput || DEFAULTS.DIRECTORY;
        const guestName = guestInput;
        const linkUndangan = `https://krafta-ampana.github.io/${directory}/?tamu=${encodeURIComponent(guestName)}`;
        const brideGroomTitle = formatBrideGroomNames(directory);

        const useRotary = Storage.getBoolean(STORAGE_KEYS.USE_ROTARY, DEFAULTS.USE_ROTARY);
        if (useRotary) {
            const s3 = segmen3[indexSeg3];
            const s4 = segmen4[indexSeg4];
            const s5 = segmen5[indexSeg5];
            const s6 = segmen6[indexSeg6];
            const s8 = segmen8[indexSeg8];
            const s9 = segmen9[indexSeg9];
            const s10 = segmen10[indexSeg10];
            const s11 = segmen11[indexSeg11];

            const pesan1 = `${s3}\n${s4} ${s5}`;
            const pesan2 = `${s8} ${s9}\n${s10}\n${s11}`;

            return `Kepada Yth.
Bapak/Ibu/Saudara(i)
*${guestName}*

${pesan1}

${s6}
${linkUndangan}

${pesan2}

Hormat Kami:
*${brideGroomTitle}*`;
        } else {
            const pesan1 = Storage.get(STORAGE_KEYS.PESAN_1, DEFAULTS.PESAN_1);
            const pesan2 = Storage.get(STORAGE_KEYS.PESAN_2, DEFAULTS.PESAN_2);

            return `Kepada Yth.
Bapak/Ibu/Saudara(i)
*${guestName}*

${pesan1}

Berikut link untuk info lengkap dari acara kami:
${linkUndangan}

${pesan2}

Hormat Kami:
*${brideGroomTitle}*`;
        }
    }

    function updateLivePreview(animate = false) {
        const directoryInput = $("#direktoriUndangan").val().trim();
        const guestInput = $("#namaPenerima").val().trim();

        const directory = directoryInput || DEFAULTS.DIRECTORY;
        const guestName = guestInput || "<<NAMA_PENERIMA_UNDANGAN>>";
        const linkUndangan = `https://krafta-ampana.github.io/${directory}/?tamu=${encodeURIComponent(guestName)}`;
        const brideGroomTitle = formatBrideGroomNames(directory);

        const useRotary = Storage.getBoolean(STORAGE_KEYS.USE_ROTARY, DEFAULTS.USE_ROTARY);
        let htmlContent = "";

        if (useRotary) {
            const s3 = segmen3[indexSeg3];
            const s4 = segmen4[indexSeg4];
            const s5 = segmen5[indexSeg5];
            const s6 = segmen6[indexSeg6];
            const s8 = segmen8[indexSeg8];
            const s9 = segmen9[indexSeg9];
            const s10 = segmen10[indexSeg10];
            const s11 = segmen11[indexSeg11];

            const pesan1 = `${s3}<br>${s4} ${s5}`;
            const pesan2 = `${s8} ${s9}<br>${s10}<br>${s11}`;

            htmlContent = `Kepada Yth.<br>
Bapak/Ibu/Saudara(i)<br>
<b>${escapeHtml(guestName)}</b><br><br>
${pesan1}<br><br>
${s6}<br>
<b class="text-blue-600 underline">${linkUndangan}</b><br><br>
${pesan2}<br><br>
Hormat Kami:<br>
<b>${escapeHtml(brideGroomTitle)}</b>`;
        } else {
            const pesan1 = escapeHtml(Storage.get(STORAGE_KEYS.PESAN_1, DEFAULTS.PESAN_1)).replace(/\n/g, "<br>");
            const pesan2 = escapeHtml(Storage.get(STORAGE_KEYS.PESAN_2, DEFAULTS.PESAN_2)).replace(/\n/g, "<br>");

            htmlContent = `Kepada Yth.<br>
Bapak/Ibu/Saudara(i)<br>
<b>${escapeHtml(guestName)}</b><br><br>
${pesan1}<br><br>
Berikut link untuk info lengkap dari acara kami:<br>
<b class="text-blue-600 underline">${linkUndangan}</b><br><br>
${pesan2}<br><br>
Hormat Kami:<br>
<b>${escapeHtml(brideGroomTitle)}</b>`;
        }

        const previewEl = $("#previewPesanUndangan");
        if (animate) {
            previewEl.addClass("opacity-40 transition-opacity duration-150");
            setTimeout(() => {
                previewEl.html(htmlContent);
                previewEl.removeClass("opacity-40");
            }, 150);
        } else {
            previewEl.html(htmlContent);
        }
    }

    // ── COOLDOWN TIMER 33 DETIK ──
    function checkAndStartCooldown() {
        const lastSendTime = parseInt(Storage.get(STORAGE_KEYS.LAST_SEND_TIME, "0"), 10);
        if (isNaN(lastSendTime) || lastSendTime === 0) return;

        const elapsed = Date.now() - lastSendTime;
        if (elapsed < DEFAULTS.COOLDOWN_MS) {
            startCooldown(DEFAULTS.COOLDOWN_MS - elapsed);
        }
    }

    function startCooldown(durationMs) {
        if (cooldownTimer) {
            clearInterval(cooldownTimer);
        }
        isCooldownActive = true;
        updateButtonStates();

        const targetTime = Date.now() + durationMs;

        const tick = () => {
            const remaining = targetTime - Date.now();
            if (remaining <= 0) {
                clearInterval(cooldownTimer);
                cooldownTimer = null;
                isCooldownActive = false;
                $("#labelKirimWhatsapp").text("Kirim via WhatsApp");
                updateButtonStates();
            } else {
                const sec = Math.ceil(remaining / 1000);
                $("#labelKirimWhatsapp").text(`Tunggu ${sec}s...`);
                $("#btnKirimViaWhatsapp").prop("disabled", true);
            }
        };

        tick();
        cooldownTimer = setInterval(tick, 1000);
    }

    // ── VALIDASI INPUT & STATE TOMBOL ──
    function updateButtonStates() {
        const directory = $("#direktoriUndangan").val().trim();
        const phone = $("#nomorWAPenerima").val().trim();
        const guest = $("#namaPenerima").val().trim();

        // Simpan direktori ke storage otomatis
        if (directory.length > 0) {
            Storage.set(STORAGE_KEYS.DIRECTORY, directory);
        }

        const isWaValid = directory.length > 0 && phone.length > 0 && guest.length > 0 && !isCooldownActive;
        const isCopyValid = directory.length > 0 && guest.length > 0;

        $("#btnKirimViaWhatsapp").prop("disabled", !isWaValid);
        $("#btnSalinPesanUndangan").prop("disabled", !isCopyValid);
    }

    // ── KIRIM WHATSAPP & SALIN PESAN ──
    function sendViaWhatsApp() {
        if (isCooldownActive) return;

        const rawPhone = $("#nomorWAPenerima").val().trim();
        const formattedPhone = formatPhoneNumberForWhatsApp(rawPhone);
        const messageText = buildFullInvitationMessage();

        const encodedText = encodeURIComponent(messageText);
        const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;

        // Buka WhatsApp di tab baru
        window.open(waUrl, "_blank");

        // Simpan waktu pengiriman dan mulai cooldown 33 detik
        Storage.set(STORAGE_KEYS.LAST_SEND_TIME, Date.now().toString());
        startCooldown(DEFAULTS.COOLDOWN_MS);

        // SELALU rotasi kombinasi kalimat setiap kali tombol kirim diklik
        randomizeSegments();
        updateLivePreview(true);
        updateButtonStates();
        showToast("Pesan dibuka di WhatsApp & kombinasi dirotasi!");
    }

    async function copyMessageToClipboard() {
        // Ambil teks pesan saat ini untuk disalin
        const messageText = buildFullInvitationMessage();
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(messageText);
            } else {
                const temp = $("<textarea>").css({ position: "absolute", left: "-9999px" }).val(messageText);
                $("body").append(temp);
                temp.select();
                document.execCommand("copy");
                temp.remove();
            }
            showToast("Pesan disalin & kombinasi dirotasi!");

            // SELALU rotasi kombinasi kalimat setiap kali tombol salin diklik
            randomizeSegments();
            updateLivePreview(true);
        } catch (err) {
            console.error("Gagal menyalin:", err);
            alert("Gagal menyalin pesan.");
        }
    }

    // ── MODAL EDIT KONSEP PESAN ──
    function openModal() {
        const currentPesan1 = Storage.get(STORAGE_KEYS.PESAN_1, DEFAULTS.PESAN_1);
        const currentPesan2 = Storage.get(STORAGE_KEYS.PESAN_2, DEFAULTS.PESAN_2);
        const currentUseRotary = Storage.getBoolean(STORAGE_KEYS.USE_ROTARY, DEFAULTS.USE_ROTARY);

        $("#pesan1").val(currentPesan1);
        $("#pesan2").val(currentPesan2);
        $("#switchUseRotary").prop("checked", currentUseRotary);

        updateModalModeVisibility(currentUseRotary);

        const modal = $("#modalEditKonsep");
        const content = $("#modalEditKonsepContent");
        modal.removeClass("hidden").addClass("flex");
        setTimeout(() => {
            modal.removeClass("opacity-0").addClass("opacity-100");
            content.removeClass("scale-95").addClass("scale-100");
        }, 10);
    }

    function closeModal() {
        const modal = $("#modalEditKonsep");
        const content = $("#modalEditKonsepContent");
        modal.removeClass("opacity-100").addClass("opacity-0");
        content.removeClass("scale-100").addClass("scale-95");
        setTimeout(() => {
            modal.addClass("hidden").removeClass("flex");
        }, 300);
    }

    function updateModalModeVisibility(isRotary) {
        if (isRotary) {
            $("#layoutSpamWarning").addClass("hidden");
            $("#layoutCustomFields").addClass("hidden");
        } else {
            $("#layoutSpamWarning").removeClass("hidden");
            $("#layoutCustomFields").removeClass("hidden");
        }
    }

    // ── EVENT LISTENERS ──
    function setupEventListeners() {
        // Filter input direktori (hanya a-z, 0-9, -)
        $("#direktoriUndangan").on("input", function () {
            const raw = $(this).val();
            const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
            if (raw !== clean) {
                $(this).val(clean);
            }
            updateLivePreview();
            updateButtonStates();
        });

        // Filter nomor telepon (hanya angka & tanda +)
        $("#nomorWAPenerima").on("input", function () {
            const raw = $(this).val();
            const clean = raw.replace(/[^0-9+]/g, "");
            if (raw !== clean) {
                $(this).val(clean);
            }
            updateButtonStates();
        });

        // Nama Tamu: setiap ketikan akan mengacak segmen rotary (seperti di Android)
        $("#namaPenerima").on("input", function () {
            randomizeSegments();
            updateLivePreview();
            updateButtonStates();
        });

        // Tombol Ubah Kombinasi Pesan (Manual Shuffle)
        $("#btnShuffleMessage").on("click", function () {
            randomizeSegments();
            updateLivePreview();
            showToast("Kombinasi pesan berhasil diacak!");
        });

        // Tombol Aksi WhatsApp & Salin
        $("#btnKirimViaWhatsapp").on("click", sendViaWhatsApp);
        $("#btnSalinPesanUndangan").on("click", copyMessageToClipboard);

        // Modal triggers
        $("#btnOpenModal").on("click", openModal);
        $("#btnCloseModal, #btnCancelModal").on("click", closeModal);
        $("#modalEditKonsep").on("click", function (e) {
            if (e.target === this) closeModal();
        });

        // Toggle Switch Mode Rotary pada Modal
        $("#switchUseRotary").on("change", function () {
            updateModalModeVisibility($(this).is(":checked"));
        });

        // Simpan Konsep Pesan dari Modal
        $("#simpanKonsepPesan").on("click", function () {
            const isRotary = $("#switchUseRotary").is(":checked");
            const newPesan1 = $("#pesan1").val().trim();
            const newPesan2 = $("#pesan2").val().trim();

            Storage.setBoolean(STORAGE_KEYS.USE_ROTARY, isRotary);
            Storage.set(STORAGE_KEYS.PESAN_1, newPesan1 || DEFAULTS.PESAN_1);
            Storage.set(STORAGE_KEYS.PESAN_2, newPesan2 || DEFAULTS.PESAN_2);

            closeModal();
            updateLivePreview();
            showToast("Konsep pesan berhasil disimpan!");
        });
    }

    // ── THEME MANAGER (DARK / LIGHT MODE) ──
    function updateThemeUI(isDark) {
        if (isDark) {
            $("html").addClass("dark");
            $("#iconThemeSun").removeClass("hidden");
            $("#iconThemeMoon").addClass("hidden");
        } else {
            $("html").removeClass("dark");
            $("#iconThemeSun").addClass("hidden");
            $("#iconThemeMoon").removeClass("hidden");
        }
    }

    function toggleTheme() {
        const isCurrentDark = $("html").hasClass("dark");
        const newTheme = isCurrentDark ? "light" : "dark";
        Storage.set(STORAGE_KEYS.THEME, newTheme);
        updateThemeUI(newTheme === "dark");
        showToast(`Tema ${newTheme === "dark" ? "Gelap (Dark)" : "Terang (Light)"} aktif`);
    }

    function initTheme() {
        // Default theme yang aktif adalah theme light
        const savedTheme = Storage.get(STORAGE_KEYS.THEME, DEFAULTS.THEME);
        updateThemeUI(savedTheme === "dark");
        $("#btnThemeToggle").on("click", toggleTheme);
    }

    // ── INITIALIZATION ──
    function init() {
        initTheme();
        randomizeSegments();

        const savedDirectory = Storage.get(STORAGE_KEYS.DIRECTORY, DEFAULTS.DIRECTORY);
        $("#direktoriUndangan").val(savedDirectory);

        setupEventListeners();
        updateLivePreview();
        updateButtonStates();
        checkAndStartCooldown();
    }

    init();
});
