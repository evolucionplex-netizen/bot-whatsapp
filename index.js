const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./tokens');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'warn' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['Bot Railway', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if(qr) {
            console.log('Escanea este QR:');
            qrcode.generate(qr, {small: true});
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Conexion cerrada. Reconectando...', shouldReconnect);
            if(shouldReconnect) {
                startBot();
            }
        } else if(connection === 'open') {
            console.log('✅ Bot conectado exitosamente');
        }
    });

    // Comando de prueba
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        if(text?.toLowerCase() === 'hola') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hola bro! El bot ya esta vivo en Railway con Baileys' });
        }
    });
}

startBot();
