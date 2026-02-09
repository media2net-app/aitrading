//+------------------------------------------------------------------+
//|                                              AITradingBot.mq5    |
//|                        AI Trading Bot - File Communication      |
//|  Leest commands.json (van webapp), plaatst orders, schrijft     |
//|  status.json + responses.json. Zet FilePath gelijk aan           |
//|  MT5_BOT_PATH (Mac/Wine: C:/Users/Public/Documents/MT5_AI_Bot/)  |
//+------------------------------------------------------------------+
#property copyright "AI Trading Bot"
#property link      ""
#property version   "2.10"
#property strict

// Input parameters (SymbolName/FilePath vermeden: MQL5 built-in/reserved)
// BotFilePath: "MT5_AI_Bot/" = Common\Files\MT5_AI_Bot (bridge schrijft naar MT5_BOT_PATH = die map).
// Alternatief: "C:/Users/Public/Documents/MT5_AI_Bot/" (bridge schrijft ook naar drive_c/users/Public/Documents/MT5_AI_Bot).
input string BotFilePath = "MT5_AI_Bot/"; // Relatief onder FILE_COMMON root
input int    MagicNumber = 123456; // Magic number voor deze EA
input string TradeSymbol = "XAUUSD"; // XAUUSD of GOLD (broker-afhankelijk)

// Global variables
string commandFile = "commands.json";
string responseFile = "responses.json";
string statusFile = "status.json";

