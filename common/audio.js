let wordAudio = null
let sfxAudio = null

function getWordAudio() {
	if (!wordAudio) {
		wordAudio = uni.createInnerAudioContext()
		wordAudio.obeyMuteSwitch = false
		wordAudio.onError(() => {})
	}
	return wordAudio
}

function getSfxAudio() {
	if (!sfxAudio) {
		sfxAudio = uni.createInnerAudioContext()
		sfxAudio.obeyMuteSwitch = false
		sfxAudio.onError(() => {})
	}
	return sfxAudio
}

export function playWord(word) {
	if (!word) return
	const a = getWordAudio()
	try {
		a.stop()
	} catch (e) {}
	a.src = 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(word)
	a.play()
}

export function playSfx(type, enabled) {
	if (!enabled) return
	const a = getSfxAudio()
	try {
		a.stop()
	} catch (e) {}
	// 答对：清脆上扬叮咚；答错：低沉两声（本地 wav）
	a.src = type === 'right' ? '/static/audio/right.wav' : '/static/audio/wrong.wav'
	a.play()
}

export function destroyAudio() {
	if (wordAudio) {
		wordAudio.destroy()
		wordAudio = null
	}
	if (sfxAudio) {
		sfxAudio.destroy()
		sfxAudio = null
	}
}

export default {
	playWord,
	playSfx,
	destroyAudio
}
