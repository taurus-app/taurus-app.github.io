// register.js - Taurus register logic with contract interaction

document.addEventListener('DOMContentLoaded', async function () {
	await initializeWeb3AndContract();
	
	// 兼容新版MetaMask，确保window.web3被正确初始化
	if (window.ethereum && typeof window.Web3 !== 'undefined') {
		window.web3 = new Web3(window.ethereum);
	}

	const walletInput = document.getElementById('walletAddress');
	const inviterInput = document.getElementById('inviterId');
	const balanceSpan = document.getElementById('bnbBalance');
	const registerForm = document.querySelector('.register-form');
	const registerBtn = document.getElementById('registerBtn');

	// 注册所需BNB（可后续支持合约读取）
	// todo change register bnb
	const REGISTER_BNB = 0.001;

	// 检查URL参数，自动填充邀请人ID
	const urlParams = new URLSearchParams(window.location.search);
	const inviteValue = urlParams.get('invite');
	if (inviteValue) {
		inviterInput.value = inviteValue;
	}

	/**
	 * 格式化钱包地址，保留前6位和后4位，中间用...代替
	 * @param {string} address 钱包地址
	 * @returns {string} 格式化后的地址
	 */
	function formatAddress(address) {
		if (!address || address.length <= 10) return address;
		return address.slice(0, 28) + '...' + address.slice(-4);
	}

	// 统一通过auth.js的getCurrentAddress获取钱包地址
	async function updateWalletAddress() {
		if (window.getCurrentAddress) {
			const addr = await window.getCurrentAddress();
			walletInput.value = formatAddress(addr || '');
			if (addr) {
				getBNBBalance(addr, balanceSpan);
				if (window.checkMembershipStatus) {
					window.checkMembershipStatus(addr, 'register');
				}
			} else {
				balanceSpan.textContent = t('availableBalance') + ': 0.0 BNB';
			}
		}
	}
	await updateWalletAddress();

	// 监听钱包切换
	if (window.ethereum) {
		window.ethereum.on('accountsChanged', updateWalletAddress);
	}

	// 注册按钮事件
	let isSubmitting = false;
	registerForm.addEventListener('submit', async function (e) {
		e.preventDefault();
		if (isSubmitting) return;
		isSubmitting = true;
		registerBtn.disabled = true;
		registerBtn.textContent = 'Registering...';

		const inviter = inviterInput.value.trim();
		let inviterId = parseInt(inviter, 10);
		const address = await window.getCurrentAddress();

		if (!inviter || isNaN(inviterId) || inviterId <= 0) {
			showToast('Valid inviter ID is required.', 'error');
			inviterInput.focus();
			isSubmitting = false;
			registerBtn.disabled = false;
			registerBtn.textContent = 'Register';
			return;
		}
		if (!address) {
			showToast('Please connect your wallet.', 'error');
			isSubmitting = false;
			registerBtn.disabled = false;
			registerBtn.textContent = 'Register';
			return;
		}
		if (!window.taurusContract) {
			showToast('Contract not initialized.', 'error');
			isSubmitting = false;
			registerBtn.disabled = false;
			registerBtn.textContent = 'Register';
			return;
		}

		try {
			// 检查BNB余额
			const web3 = window.web3;
			const balanceWei = await web3.eth.getBalance(address);
			const balance = parseFloat(web3.utils.fromWei(balanceWei, 'ether'));
			if (balance < REGISTER_BNB) {
				showToast('Insufficient BNB balance.', 'error');
				isSubmitting = false;
				registerBtn.disabled = false;
				registerBtn.textContent = 'Register';
				return;
			}

			// 发起合约注册交易
			showToast('Waiting for wallet signature...', 'info');
			window.taurusContract.methods.register(inviterId).send({
				from: address,
				value: web3.utils.toWei(REGISTER_BNB.toString(), 'ether')
			})
			.on('transactionHash', hash => {
				showToast('Transaction sent, waiting for confirmation...', 'info');
				registerBtn.textContent = 'Pending...';
			})
			.on('receipt', receipt => {
				showToast('Registration successful!', 'success');
				registerBtn.textContent = 'Success!';
				setTimeout(() => {
					window.location.href = 'dashboard.html';
				}, 1200);
			})
			.on('error', error => {
				if (error && error.message && error.message.includes('User already exists')) {
					showToast('You are already registered.', 'error');
					setTimeout(() => {
						window.location.href = 'dashboard.html';
					}, 1200);
				} else if (error && error.code === 4001) {
					showToast('Transaction rejected by user.', 'error');
				} else {
					showToast('Registration failed: ' + (error && error.message ? error.message : 'Unknown error'), 'error');
				}
				isSubmitting = false;
				registerBtn.disabled = false;
				registerBtn.textContent = 'Register';
			});
		} catch (err) {
			showToast('Registration failed: ' + (err && err.message ? err.message : 'Unknown error'), 'error');
			isSubmitting = false;
			registerBtn.disabled = false;
			registerBtn.textContent = 'Register';
		}
	});
});

// 获取BNB余额
function getBNBBalance(address, balanceSpan) {
	if (window.ethereum && typeof window.Web3 !== 'undefined') {
		window.web3 = new Web3(window.ethereum);
	}
	if (!window.web3) return;
	window.web3.eth.getBalance(address)
		.then(balanceWei => {
			const balance = window.web3.utils.fromWei(balanceWei, 'ether');
			balanceSpan.textContent = t('availableBalance') + ': ' + parseFloat(balance).toFixed(4) + ' BNB';
		})
		.catch(() => {
			balanceSpan.textContent = t('availableBalance') + ': 0.0 BNB';
		});
}