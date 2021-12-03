import { SettingManager, FishPath, Collision as CollisionObj, ESkill, Tower } from "../common/setting";

export class Bullet0402 extends cc.Component {
    private tower: Tower;

    public init(tower: Tower) {
        this.tower = tower;
    }

    // public onCollisionEnter(fishCollider: cc.Collider, bullethCollider: cc.Collider) {
    // tmpCollisionFishArr.push(fishCollider.node);
    // }

    // public onCollisionStay(fishCollider: cc.Collider, bullethCollider: cc.Collider) {
    //     cc.log("onCollisionStay fish: " + fishCollider.node.name);
    // }

    // public onCollisionExit(fishCollider: cc.Collider, bullethCollider: cc.Collider) {
    //     cc.log("onCollisionExit fish: " + fishCollider.node.name);
    // }

    // public getBet(): number {
    //     return this.bet;
    // }

    public getTower(): Tower {
        return this.tower;
    }
}