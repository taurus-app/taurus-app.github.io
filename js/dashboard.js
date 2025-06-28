let userData = {
	userId: '--',
	vipLevel: '--',
	inviterId: '--',
	partnerCount: '--',
	inviteLink: '',
	slots: [] // 这里后续可链上获取
};

document.addEventListener('DOMContentLoaded', async function () {
	// 1. 获取钱包地址
	let address = '';
	if (window.getCurrentAddress) {
		address = await window.getCurrentAddress();
		
		document.getElementById('walletAddress').value = formatAddress(address);
	}

	// 2. 调用auth判断会员状态
	if (window.checkMembershipStatus && address) {
		await window.checkMembershipStatus(address, 'dashboard');
	}

	// 3. 链上获取用户数据
	await initializeWeb3AndContract();

	try {
		if (window.taurusContract && address) {
			const info = await window.taurusContract.methods.getFullUser(address).call();
			userData.userId = info.id || '--';
			userData.vipLevel = parseInt(info.currentLevel) || 0;
			userData.inviterId = info.inviterId || '--';
			userData.partnerCount = info.invitedCount || '--';
			userData.inviteLink = `https://taurus-dex.github.io/register?invite=${userData.userId}`;
			// 查询插槽奖励（仅与VIP等级匹配的）
			userData.slots = await getUserSlots(userData.userId, userData.vipLevel);
		}
	} catch (err) {
		window.showToast && window.showToast('Failed to load user info', 'error');
	}

	// 4. 填充数据
	document.getElementById('userId').textContent = userData.userId;
	document.getElementById('vipLevel').textContent = 'VIP' + userData.vipLevel;
	document.getElementById('inviterId').textContent = userData.inviterId;
	document.getElementById('partnerCount').innerHTML = `My Partners: <span style="font-weight: bold;">${userData.partnerCount}</span>`;
	document.getElementById('inviteLink').textContent = userData.inviteLink;

	// 5. 渲染插槽
	renderSlots(userData.slots);

	// 6. 复制邀请链接
	document.getElementById('copyInviteBtn').onclick = function () {
		navigator.clipboard.writeText(userData.inviteLink);
		if (window.showToast) window.showToast('Invite link copied!', 'success');
	};

	// 7. Details按钮跳转到我的伙伴页面
	document.getElementById('detailsBtn').onclick = function () {
		window.location.href = 'partners.html';
	};

	// 8. Slot View按钮跳转到slot-history.html
	const slots = userData.slots;
	document.querySelectorAll('.slot-view-btn').forEach(function (btn, idx) {
		btn.onclick = function () {
			// 获取当前slot的VIP等级
			const slotLevel = slots[idx].level;
			window.location.href = `slot-history.html?vip=${slotLevel}`;
		};
	});
});

// 查询用户所有VIP等级的插槽奖励
async function getUserSlots(userId, vipLevel) {
	if (!window.taurusContract || !userId || !vipLevel) return [];
	const slots = [];
	try {
		for (let level = 1; level <= vipLevel; level++) {
			try {
				const slotData = await window.taurusContract.methods.getUserSlot(userId, level).call();
				// 过滤掉值为0的数据
				const slotArr = [];
				if (slotData.point1 && slotData.point1 !== '0' && slotData.point1 !== 0) {
					slotArr.push({ type: 'direct', id: slotData.point1 });
				}
				if (slotData.point2 && slotData.point2 !== '0' && slotData.point2 !== 0) {
					slotArr.push({ type: 'indirect', id: slotData.point2 });
				}
				// 保证有3个插槽，空位补empty
				while (slotArr.length < 3) {
					slotArr.push({ type: 'empty' });
				}
				slots.push({
					level,
					amount: window.getVipAmount ? window.getVipAmount(level) : '',
					unit: 'BNB',
					slots: slotArr
				});
			} catch (e) {
				// 某一级异常，跳过
				slots.push({
					level,
					amount: window.getVipAmount ? window.getVipAmount(level) : '',
					unit: 'BNB',
					slots: [{}, {}, {}]
				});
			}
		}
	} catch (err) {
		// 全局异常
	}
	return slots;
}

function formatAddress(address) {
	if (!address || address.length <= 10) return address;
	return address.slice(0, 24) + '...' + address.slice(-4);
}

