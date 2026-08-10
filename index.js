const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

const miNumero = '573228134886@c.us';

// 1. CUANDO GENERA QR -> LO MUESTRA EN CONSOLA
client.on('qr', qr => {
    console.log('====================================');
    console.log(' ESCANEA ESTE QR EN WHATSAPP WEB');
    console.log('====================================');
    qrcode.generate(qr, {small: true});
});

// 2. CUANDO YA SE CONECTÓ
client.on('ready', () => {
    console.log('✅ Bot conectado correctamente');
});

// 3. SI SE DESCONECTA
client.on('disconnected', (reason) => {
    console.log('❌ Bot desconectado:', reason);
});

// 4. SI TÚ LE MANDAS "qr" TE AVISA QUE REVISES LOGS
client.on('message', async msg => {
    if (msg.from === miNumero && msg.body.toLowerCase() === 'qr') {
        msg.reply('Listo, genera un QR nuevo. Ve a Railway > Deploy Logs y escanea el QR que aparece ahí');
        client.logout(); 
    }
});

client.initialize();
