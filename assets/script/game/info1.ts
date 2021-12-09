import { EAction as EAudioAction, AudioManager } from "../common/audio";

export class Info1 extends cc.Component {
    private page1Node: cc.Node;
    private page2Node: cc.Node;

    public onLoad() {
        this.page1Node = this.node.getChildByName("page1");
        this.page1Node.active = true;

        this.page2Node = this.node.getChildByName("page2");
        this.page2Node.active = false;

        this.page1Node.getChildByName("btn_skip").on(cc.Node.EventType.TOUCH_START, this.close, this);
        this.page1Node.getChildByName("btn_next").on(cc.Node.EventType.TOUCH_START, this.next, this);
        this.page2Node.getChildByName("btn_start").on(cc.Node.EventType.TOUCH_START, this.close, this);
    }

    public onDisable() {
        this.page1Node.getChildByName("btn_skip").off(cc.Node.EventType.TOUCH_START, this.close, this);
        this.page1Node.getChildByName("btn_next").off(cc.Node.EventType.TOUCH_START, this.next, this);
        this.page2Node.getChildByName("btn_start").off(cc.Node.EventType.TOUCH_START, this.close, this);
    }

    private next() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        this.page1Node.active = false;
        this.page2Node.active = true;
    }

    private close() {
        AudioManager.play(`UI_Menu_Click`, true, false);
        cc.tween(this.node).to(0.3, { opacity: 0 }).call(() => { this.node.active = false; }).start();
    }
}