
export class Bullet0402 extends cc.Component {
    private bet: number = 0;

    public init(bet: number) {
        this.bet = bet;
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

    public getBet(): number {
        return this.bet;
    }
}