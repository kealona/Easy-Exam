import cryptoJs from "crypto-js"

export default {
	/**
	 * 加密
	 * @param {String} word 密码
	 * @return {String} 加密后的密码
	 */
	encrypt(word) {
		let key = cryptoJs.enc.Utf8.parse('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ')
		let srcs = cryptoJs.enc.Utf8.parse(word)
		let encrypted = cryptoJs.AES.encrypt(srcs, key, {
			mode: cryptoJs.mode.ECB,
			padding: cryptoJs.pad.Pkcs7
		})
		return encrypted.toString()
	}
}
