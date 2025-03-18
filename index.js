require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const express = require('express');

async function startBot() {
    try {
        const authDir = path.join(__dirname, 'auth');
        if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true, // Menampilkan QR di terminal
        });

        // Event untuk menyimpan kredensial
        sock.ev.on('creds.update', saveCreds);

        // Event ketika ada pesan masuk dari grup
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];

            // Pastikan pesan ada dan bukan dari bot sendiri
            if (!msg || !msg.message || msg.key.fromMe) return;

            // ID grup yang diizinkan
            const allowedGroups = ['120363414202287808@g.us'];

            // Cetak ID grup ke terminal untuk debugging
            console.log(`Pesan diterima dari grup: ${msg.key.remoteJid}`);

            // Periksa apakah pesan berasal dari grup yang diizinkan
            if (!allowedGroups.includes(msg.key.remoteJid)) {
                console.log("Pesan dari grup yang tidak diizinkan, diabaikan.");
                return;
            }

            // Pastikan pesan berasal dari grup
            if (msg.key.remoteJid.endsWith('@g.us')) {
                const text = msg.message?.conversation?.toLowerCase() || '';
                const sender = msg.key.remoteJid;

                console.log(`Pesan diterima dari ${sender}: ${text}`);

                // Daftar produk
                const productList = "📌 *Daftar Produk*\n\n"
                    + " • *CAPCUT PRO*\n"
                    + " • *VIDIO*\n"
                    + " • *VIU*\n"
                    + " • *WETV*\n"
                    + " • *YT3B*\n"
                    + " • *SPOTIFY*\n"
                    + " • *Paket Bundling WETV+VIU 18K*\n\n"
                    + "Silakan ketik nama produk untuk melihat detail.";

                // Daftar produk dengan gambar dan keterangan
                const productDetails = {
                    "capcut": { text: "🔹 *CAPCUT PRO*\nHarga: 25K/35 hari", image: "images/capcut-pro.png" },
                    "vidio": { text: "🔹 *VIDIO PLATINUM*\nHarga: 15K/bulan", image: "images/vidio.png" },
                    "viu": { text: "🔹 *VIU PREMIUM*\nHarga: 6K/bulan", image: "images/viu.png" },
                    "wetv": { text: "🔹 *WETV VIP*\nHarga: 20K/bulan", image: "images/wetv.png" },
                    "paket bundling": { text: "🔹 *Paket WETV + VIU*\nHarga: 18K/bulan", image: "images/wetv-viu.png" },
                    "yt3b": { text: "🔹 *YouTube Premium*\nHarga: 10K", image: "images/yt-3b.png" },
                    "spotify": { text: "🔹 *Spotify Premium*\nCOMING SOON" },
                    "netflix": { text: "🔹 *Netflix*\nCOMING SOON", image: "images/netflix.png" }
                };

                // Jika pengguna mengetik "list", kirim daftar produk
                if (text === 'list') {
                    await sock.sendMessage(sender, { text: productList });
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
            }
        });

    } catch (error) {
        console.error("Error saat menjalankan bot:", error);
    }
}

// Express server untuk health check
const app = express();
app.get("/", (req, res) => {
    res.send("Bot WhatsApp is running!");
});
app.listen(3000, () => {
    console.log("Health check running on port 3000");
});

// Jalankan bot
startBot();
