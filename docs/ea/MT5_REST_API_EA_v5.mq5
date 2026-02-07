//+------------------------------------------------------------------+
//| MT5_REST_API_EA_v5.mq5 - Bridge naar AI Trading webapp           |
//| Version 5.0: schrijft balance, equity, profit, openPositions     |
//| naar status.json voor dashboard en orders via commands.json.     |
//+------------------------------------------------------------------+
#property copyright "AI Trading"
#property link      ""
#property version   "5.0"
#property description "Version 5.0: status.json met balance/equity/profit/openPositions voor dashboard."

// Gebruik aanhalingstekens: zoekt .mqh in dezelfde map als deze EA.
// Zet MT5_StatusWriter.mqh in dezelfde map als dit bestand (bijv. MQL5/Experts/).
#include "MT5_StatusWriter.mqh"

input int StatusWriteIntervalSec = 1;  // Status naar status.json elke N seconden

int g_timerHandle = -1;

//+------------------------------------------------------------------+
int OnInit()
{
   WriteMT5Status();
   g_timerHandle = EventSetTimer(StatusWriteIntervalSec);
   if (g_timerHandle == -1)
   {
      Print("MT5_REST_API_EA: EventSetTimer failed");
      return INIT_FAILED;
   }
   Print("MT5_REST_API_EA v5.0: started, status.json every ", StatusWriteIntervalSec, "s");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if (g_timerHandle >= 0)
      EventKillTimer();  // MQL5: geen parameter
   Print("MT5_REST_API_EA v5.0: stopped");
}

//+------------------------------------------------------------------+
void OnTick()
{
   WriteMT5Status();
   // Hier: lees commands.json, voer orders uit, schrijf responses.json
   // (je bestaande order-logica blijft hier)
}

//+------------------------------------------------------------------+
void OnTimer()
{
   WriteMT5Status();
}

//+------------------------------------------------------------------+
