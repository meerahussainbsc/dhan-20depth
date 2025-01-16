class MarketDepthWebSocket {
    constructor() {
        this.token = null;
        this.clientId = null;
        this.ws = null;
        this.depthData = {
            bids: [],
            offers: []
        };
        this.pingTimeout = null;
        this.initialize();
    }

    async initialize() {
        try {
            const response = await fetch('/config');
            const credentials = await response.json();
            
            this.token = credentials.token;
            this.clientId = credentials.clientId;
            
            this.connect();
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    connect() {
        if (!this.token || !this.clientId) {
            console.error('Missing credentials');
            return;
        }

        this.ws = new WebSocket(`wss://depth-api-feed.dhan.co/twentydepth?token=${this.token}&clientId=${this.clientId}&authType=2`);
        
        this.ws.onopen = () => {
            console.log('WebSocket Connected');
            this.subscribe();
            this.startPingTimeout();
        };
        
        this.ws.onmessage = (event) => {
            // Reset ping timeout on any message
            this.startPingTimeout();
            
            if (event.data instanceof Blob) {
                this.handleBinaryMessage(event.data);
            } else {
                console.log('Received text message:', event.data);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
        
        this.ws.onclose = (event) => {
            console.log('WebSocket Disconnected, Code:', event.code);
            this.clearPingTimeout();
            
            // Handle specific disconnect codes
            if (event.code === 805) {
                console.warn('More than 5 WebSocket connections established. Oldest connection disconnected.');
            }
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connect(), 5000);
        };
    }

    startPingTimeout() {
        // Clear existing timeout
        this.clearPingTimeout();
        
        // Set new timeout for 40 seconds (server sends ping every 10s)
        this.pingTimeout = setTimeout(() => {
            console.warn('No response from server for 40 seconds, closing connection');
            this.ws.close();
        }, 40000);
    }

    clearPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
    }

    subscribe() {
        const subscribeMessage = {
            "RequestCode": 23,  // Subscribe to 20-Level Market Depth
            "InstrumentCount": 1,
            "InstrumentList": [
                {
                    "ExchangeSegment": "NSE_EQ",
                    "SecurityId": "2885",
                    "BidAskBoth": true,  // Request both bid and ask data
                    "Mode": "20DEPTH"  // Explicitly request 20-depth mode
                }
            ]
        };
        
        if (this.ws.readyState === WebSocket.OPEN) {
            // First disconnect any existing subscriptions
            const disconnectMessage = {
                "RequestCode": 12  // Disconnect code
            };
            console.log('Sending disconnect:', disconnectMessage);
            this.ws.send(JSON.stringify(disconnectMessage));

            // Wait a bit then subscribe
            setTimeout(() => {
                console.log('Sending market depth subscription:', subscribeMessage);
                this.ws.send(JSON.stringify(subscribeMessage));
                console.log('Market depth subscription sent');
            }, 1000);
        }
    }

    async handleBinaryMessage(blob) {
        try {
            const buffer = await blob.arrayBuffer();
            const dataView = new DataView(buffer);
            
            // Process first packet (0-332 bytes)
            this.processDepthPacket(dataView, 0);
            
            // Process second packet (332-664 bytes)
            if (buffer.byteLength >= 664) {
                this.processDepthPacket(dataView, 332);
            }
            
            // Update UI after processing both packets
            this.updateUI();
        } catch (error) {
            console.error('Error processing binary message:', error);
            console.error('Stack:', error.stack);
            if (blob) {
                console.error('Blob size:', blob.size);
            }
        }
    }

    processDepthPacket(dataView, startOffset) {
        // Parse Response Header (12 bytes)
        const msgLength = dataView.getInt16(startOffset + 0, true); // Message Length (2 bytes)
        const feedCode = dataView.getUint8(startOffset + 2); // Feed Response Code (1 byte)
        const exchangeSegment = dataView.getUint8(startOffset + 3); // Exchange Segment (1 byte)
        const securityId = dataView.getInt32(startOffset + 4, true); // Security ID (4 bytes)
        const messageSeq = dataView.getUint32(startOffset + 8, true); // Message Sequence (4 bytes)

        console.log('Processing Depth Packet:', {
            offset: startOffset,
            msgLength,
            feedCode,
            exchangeSegment,
            securityId,
            messageSeq,
            packetType: feedCode === 41 ? 'Bid/Buy' : feedCode === 51 ? 'Ask/Sell' : 'Other'
        });

        if (feedCode === 41 || feedCode === 51) {
            const depthData = [];
            
            // Process 20 packets of 16 bytes each starting at byte 13
            for (let i = 0; i < 20; i++) {
                const offset = startOffset + 12 + (i * 16); // Header is 12 bytes
                
                const price = dataView.getFloat64(offset, true); // Price (8 bytes)
                const quantity = dataView.getUint32(offset + 8, true); // Quantity (4 bytes)
                const orders = dataView.getUint32(offset + 12, true); // Orders (4 bytes)
                
                if (price > 0 || quantity > 0) {
                    depthData.push({ price, quantity, orders });
                }
            }

            // Update the appropriate side
            if (feedCode === 41) { // Bid Data (Buy)
                console.log(`Updating ${depthData.length} bids`);
                this.depthData.bids = depthData;
            } else if (feedCode === 51) { // Ask Data (Sell)
                console.log(`Updating ${depthData.length} offers`);
                this.depthData.offers = depthData;
            }

            console.log(`Depth Data (${feedCode === 41 ? 'Bid' : 'Ask'}):`, {
                count: depthData.length,
                range: depthData.length > 0 ? {
                    lowest: depthData[depthData.length - 1].price,
                    highest: depthData[0].price
                } : null
            });
        } else if (feedCode === 50) {
            // Handle disconnect packet
            if (dataView.byteLength >= startOffset + 14) {
                const disconnectCode = dataView.getInt16(startOffset + 12, true);
                console.log('WebSocket disconnected with code:', disconnectCode);
                if (disconnectCode === 805) {
                    console.error('Too many WebSocket connections');
                }
            }
        }
    }

    disconnect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ "RequestCode": 12 }));
            this.ws.close();
        }
        this.clearPingTimeout();
    }

    updateUI() {
        const depthDataElement = document.getElementById('depth-data');
        depthDataElement.innerHTML = '';
        
        // Sort bids in descending order (highest first)
        const sortedBids = [...this.depthData.bids].sort((a, b) => b.price - a.price);
        // Sort offers in ascending order (lowest first)
        const sortedOffers = [...this.depthData.offers].sort((a, b) => a.price - b.price);
        
        // Calculate totals
        const totalBidQty = sortedBids.reduce((sum, bid) => sum + bid.quantity, 0);
        const totalOfferQty = sortedOffers.reduce((sum, offer) => sum + offer.quantity, 0);
        
        // Update totals
        document.getElementById('total-bid').textContent = totalBidQty.toLocaleString();
        document.getElementById('total-offer').textContent = totalOfferQty.toLocaleString();
        
        // Display depth data
        const maxRows = Math.max(sortedBids.length, sortedOffers.length);
        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('div');
            row.className = 'depth-row';
            
            const bid = sortedBids[i] || {};
            const offer = sortedOffers[i] || {};
            
            // Create cells in the order matching the column headers:
            // BID | ORDERS | QTY. | OFFER | ORDERS | QTY.
            row.innerHTML = `
                <div class="text-blue-600">${bid.price ? bid.price.toFixed(2) : ''}</div>
                <div>${bid.orders || ''}</div>
                <div>${bid.quantity ? bid.quantity.toLocaleString() : ''}</div>
                <div class="text-red-600">${offer.price ? offer.price.toFixed(2) : ''}</div>
                <div>${offer.orders || ''}</div>
                <div>${offer.quantity ? offer.quantity.toLocaleString() : ''}</div>
            `;
            
            depthDataElement.appendChild(row);
        }

        // Log the current state
        console.log('Depth Data (Bid):', {
            count: sortedBids.length,
            range: sortedBids.length > 0 ? {
                lowest: sortedBids[sortedBids.length - 1].price,
                highest: sortedBids[0].price
            } : null
        });
        console.log('Depth Data (Ask):', {
            count: sortedOffers.length,
            range: sortedOffers.length > 0 ? {
                lowest: sortedOffers[0].price,
                highest: sortedOffers[sortedOffers.length - 1].price
            } : null
        });
    }
}

// Initialize WebSocket connection
const depthSocket = new MarketDepthWebSocket();
