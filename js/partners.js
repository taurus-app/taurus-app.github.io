document.addEventListener('DOMContentLoaded', async function() {
    // 获取钱包地址
    let address = '';
    if (window.getCurrentAddress) {
        address = await window.getCurrentAddress();
    }
    // 调用auth判断会员状态
    if (window.checkMembershipStatus && address) {
        window.checkMembershipStatus(address, 'partners');
    }

    await initializeWeb3AndContract();

    // 链上获取新伙伴数据
    let partnerCount = '--';
    let newPartners = [];
    try {
        if (window.taurusContract && address) {
            const info = await window.taurusContract.methods.getFullUser(address).call();
            partnerCount = info.invitedCount || 0;
            // invitedUsers: address[3]
            const partnerAddresses = (info.invitedUsers || []).filter(addr => addr && addr !== '0x0000000000000000000000000000000000000000');
            // 并发获取详细信息
            newPartners = await Promise.all(partnerAddresses.map(async (addr) => {
                try {
                    const pInfo = await window.taurusContract.methods.getFullUser(addr).call();
                    return {
                        id: pInfo.id || '--',
                        vip: pInfo.currentLevel || '--',
                        address: addr
                    };
                } catch (e) {
                    return {
                        id: '--',
                        vip: '--',
                        address: addr
                    };
                }
            }));
        }
    } catch (err) {
        window.showToast && window.showToast('Failed to load partners', 'error');
    }

    document.getElementById('partnerCount').innerHTML = `My Partners: <span style="font-weight: bold;">${partnerCount}</span>`;
    renderPartnerList(newPartners);

    document.getElementById('backBtn').onclick = function() {
        window.location.href = 'dashboard.html';
    };
});

function renderPartnerList(partners) {
    const list = document.getElementById('partnerList');
    list.innerHTML = '';
    if (!partners || partners.length === 0) {
        // 无数据展示
        list.innerHTML = `<div class="no-partner-data">No new partners yet.</div>`;
        return;
    }
    partners.forEach(p => {
        const card = document.createElement('div');
        card.className = 'partner-card';
        card.innerHTML = `
            <div class="partner-card-header">
                <span class="partner-card-id">ID: <span style="color:#F0B90B">${p.id}</span></span>
                <span class="partner-card-vip">VIP${p.vip}</span>
            </div>
            <div class="partner-card-address">${formatAddress(p.address)}</div>
        `;
        list.appendChild(card);
    });
}

function formatAddress(address) {
    if (!address || address.length < 10) return address;
    return address.slice(0, 28) + '...' + address.slice(-4);
} 