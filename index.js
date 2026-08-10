    const { Client, LocalAuth } = require('whatsapp-web.js');

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: '/tmp' }),
        puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });
client.on('qr', qr => {
    console.log('QR Generado. Te lo envío por WhatsApp');
    
    // CAMBIA ESTE NÚMERO POR EL TUYO CON CÓDIGO DE PAÍS
    const miNumero = '521TU_NUMERO_AQUI@c.us';
    
    client.sendMessage(miNumero, `*TU QR PARA VINCULAR* \n\n${qr}\n\nCopia todo eso y pégalo en "Vincular con código"`);
});
    
    client.on('ready', () => { console.log('Client is ready!'); });
    client.on('message', msg => { if (msg.body === 'hola') msg.reply('Hola! Soy tu bot 24/7 🚀'); });
    client.initialize();
