// T等级与升级所需BNB数量映射
const vipLevelAmountMap = {
    1: 0.1,
    2: 0.2,
    3: 0.4,
    4: 0.8,
    5: 1.6,
    6: 3.2,
    7: 6.4,
    8: 12.8,
    9: 25.6
};

/**
 * 通过T等级获取所需BNB数量
 * @param {number} vipLevel
 * @returns {number} BNB数量
 */
function getVipAmount(vipLevel) {
    return vipLevel && vipLevelAmountMap[vipLevel] ? vipLevelAmountMap[vipLevel] : 0;
}

// 导出方法
window.getVipAmount = getVipAmount; 