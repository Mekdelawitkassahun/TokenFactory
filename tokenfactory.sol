// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

contract CustomToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(string memory _name, string memory _symbol, uint256 _supply, address _owner) {
        name = _name;
        symbol = _symbol;
        totalSupply = _supply * 10 ** decimals;
        owner = _owner;
        balanceOf[_owner] = totalSupply;
        emit Transfer(address(0), _owner, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    function burn(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Transfer(msg.sender, address(0), _amount);
    }
}

contract TokenFactory {
    address public owner;
    uint256 public tokenCount;
    
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint256 supply;
        address creator;
        uint256 createdAt;
    }
    
    mapping(uint256 => TokenInfo) public tokens;
    mapping(address => uint256[]) public userTokens;
    
    event TokenCreated(uint256 indexed tokenId, address indexed tokenAddress, string name, string symbol, address indexed creator);
    
    constructor() {
        owner = msg.sender;
    }
    
    function createToken(string memory _name, string memory _symbol, uint256 _supply) public returns (address) {
        require(_supply > 0, "Supply > 0");
        
        CustomToken newToken = new CustomToken(_name, _symbol, _supply, msg.sender);
        address tokenAddress = address(newToken);
        
        tokenCount++;
        tokens[tokenCount] = TokenInfo({
            tokenAddress: tokenAddress,
            name: _name,
            symbol: _symbol,
            supply: _supply,
            creator: msg.sender,
            createdAt: block.timestamp
        });
        
        userTokens[msg.sender].push(tokenCount);
        
        emit TokenCreated(tokenCount, tokenAddress, _name, _symbol, msg.sender);
        
        return tokenAddress;
    }
    
    function getTokenCount() public view returns (uint256) {
        return tokenCount;
    }
    
    function getUserTokens(address _user) public view returns (uint256[] memory) {
        return userTokens[_user];
    }
    
    function getAllTokens() public view returns (TokenInfo[] memory) {
        TokenInfo[] memory allTokens = new TokenInfo[](tokenCount);
        for (uint256 i = 1; i <= tokenCount; i++) {
            allTokens[i-1] = tokens[i];
        }
        return allTokens;
    }
}