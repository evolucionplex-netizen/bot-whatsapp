const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

const miNumero = '573228134886@c.us'; // TU NÚMERO

// 1. CUANDO GENERA QR
client.on('qr', qr => {
    console.log('QR Generado.');
    // Esperamos 3 seg para poder enviarlo
    setTimeout(() => {
        client.sendMessage(miNumero, `*QR PARA VINCULAR* \n\n${qr}\n\nTiene 20 seg para escanearlo`);
    }, 3000);
});

// 2. CUANDO YA SE CONECTÓ
client.on('ready', () => {
    console.log('Bot listo!');
    client.sendMessage(miNumero, '✅ Bot conectado correctamente');
});

// 3. SI SE DESCONECTA
client.on('disconnected', (reason) => {
    console.log('Bot desconectado:', reason);
    // Cuando vuelva a generar QR, te llegará solo con el evento de arriba
});

// 4. SI ALGUIEN TE ESCRIBE
client.on('message', async msg => {
    // Si TÚ le mandas "qr" al bot
    if (msg.from === miNumero && msg.body.toLowerCase() === 'qr') {
        msg.reply('Generando nuevo QR... espera 5 segundos');
        // Forzamos que se genere un QR nuevo
        client.logout(); 
    }
});

client.initialize();
