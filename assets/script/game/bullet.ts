import { ESkill, Skill, Tower } from "../common/setting";

type handler = (other: cc.Collider, self: cc.Collider) => void;

class BulletCollision extends cc.Component {
    private handler: handler;

    public init(handler: handler) {
        this.handler = handler;
    }

    public onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (this.handler) {
            this.handler(other, self);
        }
    }
}

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

    // 計時器
    private timerOfFps: number;
    private timerOfSleep: number;

    // 開始更新子彈位置
    private running: boolean;

    private fpsOfXY: number; // 多久更新一次子彈實際的 x、y座標
    private fpsOfCanvas: number;// 多久刷一次子彈顯示位置, 16ms = 60fps, 33ms = 30fps

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
        this.speed = 20;// XXX 
        this.bgWidth = 472;
        this.bgHeight = 840;
        this.fpsOfXY = 1;
        this.fpsOfCanvas = 1;
        this.timerOfFps = 0;
        this.timerOfSleep = 0;
        this.timerOfFps = 0; // 初始化計時器
        this.timerOfSleep = 0; // 初始化計時器

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

        let self = this;

        let obj = this.bulletNode.addComponent(BulletCollision);
        obj.init(function (fish: cc.Collider, bullet: cc.Collider) {
            if (!self.running) {
                return;
            }

            // cc.log("onCollisionEnter: bullet:" + bullet.name + " fish:" + fish.name);

            self.running = false;
            self.bulletNode.active = false;
            self.netNode.active = true;

            cc.tween(fish.node) // XXX 效果不太好看起來顏色太深, 考慮用遮罩方式處理
                .call(() => { fish.node.color = new cc.Color(255, 0, 0); })
                .delay(0.8)
                .call(() => { fish.node.color = new cc.Color(255, 255, 255); })
                .start();

            cc.tween(self.netNode)
                .to(0.8, { scale: 1.1 }, { easing: 'bounceOut' })
                .call(() => { self.netNode.active = false })
                .start();
        });
    }

    public startBullet() {
        if (this.running) {
            return;
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

    public cancelBullet() {
    }

    public update(dt) {// XXX 要確認應該用 update(dt)還是 schedule
        if (!this.running) {
            return;
        }

        this.draw(dt);
        this.updateXY(dt);
    }

    private draw(dt) {// 更新子彈顯示位置
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

            if (this.rotate % 180 == 0) {
                if (pointA.Y > pointB.Y) {
                    angle = 180;
                } else if (pointA.Y < pointB.Y) {
                    angle = 0;
                }
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
        // console.log(angleA)
        return angleA;
    }
}