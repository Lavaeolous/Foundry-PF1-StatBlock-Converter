# Foundry-PF1-StatBlock-Converter
Tool to parse Creature StatBlocks for the Pathfinder 1 GameSystem on FoundryVTT

This Tool takes a Statblock as found on the srd, aon or in pdfs per copy and paste and tries to convert that to a usable json. The generated JSON can, if everything works as intended, be imported in Foundry. As this is a first draft, i guess most of the time it will not work :slight_smile: But maybe it's useful for some of you.

Steps:
1. Copy and Paste a Statblock into the left input field and click "Convert Stat Block"
2. Visually inspect the Output on the right side. If nothing appears, check the console (F12), as in most of the cases there will be a part in the Statblock thats not formatted in a way thats readable for the converter
3. Download the JSON file
4. Create a new NPC Actor in Foundry (with a placeholder name), right click on it and select "Import Data". Pick the JSON you generated.
5. Open the Actor Sheet, navigate to the Permanent Buff section and open the Buff "Conversion Changes"
6. Edit one of the Values in there (e.g. change a 6 into a 5, tab out of the field and change it back again) to trigger an item/sheet update

Currently, the tool only parses the following data and generates equivalent Foundry Data and Items:

![Status Image](/assets/images/status.png)

*  Name
*  CR
*  XP
*  Gender
*  Race*
*  Class(es) *
*  Alignment
*  Size ***
*  Type (Subtype) *
*  Init
*  Senses ***
*  Aura
*  AC (AC, Touch and Flat-Footed) **
*  HP **
*  Hit Dice **
*  Saves **
*  Defensive Abilities * (WIP)
*  Immunities, Resistances, Weaknesses (WIP)
*  Damage and Spell Resistance
*  Tactics (Before Combat, During Combat, Morale)
*  Attributes Str, Dex, Con, Int, Wis, Cha
*  BAB
*  CMD and CMB (WIP)


\* A new Item is created for these Values including the needed calculations for Hit Dice, HP, etc.  
\*\* Including the needed calculations  
\*\*\* Including changes to the token (e.g. size and vision)

**Known Bugs:**
*  Not all Statblocks are equally formatted. As long as its reasonably well formed (as in the default one included), it should work
*  Changes in Items (Creature Types, Classes, Conversion Changes) are not automatically updated after importing
*  A lot more ... see Issues. If you find anythings thats not noted there, please include it


**To Do:**
*  Bug Fixing
*  Finish the mapping of statistics to the foundry-json (including Feats, Skills, Racial Skill Modifiers, Languages, Special Qualities, Gear)
*  Parse Attacks, Spells, Ecology, Description (only for SRD-Content), Gear & Treasure, Special Abilities
*  Give usable Feedback in the status bar (for now some comments are visible in the console)
*  Sometime in the future make a module out of it, maybe