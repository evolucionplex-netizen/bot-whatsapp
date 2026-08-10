const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const mysql = require('mysql2/promise');
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8080;

let qrCodeData = null;

// CONFIGURA TU BASE DE DATOS AQUÍ
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'clientes_db'
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('QR Generado. Abre el link de Railway para escanearlo.');
    qrCodeData = qr;
});

client.on('ready', () => {
    console.log('✅ Bot conectado correctamente');
    qrCodeData = null;
    iniciarRecordatorios();
});

client.on('auth_failure', () => {
    console.log('❌ Error de autenticación');
});

// FUNCIÓN PARA ENVIAR LOS MENSAJES
async function enviarRecordatorios() {
    console.log('⏰ Ejecutando recordatorios de las 8PM...');
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Busca clientes con estado 0
        const [rows] = await connection.execute('SELECT telefono, nombre FROM clientes WHERE estado = 0');

        if(rows.length === 0){
            console.log('No hay clientes con estado 0 hoy');
        }

        for (const cliente of rows) {
            const numero = cliente.telefono + '@c.us'; // Formato: 51987654321
            const mensaje = `Hola ${cliente.nombre} 👋

Te escribo para recordarte que tu servicio está por vencer.
Para renovar por favor comunícate con nosotros.

Gracias 🙏`;

            await client.sendMessage(numero, mensaje);
            console.log(`✅ Mensaje enviado a: ${cliente.nombre}`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 seg
        }
        await connection.end();
    } catch (error) {
        console.log('❌ Error en BD:', error);
    }
}

// CRON JOB: SE EJECUTA TODOS LOS DÍAS A LAS 8:00 PM HORA PERÚ
function iniciarRecordatorios() {
    cron.schedule('0 20 *', () => {
        enviarRecordatorios();
    }, {
        timezone: "America/Lima"
    });
    console.log('Cron de 8PM activado');
}

client.on('message', async msg => {
    if (msg.body === '!ping') {
        msg.reply('pong 🏓 El bot está vivo');
    }
});

client.initialize();

// SERVIDOR PARA VER EL QR
app.get('/', async (req, res) => {
    if (qrCodeData) {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.send(`
            <h1>Escanea este QR con WhatsApp</h1>
            <img src="${qrImage}" style="width: 300px; height: 300px;" />
        `);
    } else {
        res.send('<h1>✅ Bot ya conectado</h1><p>El cron de 8PM está activo</p>');
    }
});

app.listen(port, () => {
    console.log(`Servidor QR en puerto ${port}`);
});
