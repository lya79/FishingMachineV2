import { EWallet, EWalletResultAction, User } from "../common/user";
import { SettingManager, FishPath } from "../common/setting";

export class Fish extends cc.Component {
    private positionTween: cc.Tween<unknown>;

    private fishPath: FishPath;

    public init(fishPath: FishPath) {
        this.fishPath = fishPath;

        var anim = this.node.getComponent(cc.Animation);
        anim.getAnimationState(this.node.name).speed = fishPath.getSpeed();

        let path = fishPath.getPath();

        this.positionTween = cc.tween(this.node);

        for (let i = 0; i < path.length; i++) { // 動畫串接
            let x = path[i].x;
            let y = path[i].y;

            let delay = fishPath.getSpeedOfPoint()[i];

            if (i == 0 || (i == path.length - 1)) { // 確保起始和結束的位置要在畫面之外
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
                    this.positionTween.then(cc.tween().delay(delay)); // 稍微停止一下才開始
                    continue;
                }
            }

            this.positionTween.then(cc.tween().to(delay, { position: new cc.Vec2(x, y) }));

            if (i == path.length - 1) {
                let self = this;
                this.positionTween.then(cc.tween().delay(2)); // 稍微停止一下確保東西都處理完
                this.positionTween.then(cc.tween().call(() => { self.node.destroy(); }));
            }
        }
    }

    public onLoad() {

    }

    public onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchHandler, this);
        this.node.on(cc.Node.EventType.POSITION_CHANGED, this.positionHandler, this);
    }

    public onDisable() {
        this.node.off(cc.Node.EventType.POSITION_CHANGED, this.positionHandler, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchHandler, this);
    }

    private touchHandler(event) {
        // cc.log("touchHandler: " + this.node.name + ", " + event.getType() + ", x:" + this.node.x + ", y:" + this.node.y);
    }

    private positionHandler() {
        // cc.log("positionHandler: " + this.node.name);
    }

    public startFish() {
        this.positionTween.start();
    }

    /** 加速離開畫面 */
    public clearFish() {
        this.positionTween.stop();// 停止原先的位移動作

        // 加速離開畫面
        let self = this;
        let path = this.fishPath.getPath();
        let lastPath = path[path.length - 1];
        let clearTween = cc.tween(this.node);
        clearTween.then(cc.tween().to(1.5, { position: new cc.Vec2(lastPath.x, lastPath.y) })); // 1.5s離開畫面
        clearTween.then(cc.tween().delay(2)); // 稍微停止一下確保東西都處理完
        clearTween.then(cc.tween().call(() => { self.node.destroy(); }));
        clearTween.start();

        var anim = this.node.getComponent(cc.Animation);
        anim.getAnimationState(this.node.name).speed += 2; // 自身的動畫速度加快
    }
}