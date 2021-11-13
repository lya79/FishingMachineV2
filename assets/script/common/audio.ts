export enum EAction {
    Pause,
    Stop,
    Resume,
}

export class AudioManager {
    private static musicVolume: number = 0.5; // 預設背景音樂音量
    private static effectsVolume: number = 0.5; // 預設音效音量

    private static audioMap: Map<string, cc.AudioClip> = new Map<string, cc.AudioClip>();

    private static audioIdOfmusicMap: Map<string, number> = new Map<string, number>();
    private static audioIdOfeffectMap: Map<string, number> = new Map<string, number>();

    /**
     * 播放音效之前先載入音效資源(音效、背景音樂), 並且緩喘存至 audioMap
     */
    public static addAudio(name: string, audioClip: cc.AudioClip) {
        this.audioMap.set(name, audioClip);
    }

    /**
     * 取消靜音(恢復到靜音前的音量)
     */
    public static unmute(
        effect: boolean, // true:音效, false:背景音樂
    ) {
        if (effect) {
            cc.audioEngine.setEffectsVolume(this.effectsVolume);
        } else {
            cc.audioEngine.setMusicVolume(this.musicVolume);
        }
    }

    public static isMute(
        effect: boolean, // true:音效, false:背景音樂
    ): boolean {
        if (effect) {
            return cc.audioEngine.getEffectsVolume() == 0.0;
        }
        return cc.audioEngine.getMusicVolume() == 0.0;
    }

    public static getVolume(
        effect: boolean, // true:音效, false:背景音樂
    ): number {
        if (effect) {
            return cc.audioEngine.getEffectsVolume();
        }
        return cc.audioEngine.getMusicVolume();
    }

    /**
     * 控制音量
     * 如果需要靜音則帶入0.0
     */
    public static setVolume(
        effect: boolean, // true:音效, false:背景音樂
        volume: number,
    ) {
        if (volume < 0.0) {
            volume = 0.0;
        } else if (volume > 1.0) {
            volume = 1.0;
        }

        if (effect) {
            if (volume > 0.0) {
                this.effectsVolume = volume;
            }
            cc.audioEngine.setEffectsVolume(volume);
        } else {
            if (volume > 0.0) {
                this.musicVolume = volume;
            }
            cc.audioEngine.setMusicVolume(volume);
        }
    }

    public static play(
        name: string, // 音效或背景音樂名稱
        effect: boolean, // true:音效, false:背景音樂
        loop: boolean, // 播放次數, <=0則代表不斷重複撥放
    ) {
        if (!this.audioMap.has(name)) {
            cc.log('error 音訊不存在, name:' + name + ", effect:" + effect);
            return;
        }

        if (effect) {
            let audioID = cc.audioEngine.playEffect(this.audioMap.get(name), loop);
            this.audioIdOfeffectMap.set(name, audioID);
        } else {
            let audioID = cc.audioEngine.playMusic(this.audioMap.get(name), loop);
            this.audioIdOfmusicMap.set(name, audioID);
        }
    }

    /**
     * 暫停音效或背景音樂
     */
    public static operator(
        action: EAction,
        effect: boolean, // true:音效, false:背景音樂
        name?: string, // 音效或背景音樂名稱
    ) {
        let func = function (audioID: number) {
            switch (action) {
                case EAction.Pause:
                    cc.audioEngine.pause(audioID);
                    break;
                case EAction.Stop:
                    cc.audioEngine.stop(audioID);
                    break;
                case EAction.Resume:
                    cc.audioEngine.resume(audioID);
                    break;
                default:
                    break;
            }
        };

        let map = this.audioIdOfeffectMap;
        if (!effect) {
            map = this.audioIdOfmusicMap;
        }

        if (name) {
            if (map.has(name)) {
                func(map.get(name));
                if (action == EAction.Stop) {
                    map.delete(name);
                }
            }
            return;
        }

        map.forEach((value, key, map) => {
            func(value);
            if (action == EAction.Stop) {
                map.delete(key);
            }
        })
    }
}