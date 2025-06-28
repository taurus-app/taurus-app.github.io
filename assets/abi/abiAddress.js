// Contract addresses configuration
const CONTRACT_ADDRESSES = {
    TAURUS: '0x5F89F8AD74DBfB9bf35284e17AFe45eeb30c4c8e'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT_ADDRESSES;
} else {
    window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
}
