let web3, factory, account;
        
        const factoryABI = [
            {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
            {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"tokenAddress","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"symbol","type":"string"},{"indexed":true,"internalType":"address","name":"creator","type":"address"}],"name":"TokenCreated","type":"event"},
            {"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"uint256","name":"_supply","type":"uint256"}],"name":"createToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"nonpayable","type":"function"},
            {"inputs":[],"name":"getTokenCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
            {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokens","outputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint256","name":"supply","type":"uint256"},{"internalType":"address","name":"creator","type":"address"},{"internalType":"uint256","name":"createdAt","type":"uint256"}],"stateMutability":"view","type":"function"}
        ];
        
        const factoryAddress = "0xe5bb8a0e5DdEacCa651F99d6e33C5034802484B6";
        
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
                const count = await factory.methods.getTokenCount().call();
                document.getElementById('tokenCount').innerHTML = count.toString();
                
                if (count == 0) {
                    document.getElementById('tokensList').innerHTML = '<div class="empty-state">✨ No tokens created yet. Create your first token above!</div>';
                    return;
                }
                
                let html = '';
                for (let i = 1; i <= count; i++) {
                    const token = await factory.methods.tokens(i).call();
                    const date = new Date(Number(token.createdAt) * 1000);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    
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
                                <span class="value">${token.creator.substring(0,10)}...${token.creator.substring(token.creator.length - 8)}</span>
                            </div>
                            <div class="token-detail">
                                <span class="label">Contract Address</span>
                                <span class="value">${token.tokenAddress.substring(0,10)}...${token.tokenAddress.substring(token.tokenAddress.length - 8)}</span>
                            </div>
                            <div class="token-detail">
                                <span class="label">Created</span>
                                <span class="value">${formattedDate}</span>
                            </div>
                        </div>
                    `;
                }
                document.getElementById('tokensList').innerHTML = html;
                
            } catch (error) {
                console.error(error);
                document.getElementById('tokensList').innerHTML = '<div class="empty-state">❌ Error loading tokens. Make sure you are connected to Sepolia network.</div>';
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