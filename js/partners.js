document.addEventListener('DOMContentLoaded', async function() {
    // 获取钱包地址
    let address = '';
    if (window.getCurrentAddress) {
        address = await window.getCurrentAddress();
    }
	await initializeWeb3AndContract();
    // 调用auth判断会员状态
    if (window.checkMembershipStatus && address) {
        window.checkMembershipStatus(address, 'partners');
    }

    // 链上获取新伙伴数据
    let partnerCount = '--';
    let newPartners = [];
    try {
        if (window.taurusContract && address) {
            console.log('开始获取合作伙伴数据，当前地址:', address);

            const info = await window.taurusContract.methods.getFullUser(address).call();
            partnerCount = info.invitedCount || 0;

            // 通过事件日志获取邀请的用户
            const partnerAddresses = await getPartnersByEvent(address);
            
            console.log('获取到的合作伙伴数量:', partnerCount);
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
        window.showToast && window.showToast(t('partners.noData'), 'error');
    }

    document.getElementById('partnerCount').innerHTML = `${t('partners.myPartners')}: <span style="font-weight: bold;">${partnerCount}</span>`;
    renderPartnerList(newPartners);
	// 在数据填充后调用
	setTimeout(() => {
		showDashboardContent();
	}, 500);

    document.getElementById('backBtn').onclick = function() {
        window.location.href = 'dashboard.html';
    };
});

// 通过事件日志获取合作伙伴地址
async function getPartnersByEvent(inviterAddress) {
    try {
        console.log('getPartnersByEvent', inviterAddress);
        // 加载合约ABI
        const response = await fetch('assets/abi/tauruabi.json');
        const taurusABI = await response.json();

        const web3 = new Web3("https://rpc.ankr.com/bsc/2bd6c0010236463db32d50c26a7a5efb5cbcfcc799d5d7ea4b380a4d258d8e1a");
        const taurusContract = new web3.eth.Contract(
            taurusABI,
            window.CONTRACT_ADDRESSES.TAURUS
        );
        // 获取当前区块号
        const currentBlock = await web3.eth.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 200000);
        
        console.log('查询区块范围:', { fromBlock, toBlock: 'latest', currentBlock });
        
        // 查询Registered事件，筛选inviter为当前地址
        const events = await taurusContract.getPastEvents('Registered', {
            filter: { inviter: inviterAddress },
            fromBlock: fromBlock,
            toBlock: 'latest'
        });
        
        console.log('查询到的事件总数:', events.length,inviterAddress);
        console.log('事件详情:', events);
        
        // 提取user地址并去重
        const addresses = events.map(event => event.returnValues.user);
        const uniqueAddresses = [...new Set(addresses)];
        
        console.log('提取的地址:', addresses);
        console.log('去重后的地址:', uniqueAddresses);
        
        return uniqueAddresses;
    } catch (error) {
        console.error('Error fetching partners by event:', error);
        return [];
    }
}

function renderPartnerList(partners) {
    const list = document.getElementById('partnerList');
    list.innerHTML = '';
    if (!partners || partners.length === 0) {
        // 无数据展示
        list.innerHTML = `<div class="no-partner-data">${t('partners.noData')}</div>`;
        return;
    }
    partners.forEach(p => {
        const card = document.createElement('div');
        card.className = 'partner-card';
        card.innerHTML = `
            <div class="partner-card-header">
                <span class="partner-card-id">ID: <span style="color:#F0B90B">${p.id}</span></span>
                <span class="partner-card-vip">T${p.vip}</span>
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
