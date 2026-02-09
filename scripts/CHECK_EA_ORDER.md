# Checklist: testorder werkt alleen als dit klopt

1. **AITradingBot** staat op een chart (bijv. XAUUSD H1).
2. **BotFilePath** in de EA-inputs = `MT5_AI_Bot/` (zelfde als MT5_BOT_PATH in .env).
3. **AutoTrading** staat AAN (groene knop in de toolbar).
4. **TradeSymbol** in de EA = XAUUSD of GOLD (zoals je broker gebruikt).

Daarna: `node scripts/test-place-order.js` opnieuw runnen.
