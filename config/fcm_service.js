const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Inisialisasi Firebase Admin SDK sekali saja
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn('[FCM] firebase-service-account.json tidak ditemukan. Push notification dinonaktifkan.');
  } else {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[FCM] Firebase Admin SDK berhasil diinisialisasi.');
  }
}

/**
 * Kirim push notification ke daftar FCM token.
 * @param {string[]} tokens - Array FCM token penerima
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi notifikasi
 * @param {Object} data - Payload data tambahan (opsional)
 */
async function sendPushNotification(tokens, title, body, data = {}) {
  if (!admin.apps.length) return;
  if (!tokens || tokens.length === 0) return;

  // Pastikan semua value data bertipe string
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    notification: { title, body },
    data: stringData,
    tokens,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'helpdesk_messages',
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Terkirim: ${response.successCount}, Gagal: ${response.failureCount}`);

    // Kembalikan token yang sudah tidak valid agar bisa dihapus dari DB
    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });
    return invalidTokens;
  } catch (error) {
    console.error('[FCM] Error mengirim notifikasi:', error.message);
    return [];
  }
}

module.exports = { sendPushNotification };
