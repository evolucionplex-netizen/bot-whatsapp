const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

let qrCodeData = null;

// 1. CONFIGURAMOS EL CLIENTE
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// 2. CUANDO GENERE QR LO GUARDAMOS
client.on('qr', qr => {
    console.log('QR Generado');
    qrCodeData = qr; 
});

// 3. CUANDO SE CONECTE
client.on('ready', () => {
    console.log('✅ Bot conectado correctamente');
    qrCodeData = null; // Borramos el QR porque ya no sirve
});

// 4. PARA RESPONDER MENSAJES
client.on('message', async msg => {
    console.log('Mensaje recibido:', msg.body);

    if (msg.body === '!ping') {
        msg.reply('pong 🏓 El bot está vivo y en Railway');
    }

    if (msg.body.toLowerCase() === 'hola') {
        msg.reply('Hola bro! 👋 Soy tu bot');
    }
});

client.initialize();

// 5. SERVIDOR WEB PARA MOSTRAR EL QR
app.get('/', async (req, res) => {
    if (qrCodeData) {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.send(`
            <h1>Escanea este QR con WhatsApp</h1>
            <img src="${qrImage}" style="width: 300px; height: 300px;" />
            <p>WhatsApp > Dispositivos vinculados > Vincular dispositivo</p>
        `);
    } else {
        res.send('<h1>✅ Bot ya conectado</h1><p>No hay QR pendiente. El bot está corriendo.</p>');
    }
});

app.listen(port, () => {
    console.log(`Servidor QR en puerto ${port}`);
});
