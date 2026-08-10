const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const { google } = require('googleapis');
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 8080;

let qrCodeData = null;

// CONFIG DE TU SHEET
const SPREADSHEET_ID = '1QSoMlonkk-iCsEMhdYgcjWLxlN-c_AHN0x1y3pWMfW0';
const SHEET_NAME = 'RENOVACIONES'; 

// TU NUMERO PARA EL REPORTE
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

// AUTENTICACIÓN CON GOOGLE
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// FUNCIÓN PARA LEER EL SHEET
async function leerClientes() {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:F`,
    });
    const rows = res.data.values;
    if (!rows || rows.length < 2) return [];
    
    return rows.slice(1).filter(row => row[4] === '0').map(row => ({
        Nombre: row[1],
        WhatsApp: row[2]
    }));
}

// FUNCIÓN PARA ENVIAR LOS MENSAJES
async function enviarRecordatorios() {
    console.log('⏰ Ejecutando PRUEBA de recordatorios...');
    let enviados = 0;
    try {
        const clientes = await leerClientes();

        if(clientes.length === 0){
            console.log('No hay clientes con Estado 0');
            await client.sendMessage(MI_NUMERO, `🤖 Reporte PRUEBA\n\nNo hay clientes con Estado 0 para notificar.`);
            return;
        }

        for (const cliente of clientes) {
            const numero = cliente.WhatsApp + '@c.us';
            const mensaje = `[PRUEBA] Hola ${cliente.Nombre} 👋

Te escribo para recordarte que tu servicio está por vencer.
Para renovar por favor comunícate con nosotros.

Gracias 🙏`;

            await client.sendMessage(numero, mensaje);
            console.log(`✅ PRUEBA enviada a: ${cliente.Nombre}`);
            enviados++;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        await client.sendMessage(MI_NUMERO, `🤖 Reporte PRUEBA\nSe enviaron ${enviados} mensajes correctamente.`);

    } catch (error) {
        console.log('❌ Error:', error);
        await client.sendMessage(MI_NUMERO, `❌ Error en PRUEBA: ${error.message}`);
    }
}

// CRON JOB: SE EJECUTA EN 10 MINUTOS DESDE QUE INICIA EL BOT
function iniciarRecordatorios() {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 10);
    const minutos = ahora.getMinutes();
    const horas = ahora.getHours();

    cron.schedule(`${minutos} ${horas} *`, () => {
        enviarRecordatorios();
    }, {
        timezone: "America/Bogota"
    });
    console.log(`⏳ Prueba programada para las ${horas}:${minutos} hora Colombia`);
}

client.on('message', async msg => {
    if (msg.body === '!ping') {
        msg.reply('pong 🏓 El bot está vivo');
    }
    if (msg.body === '!probar') {
        msg.reply('Ejecutando prueba manual...');
        enviarRecordatorios();
    }
});

client.initialize();

// SERVIDOR PARA VER EL QR
app.get('/', async (req, res) => {
    if (qrCodeData) {
        const qrImage = await qrcode.toDataURL(qrCodeData);
        res.send(`<h1>Escanea este QR con WhatsApp</h1><img src="${qrImage}" style="width: 300px; height: 300px;" />`);
    } else {
        res.send('<h1>✅ Bot conectado</h1><p>Prueba en 10 min</p>');
    }
});

app.listen(port, () => {
    console.log(`Servidor QR en puerto ${port}`);
});