function renderSlots(slots) {
	const slotList = document.getElementById('slotList');
	slotList.innerHTML = '';
	// 获取当前VIP等级
	const currentVip = Number(userData.vipLevel);
	
	// 渲染1~9级
	for (let level = 1; level <= 9; level++) {
		const slot = slots.find(s => s.level === level) || { level, amount: '', unit: 'BNB', slots: [{}, {}, {}] };
		const isLocked = level > currentVip;
		const showUpgrade = level === currentVip + 1;
		const slotDiv = document.createElement('div');
		slotDiv.className = 'slot-group' + (isLocked ? ' card-disabled' : '');
		slotDiv.innerHTML = `
            <div class="slot-header">
                <span class="slot-level">VIP${level}</span>
                <span class="slot-amount">${window.getVipAmount ? window.getVipAmount(level) : ''}BNB</span>
                ${!isLocked ? `<button class="slot-view-btn" data-level="${level}">View</button>` : (showUpgrade ? `<button class="slot-view-btn upgrade-btn" data-level="${level}">Upgrade</button>` : '')}
            </div>
            <div class="slot-circles">
                ${slot.slots.map((s, idx) => {
			let dotClass = 'slot-dot';
			if (isLocked) dotClass += ' disabled';
			else if (s.type === 'empty') dotClass += ' empty';
			else if (idx === 2) dotClass += ' indirect';
			else dotClass += ' direct';
			return `<span class="${dotClass}">${s.id ? s.id : ''}</span>`;
		}).join('')}
            </div>
            <div class="slot-divider"></div>
        `;
		slotList.appendChild(slotDiv);
	}
	setTimeout(() => {
		// 按钮事件
		document.querySelectorAll('.slot-view-btn').forEach(function (btn) {
			if (btn.classList.contains('upgrade-btn')) {
				let isUpgrading = false;
				btn.onclick = async function () {
					if (isUpgrading) return;
					isUpgrading = true;
					btn.disabled = true;
					btn.textContent = 'Upgrading...';
					const level = parseInt(btn.getAttribute('data-level'));
					if (!window.getVipAmount) {
						window.showToast && window.showToast('Upgrade amount not set', 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
						return;
					}
					const need = window.getVipAmount(level);
					let address = '';
					if (window.getCurrentAddress) {
						address = await window.getCurrentAddress();
					}
					if (!address) {
						window.showToast && window.showToast('Please connect your wallet.', 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
						return;
					}
					if (!window.taurusContract) {
						window.showToast && window.showToast('Contract not initialized.', 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
						return;
					}
					// 检查BNB余额
					let balance = 0;
					try {
						if (window.Web3) {
							const web3 = new window.Web3(window.ethereum);
							const accounts = await web3.eth.getAccounts();
							balance = parseFloat(web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether'));
						}
					} catch (e) {
						window.showToast && window.showToast('Failed to get balance', 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
						return;
					}
					if (balance < need) {
						window.showToast && window.showToast('Insufficient balance', 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
						return;
					}
					// 发起合约升级交易
					try {
						window.showToast && window.showToast('Waiting for wallet signature...', 'info');
						btn.textContent = 'Upgrading...';
						window.taurusContract.methods.investLevel(level).send({
							from: address,
							value: window.web3.utils.toWei(need.toString(), 'ether')
						})
						.on('transactionHash', hash => {
							window.showToast && window.showToast('Transaction sent, waiting for confirmation...', 'info');
							btn.textContent = 'Pending...';
						})
						.on('receipt', receipt => {
							window.showToast && window.showToast('Upgrade successful!', 'success');
							btn.textContent = 'Success!';
							setTimeout(() => window.location.reload(), 1200);
						})
						.on('error', error => {
							if (error && error.code === 4001) {
								window.showToast && window.showToast('Transaction rejected by user.', 'error');
							} else {
								window.showToast && window.showToast('Upgrade failed: ' + (error && error.message ? error.message : 'Unknown error'), 'error');
							}
							isUpgrading = false;
							btn.disabled = false;
							btn.textContent = 'Upgrade';
						});
					} catch (err) {
						window.showToast && window.showToast('Upgrade failed: ' + (err && err.message ? err.message : 'Unknown error'), 'error');
						isUpgrading = false;
						btn.disabled = false;
						btn.textContent = 'Upgrade';
					}
				};
				return;
			} else {
				btn.onclick = function () {
					const level = btn.getAttribute('data-level');
					window.location.href = `slot-history.html?vip=${level}`;
				};
			}
		});
		document.querySelectorAll('.upgrade-btn').forEach(function (btn) {
			// 已合并到上面
		});
	}, 500);
} 