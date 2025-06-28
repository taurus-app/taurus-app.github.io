function getQueryParam(name) {
	const url = new URL(window.location.href);
	return url.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', async function () {
	await initializeWeb3AndContract(false);
	// 获取钱包地址
	let address = '';
	if (window.getCurrentAddress) {
		address = await window.getCurrentAddress();
	}
	// 调用auth判断会员状态
	if (window.checkMembershipStatus && address) {
		window.checkMembershipStatus(address, 'slot-history');
	}

	

	// 获取VIP等级参数
	const vipParam = getQueryParam('vip');
	let vipLevel = vipParam ? parseInt(vipParam) : 1;

	// 获取用户ID
	let userId = null;
	try {
		if (window.taurusContract && address) {
			const info = await window.taurusContract.methods.getFullUser(address).call();
			userId = info.id;
		}
	} catch (e) { }

	// 查询历史奖励事件
	let slotHistoryRows = [];
	let cycle = 1;
	 // Load contract ABI
        const response = await fetch('assets/abi/tauruabi.json');
        const taurusABI = await response.json();
	try {
		if (window.taurusContract && userId) {
			// const web3 = window.web3;
			const web3 = new Web3("https://rpc.ankr.com/bsc/2bd6c0010236463db32d50c26a7a5efb5cbcfcc799d5d7ea4b380a4d258d8e1a"); 
			let taurusContract = new web3.eth.Contract(
				taurusABI,
				window.CONTRACT_ADDRESSES.TAURUS
			);
			const latestBlock = await web3.eth.getBlockNumber();
			const fromBlock = Math.max(0, latestBlock - 5000);
			const step = 5001;

			for (let start = fromBlock; start <= latestBlock; start += step) {
				const end = Math.min(start + step - 1, latestBlock);
				// 查询Notify事件（可根据合约实际事件名调整）
				const events = await taurusContract.getPastEvents('Notify', {
					filter: {
						fromUserId: userId
					},
					fromBlock: start,
					toBlock: end
				});
				console.log(events);
				
				// 解析事件数据，按每3个一行分组
				let row = [];
				for (let i = 0; i < events.length; i++) {
					const ev = events[i];
					row.push({ type: (i % 3 === 2 ? 'cycle' : 'normal'), id: ev.returnValues.toUserId });
					if (row.length === 3) {
						slotHistoryRows.push(row);
						row = [];
					}
				}
				if (row.length > 0) slotHistoryRows.push(row);
				cycle = slotHistoryRows.length;
			}
		}
	} catch (e) {
		console.log(e);
		
		window.showToast && window.showToast('Failed to load slot history', 'error');
	}

	document.getElementById('slotHistoryVip').textContent = `VIP${vipLevel}`;
	document.getElementById('slotHistoryAmount').textContent = `${window.getVipAmount ? window.getVipAmount(vipLevel) : ''}BNB`;
	document.getElementById('slotHistoryCycle').textContent = cycle;

	renderSlotHistoryTable(slotHistoryRows);

	document.getElementById('backBtn').onclick = function () {
		window.location.href = 'dashboard.html';
	};
});

function renderSlotHistoryTable(rows) {
	const table = document.getElementById('slotHistoryTable');
	table.innerHTML = '';
	if (!rows || rows.length === 0) {
		table.innerHTML = '<div class="no-partner-data">No slot history found.</div>';
		return;
	}
	rows.forEach(row => {
		const rowDiv = document.createElement('div');
		rowDiv.className = 'slot-history-row';
		rowDiv.innerHTML = row.map(slot => {
			if (slot.type === 'cycle') {
				return `<div class="slot-history-cycle-col"><div class="slot-history-cycle-icon">&#x21bb;</div><div class="slot-history-cycle-num">${slot.id}</div></div>`;
			} else {
				return `<div class="slot-history-slot">${slot.id}</div>`;
			}
		}).join('');
		table.appendChild(rowDiv);
	});
} 