require('dotenv').config();
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const express = require('express');

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function startBot() {
    try {
        console.log("🚀 Memulai bot WhatsApp...");
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
                if (!msg || !msg.message || msg.key.fromMe) return; // Hindari pesan dari bot sendiri

                const allowedGroups = ['120363414202287808@g.us'];
                console.log(`📩 Pesan diterima dari: ${msg.key.remoteJid}`);

                if (!allowedGroups.includes(msg.key.remoteJid)) {
                    console.log("❌ Pesan dari grup yang tidak diizinkan, diabaikan.");
                    return;
                }

                if (msg.key.remoteJid.endsWith('@g.us')) {
                    const text = msg.message?.conversation?.toLowerCase() || '';
                    const sender = msg.key.remoteJid;
                    console.log(`📨 Pesan dari ${sender}: ${text}`);

                    const productList = "📌 *Daftar Produk*\n\n"
                        + " • *CAPCUT PRO*\n"
                        + " • *VIDIO*\n"
                        + " • *VIU*\n"
                        + " • *WETV*\n"
                        + " • *YT3B*\n"
                        + " • *SPOTIFY*\n"
                        + " • *Paket Bundling WETV+VIU 18K*\n\n"
                        + "Silakan ketik nama produk untuk melihat detail atau ketik
