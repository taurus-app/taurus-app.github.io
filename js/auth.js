// auth.js - BSC network & wallet auth (minimal)

const BSC_CHAIN_ID = '0x38'; // 56
// const BSC_CHAIN_ID = '0x89'; // 137

// Global Web3 and contract instances
let web3Instance = null;
let taurusContract = null;

// Initialize Web3 and contract
async function initializeWeb3AndContract(isReload = true) {
    try {
        if (isReload && typeof window.ethereum !== 'undefined') {
            // Use MetaMask or other wallet provider
            web3Instance = new Web3(window.ethereum);
        } else if (isReload && typeof window.web3 !== 'undefined') {
            // Legacy web3 provider
            web3Instance = new Web3(window.web3.currentProvider);
        } else {
            console.log(123);
            
            // Fallback to local provider (for development)
            
            // web3Instance = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org/'));
            web3Instance = new Web3(new Web3.providers.HttpProvider('https://rpc.ankr.com/bsc/2bd6c0010236463db32d50c26a7a5efb5cbcfcc799d5d7ea4b380a4d258d8e1a'));
        }

        // Load contract ABI
        const response = await fetch('assets/abi/tauruabi.json');
        const taurusABI = await response.json();

        // Initialize Taurus contract
        taurusContract = new web3Instance.eth.Contract(
            taurusABI,
            window.CONTRACT_ADDRESSES.TAURUS
        );

        // Mount to window for global access
        window.web3 = web3Instance;
        window.taurusContract = taurusContract;

        console.log('Web3 and Taurus contract initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Web3 and contract:', error);
        showToast('Failed to initialize blockchain connection', 'error');
        return false;
    }
}

// Get Web3 instance
function getWeb3() {
    return web3Instance;
}

// Get Taurus contract instance
function getTaurusContract() {
    return taurusContract;
}

// 切换到BSC主网
async function switchToBSC() {
    if (!window.ethereum) return false;

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_CHAIN_ID }],
        });
        return true;
    } catch (err) {
        showToast('Please switch to BSC Mainnet in your wallet.', 'error');
        return false;
    }
}

// 获取当前钱包地址
async function getCurrentAddress() {
    if (!window.ethereum) return '';
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts && accounts[0] ? accounts[0] : '';
        // 使用Web3.js的checksum功能标准化地址格式
        return address;
    } catch (err) {
        return '';
    }
}

// 页面加载时自动检测BSC链
async function ensureBSCNetwork() {
    if (!window.ethereum) return;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== BSC_CHAIN_ID) {
        await switchToBSC();
    }
}

// 监听链切换和账户切换事件，切换后reload，确保web3连接新链和新账户
if (window.ethereum) {
    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });
    window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload();
    });
}

// 简单Toast
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#F0B90B'};
        color: #fff;
        padding: 1rem 2rem;
        border-radius: 1rem;
        z-index: 9999;
        font-size: 1.1rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        opacity: 0.98;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2200);
}

// 页面加载时自动检测BSC
window.addEventListener('DOMContentLoaded', async () => {
    await ensureBSCNetwork();
    await initializeWeb3AndContract();
});

// 导出方法供其他文件使用
window.getCurrentAddress = getCurrentAddress;
window.ensureBSCNetwork = ensureBSCNetwork;
window.switchToBSC = switchToBSC;
window.showToast = showToast;
window.getWeb3 = getWeb3;
window.getTaurusContract = getTaurusContract;
window.initializeWeb3AndContract = initializeWeb3AndContract;

/**
 * 检查用户是否已注册为会员，并根据页面做跳转
 * @param {string} address 钱包地址
 * @param {string} currentPage 当前页面名（如 'register' 或 'dashboard'）
 */
async function checkMembershipStatus(address, currentPage) {
    console.log(address);
    
    try {
        if (!taurusContract || !address) {
            console.log('Contract not initialized or no address provided');
            return;
        }

        // Call contract to check registration status using getFullUser
        let userInfo = null;
        let isRegistered = false;
        try {
            userInfo = await taurusContract.methods.getFullUser(address).call();
            isRegistered = userInfo && userInfo.id && userInfo.id !== '0';
        } catch (err) {

            // If error message contains 'User does not exist', treat as not registered
            if (err && err.message && err.message.includes('User does not exist')) {
                isRegistered = false;
            } else {
                // Other errors, fallback to not registered
                console.error('Error checking membership status:', err);
                isRegistered = false;
            }
        }
        console.log(isRegistered);
        

        if (!isRegistered) {
            if (currentPage === 'register') {
                // 注册页未注册，什么都不做
                return;
            } else if (currentPage === 'dashboard' || currentPage === 'index') {
                // 仪表盘页或首页未注册，跳转到注册页
                window.location.href = 'register.html';
            }
        } else {
            if (currentPage === 'register' || currentPage === 'index') {
                // 注册页已注册，跳转到仪表盘页
                window.location.href = 'dashboard.html';
            } else if (currentPage === 'dashboard') {
                // 仪表盘页或首页已注册，什么都不做
                return;
            }
        }
    } catch (error) {
        console.error('Error checking membership status:', error);
        // Fallback to default behavior
        if (currentPage === 'register') {
            return;
        } else if (currentPage === 'dashboard' || currentPage === 'index') {
            window.location.href = 'register.html';
        }
    }
}

window.checkMembershipStatus = checkMembershipStatus; 