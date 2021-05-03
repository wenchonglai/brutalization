# Brutalization

## Summary
Brutalization is a turn-based single player strategy board game that implements the logic of real wars and simulates marching and battles affected by logistics, morality, and formations. A user can compete against computer players, control units to attack enemy units, and eventually win the game by having higher scores or defeating other computer players.

## Technologies
- JavaScript (ES2018+) for game logic
- Classes inheriting self-developed VirtualDOM class for ui
- Canvas and SVG layers for rendering

## MVP List
- MVP #1
  - A unit consumes move points to move, alert, or battle.
  - A unit can save and accumulate move points to the next turn.
  - When the destination tile has an enemy unit, the unit will enter a battle mode instead of moving into the tile.
- MVP #2
  - Hunger, tiredness, morality, formation, and experience altogether affect the overall military might of a unit.
  - The probability of winning relies on the relative military mights of the two opposing units in a battle.
  - A unit gains experience by marching (minimally) or enter into a battle.
- MVP #3
  - The game has a splash page with a "start game" button, as well as the main game page. The game board is visualized in an isometric view with each unit represented by a pin-like icon.
  - A user can control a unit using either mouse gestures or menu buttons.
  - The approximate information of a user-controlled unit will be indicated. The data of a computer-controlled unit or the exact data of a user-controlled unit will NOT be revealed.
- MVP #4
  - The computer player incorporates a bare minimum of AI and controls units. 
  - A computer-controlled unit can march/attack targeting a user unit.
  - A computer-controlled unit can recalculate the path and goals every turn.

## Timeline
- Apr 24 (Sat)
  - Conceptualize the game idea.
- Apr 25 (Sun)
  - Build game object classes. Incorporate BFS and a* algorithms for pathfinding.
- Apr 26 (Mon)
  - Complete the unit class with simulation calculations.
- Apr 27 (Tue)
  - Implement the overall rendering framework using Canvas and SVG.
- Apr 28 (Wed)
  - Design event listeners and/or menu buttons for user interactivity.
- Apr 29 (Thu)
  - Incorporate basic graphics.
- Apr 30 (Fri)
  - Incorporate basic AI
