import { EWallet, EWalletResultAction, User } from "../common/user";
import { SettingManager, FishPath } from "../common/setting";

export class Fish extends cc.Component {
    private positionTween: cc.Tween<unknown>;

    private fishPath: FishPath;

    /** 魚位移的最後一個位置 */
    private lastX: number;
    private lastY: number;

    public init(fishPath: FishPath) {
        this.fishPath = fishPath;

        let pathArr = fishPath.getPath();

        this.positionTween = cc.tween(this.node);

        for (let i = 0; i < pathArr.length; i++) { // 動畫串接
            let path = pathArr[i];
            let x = path.x;
            let y = path.y;

            let delay = fishPath.getSpeedOfPoint()[i];
            let speed = fishPath.getSpeedOfObj()[i];

            if (i == 0 || (i == pathArr.length - 1)) { // 確保起始和結束的位置要在畫面之外
                if (x < 0) {
                    x -= this.node.width;
                } else {
                    x += this.node.width;
                }

                if (y < 0) {
                    y -= this.node.height;
                } else {
                    y += this.node.height;
                }

                if (i == 0) {
                    this.node.setPosition(x, y); // 起點位置
                    this.positionTween.then(cc.tween().call(() => {
                        var anim = this.node.getComponent(cc.Animation);
                        anim.getAnimationState(this.node.name).speed = speed;
                    }));
                    this.positionTween.then(cc.tween().delay(delay)); // 稍微停止一下才開始
                    continue;
                }
            }

            this.positionTween.then(cc.tween().call(() => {
                var anim = this.node.getComponent(cc.Animation);
                anim.getAnimationState(this.node.name).speed = speed;
            }));
            this.positionTween.then(cc.tween().to(delay, { position: new cc.Vec2(x, y) }));

            if (i == pathArr.length - 1) {
                let self = this;
                this.positionTween.then(cc.tween().delay(2)); // 稍微停止一下確保東西都處理完
                this.positionTween.then(cc.tween().call(() => { self.node.destroy(); }));

                this.lastX = x;
                this.lastY = y;
            }
        }
    }

    public onLoad() {

    }

    public onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchHandler, this);
        // this.node.on(cc.Node.EventType.POSITION_CHANGED, this.positionHandler, this);
    }

    public onDisable() {
        // this.node.off(cc.Node.EventType.POSITION_CHANGED, this.positionHandler, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchHandler, this);
        this.node.destroy();
    }

    private touchHandler(event) {
        User.setFocusUUID(this.node.uuid);
    }

    // private positionHandler() {
    // cc.log("positionHandler: " + this.node.name);
    // }

    public startFish() {
        this.positionTween.start();
    }

    /** 加速離開畫面 */
    public clearFish() {
        this.positionTween.stop();// 停止原先的位移動作

        /**
         * 假設需要移動的最長距離為 875.6(對角)
         * 並且需要再 2s完成
         * 因此可以換算出每一個位置偏移需要耗費 0.00228414801=2/875.6
         */
        let currentPosition = this.node.getPosition();
        let lastPosition = new cc.Vec2(this.lastX, this.lastY)
        let distance = this.getDistance(currentPosition, lastPosition); //目前差還多少距離到達邊界
        let delay = distance * 0.00228414801;
        let speed = 2;

        let self = this;
        let tween = cc.tween(this.node);
        tween.then(cc.tween().call(() => {
            var anim = this.node.getComponent(cc.Animation);
            anim.getAnimationState(this.node.name).speed *= speed;
        }));
        tween.then(cc.tween().to(delay, { position: lastPosition })); // 1.5s離開畫面
        tween.then(cc.tween().delay(2)); // 稍微停止一下確保東西都處理完
        tween.then(cc.tween().call(() => { self.node.destroy(); }));
        tween.start();
    }

    private getDistance(a: cc.Vec2, b: cc.Vec2): number {
        let x = a.x - b.x;
        let y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
    }
}