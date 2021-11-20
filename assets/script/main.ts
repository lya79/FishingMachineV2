import { SettingManager } from "./common/setting";
import { EWallet, EWalletResultAction, User } from "./common/user";
import { LoadingComponent, Handler as LoadingHandler } from "./loading/loading";
import { LobbyComponent, Handler as LobbyHandler } from "./lobby/lobby";
import { Game } from "./game/game";
import { EAction as EAudioAction, AudioManager } from "./common/audio";

const { ccclass, property } = cc._decorator;

@ccclass
export class Main extends cc.Component {

    public onLoad() {
        // cc.macro.ENABLE_MULTI_TOUCH = false;

        this.controlUI(1); // 開啟 loading畫面

        this.enableCollision();

        let self = this;
        let loadingHandler: LoadingHandler = function (finish: boolean, err: Error): void {
            if (err) {
                cc.log('error: LoadingHandler err:' + err);
                return;
            }
            cc.log('完成載入資源');

            let success = true;
            success = success && self.loadSetting();
            success = success && self.initUser();
            success = success && self.initVolume();

            self.controlUI(2); // 開啟大廳畫面
        };

        let lobbyHandler: LobbyHandler = function (roomLevel: number): void {
            if (!SettingManager.isVaildRoomLevel(roomLevel)) {
                cc.log("error: 無效的 roomLevel:" + roomLevel);
                return;
            }

            cc.log('玩家選擇大廳:' + SettingManager.getRoomNameByLevel(roomLevel));
            User.setRoomLevel(roomLevel);

            self.controlUI(3); // 開啟遊戲畫面
        };

        this.initUI(loadingHandler, lobbyHandler);

        let success = this.lodRes();
    }

    public onDestroy() {
        cc.loader.releaseAll();
    }

    /**
     * 啟動 cocos內建碰撞檢測
     */
    private enableCollision() {
        cc.log('啟動 cocos內建碰撞檢測');

        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        // manager.enabledDebugDraw = true;
        // manager.enabledDrawBoundingBox = true;
    }

    /**
     * 初始化每個畫面
     */
    private initUI(
        loadingHandler: LoadingHandler,
        lobbyHandler: LobbyHandler,
    ) {
        {
            let path = 'Canvas/loading'; // loading畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }

            let component = node.addComponent(LoadingComponent);
            let success = component.init(loadingHandler);
            if (!success) {
                cc.log('LoadingComponent init fail');
                return;
            }
        }

        {
            let path = 'Canvas/lobby'; // 大廳畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }
            let component = node.addComponent(LobbyComponent);
            let success = component.init(lobbyHandler);
            if (!success) {
                cc.log('LobbyComponent init fail');
                return;
            }
        }
        {
            let path = 'Canvas/game'; // game畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }
            let component = node.addComponent(Game);
            let success = component.init(this.backLobbyHandler);
            if (!success) {
                cc.log('GameComponent init fail');
                return;
            }
        }
    }

    /**
     * 返回大廳
     */
    private backLobbyHandler() {
        {
            let path = 'Canvas/lobby'; // 大廳畫面
            let node = cc.find(path);
            node.active = true;
        }

        {
            let path = 'Canvas/game'; // game畫面
            let node = cc.find(path);
            node.active = false;
        }
    }

    /**
     * 控制要顯示的畫面
     * @param mode 1:loading畫面, 2:大廳畫面, 3:遊戲畫面
     * @returns 
     */
    private controlUI(mode: number) {
        let loading = false;
        let lobby = false;
        let game = false;

        switch (mode) {
            case 1:
                loading = true;
                break;
            case 2:
                lobby = true;
                break;
            case 3:
                game = true;
                break;
        }

        {
            let path = 'Canvas/loading'; // loading畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }
            node.active = loading;
            if (loading) {
                cc.log('開啟 loading畫面');
            }
        }
        {
            let path = 'Canvas/lobby'; // 大廳畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }
            node.active = lobby;
            if (lobby) {
                cc.log('開啟大廳畫面');
            }
        }
        {
            let path = 'Canvas/game'; // game畫面
            let node = cc.find(path);
            if (!node) {
                let err = "error: node not found:" + path;
                cc.log(err);
                return false;
            }
            node.active = game;
            if (game) {
                cc.log('開啟遊戲畫面');
            }
        }
    }

    /**
     * 載入資源
     */
    private lodRes(): boolean {
        cc.log('載入遊戲資源');

        let path = 'Canvas/loading';
        let node = cc.find(path);
        if (!node) {
            let err = "error: node not found:" + path;
            cc.log(err);
            return false;
        }

        node.getComponent(LoadingComponent).Load();
        return;
    }

    /**
    * 讀取設定
    */
    private loadSetting(): boolean {
        cc.log('讀取遊戲設定');

        return SettingManager.load();
    }

    /**
    * 讀取設定
    */
    private initUser(): boolean {
        cc.log('初始化玩家錢包');

        let wellet = "1000";

        let result = User.operatorWallet(EWallet.Deposit, wellet);
        if (result.result != EWalletResultAction.Success) {
            cc.log('error: 玩家錢包初始化失敗, result:' + result.result.toString());
            return false;
        }

        result = User.operatorWallet(EWallet.Query, null);
        if (result.result != EWalletResultAction.Success) {
            cc.log('error: 玩家錢包初始化失敗, result:' + result.result.toString());
            return false;
        } else if (result.newValue != wellet) {
            cc.log('error: 玩家錢包初始化失敗, result:' + result.result.toString());
            return false;
        }

        return true;
    }

    private initVolume(): boolean { // 預設靜音
        AudioManager.setVolume(true, 0.0);
        AudioManager.setVolume(false, 0.0);
        return true;
    }
}
