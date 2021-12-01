import { ESkill, Tower } from "../common/setting";
import { ResourcesManager } from "../common/resource";
import { SettingManager, FishPath } from "../common/setting";
import { Bullet } from "./bullet"
import { Fish } from "./fish";
import { EAction as EAudioAction, AudioManager } from "../common/audio";
import { Mul, getRandomFloat, getRandomInt } from "../common/common";

export class Background extends cc.Component { // XXX 背景隨機位置會出現冒泡
    private bg1Node: cc.Node;
    private bg2Node: cc.Node;
    private bg3Node: cc.Node;

    private noticeNode: cc.Node;

    private bubbleNode: cc.Node;

    private startFishHandler: Function;
    private clearFishHandler: Function;

    public init(startFishHandler: Function, clearFishHandler: Function) {
        this.startFishHandler = startFishHandler;
        if (!this.startFishHandler) {
            cc.log('error: startFishHandler is null');
            return;
        }

        this.clearFishHandler = clearFishHandler;
        if (!this.clearFishHandler) {
            cc.log('error: clearFishHandler is null');
            return;
        }
    }

    public onLoad() {
        this.bg1Node = this.node.getChildByName("bg1");
        if (!this.bg1Node) {
            cc.log('error: bg1Node is null');
            return;
        }

        this.bg2Node = this.node.getChildByName("bg2");
        if (!this.bg2Node) {
            cc.log('error: bg2Node is null');
            return;
        }

        this.bg3Node = this.node.getChildByName("bg3");
        if (!this.bg3Node) {
            cc.log('error: bg3Node is null');
            return;
        }

        this.noticeNode = this.node.getChildByName("notice");
        if (!this.noticeNode) {
            cc.log('error: noticeNode is null');
            return;
        }
    }

    public onEnable() {
        this.bubbleNode = new cc.Node("bubble");
        this.bubbleNode.setPosition(0, 0);
        this.node.addChild(this.bubbleNode);
    }

    public onDisable() {
        this.node.cleanup();
        this.bubbleNode.destroy();
    }

