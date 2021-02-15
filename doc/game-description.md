# !!CHESS Documentation
!!CHESS is a turn-based board game. Evolved from the conventional chess, !!CHESS introduces a vibrant set of rules involving bonus attacks, formation, logistics, and morality.

---

## Units
* ### Infantry Units
  (HP: 100)

  (Movement: 2.0 / turn; 3.5 / day)

  (Carrying Load: 15 food + 2 quivers)

  An Infantry unit is a soldier unit that marches and battles on foot. By default, each team has eight (8) Infantry units of different types at the start of the game.

  The different types of Infantry Units include:

  * #### Scout
    (Movement: 2.5 / turn; 4.0 / day)
    The Scout unit receives extra bonuses in vision, movements, and ranged attacks.
  * #### Guard
    The Guard unit has higher loyalty than other units and receives higher bonus while defending the castle. Units next to the Guard unit can change form faster and receives extra defense bonus in the friendly territory.
  * #### Innkeeper
    (Carrying Load: 45 food + 6 quivers)
    The Innkeeper unit receives a slight increase in its carrying capacity and mitigates the loss of morality of adjacent units. 
  * #### Doctor
    The Doctor unit reduces the death rates and boosts the recovery of adjacent injured units.
  * #### Merchant
    (Carrying Load: 90 food + 12 quivers)

    The Merchant unit receives extra carrying capacity.
  * #### Clerk
    The Clerk unit receives extra formation bonus and less formation debuffs while adjacent to a special unit.
  * #### Worker
    The Worker unit can replenish weapon supplies everywhere (at a slower rate). It also receives extra bonus in siege attacks and defense.
  * #### Farmer
    The Farmer unit can retain and replenish food from any friendly territory landmass.
  
* ### Cavalry Units
  (HP: 150)

  (Movement: 4.0 / turn; 4.5 / day)

  (Carrying Load: 45 food)

  A Cavalry unit is a solder unit skilled in horseback riding and battles. By default, each team has two (2) Cavalry units at the start of the game. Cavalry units receives attack bonus while charging the flank or the rear of an enemy Infantry unit.

* ### Special Units
  By default, each team has one (1) King, (1) Queen, (1) Commander, and (1) Joker at the start of the game:

  * #### King
    (HP: 100)

    (Movement: 4.0 / turn; 4.5 / day)

    (Carrying Load: 45 food)

    The player loses when the King is killed. Units adjacent to the King unit receives morality bonus.

  * #### Queen
    (HP: 100)

    (Movement: 4.0 / turn; 4.5 / day)

    (Carrying Load: 45 food)

    It will take the player's Commander unit longer to deploy battle tactics when the Queen is killed. The Queen unit will not surrender. Units adjacent to the Queen unit receives morality bonus.

  * #### Commander
    (HP: 150)

    (Movement: 4.0 / turn; 5.0 / day)

    (Carrying Load: 45 food)

    The Commander unit can deploy any battle tactics except Assassination. As long as the Queen is alive, the Commander unit will not surrender. Units next to the Commander unit receives morality bonus and can change form faster.

  * #### Joker
    (HP: 50)

    (Movement (unless in disguise): 4.0 / turn; 4.5 / day)

    (Carrying Load: 15 food)
    
    The Joker can disguise into any other friendly or enemy units. When disguised as the player's Commander unit or in disguise, the joker can deploy any battle tactics except Sniping. A joker cannot be easily spotted by any enemy units except the enemy's Commander or Joker.

---

## Battle Tactics
* ### Ambush
  When an ambush is successfully initiated, an effected unit will be invisible to the enemy for a limited amount of turns.

* ### Misinformation
  When a Misinformation is successfully initiated, an illusive unit will be generated and be visible to the enemy for a limited amount of turns. The illusive unit will disappear when attacked.

* ### Sniping
  When a Sniping is successfully initiated towards a targeted special unit, the targeted unit will be killed immediately. This tactic cannot be initiated towards a non-special unit.

* ### Assassination
  When an Assassination is successfully initiated towards a targeted Special Unit, the targeted unit will be killed immediately. This tactic cannot be initiated towards a non-special unit.

---
## Formation

A unit can end a turn in any of the following forms:

