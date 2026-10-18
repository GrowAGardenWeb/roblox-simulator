// Conector de TikTok LIVE para el escenario de baile (moneyscripts.shop/live).
// Lee los comentarios y regalos de tu live y se los pasa al escenario por un WebSocket local
// (mismo formato que TikFinity / TikTok-Live-Connector, puerto 21213).
//
// Uso:  node conector.mjs TU_USUARIO_DE_TIKTOK [API_KEY_DE_EULERSTREAM]
import { TikTokLiveConnection } from 'tiktok-live-connector';
import { WebSocketServer } from 'ws';

const user = String(process.argv[2] || '').trim().replace(/^@/, '');
const apiKey = process.argv[3] || process.env.EULER_API_KEY || '';
const PORT = Number(process.env.PORT || 21213);
if (!user) {
  console.log('Uso: node conector.mjs TU_USUARIO_DE_TIKTOK [API_KEY_DE_EULERSTREAM]');
  process.exit(1);
}

const wss = new WebSocketServer({ port: PORT });
const send = (event, data) => {
  const msg = JSON.stringify({ event, data });
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
};
wss.on('connection', () => console.log('🟢 Escenario conectado (' + wss.clients.size + ')'));
wss.on('error', (e) => {
  console.log('⚠️  No se pudo abrir el puerto ' + PORT + ' (¿TikFinity u otro conector ya está abierto?):', e.message);
  process.exit(1);
});

const who = (d) => ({
  uniqueId: d.user?.uniqueId || '',
  nickname: d.user?.nickname || d.user?.uniqueId || 'viewer',
});

let conn = null;
let retry = null;
const again = (s) => {
  clearTimeout(retry);
  retry = setTimeout(start, s * 1000);
};

async function start() {
  try { conn?.disconnect?.(); } catch {}
  conn = new TikTokLiveConnection(user, apiKey ? { signApiKey: apiKey } : {});
  conn.on('chat', (d) => {
    const u = who(d);
    console.log('💬 ' + u.nickname + ': ' + (d.comment || ''));
    send('chat', { ...u, comment: d.comment || '' });
  });
  conn.on('gift', (d) => {
    const g = d.giftDetails || {};
    // regalos en racha: solo cuenta cuando termina la racha
    if (g.giftType === 1 && !d.repeatEnd) return;
    const u = who(d);
    const giftName = g.giftName || d.extendedGiftInfo?.name || String(d.giftId || '');
    const repeatCount = d.repeatCount || 1;
    console.log('🎁 ' + u.nickname + ' → ' + giftName + ' x' + repeatCount);
    send('gift', { ...u, giftName, repeatCount, giftId: d.giftId, diamondCount: g.diamondCount || 0, giftType: g.giftType, repeatEnd: true });
  });
  conn.on('follow', (d) => send('follow', who(d)));
  conn.on('like', (d) => send('like', { ...who(d), likeCount: d.likeCount || 1 }));
  conn.on('disconnected', () => {
    console.log('🔴 Se cortó la conexión con el live. Reintentando en 15 s…');
    again(15);
  });
  try {
    const s = await conn.connect();
    console.log('✅ Conectado al live de @' + user + (s?.roomId ? ' (sala ' + s.roomId + ')' : ''));
  } catch (e) {
    console.log('⚠️  No se pudo conectar al live de @' + user + ': ' + (e?.message || e));
    console.log('   ¿Estás en vivo? Reintentando en 20 s…');
    again(20);
  }
}

console.log('Conector de TikTok LIVE — escenario moneyscripts.shop/live');
console.log('Escuchando en ws://localhost:' + PORT + ' — en el escenario abre ⚙ > TikTok > Conectar.');
start();
