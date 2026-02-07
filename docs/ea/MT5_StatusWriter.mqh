//+------------------------------------------------------------------+
//| MT5_StatusWriter.mqh - Schrijf MT5-gegevens naar status.json    |
//| voor de AI Trading webapp (bridge). Include in je EA.            |
//| Roep WriteMT5Status() aan in OnTick() of OnTimer() (bijv. 1s).   |
//| Versie 5.0: balance, equity, profit, openPositions.               |
//+------------------------------------------------------------------+
#property copyright "AI Trading"
#property link      ""
#property version   "5.0"

// Mapnaam onder Terminal Common (moet overeenkomen met MT5_BOT_PATH in de app)
#define STATUS_FOLDER   "MT5_AI_Bot"
#define STATUS_FILENAME "status.json"

//+------------------------------------------------------------------+
//| Schrijf account- en marktgegevens naar status.json                |
//| Pad: Terminal Common\Files\MT5_AI_Bot\status.json                 |
//+------------------------------------------------------------------+
void WriteMT5Status()
{
   string path = STATUS_FOLDER + "\\" + STATUS_FILENAME;
   int f = FileOpen(path, FILE_WRITE|FILE_TXT|FILE_ANSI|FILE_COMMON);
   if (f == INVALID_HANDLE)
   {
      Print("WriteMT5Status: FileOpen failed ", GetLastError(), " path=", path);
      return;
   }

   long login     = AccountInfoInteger(ACCOUNT_LOGIN);
   string server  = AccountInfoString(ACCOUNT_SERVER);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   long tradeMode = AccountInfoInteger(ACCOUNT_TRADE_MODE);
   string modeStr = "Unknown";
   if (tradeMode == ACCOUNT_TRADE_MODE_FULL)      modeStr = "Full";
   else if (tradeMode == ACCOUNT_TRADE_MODE_DISABLED) modeStr = "Disabled";
   else if (tradeMode == ACCOUNT_TRADE_MODE_READONLY) modeStr = "ReadOnly";
   else if (tradeMode == 0) modeStr = "Hedge";  // hedging

   string symbol = Symbol();
   double bid   = SymbolInfoDouble(symbol, SYMBOL_BID);
   double ask   = SymbolInfoDouble(symbol, SYMBOL_ASK);
   double spread = ask - bid;
   long   timestamp = (long)TimeCurrent();

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double profit  = AccountInfoDouble(ACCOUNT_PROFIT);

   string json = "{";
   json += "\"connected\":true,";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"bid\":" + DoubleToString(bid, 2) + ",";
   json += "\"ask\":" + DoubleToString(ask, 2) + ",";
   json += "\"spread\":" + DoubleToString(spread, 2) + ",";
   json += "\"timestamp\":" + IntegerToString(timestamp) + ",";
   json += "\"login\":" + IntegerToString(login) + ",";
   json += "\"server\":\"" + EscapeJSON(server) + "\",";
   json += "\"company\":\"" + EscapeJSON(company) + "\",";
   json += "\"mode\":\"" + modeStr + "\",";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"openPositions\":" + WriteOpenPositionsJSON() + "}";

   FileWriteString(f, json);
   FileClose(f);
}

// Bouw JSON-array van open posities voor status.json
string WriteOpenPositionsJSON()
{
   string arr = "[";
   int total = PositionsTotal();
   for (int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if (ticket == 0) continue;
      if (i > 0) arr += ",";
      string sym = PositionGetString(POSITION_SYMBOL);
      long type = PositionGetInteger(POSITION_TYPE);
      double vol = PositionGetDouble(POSITION_VOLUME);
      double priceOpen = PositionGetDouble(POSITION_PRICE_OPEN);
      double priceCur = PositionGetDouble(POSITION_PRICE_CURRENT);
      double pl = PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);
      arr += "{\"ticket\":" + IntegerToString((long)ticket) + ",\"symbol\":\"" + EscapeJSON(sym) + "\",\"type\":" + IntegerToString(type);
      arr += ",\"volume\":" + DoubleToString(vol, 2) + ",\"entryPrice\":" + DoubleToString(priceOpen, 5);
      arr += ",\"currentPrice\":" + DoubleToString(priceCur, 5) + ",\"profit\":" + DoubleToString(pl, 2);
      arr += ",\"sl\":" + DoubleToString(sl, 5) + ",\"tp\":" + DoubleToString(tp, 5) + "}";
   }
   arr += "]";
   return arr;
}

// Escape " en \ voor JSON-string
string EscapeJSON(string s)
{
   string r = "";
   for (int i = 0; i < StringLen(s); i++)
   {
      ushort c = StringGetCharacter(s, i);
      if (c == '"')  r += "\\\"";
      else if (c == '\\') r += "\\\\";
      else r += CharToString((uchar)c);
   }
   return r;
}
