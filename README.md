# Foundry-PF1-StatBlock-Converter
Tool to parse Creature StatBlocks for the Pathfinder 1 GameSystem on FoundryVTT

This Tool takes a Statblock as found on the srd, aon or in pdfs per copy and paste and tries to convert that to a usable json. The generated JSON can, if everything works as intended, be imported in Foundry. As this is a first draft, i guess most of the time it will not work :slight_smile: But maybe it's useful for some of you.

Currently, the tool only parses the following and generates equivalent Foundry Data and Items:
* general data (most of everything in the first block typically found in a statblock, except race and source)
* creature types and classes
* Tactics (e. g. Before Battle, During Battle, Morale)
*  defense data (e.g. ac/touch/flat-footed, DR, SR, Saves)
*  statistics data, not complete, currently only the abilities (Str, Dex, etc.)

**Known Bugs:**
*  Not all Statblocks are equally formatted. As long as its reasonably well formed (as in the default one included), it should work
*  Changes in Items (Creature Types, Classes, Conversion Changes) are not automatically updated after importing
*  A reload of the site is needed after conversion, because not everything is resetted as needed :(
*  A lot more ...

To trigger the update-function of the Sheet you need to open each Item under Features/Classes and Buffs/Permanent and change at least one value.

**To Do:**
*  Bug Fixing
*  Finish the mapping of statistics to the foundry-json (including Feats, Skills, Racial Skill Modifiers, Languages, Special Qualities, Gear)
*  Parse Attacks, Spells, Ecology, Description (only for SRD-Content), Gear & Treasure, Special Abilities
*  Give usable Feedback in the status bar (for now some comments are visible in the console)
*  Sometime in the future make a module out of it, maybe