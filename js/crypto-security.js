function rrot(x, n) {
  return ((x >>> n) | (x << (32 - n))) & 0xFFFFFFFF;
}

function jsSha256(s) {
  const maxWord = 4294967296; // 2^32
  const k = [];
  const h = [];
  let cand = 2;
  const isComp = {};
  while (k.length < 64) {
    if (!isComp[cand]) {
      for (let i = cand; i < 320; i += cand) {
        isComp[i] = true;
      }
      h.push((Math.floor(Math.sqrt(cand) * maxWord)) | 0);
      k.push((Math.floor(Math.cbrt(cand) * maxWord)) | 0);
    }
    cand++;
  }

  const initialH = h.slice(0, 8);
  const curH = [...initialH];
  const asciiBitLen = s.length * 8;
  s += '\x80';
  while ((s.length % 64) !== 56) {
    s += '\x00';
  }

  const words = new Array((s.length + 8) >> 2).fill(0);
  for (let i = 0; i < s.length; i++) {
    words[i >> 2] |= (s.charCodeAt(i) & 0xFF) << ((3 - (i % 4)) * 8);
  }
  words[words.length - 2] = (asciiBitLen / maxWord) | 0;
  words[words.length - 1] = asciiBitLen | 0;

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    while (w.length < 64) w.push(0);
    const oldH = [...curH];

    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15];
        const s0 = (rrot(w15, 7) ^ rrot(w15, 18) ^ (w15 >>> 3)) & 0xFFFFFFFF;
        const w2 = w[i - 2];
        const s1 = (rrot(w2, 17) ^ rrot(w2, 19) ^ (w2 >>> 10)) & 0xFFFFFFFF;
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF;
      }

      const e = curH[4];
      const s1_e = (rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25)) & 0xFFFFFFFF;
      const ch = ((e & curH[5]) ^ ((~e) & curH[6])) & 0xFFFFFFFF;
      const temp1 = (curH[7] + s1_e + ch + k[i] + w[i]) & 0xFFFFFFFF;

      const a = curH[0];
      const s0_a = (rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22)) & 0xFFFFFFFF;
      const maj = ((a & curH[1]) ^ (a & curH[2]) ^ (curH[1] & curH[2])) & 0xFFFFFFFF;
      const temp2 = (s0_a + maj) & 0xFFFFFFFF;

      curH[7] = curH[6];
      curH[6] = curH[5];
      curH[5] = curH[4];
      curH[4] = (curH[3] + temp1) & 0xFFFFFFFF;
      curH[3] = curH[2];
      curH[2] = curH[1];
      curH[1] = curH[0];
      curH[0] = (temp1 + temp2) & 0xFFFFFFFF;
    }

    for (let i = 0; i < 8; i++) {
      curH[i] = (curH[i] + oldH[i]) & 0xFFFFFFFF;
    }
  }

  let res = '';
  for (let i = 0; i < 8; i++) {
    res += (curH[i] >>> 0).toString(16).padStart(8, '0');
  }
  return res;
}

/**
 * 암호학적 안전 난수 Salt 생성 (32자리 Hex)
 */
export function generateSalt() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    try {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return salt;
}

/**
 * SHA-256 해시 계산
 * @param {string} message 
 * @returns {Promise<string>} Hex 문자열 해시값
 */
export async function sha256(message) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
    try {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Web Crypto Subtle 실패, JS fallback 사용:', e);
    }
  }
  return jsSha256(message);
}

/**
 * 카드 ID와 Salt를 결합하여 해시값 생성
 * @param {string} cardId 
 * @param {string} salt 
 * @returns {Promise<string>}
 */
export async function hashCard(cardId, salt) {
  return sha256(`${cardId}:${salt}`);
}

/**
 * 5장의 카드를 받아 암호학적 커밋먼트 생성
 * - DB에는 commitments (인덱스별 해시값)만 저장하여 상대방 및 시청자가 F12 개발자 도구로도 절대 알 수 없음
 * - 플레이어 로컬스토리지/메모리에는 secrets (카드 정보 및 Salt)를 안전하게 보관
 * @param {Array} cards 
 */
export async function createCardCommitments(cards) {
  const secrets = [];
  const commitments = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const salt = generateSalt();
    const hash = await hashCard(card.id, salt);

    secrets.push({
      index: i,
      cardId: card.id,
      card: card,
      salt: salt,
      isRevealed: false
    });

    commitments.push({
      index: i,
      hash: hash,
      revealed: null // { cardId, salt } 가 채워지면 공개 상태
    });
  }

  return { secrets, commitments };
}

/**
 * 공개된 카드가 최초 커밋된 해시와 일치하는지 검증 (위변조 방지)
 * @param {string} cardId 
 * @param {string} salt 
 * @param {string} expectedHash 
 * @returns {Promise<boolean>}
 */
export async function verifyCardReveal(cardId, salt, expectedHash) {
  if (!cardId || !salt || !expectedHash) return false;
  const calculated = await hashCard(cardId, salt);
  return calculated.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * XSS 방지를 위한 HTML Escape
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim()
    .slice(0, 30); // 최대 30자 제한
}

/**
 * 템플릿 리터럴 / innerHTML 주입 시 XSS를 원천 방어하는 HTML 이스케이프 함수
 * @param {*} val
 * @returns {string}
 */
export function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
