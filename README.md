# Dhan 20 Depth API

A real-time market depth visualization tool that displays 20 levels of bid and ask data from the Dhan trading platform. Built with Python Flask and modern web technologies.

## Features

- Real-time 20-level market depth visualization
- WebSocket integration for live data updates
- Bid and ask price levels with quantities and order counts
- Total bid and ask volumes
- Stock details including circuit limits and trading info
- Clean, responsive UI with Tailwind CSS
- Color-coded bid/ask prices for better visibility

## Setup

1. Install the required packages:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your Dhan API credentials:
   - Copy `.env.sample` to `.env`
   - Replace the placeholder values with your actual credentials:
```env
DHAN_TOKEN=your_actual_token_here    # Replace eyxxxxx with your token
DHAN_CLIENT_ID=your_client_id_here   # Replace 100xxxxxxx with your client ID
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Technical Details

- **Backend**: Python Flask server handling WebSocket connections
- **Frontend**: 
  - Vanilla JavaScript for WebSocket handling and UI updates
  - Tailwind CSS for styling
  - Real-time binary data processing
- **Data Format**: 
  - Feed Code 41: Bid Data (Buy)
  - Feed Code 51: Ask Data (Sell)
  - 20 levels of depth with price, quantity, and order count

## Project Structure

```
.
├── app.py              # Flask application
├── static/
│   ├── css/
│   │   └── styles.css  # Custom styles
│   └── js/
│       └── market-depth.js  # WebSocket and UI logic
├── templates/
│   └── index.html      # Main HTML template
├── .env.sample         # Environment variables template
└── requirements.txt    # Python dependencies
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
