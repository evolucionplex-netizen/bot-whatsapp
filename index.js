const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

const miNumero = '573228134886@c.us'; // TU NÚMERO
let qrGuardado = null; // Aquí guardamos el QR

// 1. CUANDO GENERA QR -> SOLO LO GUARDAMOS
client.on('qr', async qr => {
    console.log('QR Generado.');
    qrGuardado = qr;
    await qrcode.toFile('./qr.png', qr);
});

// 2. CUANDO YA SE CONECTÓ -> AHORA SÍ ENVIAMOS
client.on('ready', async () => {
    console.log('Bot listo!');
    await client.sendMessage(miNumero, '✅ Bot conectado correctamente');
    
    // Si tenemos un QR guardado, lo enviamos
    if (qrGuardado) {
        const media = MessageMedia.fromFilePath('./qr.png');
        await client.sendMessage(miNumero, media, {caption: '*ESCANEA ESTE QR PARA VINCULAR*'});
        fs.unlinkSync('./qr.png');
        qrGuardado = null;
    }
});

// 3. SI SE DESCONECTA
client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
});

// 4. SI ALGUIEN TE ESCRIBE
client.on('message', async msg => {
    if (msg.from === miNumero && msg.body.toLowerCase() === 'qr') {
        msg.reply('Generando nuevo QR... espera 10 segundos y se reiniciará');
        client.logout(); 
    }
});

client.initialize();
