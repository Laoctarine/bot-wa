const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function startBot() {
    const authDir = path.join(__dirname, 'auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    // Handler untuk cek status koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            console.log('Koneksi terputus, mencoba menyambung kembali dalam 5 detik...');
            setTimeout(() => startBot(), 5000);
        
        } else if (connection === 'open') {
            console.log('Bot terhubung kembali!');
        }
    });

    // Handler untuk pesan masuk
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const isGroup = sender?.endsWith('@g.us');
        const senderId = msg.key.participant || sender;
        if (!senderId) {
            console.log("⚠️ Gagal mendapatkan ID pengirim.");
            return;
        }

        const allowedGroups = ['120363414202287808@g.us'];
        if (isGroup && !allowedGroups.includes(sender)) {
            console.log("Pesan dari grup yang tidak diizinkan, diabaikan.");
            return;
        }

        console.log(`Pesan diterima dari: ${sender}`);

        let text = msg.message?.conversation 
            || msg.message?.extendedTextMessage?.text 
            || msg.message?.imageMessage?.caption
            || msg.message?.videoMessage?.caption
            || msg.message?.documentMessage?.caption
            || '';

        text = text.toLowerCase().trim(); // Bersihkan teks

        console.log(`Isi pesan: ${text}`);

        // Hanya admin yang bisa gunakan #konfirmasi
        if (text.startsWith('#konfirmasi')) {
            if (!isGroup) {
                console.log('Perintah #konfirmasi hanya bisa digunakan di grup.');
                return;
            }

            const groupMetadata = await sock.groupMetadata(sender);
            const admins = groupMetadata.participants
                .filter(participant => participant.admin)
                .map(admin => admin.id);

            if (!admins.includes(senderId)) {
                console.log(`❌ Pengguna ${senderId} bukan admin. Tidak diizinkan.`);
                await sock.sendMessage(sender, { text: '⚠️ Hanya admin yang dapat menggunakan perintah ini.' }, { quoted: msg });
                return;
            }

            console.log('✅ Admin mengirim perintah #konfirmasi');

            // Pastikan pesan yang direply ada
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                console.log('⚠️ Tidak ada pesan yang direply untuk dikonfirmasi.');
                await sock.sendMessage(sender, { text: '⚠️ Gunakan perintah ini dengan mereply bukti transaksi.' }, { quoted: msg });
                return;
            }

            // Ambil info pengguna yang direply
            const quotedInfo = msg.message.extendedTextMessage.contextInfo;
            const originalSender = quotedInfo.participant;

            if (!originalSender) {
                console.log('Gagal mendapatkan pengirim asli.');
                return;
            }

            console.log(`Mengkonfirmasi transaksi dari ${originalSender}`);

            // Kirim balasan ke chat yang direply
            const response = `✅ *Konfirmasi Pembayaran*\n\n@${originalSender.split('@')[0]} telah melakukan pembayaran.\nTerima kasih telah melakukan transaksi! 🙌`;

            await sock.sendMessage(sender, { text: response, mentions: [originalSender] }, { quoted: msg });

            return;
        }

        if (text === '#close' || text === '#open') {
            if (!isGroup) {
                await sock.sendMessage(sender, { text: '⚠️ Perintah ini hanya bisa digunakan di grup.' }, { quoted: msg });
                return;
            }
        
            const groupMetadata = await sock.groupMetadata(sender);
            const admins = groupMetadata.participants
                .filter(participant => participant.admin || participant.superadmin)
                .map(participant => participant.id);
        
            if (!admins.includes(senderId)) {
                await sock.sendMessage(sender, { text: '⚠️ Hanya admin yang dapat menggunakan perintah ini.' }, { quoted: msg });
                return;
            }
        
            const setting = text === '#close' ? 'announcement' : 'not_announcement';
            await sock.groupSettingUpdate(sender, setting);
            await sock.sendMessage(sender, { text: `Grup telah ${text === '#close' ? 'ditutup' : 'dibuka'} .` });
        }

        // Daftar produk
        const productList = "📌 *Daftar Produk*\n\n"
            + " • *CAPCUT*\n"
            + " • *VIDIO*\n"
            + " • *VIU*\n"
            + " • *WETV*\n"
            + " • *YT3B*\n"
            + " • *NETFLIX*\n"
            + " • *VISION*\n"
            + " ┏ *PROMO VISION PAYTV*\n ┗ ketik ''promo''\n"
            + " • *Paket Bundling WETV+VIU 23K*\n\n"
            + "Silakan ketik nama produk untuk melihat detail.\n\n"
            + "*We Are Connected To*\n✈️https://t.me/Laoctstore.";

        // Daftar produk dengan gambar dan keterangan
        const productDetails = {
                "capcut": {
                    text: "🔹 *CAPCUTPRO*\n⇢ *PRIVATE*\n\n▸ 35 hari 25K\n▸ 28 hari 20K\n▸ 7 hari 5K\n\n⇢ *SHARING (5U)*\n\n▸ 1 tahun 30K\n▸ 35 hari 9k\n▸ 7 hari 3k\n\n━━━━━━━━━━━━━━━━━━━\nUNTUK SETIAP PEMBELIAN 2PCS CAPCUTPRO 35 HARI\n\n • FREE 5 acc CCPRO 7 hari\n⚠️ *ATAU*\n • FREE 1 acc CCPRO 28hari\n━━━━━━━━━━━━━━━━━━━\n*bonus berlaku kelipatan khusus private.\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/capcut-pro.png"
                },
                "garansi capcut": {
                    text: "🔹 *GARANSI CAPCUTPRO*\n⇢ *PRIVATE*\n28H & 35H GARANSI 2 MINGGU\n\n⇢ *SHARING*\n35H & 1T GARANSI 5 HARI\n7H FULL GARANSI",
                },
                "garansi streaming": {
                    text: "🔹 *GARANSI PRIVATE STREAMING*\nFULL GARANSI BACKFREE\n\n🔹 *GARANSI SHARING STREAMING*\nFULL GARANSI BACKFREE\n\n⚠️Garansi Aktif Jika Mematuhi SNK",
                },
                "vidio": {
    text: "🔹 *VIDIO PLATINUM ALLDEV*\n"
        + "📌 *PRIVATE:*\n"
        + "  ▸ 1 Bulan: *15K*\n"
        + "  ▸ Paket6   → *84K*\n"
        + "  ▸ Paket26  → *357K 🎁 *Free 1 acc*\n"
        + "  ▸ Paket50  → *685K 🎁 *Free 2 acc*\n"
        + "  ▸ Paket100 → *(PM Admin)* 🎁 *Free 6 acc*\n\n"
        + "📌 *SHARING (2U):*\n"
        + "  ▸ 1 Bulan: *8K*\n"
        + "━━━━━━━━━━━━━━━━\n"
        + "🔹 *VIDIO DIAMOND MOBILE*\n"
        + "📌 *PRIVATE (Pre-Order):*\n"
        + "  ▸ 1 Bulan: *42K*\n"
        + "  ▸ Paket2  → *75K*\n"
        + "  ▸ Paket4  → *150K* 🎁 *Free 1 Plat AllDev*\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/vidio.png"
                },
                "viu": {
                    text: "🔹 *VIU PREMIUM*\n\n⇢ *PRIVATE*\n1 Bulan 6k\n\n⇢ *SHARING (5U)*\n1 Bulan 2k (5 user)\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/viu.png"
                },
                "paket bundling": {
                    text: "🔹 *PAKET BUNDLING WETV+VIU*\n💰 Harga: Rp23.000\n📆 Durasi: 1 Bulan (Private)\n Dapatkan keduanya dengan harga hemat!\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/wetv-viu.png"
                },
                "yt3b": {
                    text: "🔹 *YouTube Premium 3b*\n⇢Indplan 12k nogar\n⇢Indplan 20k Fullgar\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/yt-3b.png"
                },
                "promo": {
                    text: "🔹 *Kode Redeem Vision+PayTV*\n10 KODE 30K\n25 KODE 60K\n\n*BEST DEAL*\n50 KODE 80K\n100 KODE 130K\n\n🔹 *JASPAY VISION+PAYTV*\n1 Akun 3k\n10 Akun 25k\n25 Akun 50k\n100 Akun 165k\n*Wajib Gmail Tidak Bisa Domain\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                },
                "wetv": {
                    text: "🔹 *WETV VIP*\n⇢ *PRIVATE*\n1 Bulan 20k\n\n[Paket5] 80k+Free 1 acc private\n\n⇢ *SHARING (5U)*\n1 Bulan 9k (3 user)\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/wetv.png"
                },
                "netflix": {
    text: "🔹 *NETFLIX PREMIUM 1B*\n"
        + "📌 *1 PROFILE 1 USER: 20K*\n"
        + "  ▸ Login 1 device\n"
        + "  ▸ Request Nama Profile Dan Pin +2k\n"
        + "  ▸ Jarang Limit Screen\n\n"
        + "📌 *1 PROFILE 2 USER: 11K*\n"
        + "  ▸ Satu Profile Di Isi 2 Orang/2 Device\n"
        + "  ▸ Sering Limit Screen Karena Sharing\n\n"
        + "📌 *SEMI PRIVATE: 25K*\n"
        + "  ▸ Netflix Sharing Yang Bisa Login Di 2 Device\n"
        + "  ▸ Jarang Limit Screen\n"
        + "  ▸ free request nama profile dan pin*\n\n"
        + "📌 *PRIVATE 1 AKUN: 95K*\n"
        + "📚 NOTE"
        + "  ▸ Resolusi ultra HD 4k\n"
        + "  ▸ Full garansi selama durasi\n"
        + "  ▸ Garansi berlaku selama mematuhi S&K\n"
        + "  ▸ tanya stok sebelum order\n\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/netflix.png"
                },
                "spotify": {
                    text: "🔹 *Spotify Premium*\nCOMING SOON",
                },
                "vision": {
                    text: "🔹 *VISION+ PAYTV BEINSPORT*\n\n⇢ *PRIVATE*\n1 Bulan 8k\n\n✨account seller\n✨All Device\n✨ios/andoid\n✨BULK PM\n\n 🌟FULL GARANSI\n\nUnlock :\n✅Liga Spanyol\n✅Liga Champion\n✅Bundesliga Jerman\n✅AFC Champion\n✅Liga Arab\n✅Indonesian Idol\n✅Masterchef Indonesia\n\nTulis ''*pay*'' Untuk Melanjutkan Pembayaran",
                    image: "images/vision+.png"
                },
                "pay": {
                    text: "*┏━━━〔 PAYMENT 〕━━━┓*\n\n\n*Sertakan Bukti Transfer Biar Bisa Diproses*",
                    image: "images/pay.png"
                }
            };

            // Jika pengguna mengetik "list", kirim daftar produk
            if (text === 'list') {
                if (msg.key.remoteJid.endsWith('@g.us')) {
                    await sock.sendMessage(msg.key.remoteJid, { text: productList });
                }
                return;
                
            }

            // Jika pengguna memilih salah satu produk, kirim detail + gambar
            if (productDetails[text]) {
                const product = productDetails[text];

                // Cek apakah gambar tersedia
                if (product.image && fs.existsSync(product.image)) {
                    await sock.sendMessage(sender, {
                        image: { url: product.image },
                        caption: product.text
                    });
                } else {
                    await sock.sendMessage(sender, { text: product.text });
                }
            }
        }); // **Kurung `)` yang hilang sudah ditutup di sini!**
    }
    
    // Jalankan bot
    startBot();
