const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');


const MI_NUMERO = '573228134886';
const SHEET_ID = '1QSoMlonkk-iCsEMhdYgcjWLxlN-c_AHN0x1y3pWMfW0';


let sock;


async function conectarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({ auth: state, printQRInTerminal: true });
    sock.ev.on('creds.update', saveCreds);


    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr){ 
            console.log("Escanea este QR con WhatsApp > Dispositivos vinculados");
            qrcode.generate(qr, {small: true}); 
        }


        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            try {
                await sock.sendMessage(MI_NUMERO + '@s.whatsapp.net', {
                    text: '⚠️ ATENCIÓN: El bot se desvinculó de WhatsApp.\nEntra a Railway > Logs para escanear el QR nuevo.'
                });
            } catch(e){}
            if(shouldReconnect) conectarWhatsApp();
        }
        if(connection === 'open') { console.log('Bot conectado a WhatsApp ✅'); }
    });
}


async function revisarVencidos() {
    console.log('Revisando vencidos...');
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_CREDENTIALS));
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const filas = await sheet.getRows();


    for(const fila of filas){
        const estado = parseInt(fila.Estado);
        if(estado === 0 && fila.Notificado!== 'SI' && fila.WhatsApp){
            const mensaje = `Buenas tardes ${fila.Nombre}\n\nEl día de hoy vence tu ${fila.Servicio}.\n¿Deseas renovarla?`;
            await sock.sendMessage(fila.WhatsApp + '@s.whatsapp.net', { text: mensaje });
            fila.Notificado = 'SI';
            await fila.save();
            console.log(`Mensaje enviado a: ${fila.Nombre}`);
        }
    }
}


conectarWhatsApp();
cron.schedule('0 9 *', revisarVencidos, { timezone: "America/Bogota" });
console.log('Bot iniciado. Esperando QR...');
