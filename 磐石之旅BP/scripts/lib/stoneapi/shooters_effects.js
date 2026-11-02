import { world } from '@minecraft/server';

const rules = new Set();
let subscription;

const onHit = (event) => {
    try {
        const target = event.getEntityHit?.()?.entity;
        if (!target?.isValid) return;

        // 箭矢命中后可能立刻被移除：projectile 可能已失效，取 owner 前必须先判 isValid
        let owner = event.source;
        if (!owner?.isValid) {
            const projectile = event.projectile;
            owner = projectile?.isValid
                ? projectile.getComponent('minecraft:projectile')?.owner
                : undefined;
        }
        if (!owner?.isValid) return;

        for (const rule of rules) {
            if (owner.typeId !== rule.attackerTypeId) continue;
            if (!target.isValid) return; // 循环期间目标可能已死
            target.addEffect(rule.effectId, rule.duration, {
                amplifier: rule.amplifier,
                showParticles: rule.showParticles
            });
        }
    } catch {
    }
};
 /**
     * @param {object} options
     * @param {string} options.attackerTypeId 发射者实体 ID（如 'stonecraft:sandstone_shooter'）
     * @param {string} options.effectId       要添加的效果 ID（如 'minecraft:hunger'）
     * @param {number} options.duration       效果时长，单位：刻（20 刻 = 1 秒）
     * @param {number} [options.amplifier=0]  效果强度（0 = I 级，1 = II 级……）
     * @param {boolean} [options.showParticles=true] 是否显示效果粒子
*/
export class ShootersEffects {
    #rule;

    constructor({ attackerTypeId, effectId, duration, amplifier = 0, showParticles = true }) {
        this.#rule = { attackerTypeId, effectId, duration, amplifier, showParticles };
    }

    start() {
        rules.add(this.#rule);
        subscription ??= world.afterEvents.projectileHitEntity.subscribe(onHit);
        return this;
    }

    stop() {
        rules.delete(this.#rule);
        if (rules.size === 0 && subscription) {
            subscription.unsubscribe();
            subscription = undefined;
        }
        return this;
    }
}