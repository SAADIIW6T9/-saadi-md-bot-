const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('SAADI-MD-BOT is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan QR code above with WhatsApp');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && m.type === 'notify') {
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const sender = msg.key.remoteJid;

      if (text.toLowerCase() === '.ping') {
        await sock.sendMessage(sender, { text: 'Pong! Bot is alive.' });
      }
      if (text.toLowerCase() === '.menu') {
        await sock.sendMessage(sender, { text: '*SAADI MD BOT*\n\n.ping - Check status\n.menu - Show menu\n.owner - Owner info' });
      }
      if (text.toLowerCase() === '.owner') {
        await sock.sendMessage(sender, { text: 'Owner: SAADI' });
      }
    }
  });
}

startBot();
