/**
 * Chiffrement AES-256-GCM côté client.
 * La clé est dérivée via PBKDF2(password + identifier, salt, 100 000 itérations, SHA-256).
 *
 * Format du fichier chiffré :
 *   [magic 4B "WBKP"][salt 16B][iv 12B][ciphertext]
 */

const ITERATIONS = 100_000
const MAGIC = new Uint8Array([0x57, 0x42, 0x4b, 0x50]) // "WBKP"

async function deriveKey(
  password: string,
  identifier: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password + identifier),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** Chiffre un ArrayBuffer avec le mot de passe et l'identifiant de l'admin. */
export async function encryptBuffer(
  data: ArrayBuffer,
  password: string,
  identifier: string
): Promise<ArrayBuffer> {
  const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
  const key = await deriveKey(password, identifier, salt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)

  const out = new Uint8Array(4 + 16 + 12 + ciphertext.byteLength)
  out.set(MAGIC, 0)
  out.set(salt, 4)
  out.set(iv, 20)
  out.set(new Uint8Array(ciphertext), 32)
  return out.buffer
}

/** Déchiffre un ArrayBuffer produit par encryptBuffer. */
export async function decryptBuffer(
  data: ArrayBuffer,
  password: string,
  identifier: string
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(data)

  for (let i = 0; i < 4; i++) {
    if (bytes[i] !== MAGIC[i]) throw new Error('Format de fichier invalide (magic incorrect)')
  }

  const salt = new Uint8Array(bytes.buffer, bytes.byteOffset + 4, 16) as Uint8Array<ArrayBuffer>
  const iv = new Uint8Array(bytes.buffer, bytes.byteOffset + 20, 12) as Uint8Array<ArrayBuffer>
  const ciphertext = bytes.slice(32)
  const key = await deriveKey(password, identifier, salt)

  try {
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  } catch {
    throw new Error('Déchiffrement échoué — mot de passe ou identifiant incorrect')
  }
}
