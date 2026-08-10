const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const mysql = require('mysql2/promise');
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8080;

let qrCodeData = null;

// 1. CONFIGURA TU BASE DE DATOS AQUÍ
const dbConfig = {
    host: 'localhost', // Ej: 'localhost' o 'sql123.hostinger.com'
    user: 'root', // Tu usuario de BD
    password: '1234', // Tu contraseña de BD
    database: 'TU_BASE_DATOS' // Nombre de tu base de datos
};

// 2. TU NUMERO PARA EL REPORTE
const MI_NUMERO = '573228134886@c.us';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
    console.log('❌ Error de autenticación. Borra la carpeta.wwebjs_auth');
});

// FUNCIÓN PARA ENVIAR LOS MENSAJES
async function enviarRecordatorios() {
    console.log('⏰ Ejecutando recordatorios de la 1PM...');
    let enviados = 0;
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Busca en tabla RENOVACIONES donde Estado = 0
        const [rows] = await connection.execute('SELECT Nombre, WhatsApp FROM RENOVACIONES WHERE Estado = 0');

        if(rows.length === 0){
            console.log('No hay clientes con Estado 0 hoy');
            await client.sendMessage(MI_NUMERO, `🤖 Reporte 1:00 PM\n\nNo hay clientes con Estado 0 para notificar hoy.`);
            await connection.end();
            return;
        }

        for (const cliente of rows) {
            const numero = cliente.WhatsApp + '@c.us'; // Ej: 57320266158@c.us
            const mensaje = `Hola ${cliente.Nombre} 👋

Te escribo para recordarte que tu servicio está por vencer.
Para renovar por favor comunícate con nosotros.

Gracias 🙏`;

            await client.sendMessage(numero, mensaje);
            console.log(`✅ Mensaje enviado a: ${cliente.Nombre} - ${cliente.WhatsApp}`);
            enviados++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5 seg entre mensajes
        }
        await connection.end();

        // TE ENVÍA EL REPORTE A TI
        await client.sendMessage(MI_NUMERO, `🤖 Reporte 1:00 PM\nSe enviaron ${enviados} mensajes de renovación correctamente.`);

    } catch (error) {
        console.log('❌ Error en BD:', error);
        await client.sendMessage(MI_NUMERO, `❌ Error en el bot a las 1PM: ${error.message}`);
    }
}

// CRON JOB: SE EJECUTA TODOS LOS DÍAS A LA 1:00 PM HORA COLOMBIA
function iniciarRecordatorios() {
    cron.schedule('0 13 *', () => { // 0 13 = 1:00 PM
        enviarRecordatorios();
    }, {
        timezone: "America/Bogota" // Hora Colombia
    });
    console.log('Cron de 1PM Colombia activado');
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
        res.send('<h1>✅ Bot ya conectado</h1><p>El cron de 1PM Colombia está activo</p>');
    }
});

app.listen(port, () => {
    console.log(`Servidor QR en puerto ${port}`);
});
