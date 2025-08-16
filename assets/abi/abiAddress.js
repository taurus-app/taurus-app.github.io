// Contract addresses configuration
// todo change contract address
const CONTRACT_ADDRESSES = {
    TAURUS: '0x3f448cbB3a5f99149B203A2eb4D298A02BE28A2E',
	NODE: '0x0B793b958a3634BBf543c29Db360C67478143c84'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT_ADDRESSES;
} else {
    window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
}
