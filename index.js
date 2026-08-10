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

// 1. CUANDO GENERA QR
client.on('qr', async qr => {
    console.log('QR Generado.');
    // Generamos imagen del QR
    await qrcode.toFile('./qr.png', qr);
    // Esperamos a que el cliente esté listo
    setTimeout(async () => {
        const media = MessageMedia.fromFilePath('./qr.png');
        await client.sendMessage(miNumero, media, {caption: '*ESCANEA ESTE QR PARA VINCULAR*'});
        fs.unlinkSync('./qr.png'); // borramos la imagen
    }, 5000);
});

// 2. CUANDO YA SE CONECTÓ
client.on('ready', () => {
    console.log('Bot listo!');
    client.sendMessage(miNumero, '✅ Bot conectado correctamente');
});

// 3. SI SE DESCONECTA
client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
});

// 4. SI ALGUIEN TE ESCRIBE
client.on('message', async msg => {
    if (msg.from === miNumero && msg.body.toLowerCase() === 'qr') {
        msg.reply('Generando nuevo QR... espera 5 segundos');
        client.logout(); 
    }
});

client.initialize();
