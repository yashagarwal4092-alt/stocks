import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

const symbolToSlug = {
  '^NSEI': 'indices/nifty-50',
  '^BSESN': 'indices/sensex',
  '^NSEMDCP50': 'indices/nifty-midcap-100',
  'TATAMOTORS.NS': 'stocks/tata-motors-ltd-share-price',
  'INFY.NS': 'stocks/infosys-ltd-share-price',
  'HDFCBANK.NS': 'stocks/hdfc-bank-ltd-share-price',
  'RELIANCE.NS': 'stocks/reliance-industries-ltd-share-price',
  'BAJFINANCE.NS': 'stocks/bajaj-finance-ltd-share-price',
  'AXISBANK.NS': 'stocks/axis-bank-ltd-share-price'
};

app.get('/api/quote', async (req, res) => {
  const symbols = req.query.symbols;
  if (!symbols) return res.status(400).json({ error: 'Missing symbols' });
  
  const symbolsArray = symbols.split(',');
  const results = [];

  for (const symbol of symbolsArray) {
    const slug = symbolToSlug[symbol];
    if (slug) {
      try {
        const { data } = await axios.get(`https://www.indmoney.com/${slug}`, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
            'Accept': 'text/html'
          },
          timeout: 5000
        });
        
        // INDmoney HTML includes __NEXT_DATA__ JSON containing all the prices
        const priceMatch = data.match(/"currentPrice":\s*([\d.]+)/) || data.match(/"price":\s*([\d.]+)/) || data.match(/₹([0-9,]+\.[0-9]+)/);
        const changeMatch = data.match(/"change":\s*([\d.-]+)/) || data.match(/([+-][0-9,]+\.[0-9]+)\s*\(/);
        const changePercentMatch = data.match(/"changePercent":\s*([\d.-]+)/) || data.match(/\(\s*([+-][0-9,]+\.[0-9]+)\s*%\s*\)/);

        let price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        let change = changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : 0;
        let changePercent = changePercentMatch ? parseFloat(changePercentMatch[1].replace(/,/g, '')) : 0;
        
        if (price) {
            results.push({ symbol, regularMarketPrice: price, regularMarketChange: change, regularMarketChangePercent: changePercent });
        }
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e.message);
      }
    }
  }

  res.json({ quoteResponse: { result: results } });
});

app.listen(5000, () => console.log('Proxy running on port 5000'));