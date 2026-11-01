# Important Project Rules & Architecture Guidelines

1. **Performance First (No Blur)**:
   - Never use `backdrop-filter: blur()` or `filter: blur()` in UI components to ensure 60fps smooth animations on mobile Android devices.
   - Use solid multi-stop gradients, crisp borders, and lightweight CSS animations instead.
   - Memoize heavy components (`React.memo`, `useMemo`, `useCallback`).
2. **File Size Limit (< 700 Lines)**:
   - Keep every source file concise and modular (under 300-400 lines ideally, strictly under 700 lines).
3. **Documentation Sync**:
   - Always update `APP_MAP.md` whenever files, UI components, or logic interfaces are added or modified.
   - Store plans and test results in `docs/`, and move plans older than 7 days to `docs/history/`.
4. **Game Rules Summary**:
   - 3~4 Players, Cards 3~35 (33 cards total), 2~9 cards randomly excluded at start (hidden until game ends).
   - 11 Ruby Coins per player. Host selects whether coin counts are Public or Hidden at game start.
   - Turn order determined by rolling 2 dice (ties re-roll among tied players).
   - On turn: either pay 1 coin to pass, or take the card + all coins on it.
   - Taking a card flips the next card AND advances the turn to the next player (does NOT repeat turn).
   - If a player has 0 coins on their turn, they MUST take the card.
   - Consecutive numbers (e.g., 11, 12, 13) count only as the lowest number (11).
   - Lowest `(Card Sum - Coin Count)` wins. Ties broken by highest coin count.