    public changeStageHandler(oldStage: number, newStage: number) {
        if (oldStage == 0) {
            AudioManager.operator(EAudioAction.Stop, true);
            AudioManager.operator(EAudioAction.Stop, false);

            AudioManager.play(this.bgMusic(newStage), false, true);

            this.bg1Node.setPosition(0, 0);

            this.bg1Node.active = true;
            this.bg2Node.active = false;
            this.bg3Node.active = false;
            this.noticeNode.active = false;

            // 開始顯示關卡的魚
            this.startFishHandler();

            return;
        }

        let currentBgNode: cc.Node;
        let nextBgNode: cc.Node;

        if (oldStage == 1 && newStage == 2) {
            currentBgNode = this.bg1Node;
            nextBgNode = this.bg2Node;
            this.bg3Node.active = false;
        } else if (oldStage == 2 && newStage == 3) {
            currentBgNode = this.bg2Node;
            nextBgNode = this.bg3Node;
            this.bg1Node.active = false;
        } else if (oldStage == 3 && newStage == 1) {
            currentBgNode = this.bg3Node;
            nextBgNode = this.bg1Node;
            this.bg2Node.active = false;
        }

        let currentBgTween: cc.Tween<unknown>;
        let nextBgTween: cc.Tween<unknown>;
        { // 將下一個要顯示的背景位移到目前背景的正下方
            nextBgNode.setPosition(0, -nextBgNode.height);
            nextBgNode.active = true;

            currentBgTween = cc.tween(currentBgNode)
                .to(1.5, { position: new cc.Vec2(0, currentBgNode.height) });

            nextBgTween = cc.tween(nextBgNode)
                .to(1.5, { position: new cc.Vec2(0, 0) });
        }


        let bubbleTweenArray: cc.Tween<unknown>[];
        {// 顯示泡泡的 tween
            bubbleTweenArray = [];
            let name = "img_db_glass";

            let bubbleMax = 150; // 泡泡預計顆數

            for (let i = 0; i < bubbleMax; i++) {
                let node = new cc.Node("bubble");
                var sprite = node.addComponent(cc.Sprite);
                sprite.spriteFrame = (ResourcesManager.spriteAtlasMap.get('SS_Symbol_Atlas_03')).getSpriteFrame(name);

                let spriteHeight = sprite.spriteFrame.getRect().height;
                let startOpacity = getRandomInt(200, 255);
                let startScale = getRandomFloat(0.1, 1);
                let startX = getRandomInt(-150, 150);
                let startY = -(this.node.height / 2) - (startScale * (spriteHeight / 2));
                startY = getRandomFloat(startY - 400, startY);

                node.setPosition(startX, startY);
                node.opacity = startOpacity;
                node.scale = startScale;

                let targetRotation = getRandomInt(0, 360);
                let targetOpacity = startOpacity - 50;
                let targetScale = getRandomFloat(startScale, startScale + 0.3);
                let speed = getRandomFloat(1.5, 2.0);
                let targetX = getRandomInt(-350, 350);
                let targetY = (this.node.height / 2) + (targetScale * (spriteHeight / 2));
                targetY = getRandomInt(targetY, targetY + 400);

                this.bubbleNode.addChild(node);

                let tween = cc.tween(node)
                    .to(speed, { position: new cc.Vec2(targetX, targetY), opacity: targetOpacity, scale: targetScale, rotation: targetRotation })
                    .call(() => {
                        node.destroy();
                    });
                bubbleTweenArray.push(tween);
            }
        }

        let stageNoticTween: cc.Tween<unknown>;
        if (newStage != 1) { // 需要額外顯示關卡名稱
            this.noticeNode.setPosition(0, 600);
            this.noticeNode.active = true;
            this.noticeNode.getChildByName("level_2").active = (newStage == 2 ? true : false);
            this.noticeNode.getChildByName("level_3").active = (newStage == 3 ? true : false);
            this.noticeNode.opacity = 255;

            stageNoticTween = cc.tween(this.noticeNode)
                .to(1.5, { position: new cc.Vec2(0, 0) })
                .delay(1.5)
                .to(0.7, { opacity: 0 });
        }

        let delay1 = 2.5;
        let delay2 = 2.5;
        if (stageNoticTween) {
            delay2 = 4;
        }

        let self = this;
        cc.tween(this)
            .call(() => {
                AudioManager.operator(EAudioAction.Stop, true);
                AudioManager.operator(EAudioAction.Stop, false);

                AudioManager.play(`UI_Roulette`, true, false); // 2.22秒

                // 要求全部的魚在 2.22秒內全部加速離開畫面
                self.clearFishHandler();
            })
            .delay(delay1)
            .call(() => {
                if (bubbleTweenArray) {
                    AudioManager.play(`UI_Bubble`, true, false); // 1.933秒
                }
                if (currentBgTween) {
                    currentBgTween.start();
                }
                if (nextBgTween) {
                    nextBgTween.start();
                }
                if (stageNoticTween) {
                    stageNoticTween.start();
                }
                if (bubbleTweenArray) {
                    for (let i = 0; i < bubbleTweenArray.length; i++) {
                        bubbleTweenArray[i].start();
                    }
                }
            })
            .delay(delay2)
            .call(() => {
                AudioManager.play(this.bgMusic(newStage), false, true);

                // 開始顯示關卡的魚
                self.startFishHandler();
            })
            .start();
    }

    private bgMusic(stage: number): string {
        switch (stage) {
            case 1:
                return `BG_Leave_01`;
            case 2:
                return `BG_Leave_02`;
            case 3:
                return `BG_Leave_03`;
            default:
                cc.log("error: 無效的遊戲關卡:" + stage);
                return `BG_Leave_01`;
        }
    }
}