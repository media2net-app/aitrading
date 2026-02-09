#!/bin/bash
# Zoek debugbestanden die de EA schrijft (FILE_COMMON). Run na het starten van de EA.
BASE="$HOME/Library/Application Support/net.metaquotes.wine.metatrader5"
echo "=== Zoeken naar mt5_debug_5004.txt (eenmalig bij error 5004) ==="
find "$BASE" -name "mt5_debug_5004.txt" 2>/dev/null
find "$BASE" -name "mt5_debug_5004.txt" 2>/dev/null | while IFS= read -r f; do
  echo "--- Inhoud $f ---"
  cat "$f"
  echo ""
done
echo ""
echo "=== Zoeken naar ea_init_ok.txt (map waar EA kan schrijven = FILE_COMMON+BotFilePath) ==="
find "$BASE" -name "ea_init_ok.txt" 2>/dev/null
find "$BASE" -name "ea_init_ok.txt" 2>/dev/null | while IFS= read -r f; do
  echo "--> EA schrijft in map: $(dirname "$f")"
  cat "$f"
  echo ""
done
echo ""
echo "=== mt5_debug_common_path.txt ==="
find "$BASE" -name "mt5_debug_common_path.txt" 2>/dev/null
find "$BASE" -name "mt5_debug_common_path.txt" 2>/dev/null | while IFS= read -r f; do
  echo "--- Inhoud $f ---"
  cat "$f" | tr -d '\0'
  echo ""
done
