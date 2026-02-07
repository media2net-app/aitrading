//+------------------------------------------------------------------+
//|                                          MT5_REST_API_EA.mq5     |
//|                        MetaTrader 5 REST API Expert Advisor      |
//|                                                                  |
//+------------------------------------------------------------------+
#property copyright "AI Trader by Chiel"
#property link      ""
#property version   "5.0"
#property description "MetaTrader 5 REST API Expert Advisor"
#property description "Provides HTTP-like API via file-based communication"
#property description "Features: Account info, positions, order placement, history, candlestick data"
#property description "Version 5.0: status.json for dashboard (balance/equity/profit/openPositions), automatic SL/TP, optimized for live trading"

#include <Trade\Trade.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Files\File.mqh>

input int      CheckInterval = 100;  // Check interval in milliseconds
input bool     EnableLogging = true;  // Enable file logging (disable for maximum speed)

CTrade trade;
CAccountInfo account;
CPositionInfo position;
CSymbolInfo symbol_info;

string request_file = "mt5_request.txt";
string response_file = "mt5_response.txt";
string log_file = "mt5_ea_logs.txt";

// Status.json voor AI Trading dashboard (v5.0)
#define STATUS_FOLDER   "MT5_AI_Bot"
#define STATUS_FILENAME "status.json"

// Log buffer to minimize file I/O
string log_buffer[];
int log_buffer_size = 0;
datetime last_log_cleanup = 0;

//+------------------------------------------------------------------+
//| Escape " en \ voor JSON-string                                    |
//+------------------------------------------------------------------+
string EscapeJSON(string s)
{
   string r = "";
   for(int i = 0; i < StringLen(s); i++)
   {
      ushort c = StringGetCharacter(s, i);
      if(c == '"')  r += "\\\"";
      else if(c == '\\') r += "\\\\";
      else r += CharToString((uchar)c);
   }
   return r;
}

