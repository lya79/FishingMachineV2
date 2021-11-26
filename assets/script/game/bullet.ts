import { ESkill, Tower } from "../common/setting";

// FIXME 子彈prefab最上層因為沒有設定長寬, 所以無法設定錨點, 導致子彈碰撞牆壁的時候會超過牆壁

export class Bullet extends cc.Component {
    private bulletNode: cc.Node;
    private netNode: cc.Node;

    private roomLevel: number;
    private tower: Tower;
    private location: cc.Vec2;
    private rotate: number;

    // 子彈座標
    private x: number;
    private y: number;

    // 子彈偏移座標
    private dx: number;
    private dy: number;

    // 子彈每次移動多少距離
    private speed: number;

    // 碰撞區域多大
    private bgWidth: number;
    private bgHeight: number;

    // 開始更新子彈位置
    private running: boolean;

    private fpsOfXY: number; // 每幾偵偏移一次子彈座標
    private fpsOfCanvas: number;// 每幾偵偏更新一次子彈的node座標
    private timerOfFps: number; // 計時器
    private timerOfSleep: number; // 計時器

    public init(
        roomLevel: number,
        tower: Tower,
        location: cc.Vec2,
        rotataion: number,
    ) {
        this.roomLevel = roomLevel;
        this.tower = tower;
        this.location = location;
        this.rotate = rotataion;

        this.running = false;
        this.bgWidth = 472;
        this.bgHeight = 840;
        this.speed = 5;
        this.fpsOfXY = 1;
        this.fpsOfCanvas = 1;
        this.timerOfFps = 0;
        this.timerOfSleep = 0;

        this.dx = Math.sin((this.rotate * Math.PI) / 180) * this.speed;
        this.dy = Math.cos((this.rotate * Math.PI) / 180) * this.speed;

        for (let i = 1; i <= 4; i++) {
            let bulletNode = this.node.getChildByName(`bullet_${i}`);
            let netNode = this.node.getChildByName(`net_${i}`);

            let active = (this.tower.getLevel() == i);
            bulletNode.active = active;
            netNode.active = false;

            if (active) {
                this.bulletNode = bulletNode;
                this.netNode = netNode;
            }
        }

        const offsetOfStartPos = 78;

        let dx = Math.sin((this.rotate * Math.PI) / 180) * offsetOfStartPos;
        let dy = Math.cos((this.rotate * Math.PI) / 180) * offsetOfStartPos;

        let startX = this.location.x + dx;
        let startY = this.location.y + dy;

        this.x = startX;
        this.y = startY;

        this.node.setPosition(startX, startY);
        this.node.rotation = this.rotate;

        this.running = true;
    }

    public attack() { // TODO 播放子彈碰撞的音效
        if (!this.running) {
            return;
        }

        this.running = false;

        this.bulletNode.active = false;
        this.netNode.active = true;

        let self = this;
        cc.tween(this.netNode)
            .to(0.8, { scale: 1.1 }, { easing: 'bounceOut' })
            .call(() => { self.netNode.active = false; })
            .call(() => { self.node.destroy(); })
            .start();
    }

    public getTower(): Tower {
        return this.tower;
    }

    public update(dt) {
        if (!this.running) {
            return;
        }

        this.updateXY(dt);
        this.updateNodeXY(dt);
    }

    private updateNodeXY(dt) {// 更新子彈顯示位置
        {// 計時
            this.timerOfFps += 1;
            if (this.timerOfFps < this.fpsOfCanvas) {
                return;
            }
            this.timerOfFps = 0;
        }

        this.node.setPosition(this.x, this.y);
    }

    private updateXY(dt) {// 更新子彈的 x、y座標
        {// 計時
            this.timerOfSleep += 1;
            if (this.timerOfSleep < this.fpsOfXY) {
                return;
            }
            this.timerOfSleep = 0;
        }

        let width = this.bgWidth / 2;
        let height = this.bgHeight / 2;
        let collision = false // 是否碰撞邊界

        { // 檢查邊界碰撞
            if (this.x >= width || this.x <= -width) {
                this.dx = -this.dx
                collision = true;
            }

            if (this.y >= height || this.y <= -height) {
                this.dy = -this.dy;
                collision = true;
            }
        }

        if (collision) { // 發生邊界碰撞時將子彈轉向
            let angle; // 預計旋轉的角度
            let pointA = { X: this.x, Y: this.y }; // 子彈位置
            let pointB = { X: this.x + this.dx, Y: this.y + this.dy }; // 下一個子彈位置
            let pointC = { X: this.x, Y: this.y + this.dy }; // 基準點

            if (pointA.X == pointC.X && pointA.Y == pointC.Y) {// 水平翻轉
                angle = this.rotate + 180;
            } else if (pointB.X == pointC.X && pointB.Y == pointC.Y) { // 垂直翻轉
                angle = this.rotate + 180;
            } else {
                angle = this.getAngle(pointA, pointB, pointC);
                if (this.x + this.dx < this.x) {
                    angle *= -1;
                }

                if (pointA.Y > pointC.Y) {
                    if (angle < 0) {
                        angle = -180 - angle;
                    } else if (angle > 0) {
                        angle = 180 - angle;
                    }
                }
            }

            this.rotate = angle;
            this.node.rotation = this.rotate;
        }

        { // 移動子彈
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    private getAngle(A, B, C) {
        var AB = Math.sqrt(Math.pow(A.X - B.X, 2) + Math.pow(A.Y - B.Y, 2));
        var AC = Math.sqrt(Math.pow(A.X - C.X, 2) + Math.pow(A.Y - C.Y, 2));
        var BC = Math.sqrt(Math.pow(B.X - C.X, 2) + Math.pow(B.Y - C.Y, 2));
        var cosA = (
            Math.pow(AB, 2) + Math.pow(AC, 2) - Math.pow(BC, 2)
        ) / (
                2 * AB * AC
            );
        var angleA = Math.round(Math.acos(cosA) * 180 / Math.PI);
        return angleA;
    }
}