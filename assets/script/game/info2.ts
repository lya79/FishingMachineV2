import { EAction as EAudioAction, AudioManager } from "../common/audio";
import { ResourcesManager } from "../common/resource";

export class Info2 extends cc.Component {
    private page1Node: cc.Node;
    private page2Node: cc.Node;
    private page3Node: cc.Node;

    private dot1Node: cc.Node;
    private dot2Node: cc.Node;
    private dot3Node: cc.Node;

    private closeNode: cc.Node;
    private prevNode: cc.Node;
    private nextNode: cc.Node;

    private currentPage: number;

    public onLoad() {
        let pageNode = this.node.getChildByName("page");
        this.page1Node = pageNode.getChildByName("page1");
        this.page2Node = pageNode.getChildByName("page2");
        this.page3Node = pageNode.getChildByName("page3");

        let dotNode = this.node.getChildByName("dot");
        this.dot1Node = dotNode.getChildByName("page1");
        this.dot2Node = dotNode.getChildByName("page2");
        this.dot3Node = dotNode.getChildByName("page3");

        let btnNode = this.node.getChildByName("btn");
        this.closeNode = btnNode.getChildByName("btn_close");
        this.prevNode = btnNode.getChildByName("btn_left");
        this.nextNode = btnNode.getChildByName("btn_right");
    }

    public onEnable() {
        this.closeNode.on(cc.Node.EventType.TOUCH_START, this.close, this);
        this.prevNode.on(cc.Node.EventType.TOUCH_START, this.prev, this);
        this.nextNode.on(cc.Node.EventType.TOUCH_START, this.next, this);
        this.dot1Node.on(cc.Node.EventType.TOUCH_START, this.dotHandler, this);
        this.dot2Node.on(cc.Node.EventType.TOUCH_START, this.dotHandler, this);
        this.dot3Node.on(cc.Node.EventType.TOUCH_START, this.dotHandler, this);

        this.currentPage = 1;
        this.updateUI();

        this.node.opacity = 255;
    }

    public onDisable() {
        this.closeNode.off(cc.Node.EventType.TOUCH_START, this.close, this);
        this.prevNode.off(cc.Node.EventType.TOUCH_START, this.prev, this);
        this.nextNode.off(cc.Node.EventType.TOUCH_START, this.next, this);
        this.dot1Node.off(cc.Node.EventType.TOUCH_START, this.dotHandler, this);
        this.dot2Node.off(cc.Node.EventType.TOUCH_START, this.dotHandler, this);
        this.dot3Node.off(cc.Node.EventType.TOUCH_START, this.dotHandler, this);
    }

    private dotHandler(event: cc.Event) {
        switch (event.getCurrentTarget().name) {
            case "page1":
                this.currentPage = 1;
                break;
            case "page2":
                this.currentPage = 2;
                break;
            case "page3":
                this.currentPage = 3;
                break;
        }
        this.updateUI();
    }

    private close() {
        AudioManager.play(`UI_Menu_Click`, true, false);

        let self = this;
        cc.tween(this.node)
            .to(0.3, { opacity: 0 })
            .call(() => { self.node.active = false; })
            .start();
    }

    private prev() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.currentPage -= 1;
        if (this.currentPage < 1) {
            this.currentPage = 3;
        }
        this.updateUI();
    }

    private next() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.currentPage += 1;
        if (this.currentPage > 3) {
            this.currentPage = 1;
        }
        this.updateUI();
    }

    private updateUI() {
        this.page1Node.active = false;
        this.page2Node.active = false;
        this.page3Node.active = false;


        let altas = ResourcesManager.spriteAtlasMap.get('SS_Symbol_Atlas_06');
        let disable = altas.getSpriteFrame("ic_dot_disabled");
        let enable = altas.getSpriteFrame("ic_dot_enabled");

        this.page1Node.active = this.currentPage == 1;
        this.dot1Node.getComponent(cc.Sprite).spriteFrame = (this.currentPage == 1 ? enable : disable);

        this.page2Node.active = this.currentPage == 2;
        this.dot2Node.getComponent(cc.Sprite).spriteFrame = (this.currentPage == 2 ? enable : disable);

        this.page3Node.active = this.currentPage == 3;
        this.dot3Node.getComponent(cc.Sprite).spriteFrame = (this.currentPage == 3 ? enable : disable);
    }
}