//+------------------------------------------------------------------+
//| Bouw JSON-array van open posities voor status.json               |
//+------------------------------------------------------------------+
string WriteOpenPositionsJSON()
{
   string arr = "[";
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(i > 0) arr += ",";
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

//+------------------------------------------------------------------+
//| Schrijf account- en marktgegevens naar status.json (dashboard)   |
//+------------------------------------------------------------------+
void WriteMT5Status()
{
   string path = STATUS_FOLDER + "\\" + STATUS_FILENAME;
   int f = FileOpen(path, FILE_WRITE|FILE_TXT|FILE_ANSI|FILE_COMMON);
   if(f == INVALID_HANDLE)
   {
      Print("WriteMT5Status: FileOpen failed ", GetLastError(), " path=", path);
      return;
   }
   long login     = AccountInfoInteger(ACCOUNT_LOGIN);
   string server  = AccountInfoString(ACCOUNT_SERVER);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   long tradeMode = AccountInfoInteger(ACCOUNT_TRADE_MODE);
   string modeStr = "Unknown";
   if(tradeMode == 0) modeStr = "Full";
   else if(tradeMode == 1) modeStr = "Disabled";
   else if(tradeMode == 2) modeStr = "ReadOnly";
   else modeStr = "Hedge";
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
   json += "\"version\":\"5.0\",";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"openPositions\":" + WriteOpenPositionsJSON() + "}";
   FileWriteString(f, json);
   FileClose(f);
}

// Try to find the correct Common folder path
string GetCommonFolderPath()
{
   string test_file = "test_path.txt";
   int test_handle = FileOpen(test_file, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(test_handle != INVALID_HANDLE)
   {
      FileClose(test_handle);
      FileDelete(test_file, FILE_COMMON);
      return "FILE_COMMON works";
   }
   return "FILE_COMMON path issue";
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("MT5 REST API EA Starting (File-based communication)");
   Print("Request file: ", request_file);
   Print("Response file: ", response_file);
   WriteLog("MT5 REST API EA v5.0 Starting");
   WriteMT5Status();
   string test_file = "mt5_test_path.txt";
   int test_handle = FileOpen(test_file, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(test_handle != INVALID_HANDLE)
   {
      FileWriteString(test_handle, "TEST");
      FileClose(test_handle);
      Print("✅ Test file created in FILE_COMMON location");
      Print("   Check Terminal Data Path: ", TerminalInfoString(TERMINAL_DATA_PATH));
      Print("   Common folder should be: ", TerminalInfoString(TERMINAL_DATA_PATH), "\\MQL5\\Files\\Common");
   }
   else
   {
      int error = GetLastError();
      Print("❌ Cannot create test file. Error: ", error);
      Print("   Terminal Data Path: ", TerminalInfoString(TERMINAL_DATA_PATH));
   }
   EventSetTimer(1);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("MT5 REST API EA Stopped");
   WriteLog("MT5 REST API EA Stopped");
   FlushLogBuffer();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   WriteMT5Status();
   CheckForRequests();
}

//+------------------------------------------------------------------+
//| Timer function (called every second)                            |
//+------------------------------------------------------------------+
void OnTimer()
{
   static int counter = 0;
   counter++;
   if(counter >= 10)
   {
      Print("Timer check #", counter, " - Checking for requests...");
      counter = 0;
   }
   WriteMT5Status();
   CheckForRequests();
}

//+------------------------------------------------------------------+
//| Check for incoming requests                                      |
//+------------------------------------------------------------------+
void CheckForRequests()
{
   int file_handle = FileOpen(request_file, FILE_READ|FILE_TXT|FILE_COMMON);
   if(file_handle == INVALID_HANDLE)
   {
      int error_code = GetLastError();
      if(error_code != 5004 && error_code != 0)
      {
         static int last_error = 0;
         if(error_code != last_error)
         {
            Print("⚠️ Cannot open request file. Error code: ", error_code);
            last_error = error_code;
         }
      }
      ResetLastError();
      return;
   }
   Print("✅ Request file opened successfully!");
   string request = "";
   while(!FileIsEnding(file_handle))
   {
      request = request + FileReadString(file_handle) + "\n";
   }
   FileClose(file_handle);
   FileDelete(request_file, FILE_COMMON);
   if(StringLen(request) > 0)
   {
      Print("✅ Received request: ", request);
      if(StringFind(request, "/health") < 0)
      {
         WriteLog("Received: " + StringSubstr(request, 0, 80));
      }
      string response = ProcessRequest(request);
      Print("✅ Sending response: ", StringSubstr(response, 0, 100), "...");
      WriteResponse(response);
      Print("✅ Response written successfully");
   }
}

//+------------------------------------------------------------------+
//| Process HTTP-like request                                        |
//+------------------------------------------------------------------+
string ProcessRequest(string request)
{
   string method = "";
   string path = "";
   string lines[];
   int line_count = StringSplit(request, '\n', lines);
   if(line_count > 0)
   {
      string first_line = lines[0];
      string parts[];
      int part_count = StringSplit(first_line, ' ', parts);
      if(part_count >= 2)
      {
         method = parts[0];
         path = parts[1];
      }
   }
   Print("🔍 Processing request - Method: ", method, ", Path: ", path);
   if(StringFind(path, "/health") < 0)
   {
      WriteLog("Processing: " + method + " " + path);
   }
   if(path == "/health" || path == "/health/")
   {
      return "{\"status\":\"ok\",\"service\":\"MT5 REST API\"}";
   }
   else if(StringFind(path, "/connect") >= 0)
   {
      return HandleConnect();
   }
   else if(path == "/account" || path == "/account/")
   {
      return HandleAccount();
   }
   else if(path == "/positions" || path == "/positions/")
   {
      return HandlePositions();
   }
   else if(path == "/symbols" || path == "/symbols/")
   {
      return HandleSymbols();
   }
   else if(StringFind(path, "/symbol/") >= 0)
   {
      int symbol_pos = StringFind(path, "/symbol/");
      string symbol_name = StringSubstr(path, symbol_pos + 8);
      return HandleSymbolInfo(symbol_name);
   }
   else if(StringFind(path, "/tick/") >= 0)
   {
      int tick_pos = StringFind(path, "/tick/");
      string symbol_name = StringSubstr(path, tick_pos + 6);
      return HandleTick(symbol_name);
   }
   else if(StringFind(path, "/place-order") >= 0)
   {
      string body = "";
      if(line_count > 1)
         body = lines[1];
      return HandlePlaceOrder(body);
   }
   else if(StringFind(path, "/close-position/") >= 0)
   {
      Print("🔒 Close position request detected!");
      int pos_pos = StringFind(path, "/close-position/");
      string ticket_str = StringSubstr(path, pos_pos + 16);
      Print("   Ticket string: ", ticket_str);
      ulong ticket = StringToInteger(ticket_str);
      Print("   Parsed ticket (ulong): ", ticket);
      string result = HandleClosePosition(ticket);
      Print("   Close result: ", StringSubstr(result, 0, 200));
      return result;
   }
   else if(path == "/history" || path == "/history/")
   {
      return HandleHistory();
   }
   else if(StringFind(path, "/candles/") >= 0)
   {
      int candles_pos = StringFind(path, "/candles/");
      string symbol_and_params = StringSubstr(path, candles_pos + 9);
      string parts[];
      int part_count = StringSplit(symbol_and_params, '/', parts);
      if(part_count >= 1)
      {
         string symbol_name = parts[0];
         string timeframe_str = (part_count >= 2) ? parts[1] : "H1";
         int count = (part_count >= 3) ? (int)StringToInteger(parts[2]) : 100;
         return HandleCandles(symbol_name, timeframe_str, count);
      }
      else
      {
         return "{\"error\":\"Invalid candles request format\"}";
      }
   }
   else
   {
      Print("⚠️ Unknown path: ", path);
      return "{\"error\":\"Not found\",\"path\":\"" + path + "\"}";
   }
}

//+------------------------------------------------------------------+
//| Write response to file                                           |
//+------------------------------------------------------------------+
void WriteResponse(string response)
{
   int file_handle = FileOpen(response_file, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(file_handle != INVALID_HANDLE)
   {
      FileWriteString(file_handle, response);
      FileClose(file_handle);
      Print("Response written successfully");
   }
   else
   {
      int error = GetLastError();
      Print("Failed to write response file. Error: ", error);
   }
}

//+------------------------------------------------------------------+
//| Write log to buffer (fast, no file I/O)                         |
//+------------------------------------------------------------------+
void WriteLog(string message)
{
   if(!EnableLogging) return;
   string timestamp = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   string log_entry = timestamp + " | " + message;
   ArrayResize(log_buffer, log_buffer_size + 1);
   log_buffer[log_buffer_size] = log_entry;
   log_buffer_size++;
   static datetime last_flush = 0;
   datetime now = TimeCurrent();
   if(log_buffer_size >= 10 || (now - last_flush) >= 5)
   {
      FlushLogBuffer();
      last_flush = now;
   }
   if((now - last_log_cleanup) >= 60)
   {
      CleanupLogFile();
      last_log_cleanup = now;
   }
}

//+------------------------------------------------------------------+
//| Flush log buffer to file (batch write for performance)         |
//+------------------------------------------------------------------+
void FlushLogBuffer()
{
   if(log_buffer_size == 0) return;
   int file_handle = FileOpen(log_file, FILE_WRITE|FILE_READ|FILE_TXT|FILE_COMMON);
   if(file_handle != INVALID_HANDLE)
   {
      FileSeek(file_handle, 0, SEEK_END);
      for(int i = 0; i < log_buffer_size; i++)
      {
         FileWriteString(file_handle, log_buffer[i] + "\n");
      }
      FileClose(file_handle);
      ArrayResize(log_buffer, 0);
      log_buffer_size = 0;
   }
}

//+------------------------------------------------------------------+
//| Cleanup log file (only called periodically)                      |
//+------------------------------------------------------------------+
void CleanupLogFile()
{
   int file_handle = FileOpen(log_file, FILE_READ|FILE_TXT|FILE_COMMON);
   if(file_handle == INVALID_HANDLE) return;
   int lines = 0;
   while(!FileIsEnding(file_handle))
   {
      FileReadString(file_handle);
      lines++;
   }
   FileClose(file_handle);
   if(lines > 2000)
   {
      string temp_file = "mt5_ea_logs_temp.txt";
      int read_handle = FileOpen(log_file, FILE_READ|FILE_TXT|FILE_COMMON);
      int write_handle = FileOpen(temp_file, FILE_WRITE|FILE_TXT|FILE_COMMON);
      if(read_handle != INVALID_HANDLE && write_handle != INVALID_HANDLE)
      {
         for(int i = 0; i < lines - 1000; i++)
            FileReadString(read_handle);
         while(!FileIsEnding(read_handle))
            FileWriteString(write_handle, FileReadString(read_handle) + "\n");
         FileClose(read_handle);
         FileClose(write_handle);
         FileDelete(log_file, FILE_COMMON);
         FileMove(temp_file, 0, log_file, FILE_COMMON);
      }
   }
}

//+------------------------------------------------------------------+
//| Handle connect request                                           |
//+------------------------------------------------------------------+
string HandleConnect()
{
   string json = "{";
   json = json + "\"success\":true,";
   json = json + "\"message\":\"Connected to MT5\",";
   json = json + "\"account\":{";
   json = json + "\"login\":" + IntegerToString(account.Login()) + ",";
   json = json + "\"balance\":" + DoubleToString(account.Balance(), 2) + ",";
   json = json + "\"equity\":" + DoubleToString(account.Equity(), 2) + ",";
   json = json + "\"margin\":" + DoubleToString(account.Margin(), 2) + ",";
   json = json + "\"free_margin\":" + DoubleToString(account.FreeMargin(), 2) + ",";
   json = json + "\"server\":\"" + account.Server() + "\",";
   json = json + "\"currency\":\"" + account.Currency() + "\"";
   json = json + "}";
   json = json + "}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle account info request                                      |
//+------------------------------------------------------------------+
string HandleAccount()
{
   string json = "{";
   json = json + "\"login\":" + IntegerToString(account.Login()) + ",";
   json = json + "\"balance\":" + DoubleToString(account.Balance(), 2) + ",";
   json = json + "\"equity\":" + DoubleToString(account.Equity(), 2) + ",";
   json = json + "\"margin\":" + DoubleToString(account.Margin(), 2) + ",";
   json = json + "\"free_margin\":" + DoubleToString(account.FreeMargin(), 2) + ",";
   json = json + "\"profit\":" + DoubleToString(account.Profit(), 2) + ",";
   json = json + "\"server\":\"" + account.Server() + "\",";
   json = json + "\"currency\":\"" + account.Currency() + "\",";
   json = json + "\"leverage\":" + IntegerToString(account.Leverage()) + ",";
   json = json + "\"company\":\"" + account.Company() + "\"";
   json = json + "}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle positions request                                         |
//+------------------------------------------------------------------+
string HandlePositions()
{
   string json = "{\"positions\":[";
   bool first = true;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(position.SelectByIndex(i))
      {
         if(!first) json = json + ",";
         first = false;
         string pos_type = (position.PositionType() == POSITION_TYPE_BUY) ? "BUY" : "SELL";
         json = json + "{";
         json = json + "\"ticket\":" + IntegerToString(position.Ticket()) + ",";
         json = json + "\"symbol\":\"" + position.Symbol() + "\",";
         json = json + "\"type\":\"" + pos_type + "\",";
         json = json + "\"volume\":" + DoubleToString(position.Volume(), 2) + ",";
         json = json + "\"price_open\":" + DoubleToString(position.PriceOpen(), 5) + ",";
         json = json + "\"price_current\":" + DoubleToString(position.PriceCurrent(), 5) + ",";
         json = json + "\"profit\":" + DoubleToString(position.Profit(), 2) + ",";
         json = json + "\"swap\":" + DoubleToString(position.Swap(), 2) + ",";
         json = json + "\"time\":\"" + TimeToString(position.Time(), TIME_DATE|TIME_SECONDS) + "\"";
         json = json + "}";
      }
   }
   json = json + "]}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle symbols request                                           |
//+------------------------------------------------------------------+
string HandleSymbols()
{
   string json = "{\"symbols\":[";
   bool first = true;
   string symbols[] = {"EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF"};
   for(int i = 0; i < ArraySize(symbols); i++)
   {
      if(symbol_info.Name(symbols[i]))
      {
         if(!first) json = json + ",";
         first = false;
         json = json + "{";
         json = json + "\"name\":\"" + symbols[i] + "\",";
         json = json + "\"description\":\"" + symbol_info.Description() + "\",";
         json = json + "\"currency_base\":\"" + symbol_info.CurrencyBase() + "\",";
         json = json + "\"currency_profit\":\"" + symbol_info.CurrencyProfit() + "\",";
         json = json + "\"digits\":" + IntegerToString(symbol_info.Digits()) + ",";
         json = json + "\"point\":" + DoubleToString(symbol_info.Point(), 10);
         json = json + "}";
      }
   }
   json = json + "]}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle symbol info request                                       |
//+------------------------------------------------------------------+
string HandleSymbolInfo(string symbol_name)
{
   if(!SymbolSelect(symbol_name, true))
      return "{\"error\":\"Symbol not found\"}";
   if(!symbol_info.Name(symbol_name))
      return "{\"error\":\"Symbol not found\"}";
   MqlTick tick;
   SymbolInfoTick(symbol_name, tick);
   int digits = (int)symbol_info.Digits();
   double point_val = SymbolInfoDouble(symbol_name, SYMBOL_POINT);
   double vol_min = SymbolInfoDouble(symbol_name, SYMBOL_VOLUME_MIN);
   double vol_max = SymbolInfoDouble(symbol_name, SYMBOL_VOLUME_MAX);
   double vol_step = SymbolInfoDouble(symbol_name, SYMBOL_VOLUME_STEP);
   string json = "{";
   json = json + "\"symbol\":\"" + symbol_name + "\",";
   json = json + "\"description\":\"" + symbol_info.Description() + "\",";
   json = json + "\"currency_base\":\"" + symbol_info.CurrencyBase() + "\",";
   json = json + "\"currency_profit\":\"" + symbol_info.CurrencyProfit() + "\",";
   json = json + "\"digits\":" + IntegerToString(digits) + ",";
   json = json + "\"point\":" + DoubleToString(point_val, 10) + ",";
   json = json + "\"volume_min\":" + DoubleToString(vol_min, 2) + ",";
   json = json + "\"volume_max\":" + DoubleToString(vol_max, 2) + ",";
   json = json + "\"volume_step\":" + DoubleToString(vol_step, 2) + ",";
   json = json + "\"bid\":" + DoubleToString(tick.bid, digits) + ",";
   json = json + "\"ask\":" + DoubleToString(tick.ask, digits) + ",";
   json = json + "\"last\":" + DoubleToString(tick.last, digits) + ",";
   json = json + "\"time\":\"" + TimeToString(tick.time, TIME_DATE|TIME_SECONDS) + "\"";
   json = json + "}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle tick request (get current price)                          |
//+------------------------------------------------------------------+
string HandleTick(string symbol_name)
{
   if(StringLen(symbol_name) == 0)
      return "{\"error\":\"Symbol name required\"}";
   MqlTick tick;
   if(!SymbolInfoTick(symbol_name, tick))
      return "{\"error\":\"Cannot get tick for " + symbol_name + "\"}";
   int digits = (int)SymbolInfoInteger(symbol_name, SYMBOL_DIGITS);
   string json = "{";
   json = json + "\"symbol\":\"" + symbol_name + "\",";
   json = json + "\"bid\":" + DoubleToString(tick.bid, digits) + ",";
   json = json + "\"ask\":" + DoubleToString(tick.ask, digits) + ",";
   json = json + "\"last\":" + DoubleToString(tick.last, digits) + ",";
   json = json + "\"volume\":" + IntegerToString(tick.volume) + ",";
   json = json + "\"time\":\"" + TimeToString(tick.time, TIME_DATE|TIME_SECONDS) + "\"";
   json = json + "}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle place order request                                       |
//+------------------------------------------------------------------+
string HandlePlaceOrder(string body)
{
   string symbol_name = "";
   string order_type_str = "";
   double volume_val = 0;
   double sl_val = 0;
   double tp_val = 0;
   int symbol_pos = StringFind(body, "\"symbol\"");
   if(symbol_pos >= 0)
   {
      int start = StringFind(body, "\"", symbol_pos + 8) + 1;
      int end = StringFind(body, "\"", start);
      if(end > start) symbol_name = StringSubstr(body, start, end - start);
   }
   int type_pos = StringFind(body, "\"type\"");
   if(type_pos >= 0)
   {
      int start = StringFind(body, "\"", type_pos + 6) + 1;
      int end = StringFind(body, "\"", start);
      if(end > start) order_type_str = StringSubstr(body, start, end - start);
   }
   int volume_pos = StringFind(body, "\"volume\"");
   if(volume_pos >= 0)
   {
      int start = StringFind(body, ":", volume_pos) + 1;
      string volume_str = "";
      for(int i = start; i < (int)StringLen(body); i++)
      {
         string char_str = StringSubstr(body, i, 1);
         if(char_str == "," || char_str == "}" || char_str == " ")
         {
            if(StringLen(volume_str) > 0) break;
            continue;
         }
         volume_str = volume_str + char_str;
      }
      volume_val = StringToDouble(volume_str);
   }
   int sl_pos = StringFind(body, "\"sl\"");
   if(sl_pos >= 0)
   {
      int start = StringFind(body, ":", sl_pos) + 1;
      string sl_str = "";
      for(int i = start; i < (int)StringLen(body); i++)
      {
         string char_str = StringSubstr(body, i, 1);
         if(char_str == "," || char_str == "}" || char_str == " ")
         {
            if(StringLen(sl_str) > 0) break;
            continue;
         }
         sl_str = sl_str + char_str;
      }
      sl_val = StringToDouble(sl_str);
   }
   int tp_pos = StringFind(body, "\"tp\"");
   if(tp_pos >= 0)
   {
      int start = StringFind(body, ":", tp_pos) + 1;
      string tp_str = "";
      for(int i = start; i < (int)StringLen(body); i++)
      {
         string char_str = StringSubstr(body, i, 1);
         if(char_str == "," || char_str == "}" || char_str == " ")
         {
            if(StringLen(tp_str) > 0) break;
            continue;
         }
         tp_str = tp_str + char_str;
      }
      tp_val = StringToDouble(tp_str);
   }
   if(StringLen(symbol_name) == 0 || StringLen(order_type_str) == 0 || volume_val == 0)
      return "{\"error\":\"Missing required fields\"}";
   symbol_info.Name(symbol_name);
   int digits = (int)symbol_info.Digits();
   double normalized_sl = (sl_val > 0) ? sl_val : 0;
   double normalized_tp = (tp_val > 0) ? tp_val : 0;
   bool success = false;
   double price = 0;
   string comment = "AI Trader v5.0";
   if(order_type_str == "BUY")
   {
      price = SymbolInfoDouble(symbol_name, SYMBOL_ASK);
      if(price <= 0)
         return "{\"error\":\"Cannot get ASK price for " + symbol_name + "\"}";
      if(normalized_sl > 0 || normalized_tp > 0)
      {
         success = trade.Buy(volume_val, symbol_name, 0, normalized_sl, normalized_tp, comment);
         if(success) WriteLog("BUY: " + symbol_name + " Vol:" + DoubleToString(volume_val, 2) + " SL:" + DoubleToString(normalized_sl, 5) + " TP:" + DoubleToString(normalized_tp, 5));
         else WriteLog("BUY FAILED: " + trade.ResultRetcodeDescription());
      }
      else
      {
         success = trade.Buy(volume_val, symbol_name, 0, 0, 0, comment);
         if(success) WriteLog("BUY: " + symbol_name + " Vol:" + DoubleToString(volume_val, 2) + " (no SL/TP)");
         else WriteLog("BUY FAILED: " + trade.ResultRetcodeDescription());
      }
   }
   else if(order_type_str == "SELL")
   {
      price = SymbolInfoDouble(symbol_name, SYMBOL_BID);
      if(price <= 0)
         return "{\"error\":\"Cannot get BID price for " + symbol_name + "\"}";
      if(normalized_sl > 0 || normalized_tp > 0)
      {
         success = trade.Sell(volume_val, symbol_name, 0, normalized_sl, normalized_tp, comment);
         if(success) WriteLog("SELL: " + symbol_name + " Vol:" + DoubleToString(volume_val, 2) + " SL:" + DoubleToString(normalized_sl, 5) + " TP:" + DoubleToString(normalized_tp, 5));
         else WriteLog("SELL FAILED: " + trade.ResultRetcodeDescription());
      }
      else
      {
         success = trade.Sell(volume_val, symbol_name, 0, 0, 0, comment);
         if(success) WriteLog("SELL: " + symbol_name + " Vol:" + DoubleToString(volume_val, 2) + " (no SL/TP)");
         else WriteLog("SELL FAILED: " + trade.ResultRetcodeDescription());
      }
   }
   else
      return "{\"error\":\"Invalid order type\"}";
   if(success)
   {
      ulong order_ticket = trade.ResultOrder();
      ulong deal_ticket = trade.ResultDeal();
      double executed_price = trade.ResultPrice();
      string json = "{";
      json = json + "\"success\":true,";
      json = json + "\"order\":" + IntegerToString((long)order_ticket) + ",";
      json = json + "\"deal\":" + IntegerToString((long)deal_ticket) + ",";
      json = json + "\"volume\":" + DoubleToString(volume_val, 2) + ",";
      json = json + "\"price\":" + DoubleToString(executed_price, digits) + ",";
      json = json + "\"sl\":" + DoubleToString(normalized_sl, digits) + ",";
      json = json + "\"tp\":" + DoubleToString(normalized_tp, digits);
      json = json + "}";
      return json;
   }
   else
   {
      uint retcode = (uint)trade.ResultRetcode();
      string error_msg = trade.ResultRetcodeDescription();
      return "{\"error\":\"" + error_msg + "\",\"retcode\":" + IntegerToString((long)retcode) + "}";
   }
}

//+------------------------------------------------------------------+
//| Handle close position request                                    |
//+------------------------------------------------------------------+
string HandleClosePosition(ulong ticket)
{
   int total = PositionsTotal();
   bool found = false;
   string symbol_name = "";
   double volume_val = 0;
   ENUM_POSITION_TYPE pos_type = WRONG_VALUE;
   ulong pos_ticket = 0;
   Print("🔍 Looking for position with ticket: ", ticket);
   Print("📊 Total positions: ", total);
   for(int i = 0; i < total; i++)
   {
      ulong ticket_id = PositionGetTicket(i);
      if(ticket_id > 0)
      {
         Print("   Position ", i, ": ticket = ", ticket_id);
         if(ticket_id == ticket)
         {
            Print("✅ Found matching position!");
            pos_ticket = ticket_id;
            symbol_name = PositionGetString(POSITION_SYMBOL);
            volume_val = PositionGetDouble(POSITION_VOLUME);
            pos_type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
            found = true;
            Print("   Symbol: ", symbol_name, ", Volume: ", volume_val, ", Type: ", EnumToString(pos_type));
            break;
         }
      }
   }
   if(!found)
      return "{\"error\":\"Position not found. Ticket: " + IntegerToString((long)ticket) + "\"}";
   symbol_info.Name(symbol_name);
   if(!symbol_info.Name(symbol_name))
      return "{\"error\":\"Symbol not found: " + symbol_name + "\"}";
   MqlTick tick;
   if(!SymbolInfoTick(symbol_name, tick))
      return "{\"error\":\"Could not get tick data for " + symbol_name + "\"}";
   ENUM_ORDER_TYPE order_type;
   double price;
   if(pos_type == POSITION_TYPE_BUY)
   {
      order_type = ORDER_TYPE_SELL;
      price = tick.bid;
   }
   else if(pos_type == POSITION_TYPE_SELL)
   {
      order_type = ORDER_TYPE_BUY;
      price = tick.ask;
   }
   else
      return "{\"error\":\"Invalid position type\"}";
   Print("🔒 Attempting to close position with PositionClose()...");
   WriteLog("Closing: Ticket " + IntegerToString((long)pos_ticket) + " " + symbol_name);
   if(trade.PositionClose(pos_ticket))
   {
      Print("✅ PositionClose() succeeded!");
      WriteLog("Closed: Ticket " + IntegerToString((long)pos_ticket));
      Sleep(100);
      return "{\"success\":true,\"ticket\":" + IntegerToString((long)pos_ticket) + ",\"closed_price\":" + DoubleToString(price, symbol_info.Digits()) + "}";
   }
   else
   {
      Print("⚠️ PositionClose() failed, trying OrderSend()...");
      uint retcode = (uint)trade.ResultRetcode();
      string retdesc = trade.ResultRetcodeDescription();
      Print("   Retcode: ", retcode, ", Description: ", retdesc);
      MqlTradeRequest request = {};
      MqlTradeResult result = {};
      request.action = TRADE_ACTION_DEAL;
      request.symbol = symbol_name;
      request.volume = volume_val;
      request.type = order_type;
      request.position = pos_ticket;
      request.price = price;
      request.deviation = 20;
      request.magic = 234000;
      request.comment = "Close position";
      request.type_time = ORDER_TIME_GTC;
      request.type_filling = ORDER_FILLING_IOC;
      Print("📤 Sending OrderSend() with:");
      Print("   Symbol: ", symbol_name);
      Print("   Volume: ", volume_val);
      Print("   Type: ", EnumToString(order_type));
      Print("   Position: ", pos_ticket);
      Print("   Price: ", price);
      if(OrderSend(request, result))
      {
         Print("✅ OrderSend() succeeded! Retcode: ", result.retcode);
         if(result.retcode == TRADE_RETCODE_DONE)
            return "{\"success\":true,\"ticket\":" + IntegerToString((long)pos_ticket) + ",\"order\":" + IntegerToString((long)result.order) + ",\"price\":" + DoubleToString(result.price, symbol_info.Digits()) + "}";
         else
            return "{\"error\":\"Close failed: " + IntegerToString(result.retcode) + " - " + result.comment + "\"}";
      }
      else
      {
         int error_code = GetLastError();
         Print("❌ OrderSend() failed! Error: ", error_code);
         return "{\"error\":\"OrderSend failed: " + IntegerToString(error_code) + "\"}";
      }
   }
}

//+------------------------------------------------------------------+
//| Handle history request                                           |
//+------------------------------------------------------------------+
string HandleHistory()
{
   string json = "{\"trades\":[";
   bool first = true;
   datetime from_date = TimeCurrent() - 2592000;
   datetime to_date = TimeCurrent();
   if(HistorySelect(from_date, to_date))
   {
      int total = HistoryDealsTotal();
      for(int i = 0; i < total; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket > 0)
         {
            int entry_type = (int)HistoryDealGetInteger(ticket, DEAL_ENTRY);
            if(entry_type == DEAL_ENTRY_OUT)
            {
               if(!first) json = json + ",";
               first = false;
               string deal_type = (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY) ? "BUY" : "SELL";
               json = json + "{";
               json = json + "\"ticket\":" + IntegerToString((long)ticket) + ",";
               json = json + "\"symbol\":\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\",";
               json = json + "\"type\":\"" + deal_type + "\",";
               json = json + "\"volume\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
               json = json + "\"price\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
               json = json + "\"profit\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
               json = json + "\"entry\":\"" + (entry_type == DEAL_ENTRY_IN ? "IN" : "OUT") + "\",";
               json = json + "\"time\":\"" + TimeToString((datetime)HistoryDealGetInteger(ticket, DEAL_TIME), TIME_DATE|TIME_SECONDS) + "\"";
               json = json + "}";
            }
         }
      }
   }
   json = json + "]}";
   return json;
}

//+------------------------------------------------------------------+
//| Handle candles request (OHLC data)                              |
//+------------------------------------------------------------------+
string HandleCandles(string symbol_name, string timeframe_str, int count)
{
   Print("📊 Candles request: Symbol=", symbol_name, ", Timeframe=", timeframe_str, ", Count=", count);
   if(!SymbolSelect(symbol_name, true))
      return "{\"error\":\"Symbol not found: " + symbol_name + "\"}";
   ENUM_TIMEFRAMES timeframe = PERIOD_H1;
   if(timeframe_str == "M1") timeframe = PERIOD_M1;
   else if(timeframe_str == "M5") timeframe = PERIOD_M5;
   else if(timeframe_str == "M15") timeframe = PERIOD_M15;
   else if(timeframe_str == "M30") timeframe = PERIOD_M30;
   else if(timeframe_str == "H1") timeframe = PERIOD_H1;
   else if(timeframe_str == "H4") timeframe = PERIOD_H4;
   else if(timeframe_str == "D1") timeframe = PERIOD_D1;
   else if(timeframe_str == "W1") timeframe = PERIOD_W1;
   else if(timeframe_str == "MN1") timeframe = PERIOD_MN1;
   MqlRates rates[];
   int copied = CopyRates(symbol_name, timeframe, 0, count, rates);
   if(copied <= 0)
   {
      int error = GetLastError();
      return "{\"error\":\"Failed to get candles. Error: " + IntegerToString(error) + "\"}";
   }
   Print("✅ Copied ", copied, " candles for ", symbol_name);
   string json = "{\"symbol\":\"" + symbol_name + "\",";
   json = json + "\"timeframe\":\"" + timeframe_str + "\",";
   json = json + "\"count\":" + IntegerToString(copied) + ",";
   json = json + "\"candles\":[";
   int digits = (int)SymbolInfoInteger(symbol_name, SYMBOL_DIGITS);
   for(int i = 0; i < copied; i++)
   {
      if(i > 0) json = json + ",";
      json = json + "{";
      json = json + "\"time\":\"" + TimeToString(rates[i].time, TIME_DATE|TIME_SECONDS) + "\",";
      json = json + "\"open\":" + DoubleToString(rates[i].open, digits) + ",";
      json = json + "\"high\":" + DoubleToString(rates[i].high, digits) + ",";
      json = json + "\"low\":" + DoubleToString(rates[i].low, digits) + ",";
      json = json + "\"close\":" + DoubleToString(rates[i].close, digits) + ",";
      json = json + "\"volume\":" + IntegerToString((long)rates[i].tick_volume);
      json = json + "}";
   }
   json = json + "]}";
   return json;
}
//+------------------------------------------------------------------+
