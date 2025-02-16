$(document).ready(async function () {
	
    const storageAvailable = (type) => {
        try {
            let storage = window[type], test = "__storage_test__";
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    const useLocalStorage = storageAvailable("localStorage");

    // Fungsi untuk menyimpan ke LocalStorage atau IndexedDB
    const saveData = async (key, value) => {
        if (useLocalStorage) {
            localStorage.setItem(key, value);
        } else {
            let db = await openDB();
            let tx = db.transaction("data", "readwrite");
            let store = tx.objectStore("data");
            store.put(value, key);
            await tx.complete;
        }
        updatePreview(); // Perbarui tampilan saat data disimpan
    };

    // Fungsi untuk mengambil data
    const getData = async (key, defaultValue) => {
        if (useLocalStorage) {
            return localStorage.getItem(key) || defaultValue;
        } else {
            let db = await openDB();
            let tx = db.transaction("data", "readonly");
            let store = tx.objectStore("data");
            let value = await store.get(key);
            return value || defaultValue;
        }
    };

    // Fungsi untuk membuka IndexedDB
    const openDB = async () => {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open("KraftaPrefs", 1);
            request.onupgradeneeded = (event) => {
                let db = event.target.result;
                if (!db.objectStoreNames.contains("data")) {
                    db.createObjectStore("data");
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Data default
    const defaultPesan1 = "Assalamu'alaikum Warahmatullahi Wabarakatuh.\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara(i) untuk menghadiri acara pernikahan kami.";
    const defaultPesan2 = "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara(i) berkenan untuk hadir dan memberikan doa restu.\nAtas kehadiran dan do'a restunya kami ucapkan terima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.";
    const defaultDirektori = "fullan-fullannah";

    // Mengisi nilai awal dari penyimpanan
    $("#direktoriUndangan").val(await getData("direktoriUndangan", defaultDirektori));
    $("#pesan1").val(await getData("pesan1", defaultPesan1));
    $("#pesan2").val(await getData("pesan2", defaultPesan2));



	const toTitleCase = (str) => {
		return str
			.split('-') // Pisahkan berdasarkan tanda "-"
			.map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Ubah huruf pertama jadi kapital
			.join(' - '); // Gabungkan kembali dengan " - "
	};


    // Fungsi untuk memperbarui tampilan preview
    const updatePreview = async () => {
        let pesan1Value = await getData("pesan1", defaultPesan1);
        let pesan2Value = await getData("pesan2", defaultPesan2);
        let direktoriValue = await getData("direktoriUndangan", defaultDirektori);

		$("#previewPesanUndangan").html(
			"Kepada Yth.<br>Bapak/Ibu/Saudara(i)<br><b>&lt;&lt;NAMA_PENERIMA_UDANGAN&gt;&gt;</b><br><br>" + 
			pesan1Value.replace(/\n/g, "<br>") + "<br><br>" + 
			"Berikut link untuk info lengkap dari acara kami :<br>" + "<b>&lt;&lt;LINK_UNDANGAN_WEB&gt;&gt;</b>" + "<br><br>" +
			pesan2Value.replace(/\n/g, "<br>") + "<br><br>" + 
			"Hormat Kami :<br><strong>" + toTitleCase(direktoriValue) + "</strong>"
		);
		
    };

    // Jalankan update pertama kali
    updatePreview();

    // Event listener untuk menyimpan dan memperbarui preview saat input berubah
    $("#pesan1").on("input", function () { saveData("pesan1", $(this).val()); });
    $("#pesan2").on("input", function () { saveData("pesan2", $(this).val()); });
    $("#direktoriUndangan").on("input", function () { saveData("direktoriUndangan", $(this).val()); });

    // Live validation input direktori
    $("#direktoriUndangan").on("input", function() {
        let value = $(this).val();
        value = value.replace(/[^a-z0-9-]/g, ''); // Hanya karakter a-z, 0-9, dan '-'
        $(this).val(value);
    });

    // Live validation input number
    $("#nomorWAPenerima").on("input", function () {
        let value = $(this).val();
        value = value.replace(/[^0-9]/g, '');
        if (!value.startsWith("0") && !value.startsWith("62")) {
            value = "0";
        }
        $(this).val(value);
    });

    // Simpan konsep pesan saat tombol diklik
    $("#simpanKonsepPesan").on("click", async function () {
        let pesan1Value = $("#pesan1").val();
        let pesan2Value = $("#pesan2").val();

        await saveData("pesan1", pesan1Value);
        await saveData("pesan2", pesan2Value);

        // Tutup modal setelah menyimpan
        $("#modalEditKonsep").modal("hide");
    });



	// Fungsi untuk mengecek input dan menonaktifkan/mengaktifkan tombol
    function validateInputs() {
        let nomorWA = $("#nomorWAPenerima").val().trim();
        let namaPenerima = $("#namaPenerima").val().trim();

		if (nomorWA === "" && namaPenerima === "") {
			// Jika nomorWA dan namaPenerima kosong, kedua tombol disabled
			$("#btnKirimViaWhatsapp, #btnSalinPesanUndangan").prop("disabled", true);
		} else if (nomorWA !== "" && namaPenerima === "") {
			// Jika nomorWA ada tetapi namaPenerima kosong, kedua tombol disabled
			$("#btnKirimViaWhatsapp, #btnSalinPesanUndangan").prop("disabled", true);
		} else if (nomorWA === "" && namaPenerima !== "") {
			// Jika nomorWA kosong tetapi namaPenerima ada, btnKirimViaWhatsapp disabled, btnSalinPesanUndangan enabled
			$("#btnKirimViaWhatsapp").prop("disabled", true);
			$("#btnSalinPesanUndangan").prop("disabled", false);
		} else {
			// Jika nomorWA dan namaPenerima ada, kedua tombol enabled
			$("#btnKirimViaWhatsapp, #btnSalinPesanUndangan").prop("disabled", false);
		}
    }

    // Panggil validasi saat input berubah
    $("#nomorWAPenerima, #namaPenerima").on("input", validateInputs);

    // Fungsi untuk membentuk pesan undangan
    function generatePesanUndangan() {
        let namaPenerima = $("#namaPenerima").val().trim();
        let direktoriUndangan = $("#direktoriUndangan").val().trim() || "fullan-fullannah";
		let namapenutup = toTitleCase(direktoriUndangan);
        let pesan1 = $("#pesan1").val().trim() || "Assalamu'alaikum Warahmatullahi Wabarakatuh. Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara(i) untuk menghadiri acara pernikahan kami.";
        let pesan2 = $("#pesan2").val().trim() || "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara(i) berkenan untuk hadir dan memberikan doa restu. Atas kehadiran dan do'a restunya kami ucapkan terima kasih. Wassalamu'alaikum Warahmatullahi Wabarakatuh.";
        
        let linkUndangan = `https://krafta-ampana.github.io/${direktoriUndangan}/?tamu=${encodeURIComponent(namaPenerima)}`;

        return `Kepada Yth.
Bapak/Ibu/Saudara(i)
*${namaPenerima}*

${pesan1}

Berikut link untuk info lengkap dari acara kami:
${linkUndangan}

${pesan2}

Hormat Kami:
*${namapenutup}*
        `;
    }

    // Tombol Kirim via WhatsApp
    $("#btnKirimViaWhatsapp").on("click", function () {
        let nomorWA = $("#nomorWAPenerima").val().trim();
        let pesanUndangan = generatePesanUndangan();

        // Pastikan nomor diawali dengan +62 atau 62 jika menggunakan format 08
        if (nomorWA.startsWith("08")) {
            nomorWA = "62" + nomorWA.substring(1);
        }

        let whatsappLink = `https://wa.me/${nomorWA}?text=${encodeURIComponent(pesanUndangan)}`;
        window.open(whatsappLink, "_blank");
    });

    // Tombol Salin Pesan
    $("#btnSalinPesanUndangan").on("click", function () {
        let pesanUndangan = generatePesanUndangan();
        let tempTextArea = $("<textarea>");
        $("body").append(tempTextArea);
        tempTextArea.val(pesanUndangan).select();
        document.execCommand("copy");
        tempTextArea.remove();
        alert("Pesan undangan berhasil disalin!");
    });

    // Panggil validasi awal saat halaman dimuat
    validateInputs();

});