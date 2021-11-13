
import { EWallet, EWalletResultAction, User } from "../common/user";
import { EAction as EAudioAction, AudioManager } from "../common/audio";

const { ccclass, property } = cc._decorator;

export type Handler = (roomLevel: number) => void;

@ccclass
export class LobbyComponent extends cc.Component {
    private handler: Handler;

    private soundOnNode: cc.Node;
    private soundOffNode: cc.Node;

    public init(handler: Handler): boolean {
        this.handler = handler;
        if (!this.handler) {
            cc.log('error: handler is null');
            return false;
        }
        return true;
    }

    public onLoad() {
        cc.log("lobby onload");

        let soundNode = this.node.getChildByName("sound");
        if (!soundNode) {
            cc.log('error: soundNode is null');
            return;
        }

        this.soundOnNode = soundNode.getChildByName("on");
        if (!this.soundOnNode) {
            cc.log('error: soundOnNode is null');
            return;
        }

        this.soundOffNode = soundNode.getChildByName("off");
        if (!this.soundOffNode) {
            cc.log('error: soundOffNode is null');
            return;
        }
    }

    // public start() {
    // }

    public onEnable() {
        cc.log("lobby onEnable");

        AudioManager.operator(EAudioAction.Stop, true);
        AudioManager.operator(EAudioAction.Stop, false);

        AudioManager.play(`BG_Lobby`, false, true);

        this.updatMuteBtn();

        let success = this.setWallet(); // 更新錢包數值

        for (let i = 1; i <= 3; i++) {
            let level = i;
            let path = 'Canvas/lobby/level' + `${level}`;
            let node = cc.find(path);
            if (!node) {
                cc.log("error: node not found:" + path);
                return false;
            }

            switch (level) {
                case 1:
                    node.on(cc.Node.EventType.TOUCH_START, this.selectRoomLevel1, this);
                    break;
                case 2:
                    node.on(cc.Node.EventType.TOUCH_START, this.selectRoomLevel2, this);
                    break;
                case 3:
                    node.on(cc.Node.EventType.TOUCH_START, this.selectRoomLevel3, this);
                    break;
                default:
                    break;
            }
        }

        this.soundOnNode.on(cc.Node.EventType.TOUCH_START, this.changeMute, this);
        this.soundOffNode.on(cc.Node.EventType.TOUCH_START, this.changeMute, this);
    }

    public onDisable() {
        cc.log("lobby onDisable");

        this.soundOnNode.off(cc.Node.EventType.TOUCH_START, this.changeMute, this);
        this.soundOffNode.off(cc.Node.EventType.TOUCH_START, this.changeMute, this);

        for (let i = 1; i <= 3; i++) {
            let level = i;
            let path = 'Canvas/lobby/level' + `${level}`;
            let node = cc.find(path);
            if (!node) {
                cc.log("error: node not found:" + path);
                return false;
            }

            switch (level) {
                case 1:
                    node.off(cc.Node.EventType.TOUCH_START, this.selectRoomLevel1, this);
                    break;
                case 2:
                    node.off(cc.Node.EventType.TOUCH_START, this.selectRoomLevel2, this);
                    break;
                case 3:
                    node.off(cc.Node.EventType.TOUCH_START, this.selectRoomLevel3, this);
                    break;
                default:
                    break;
            }
        }
    }

    private selectRoomLevel1() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.handler(1);
    }

    private selectRoomLevel2() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.handler(2);
    }

    private selectRoomLevel3() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.handler(3);
    }

    /**
     * 設定錢包
     */
    private setWallet(): boolean {
        let result = User.operatorWallet(EWallet.Query, null);
        if (result.result != EWalletResultAction.Success) {
            cc.log('error: 玩家錢包初始化失敗, result:' + result.result.toString());
            return false;
        }

        let path = 'Canvas/lobby/wallet_bg/wallet/value';
        let node = cc.find(path);
        if (!node) {
            cc.log("error: node not found:" + path);
            return false;
        }

        let label = node.getComponent(cc.Label);
        if (!label) {
            cc.log("error: cc.Label not found");
            return false;
        }

        label.string = result.newValue;

        return true; // success
    }

    private changeMute() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        cc.log("靜音: " + this.isMute());

        if (this.isMute()) {
            AudioManager.unmute(true);
            AudioManager.unmute(false);
        } else {
            AudioManager.setVolume(true, 0.0);
            AudioManager.setVolume(false, 0.0);
        }


        this.updatMuteBtn();
    }

    private updatMuteBtn() {
        cc.log("靜音: " + this.isMute());

        let mute = this.isMute();
        this.soundOnNode.active = !mute;
        this.soundOffNode.active = mute;
    }

    private isMute(): boolean {
        return AudioManager.isMute(true) && AudioManager.isMute(false);
    }
}