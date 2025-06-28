# Taurus 业务合约API（前端用）

## 1. 注册/升级相关

### register(uint256 inviterId) payable
- 用途：注册新用户，传入邀请人ID，需支付BNB。
- 用法：注册页发起注册时调用。

### investLevel(uint8 level) payable
- 用途：升级到指定VIP等级，需支付对应BNB。
- 用法：首页Upgrade按钮发起升级时调用。

### getFullUser(address userAddress) view returns (
  uint256 id,
  address inviter,
  uint256 inviterId,
  uint8 currentLevel,
  bool isBlocked,
  uint256 invitedCount,
  address[3] invitedUsers,
  uint256[][2] slots
)
- 用途：获取用户完整信息（ID、邀请人、当前VIP等级、伙伴、插槽等）。
- 用法：首页、插槽历史、伙伴页加载用户数据时调用。

### getUserSlot(uint256 userId, uint8 level) view returns (uint256 point1, uint256 point2)
- 用途：获取指定用户在某VIP等级下的插槽信息。
- 用法：插槽历史、首页插槽展示。

### getUserById(uint256 id) view returns (address)
- 用途：通过用户ID查找钱包地址。
- 用法：伙伴展示、邀请链等。

## 2. 统计/辅助

### userCount() view returns (uint256)
- 用途：平台总注册用户数。
- 用法：统计展示。

### totalRegistered() view returns (uint256)
- 用途：平台累计注册数。
- 用法：统计展示。

## 3. 只读配置

### owner() view returns (address)
- 用途：合约拥有者。

### niuToken() view returns (address)
- 用途：业务Token地址。

### router() view returns (address)
- 用途：Pancake路由合约地址。

## 4. 其他（如需后台管理/特殊功能时用）

- registerAddressByOwner(address useraddress, uint256 inviterId, uint8 level) payable
- setAddressLevelByOwner(address useraddress, uint8 level) payable
- setDevAddress(address _dev)
- setMaxDepth(uint8 _depth)
- setNiuToken(address _token)
- setRouter(address _router)
- setSlippage(uint256 _slippage)
- withdraw()

> 说明：以上为合约全部方法，前端主要用1-3节的方法即可，4为管理/特殊用途。
