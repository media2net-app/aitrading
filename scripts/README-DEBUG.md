# EA 5004 debug – stappen

1. **MetaEditor:** open `Advisors/AITradingBot.mq5` → **F7** (Compile).
2. **MT5:** EA van de chart halen, opnieuw **AITradingBot** op de GOLD-chart zetten (BotFilePath = `MT5_AI_Bot/`, AutoTrading aan).
3. Wacht tot in het journaal staat: *AI Trading Bot EA gestart* en eventueel *open failed, error 5004*.
4. **Debugbestanden zoeken** (in de projectmap):
   ```bash
   ./scripts/find-ea-debug.sh
   ```
   - **ea_init_ok.txt** → map waarin de EA kan schrijven (= FILE_COMMON+BotFilePath). Daar moet commands.json komen.
   - **mt5_debug_5004.txt** → wordt eenmalig geschreven bij 5004; bevat het exacte pad dat de EA probeert.
5. **Testorder** (optioneel): `node scripts/test-place-order.js` → als er weer 5004 is, wordt mt5_debug_5004.txt (opnieuw) geschreven.
6. **find-ea-debug.sh** opnieuw runnen en de uitvoer bewaren of doorsturen.

De inhoud van **mt5_debug_common_path.txt** (in Terminal/Common/Files) geeft `TERMINAL_DATA_PATH=C:\Program Files\MetaTrader 5`. FILE_COMMON kan daarom onder die installatiemap vallen (bijv. MQL5/Files/Common); de bridge schrijft daar al naartoe.
