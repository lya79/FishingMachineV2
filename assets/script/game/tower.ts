import { ResourcesManager } from "../common/resource";
import { EAction as EAudioAction, AudioManager } from "../common/audio";

export class Tower extends cc.Component {
    private towerNode: cc.Node;
    private fireNode: cc.Node;

    private shotAudioName: string;

    public init() {
    }

    public onLoad() {
        this.towerNode = this.node.getChildByName("tower");
        if (!this.towerNode) {
            cc.log('error: towerNode is null');
            return;
        }

        this.fireNode = this.node.getChildByName("fire");
        if (!this.fireNode) {
            cc.log('error: fireNode is null');
            return;
        }
    }

    public onEnable() {
        // let self = this;
        // this.schedule(function (dt) {
        //     self.fire();
        // }, 0.05);
    }

    public onDisable() {

    }

    /**
     * 射擊的動畫, 每一次射擊都要觸發一次
     */
    public getFireNode(): cc.Node {
        return this.fireNode;
    }

    public getAudioOfFire(): string {
        return this.shotAudioName;
    }

    /**
     * 設定砲塔等級
     * 
     * @param level 數值範圍: 1-4
     */
    public setLevel(level: number) {
        cc.log("砲塔等級:" + level);

        if (level > 4 || level < 1) {
            cc.log("error: 砲塔等級:" + level);
            return;
        }

        { // 替換砲塔圖片
            let name = 'img_cannon_barrel_lv' + `${level}`;
            if (level == 4) {
                name = 'img_cannon_barrel_lvMax';
            }
            let spriteFrame = (ResourcesManager.spriteAtlasMap.get('SS_Symbol_Atlas_01')).getSpriteFrame(name);
            this.towerNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }

        { // 替換套砲塔的火花圖片
            let name = 'img_cannon_fx_lv' + `${level}` + "_";
            let spriteFrame = (ResourcesManager.spriteAtlasMap.get('SS_Symbol_Atlas_01')).getSpriteFrame(name);
            this.fireNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }


        /**
         * 受到圖片大小影響
         * 因此需要修改 fireNode的位置
         */
        switch (level) {
            case 1:
                this.fireNode.y = 93;
                break;
            case 2:
                this.fireNode.y = 105;
                break;
            case 3:
                this.fireNode.y = 103;
                break;
            case 4:
                this.fireNode.y = 105;
                break;
            default:
                break;
        }

        if (level == 4) {
            this.shotAudioName = "UI_ShotMax";
        } else {
            this.shotAudioName = "UI_Shot";
        }
    }
}