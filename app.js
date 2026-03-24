let web3, factory, account;

const factoryABI = [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"symbol","type":"string"},{"indexed":true,"internalType":"address","name":"creator","type":"address"}],"name":"TokenCreated","type":"event"},
    {"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_supply","type":"uint256"}],"name":"createToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"getTokenCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllTokens","outputs":[{"components":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"supply","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"internalType":"struct TokenFactory.TokenInfo[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokens","outputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"supply","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Replace with your deployed contract address
const factoryAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

async function connectWallet() {
    if (!window.ethereum) {
        alert('Please install MetaMask!');
        window.open('https://metamask.io/download.html', '_blank');
        return;
    }
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        account = accounts[0];
        web3 = new Web3(window.ethereum);
        factory = new web3.eth.Contract(factoryABI, factoryAddress);
        
        document.getElementById('accountInfo').innerHTML = `🦊 Connected: ${account.substring(0,8)}...${account.substring(account.length - 6)}`;
        document.getElementById('accountInfo').style.display = 'inline-flex';
        document.getElementById('status').innerHTML = '✅ Connected to Token Factory';
        document.getElementById('status').className = 'status connected';
        document.getElementById('statusBadge').innerHTML = '✅ Active';
        
        await loadAllTokens();
        await updateStats();
        
        window.ethereum.on('accountsChanged', () => connectWallet());
        
    } catch (error) {
        console.error(error);
        document.getElementById('status').innerHTML = '❌ Connection failed: ' + error.message;
    }
}

async function updateStats() {
    if (!factory) return;
    try {
        const count = await factory.methods.getTokenCount().call();
        document.getElementById('tokenCount').innerHTML = count.toString();
    } catch(e) {}
}

async function createToken() {
    if (!factory || !account) {
        alert('Please connect first!');
        return;
    }
    
    const name = document.getElementById('tokenName').value;
    const symbol = document.getElementById('tokenSymbol').value;
    const supply = document.getElementById('tokenSupply').value;
    
    if (!name || !symbol || !supply) {
        alert('Please fill all fields');
        return;
    }
    
    if (supply <= 0) {
        alert('Supply must be greater than 0');
        return;
    }
    
    const createBtn = document.getElementById('createBtn');
    createBtn.disabled = true;
    createBtn.innerHTML = '⏳ Creating Token...';
    document.getElementById('status').innerHTML = '⏳ Creating token... Please wait.';
    document.getElementById('status').className = 'status loading';
    
    try {
        const receipt = await factory.methods.createToken(name, symbol, supply)
            .send({ from: account });
        
        document.getElementById('status').innerHTML = '✅ Token created successfully!';
        document.getElementById('status').className = 'status connected';
        document.getElementById('tokenName').value = '';
        document.getElementById('tokenSymbol').value = '';
        document.getElementById('tokenSupply').value = '';
        
        await loadAllTokens();
        await updateStats();
        
    } catch (error) {
        console.error(error);
        document.getElementById('status').innerHTML = '❌ Creation failed: ' + error.message;
        document.getElementById('status').className = 'status disconnected';
    } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = '🚀 Create Token';
    }
}