* ### Linear Form
  A Linear form has three (3) sides: the Front, the Flank, and the Back. The following rules applies

  While Defending:

  * An Infantry unit inflicts 100% defense bonus against a Cavalry unit attacking towards its Front.

  While Attacking the Flank:

  * An Infantry unit inflicts 25% attack bonus against an Infantry unit and 25% attack bonus against a Cavalry unit.
  * A Cavalry unit inflicts 100% attack bonus against an Infantry unit and 50% attack bonus against a Cavalry unit.

  While Attacking the Back:
  * An Infantry unit inflicts 25% attack bonus against an Infantry unit and 15% attack bonus against a Cavalry unit.
  * A Cavalry unit inflicts 150% attack bonus against an Infantry unit 25% attack bonus against a Cavalry unit.

* ### Defense Form
  An Infantry unit in Defense form inflicts 50% extra defense bonus against a Knight unit charging from any direction.

  Only Infantry units can change into the Defense form.

  A unit can bypass an enemy unit in Defense form.

  A unit in Defense form rests can not move or attack. 

* ### Rest Form

* ### No Form  
  While Attacking a unit in No form:

  * An Infantry unit inflicts 50% attack bonus against a Cavalry unit and 100% attack bonus against an Infantry unit.
  * A Cavalry unit inflicts 50% attack bonus against a Cavalry unit and 150% attack bonus against an Infantry unit.

  A unit in No form can not attack.

Changing formation (except for changing into No form) consumes 0.5 movement each time.

### Summary of Form-related attack bonuses

| Attacker | Enemy Form    | against Infantry | against Cavalry |
| -------- | ------------- | ---------------- | --------------- |
| Infantry | Linear Front  | 0                | 0               |
| Infantry | Linear Flank  | +25%             | +25%            |
| Infantry | Linear Rear   | +25%             | +15%            |
| Cavalry  | Linear Front  | 0                | 0               |
| Cavalry  | Linear Flank  | +100%            | +50%            |
| Cavalry  | Linear Rear   | +150%            | +25%            |
| Cavalry  | Defense Form  | 0                | 0               |
| Cavalry  | No Form       | +150%            | +50%            |
|          |               |                  |                 |

---
## Logistics

A unit can carry a specified amount of food and quivers (see table below).

| Unit Type             | Carrying Capacity    | Food Consumption Rate |
| --------------------- | -------------------- | --------------------- |
| Inn Keeper (Infantry) | 45 food / 6 quivers  | 1 food / turn         |
| Merchant (Infantry)   | 90 food / 12 quivers | 3 food / turn         |
| Infantry (Default)    | 15 food / 2 quivers  | 1 food / turn         |
| Cavalry               | 45 food              | 3 food / turn         |
| King                  | 45 food              | 3 food / turn         |
| Queen                 | 45 food              | 3 food / turn         |
| Commander             | 45 food              | 3 food / turn         |
| Joker                 | 15 food              | 1 food / turn         |
|                       |                      |                       |

When a unit is within or one grid adjacent to a friendly castle, the unit automatically replenish the supply when the turn ends.

When a unit is adjacent to a unit in hunger, the unit will automatically share food with the adjacent unit until the state of hunger is lifted.

The morality and attack power starts diminishing after a unit does not consume food after the end of a turn.

---
## Morality

The following aspects can affect the morality of a unit:
- Staying away from the friendly territory for too long.
- Winning consecutively in the enemy territory.
- Winning in the friendly territory.
- Being defeated in the enemy territory.
- Being defeated consecutively.
- Not being able to eat (aggravates when in hunger state).

Morality affects the following aspects of a unit:

- The attack and defense powers.
- The probability of degeneration into a Rout state after being defeated.
- The probablility of surrendering to the enemy when encircled.

---

## States

A unit can get into one or more of the following states:

- ### Hunger
  A unit not consuming food for over a day will enter into Hunger state.
  The hunger state can be lifted until a unit restart consuming food (at 2x rate) and eliminates the previous deficit in food consumption

- ### Rout

  A unit with high casualties in a battle may degenerate into Rout state. A unit in Rout state will automatically and randomly seek to run away from any enemy unit.
  The Rout satate