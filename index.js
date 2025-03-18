require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const express = require('express');

async function startBot() {
    try {
        console.log("Memulai bot WhatsApp...");
        const authDir = path.join(__dirname, 'auth');
        if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
        
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg || !msg.message || msg.key.fromMe) return;

                const allowedGroups = ['120363414202287808@g.us'];
                console.log(`Pesan diterima dari: ${msg.key.remoteJid}`);

                if (!allowedGroups.includes(msg.key.remoteJid)) {
                    console.log("Pesan dari grup yang tidak diizinkan, diabaikan.");
                    return;
                }

                if (msg.key.remoteJid.endsWith('@g.us')) {
                    const text = msg.message?.conversation?.toLowerCase() || '';
                    const sender = msg.key.remoteJid;
                    console.log(`Pesan dari ${sender}: ${text}`);

                    const productList = "\uD83D\uDCCC *Daftar Produk*\n\n"
                        + " • *CAPCUT PRO*\n"
                        + " • *VIDIO*\n"
                        + " • *VIU*\n"
                        + " • *WETV*\n"
                        + " • *YT3B*\n"
                        + " • *SPOTIFY*\n"
                        + " • *Paket Bundling WETV+VIU 18K*\n\n"
                        + "Silakan ketik nama produk untuk melihat detail.";

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

                    if (text === 'list') {
                        await sock.sendMessage(sender, { text: productList });
                        return;
                    }

                    if (productDetails[text]) {
                        const product = productDetails[text];

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
            } catch (err) {
                console.error("Error saat menangani pesan:", err);
            }
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                console.log(`Koneksi terputus. Reconnecting: ${shouldReconnect}`);
                if (shouldReconnect) {
                    setTimeout(startBot, 5000); // Restart bot dengan delay 5 detik
                }
            } else if (connection === 'open') {
                console.log("Bot berhasil terkoneksi ke WhatsApp!");
            }
        });

        console.log("Bot WhatsApp berhasil dijalankan!");
    } catch (error) {
        console.error("Error saat menjalankan bot:", error);
    }
}

const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.status(200).json({ status: "ok", message: "Bot WhatsApp is running!" });
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Health check passed!" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Health check running on port ${PORT}`);
});

startBot();
