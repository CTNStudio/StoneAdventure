import { world, system } from "@minecraft/server";

const totemId = "stonecraft:ancient_stone_totem";
const lowhealthGrouop = "stonecraft:change_mode"; // 二阶段组件
const entityStateMap = new Map();

function getEntityState(entity) {
    const id = entity.id;

    if (!entityStateMap.has(id)) {
        entityStateMap.set(id, {
            isTransforming: false,        // 正在触发二阶段转换，期间免疫伤害
            hasEnteredSecondPhase: false, // 已完成二阶段转换
            intervalId: null              // 转换回血定时器
        });
    }

    return entityStateMap.get(id);
}

function clearEntityTimer(entity) {
    const state = getEntityState(entity);

    if (state.intervalId !== null) {
        system.clearRun(state.intervalId);
        state.intervalId = null;
    }
}

function normalRegeneration(entity) {
    if (!entity || !entity.isValid) {
        return;
    }

    const state = getEntityState(entity);

    // 转换中或已经二阶段，不进行常态回血
    if (state.isTransforming || state.hasEnteredSecondPhase) {
        return;
    }

    const health = entity.getComponent("minecraft:health");

    if (!health) {
        return;
    }

    const currentHealth = health.currentValue;
    const maxHealth = health.effectiveMax;

    // 满血不处理
    if (currentHealth >= maxHealth) {
        return;
    }

    try {
        // 常态生命恢复 I
        // 每次恢复 1 点生命值
        health.setCurrentValue(
            Math.min(maxHealth, currentHealth + 1)
        );
    } catch (error) {
        console.error(
            "[ancient_stone_totem] normal regeneration failed",
            error
        );
    }
}

world.beforeEvents.entityHurt.subscribe((event) => {

    const target = event.hurtEntity;

    if (!target || target.typeId !== totemId) {
        return;
    }

    const totemHealth = target.getComponent("minecraft:health");

    if (!totemHealth) {
        return;
    }

    const state = getEntityState(target);

    const currentHealth = totemHealth.currentValue;
    const maxHealth = totemHealth.effectiveMax;

    // 正在二阶段转换：完全锁血
    if (state.isTransforming) {
        event.cancel = true;
        return;
    }

    // 已经进入二阶段：不拦截任何伤害

    if (state.hasEnteredSecondPhase) {
        return;
    }
    
    // 常态：确保进行生命恢复
    if (currentHealth < maxHealth) {
        system.run(() => normalRegeneration(target));
    }

    // 满足条件时取消本次伤害并触发转换

    if (currentHealth < 20) {
        event.cancel = true;
        triggerSecondPhase(target, state);
        return;
    }

    // 如果是致命伤害但血量仍高于阈值
    if (currentHealth <= event.damage) {
        event.cancel = true;
        triggerSecondPhase(target, state);
        return;
    }
});

// 二阶段转换
function triggerSecondPhase(entity, state) {

    if (
        state.isTransforming ||
        state.hasEnteredSecondPhase
    ) {
        return;
    }

    state.isTransforming = true;

    system.run(() => {
        if (!entity || !entity.isValid) return;

        try {
            const oldRegen = entity.getEffect("regeneration");
            if (oldRegen) entity.removeEffect("regeneration");

            entity.addEffect("regeneration", 999999, {
                amplifier: 5,
                showParticles: false
            });

            entity.triggerEvent("stonecraft:enter_second_phase");
            entity.runCommand("summon stonecraft:fanglimao ~ ~ ~");

        } catch (error) {
            console.error("[ancient_stone_totem] failed to start regeneration or add component groups", error);
        }
    });

    // 防止重复创建定时器
    clearEntityTimer(entity);

    const intervalId = system.runInterval(() => {

        if (!entity || !entity.isValid) {
            clearEntityTimer(entity);
            return;
        }

        const healthComp = entity.getComponent("minecraft:health");

        if (!healthComp) {
            clearEntityTimer(entity);
            return;
        }

        const current = healthComp.currentValue;
        const max = healthComp.effectiveMax;

        // 尚未满血
        if (current < max) {
            try {
                healthComp.setCurrentValue(Math.min(max, current + 20));
            } catch (error) {
                console.error("[ancient_stone_totem] failed to restore health", error);

                try {
                    healthComp.resetToMaxValue();
                } catch (fallbackError) {
                    console.error("[ancient_stone_totem] failed to reset health", fallbackError);
                }
            }

            return;
        }

        // 已经满血，完成转换
        // 移除超高再生
        const regen = entity.getEffect("regeneration");

        if (regen) {
            entity.removeEffect("regeneration");
        }

        // 标记状态
        state.isTransforming = false;
        state.hasEnteredSecondPhase = true;

        clearEntityTimer(entity);

    }, 1);

    state.intervalId = intervalId;
}

// 实体生成 / 重新加载后的状态维护

world.afterEvents.entitySpawn.subscribe(({ entity }) => {

    if (!entity || entity.typeId !== totemId) {
        return;
    }

    system.run(() => {

        if (!entity.isValid) {
            return;
        }

        const state = getEntityState(entity);

        if (
            !state.isTransforming &&
            !state.hasEnteredSecondPhase
        ) {
            normalRegeneration(entity);
        }

    });
});

// 自动回血维护
// 每 20 tick（1 秒）恢复 1 点生命值
system.runInterval(() => {
    for (const dimensionId of ["overworld", "nether", "the_end"]) {
        try {
            const dimension = world.getDimension(dimensionId);
            for (const entity of dimension.getEntities({ type: totemId })) {
                if (!entity || !entity.isValid) {
                    continue;
                }
                const state = getEntityState(entity);
                // 二阶段转换过程中：由 triggerSecondPhase() 自己负责快速回血
                if (state.isTransforming) {
                    continue;
                }
                const health = entity.getComponent("minecraft:health");
                if (!health) {
                    continue;
                }
                const currentHealth = health.currentValue;
                const maxHealth = health.effectiveMax;
                // 已经满血
                if (currentHealth >= maxHealth) {
                    continue;
                }
                //恢复 1 点生命值
                try {
                    health.setCurrentValue(
                        Math.min(maxHealth, currentHealth + 1)
                    );
                } catch (error) {
                    console.error(
                        "[ancient_stone_totem] automatic regeneration failed",
                        error
                    );
                }
            }
        } catch (error) {
            console.error(
                `[ancient_stone_totem] automatic regeneration check failed in ${dimensionId}`,
                error
            );
        }
    }

}, 20); // 每秒恢复 1 点生命值