# Dhan 20 Depth Market Data Viewer

A real-time market depth visualization tool for Dhan Trading API that displays 20-level market depth data for NSE stocks.

## Features

- Real-time 20-level market depth data visualization
- WebSocket-based live data streaming
- Clean and responsive UI using TailwindCSS and DaisyUI
- Animated bid/offer quantity updates
- Secure credential management through environment variables

## Prerequisites

- Python 3.8+
- Dhan Trading Account
- Dhan API Credentials (Token and Client ID)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/marketcalls/dhan-20depth.git
cd dhan-20depth
```

2. Install required Python packages:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the project root and add your Dhan credentials:
```env
DHAN_TOKEN=your_dhan_token
DHAN_CLIENT_ID=your_client_id
```

## Configuration

The application uses the following environment variables:
- `DHAN_TOKEN`: Your Dhan API token
- `DHAN_CLIENT_ID`: Your Dhan client ID

You can also modify the stock being tracked by changing the `SecurityId` in `market-depth.js`:
```javascript
{
    "ExchangeSegment": "NSE_EQ",
    "SecurityId": "2885",  // Change this to your desired stock's security ID
    "BidAskBoth": true,
    "Mode": "20DEPTH"
}
```

## Usage

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Technical Details

### Backend (`app.py`)
- Flask-based server handling WebSocket connections and credential management
- Asynchronous WebSocket client for Dhan's market depth feed
- Binary message parsing for market depth data

### Frontend
- `market-depth.js`: Handles WebSocket connection, data processing, and UI updates
- `index.html`: Responsive UI layout with real-time data display
- Uses TailwindCSS and DaisyUI for styling

### WebSocket Message Format
Market depth data is received in binary format:
- Header (12 bytes):
  - Message Length (2 bytes)
  - Feed Code (1 byte): 41 for Bid, 51 for Ask
  - Exchange Segment (1 byte)
  - Security ID (4 bytes)
  - Message Sequence (4 bytes)
- Data (20 levels × 16 bytes each):
  - Price (8 bytes, double)
  - Quantity (4 bytes, uint32)
  - Orders (4 bytes, uint32)

## Error Handling
- Automatic WebSocket reconnection on disconnection
- Ping/Pong mechanism to detect connection health
- Comprehensive error logging for debugging
- Graceful handling of malformed messages

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Dhan API](https://api.dhan.co) for providing the market data feed
- [TailwindCSS](https://tailwindcss.com) and [DaisyUI](https://daisyui.com) for the UI components
- [Flask](https://flask.palletsprojects.com) for the web framework

## Support

For support, please raise an issue in the GitHub repository or contact the maintainers.