//+------------------------------------------------------------------+
int OnInit()
{
   Print("AI Trading Bot EA gestart");
   Print("Monitoring: ", BotFilePath + commandFile);
   // DEBUG: schrijf éénmalig pad-info in FILE_COMMON root zodat we op Mac het fysieke pad vinden.
   string debugFile = "mt5_debug_common_path.txt";
   int dbgHandle = FileOpen(debugFile, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(dbgHandle != INVALID_HANDLE)
   {
      string info = "TERMINAL_DATA_PATH=" + TerminalInfoString(TERMINAL_DATA_PATH) + "\n";
      info += "BotFilePath=" + BotFilePath + "\n";
      info += "commands_full=" + BotFilePath + commandFile;
      FileWriteString(dbgHandle, info);
      FileClose(dbgHandle);
   }
   // Test: kan de EA schrijven in BotFilePath? Zo ja, dan weten we dat FILE_COMMON+BotFilePath klopt.
   int testHandle = FileOpen(BotFilePath + "ea_init_ok.txt", FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(testHandle != INVALID_HANDLE) { FileWriteString(testHandle, "ok"); FileClose(testHandle); }
   WriteStatus();
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("AI Trading Bot EA gestopt");
}

//+------------------------------------------------------------------+
void OnTick()
{
   CheckForCommands();
   
   static datetime lastStatusUpdate = 0;
   if(TimeCurrent() - lastStatusUpdate >= 1)
   {
      WriteStatus();
      lastStatusUpdate = TimeCurrent();
   }
   
   MonitorPositions();
}

//+------------------------------------------------------------------+
void CheckForCommands()
{
   string filePath = BotFilePath + commandFile;
   int fileHandle = FileOpen(filePath, FILE_READ|FILE_TXT|FILE_COMMON);
   bool openedFromRoot = false;
   // Fallback: op Wine kan FILE_COMMON met backslashes nodig zijn
   if(fileHandle == INVALID_HANDLE)
   {
      string pathBackslash = filePath;
      StringReplace(pathBackslash, "/", "\\");
      fileHandle = FileOpen(pathBackslash, FILE_READ|FILE_TXT|FILE_COMMON);
   }
   if(fileHandle == INVALID_HANDLE)
   {
      fileHandle = FileOpen(commandFile, FILE_READ|FILE_TXT|FILE_COMMON);
      if(fileHandle != INVALID_HANDLE) openedFromRoot = true;
   }
   if(fileHandle == INVALID_HANDLE)
   {
      static int lastErr = 0;
      static bool debug5004Written = false;
      int err = GetLastError();
      if(err != lastErr) { lastErr = err; Print("AITradingBot: ", filePath, " open failed, error ", lastErr); }
      if(err == 5004 && !debug5004Written)
      {
         int dh = FileOpen("mt5_debug_5004.txt", FILE_WRITE|FILE_TXT|FILE_COMMON);
         if(dh != INVALID_HANDLE)
         {
            FileWriteString(dh, "tried=" + filePath + "\nerror=5004\nTERMINAL_DATA_PATH=" + TerminalInfoString(TERMINAL_DATA_PATH));
            FileClose(dh);
            debug5004Written = true;
         }
      }
      return;
   }
   
   string jsonContent = "";
   while(!FileIsEnding(fileHandle))
   {
      jsonContent += FileReadString(fileHandle) + "\n";
   }
   FileClose(fileHandle);
   
   if(StringFind(jsonContent, "\"action\":\"PLACE_ORDER\"") >= 0)
   {
      ProcessPlaceOrder(jsonContent);
   }
   else if(StringFind(jsonContent, "\"action\":\"CLOSE_ORDER\"") >= 0)
   {
      ProcessCloseOrder(jsonContent);
   }
   
   FileDelete(openedFromRoot ? commandFile : filePath, FILE_COMMON);
}

//+------------------------------------------------------------------+
void ProcessPlaceOrder(string jsonContent)
{
   string type = ExtractValue(jsonContent, "type");
   double volume = StringToDouble(ExtractValue(jsonContent, "volume"));
   double entryPrice = StringToDouble(ExtractValue(jsonContent, "entryPrice"));
   double stopLoss = StringToDouble(ExtractValue(jsonContent, "stopLoss"));
   string orderId = ExtractValue(jsonContent, "orderId");
   
   ENUM_ORDER_TYPE orderType;
   if(type == "BUY")
      orderType = ORDER_TYPE_BUY;
   else if(type == "SELL")
      orderType = ORDER_TYPE_SELL;
   else
   {
      WriteResponse(orderId, false, "Ongeldig order type");
      return;
   }
   
   double minLot = SymbolInfoDouble(TradeSymbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(TradeSymbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(TradeSymbol, SYMBOL_VOLUME_STEP);
   
   volume = MathFloor(volume / lotStep) * lotStep;
   volume = MathMax(minLot, MathMin(maxLot, volume));
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = TradeSymbol;
   request.volume = volume;
   request.type = orderType;
   request.price = (orderType == ORDER_TYPE_BUY) ? SymbolInfoDouble(TradeSymbol, SYMBOL_ASK) : SymbolInfoDouble(TradeSymbol, SYMBOL_BID);
   request.deviation = 10;
   request.magic = MagicNumber;
   request.comment = "AI Bot Trade";
   request.type_filling = ORDER_FILLING_FOK;
   
   if(stopLoss > 0)
   {
      request.sl = stopLoss;
   }
   
   if(!OrderSend(request, result))
   {
      Print("OrderSend failed: retcode=", result.retcode, " ", result.comment);
      WriteResponse(orderId, false, "OrderSend failed: " + IntegerToString(result.retcode) + " - " + result.comment);
      return;
   }
   
   if(result.retcode == TRADE_RETCODE_DONE)
   {
      string tp1Price = ExtractValue(jsonContent, "tp1");
      string tp2Price = ExtractValue(jsonContent, "tp2");
      string tp3Price = ExtractValue(jsonContent, "tp3");
      
      ulong ticket = result.order;
      
      if(StringToDouble(tp1Price) > 0)
         PlacePartialTP(ticket, StringToDouble(tp1Price), 0.30, orderType);
      if(StringToDouble(tp2Price) > 0)
         PlacePartialTP(ticket, StringToDouble(tp2Price), 0.50, orderType);
      if(StringToDouble(tp3Price) > 0)
         PlacePartialTP(ticket, StringToDouble(tp3Price), 0.20, orderType);
      
      WriteResponse(orderId, true, "Order geplaatst: " + IntegerToString(ticket));
   }
   else
   {
      WriteResponse(orderId, false, "Order failed: " + IntegerToString(result.retcode));
   }
}

//+------------------------------------------------------------------+
void PlacePartialTP(ulong mainTicket, double tpPrice, double percentage, ENUM_ORDER_TYPE orderType)
{
   if(!PositionSelectByTicket(mainTicket))
      return;
   
   double positionVolume = PositionGetDouble(POSITION_VOLUME);
   double closeVolume = NormalizeDouble(positionVolume * percentage, 2);
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.position = mainTicket;
   request.symbol = TradeSymbol;
   request.volume = closeVolume;
   request.type = (orderType == ORDER_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   request.price = tpPrice;
   request.deviation = 10;
   request.magic = MagicNumber;
   request.comment = "AI Bot TP";
   request.type_filling = ORDER_FILLING_FOK;
}

//+------------------------------------------------------------------+
void ProcessCloseOrder(string jsonContent)
{
   string orderId = ExtractValue(jsonContent, "orderId");
   ulong ticket = StringToInteger(orderId);
   
   if(!PositionSelectByTicket(ticket))
   {
      WriteResponse(orderId, false, "Positie niet gevonden");
      return;
   }
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.position = ticket;
   request.symbol = TradeSymbol;
   request.volume = PositionGetDouble(POSITION_VOLUME);
   request.type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   request.price = (request.type == ORDER_TYPE_SELL) ? SymbolInfoDouble(TradeSymbol, SYMBOL_BID) : SymbolInfoDouble(TradeSymbol, SYMBOL_ASK);
   request.deviation = 10;
   request.magic = MagicNumber;
   request.comment = "AI Bot Close";
   request.type_filling = ORDER_FILLING_FOK;
   
   if(OrderSend(request, result))
      WriteResponse(orderId, true, "Positie gesloten");
   else
      WriteResponse(orderId, false, "Sluiten gefaald: " + IntegerToString(result.retcode));
}

//+------------------------------------------------------------------+
void MonitorPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionSelectByTicket(ticket) && PositionGetInteger(POSITION_MAGIC) == MagicNumber)
      {
         // MT5 handelt SL/TP automatisch
      }
   }
}

//+------------------------------------------------------------------+
void WriteResponse(string orderId, bool success, string message)
{
   string filePath = BotFilePath + responseFile;
   int fileHandle = FileOpen(filePath, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(fileHandle == INVALID_HANDLE)
   {
      Print("WriteResponse FAIL: ", filePath, " open failed, error ", GetLastError());
      return;
   }
   
   string msgSafe = message;
   StringReplace(msgSafe, "\"", "'");
   string response = "{\n";
   response += "  \"orderId\": \"" + orderId + "\",\n";
   response += "  \"success\": " + (success ? "true" : "false") + ",\n";
   response += "  \"message\": \"" + msgSafe + "\",\n";
   response += "  \"timestamp\": " + IntegerToString(TimeCurrent()) + "\n";
   response += "}";
   
   FileWriteString(fileHandle, response);
   FileClose(fileHandle);
}

//+------------------------------------------------------------------+
void WriteStatus()
{
   string filePath = BotFilePath + statusFile;
   int fileHandle = FileOpen(filePath, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(fileHandle == INVALID_HANDLE)
      return;
   
   string status = "{\n";
   status += "  \"connected\": true,\n";
   status += "  \"symbol\": \"" + TradeSymbol + "\",\n";
   status += "  \"bid\": " + DoubleToString(SymbolInfoDouble(TradeSymbol, SYMBOL_BID), 5) + ",\n";
   status += "  \"ask\": " + DoubleToString(SymbolInfoDouble(TradeSymbol, SYMBOL_ASK), 5) + ",\n";
   status += "  \"spread\": " + DoubleToString(SymbolInfoDouble(TradeSymbol, SYMBOL_ASK) - SymbolInfoDouble(TradeSymbol, SYMBOL_BID), 5) + ",\n";
   status += "  \"openPositions\": [\n";
   
   int positionCount = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionSelectByTicket(ticket) && PositionGetInteger(POSITION_MAGIC) == MagicNumber)
      {
         if(positionCount > 0) status += ",\n";
         status += "    {\n";
         status += "      \"ticket\": " + IntegerToString(ticket) + ",\n";
         status += "      \"symbol\": \"" + PositionGetString(POSITION_SYMBOL) + "\",\n";
         status += "      \"type\": \"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\",\n";
         status += "      \"volume\": " + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",\n";
         status += "      \"entryPrice\": " + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",\n";
            status += "      \"currentPrice\": " + DoubleToString((PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? SymbolInfoDouble(TradeSymbol, SYMBOL_BID) : SymbolInfoDouble(TradeSymbol, SYMBOL_ASK)), 5) + ",\n";
         status += "      \"profit\": " + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",\n";
         status += "      \"swap\": " + DoubleToString(PositionGetDouble(POSITION_SWAP), 2) + ",\n";
         status += "      \"sl\": " + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",\n";
         status += "      \"tp\": " + DoubleToString(PositionGetDouble(POSITION_TP), 5) + "\n";
         status += "    }";
         positionCount++;
      }
   }
   
   status += "\n  ],\n";
   status += "  \"timestamp\": " + IntegerToString(TimeCurrent()) + "\n";
   status += "}";
   
   FileWriteString(fileHandle, status);
   FileClose(fileHandle);
}

//+------------------------------------------------------------------+
string ExtractValue(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int startPos = StringFind(json, searchKey);
   if(startPos < 0) return "";
   
   startPos += StringLen(searchKey);
   while(StringGetCharacter(json, startPos) == ' ' || StringGetCharacter(json, startPos) == '\"')
      startPos++;
   
   int endPos = startPos;
   if(StringGetCharacter(json, startPos - 1) == '\"')
      endPos = StringFind(json, "\"", startPos);
   else
   {
      while(StringGetCharacter(json, endPos) != ',' && StringGetCharacter(json, endPos) != '}' && StringGetCharacter(json, endPos) != '\n')
         endPos++;
   }
   
   return StringSubstr(json, startPos, endPos - startPos);
}

//+------------------------------------------------------------------+
