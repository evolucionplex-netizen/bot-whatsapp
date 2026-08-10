const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let qrCodeData = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// Cuando genere QR lo guardamos
client.on('qr', qr => {
    console.log('QR Generado');
    qrCodeData = qr; // Guardamos el código
});

client.on('ready', () => {
    console.log('✅ Bot conectado correctamente');
    qrCodeData = null; // Borramos el QR porque ya no sirve
});

client.initialize();

// ESTA ES LA PÁGINA WEB CON EL QR
app.get('/', async (req, res) => {
    if (qrCodeData) {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.send(`
            <h1>Escanea este QR</h1>
            <img src="${qrImage}" style="width: 300px; height: 300px;" />
            <p>Abre WhatsApp > Dispositivos vinculados > Vincular</p>
        `);
    } else {
        res.send('<h1>✅ Bot ya conectado</h1><p>No hay QR pendiente</p>');
    }
});

app.listen(port, () => {
    console.log(`Servidor QR en puerto ${port}`);
});
