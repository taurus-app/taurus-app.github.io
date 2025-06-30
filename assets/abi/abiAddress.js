// Contract addresses configuration
// todo change contract address
const CONTRACT_ADDRESSES = {
    TAURUS: '0x0877b9f51fd24a1D4f117EB910cF5b7180E1Dafd'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT_ADDRESSES;
} else {
    window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
}
