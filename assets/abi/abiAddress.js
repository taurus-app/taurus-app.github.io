// Contract addresses configuration
// todo change contract address
const CONTRACT_ADDRESSES = {
    TAURUS: '0x5BE1115E443D961aa668Da028345FeFDe9Aa96B8'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT_ADDRESSES;
} else {
    window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
}