async function loadAllTokens() {
    if (!factory) return;
    
    try {
        const allTokens = await factory.methods.getAllTokens().call();
        const count = allTokens.length;
        document.getElementById('tokenCount').innerHTML = count.toString();
        
        if (count == 0) {
            document.getElementById('tokensList').innerHTML = '<div class="empty-state">✨ No tokens created yet. Create your first token above!</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < count; i++) {
            const token = allTokens[i];
            const date = new Date(Number(token.createdAt) * 1000);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            // Full addresses - not shortened
            const fullCreatorAddress = token.creator;
            const fullTokenAddress = token.tokenAddress;
            
            html += `
                <div class="token-card">
                    <div class="token-header">
                        <div class="token-icon">💰</div>
                        <div>
                            <div class="token-name">${escapeHtml(token.name)}</div>
                            <div class="token-symbol">${escapeHtml(token.symbol)}</div>
                        </div>
                    </div>
                    <div class="token-detail">
                        <span class="label">Supply</span>
                        <span class="value">${Number(token.supply).toLocaleString()} ${escapeHtml(token.symbol)}</span>
                    </div>
                    <div class="token-detail">
                        <span class="label">Creator</span>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span class="value" style="font-size: 12px; word-break: break-all;">${fullCreatorAddress}</span>
                            <button onclick="copyToClipboard('${fullCreatorAddress}')" class="copy-btn">📋 Copy</button>
                        </div>
                    </div>
                    <div class="token-detail">
                        <span class="label">Contract Address</span>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span class="value" style="font-size: 12px; word-break: break-all;">${fullTokenAddress}</span>
                            <button onclick="copyToClipboard('${fullTokenAddress}')" class="copy-btn">📋 Copy</button>
                        </div>
                    </div>
                    <div class="token-detail">
                        <span class="label">Created</span>
                        <span class="value">${formattedDate}</span>
                    </div>
                    <button onclick="addToMetaMask('${fullTokenAddress}', '${escapeHtml(token.symbol)}')" class="metamask-btn">🦊 Add to MetaMask</button>
                </div>
            `;
        }
        document.getElementById('tokensList').innerHTML = html;
        
    } catch (error) {
        console.error(error);
        document.getElementById('tokensList').innerHTML = '<div class="empty-state">❌ Error loading tokens. Make sure you are connected to Sepolia network.</div>';
    }
}

async function burnTokens() {
    if (!factory || !account) {
        alert('Please connect first!');
        return;
    }
    
    const tokenAddress = document.getElementById('burnTokenAddress').value;
    const amount = document.getElementById('burnAmount').value;
    
    if (!tokenAddress || !amount) {
        alert('Please enter token address and amount');
        return;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    const tokenABI = [
        {"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}
    ];
    
    const burnBtn = document.getElementById('burnBtn');
    burnBtn.disabled = true;
    burnBtn.innerHTML = '🔥 Burning...';
    document.getElementById('status').innerHTML = '⏳ Burning tokens...';
    document.getElementById('status').className = 'status loading';
    
    try {
        const token = new web3.eth.Contract(tokenABI, tokenAddress);
        const tokenOwner = await token.methods.owner().call();
        
        if (tokenOwner.toLowerCase() !== account.toLowerCase()) {
            alert('❌ Only the token creator can burn tokens!');
            throw new Error('Not token owner');
        }
        
        const amountWei = web3.utils.toWei(amount, 'ether');
        const symbol = await token.methods.symbol().call();
        
        await token.methods.burn(amountWei).send({ from: account });
        
        document.getElementById('status').innerHTML = `✅ Successfully burned ${amount} ${symbol} tokens!`;
        document.getElementById('status').className = 'status connected';
        document.getElementById('burnTokenAddress').value = '';
        document.getElementById('burnAmount').value = '';
        
        await loadAllTokens();
        
    } catch (error) {
        console.error(error);
        document.getElementById('status').innerHTML = '❌ Burn failed: ' + error.message;
        document.getElementById('status').className = 'status disconnected';
    } finally {
        burnBtn.disabled = false;
        burnBtn.innerHTML = '🔥 Burn Tokens';
    }
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = '✅ Address copied to clipboard!';
        statusDiv.className = 'status connected';
        setTimeout(() => {
            if (factory && account) {
                statusDiv.innerHTML = '✅ Connected to Token Factory';
            } else {
                statusDiv.innerHTML = '⚠️ Not Connected';
                statusDiv.className = 'status disconnected';
            }
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        document.getElementById('status').innerHTML = '❌ Failed to copy address';
    }
}

// Add token to MetaMask
async function addToMetaMask(tokenAddress, tokenSymbol) {
    if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
    }
    
    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: tokenAddress,
                    symbol: tokenSymbol,
                    decimals: 18,
                },
            },
        });
        
        if (wasAdded) {
            document.getElementById('status').innerHTML = `✅ ${tokenSymbol} added to MetaMask!`;
            document.getElementById('status').className = 'status connected';
            setTimeout(() => {
                if (factory && account) {
                    document.getElementById('status').innerHTML = '✅ Connected to Token Factory';
                }
            }, 3000);
        } else {
            document.getElementById('status').innerHTML = '❌ User rejected';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('status').innerHTML = '❌ Failed to add token to MetaMask';
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.onload = function() {
    console.log("🎨 Token Factory dApp loaded!");
};