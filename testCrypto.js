const crypto = require('crypto');

let message = "Test message! /";
let key = "npgcj06nTLBD1j0O";
let iv = "ifidjvirjgkowjfh"

let cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
let enctyptedData = cipher.update(message, "utf-8", 'hex');
enctyptedData += cipher.final('hex');
enctyptedData = iv + enctyptedData;

let deCipher = crypto.createDecipheriv('aes-128-cbc', key, enctyptedData.substring(0, 16));
let decryptedData = deCipher.update(enctyptedData.substring(16), "hex", 'utf-8');
decryptedData += deCipher.final('utf8')

console.log(message)
console.log(enctyptedData)
console.log(decryptedData)