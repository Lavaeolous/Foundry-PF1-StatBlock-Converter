import templateData from "./templateData.js"
import templateActor from "./templateActor.js"
import templateClassData from "./templateClassData.js"
import templateClassItem from "./templateClassItem.js"
import templateConversionItem from "./templateConversionItem.js"
import enumTypes from "./enumTypes.js"
import enumSubtypes from "./enumSubtypes.js"
import enumClassAndLevel from "./enumClassAndLevel.js"
import enumClassData from "./enumClassData.js"
import enumBonusTypes from "./enumBonusTypes.js"


/*
 * Statblock Parser
 */

// Global Variables

var dataInput;
var dataInputHasClasses = "false";
var dataOutput;
var dataTemplate;
var formattedInput;

var enumAttributes = [
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha"
]

var enumSizes = [
    "Fine",
    "Diminutive",
    "Tiny",
    "Small",
    "Medium",
    "Large",
    "Huge",
    "Gargantuan",
    "Colossal"
];

var carrySizeModificators = {
    "Fine": 1/8,
    "Diminutive": 1/4,
    "Tiny": 1/2,
    "Small": 3/4,
    "Medium": 1,
    "Large": 2,
    "Huge": 4,
    "Gargantuan": 8,
    "Colossal": 16
};

var enumTokenSize = {
  "Fine": { w: 1, h: 1, scale: 0.2 },
  "Diminutive": { w: 1, h: 1, scale: 0.4 },
  "Tiny": { w: 1, h: 1, scale: 0.6 },
  "Small": { w: 1, h: 1, scale: 0.8 },
  "Medium": { w: 1, h: 1, scale: 1 },
  "Large": { w: 2, h: 2, scale: 1 },
  "Huge": { w: 3, h: 3, scale: 1 },
  "Gargantuan": { w: 4, h: 4, scale: 1 },
  "Colossal": { w: 6, h: 6, scale: 1 },
};


var enumSaves = [
    "fort",
    "ref",
    "will"
];
var enumSaveModifier = [
    "con",
    "dex",
    "wis"
];
    


// Get HTML Elements
var outputTextArea = document.getElementById("output");
var inputTextArea = document.getElementById("input");
var statusOutput = document.getElementById("statusOutput");

window.init = init;
window.convertStatBlock = convertStatBlock;
window.saveJSON = saveJSON;


// Initilization
function init() {

    console.log("init");
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    // Load FoundryVTT Actor Template
    
    dataTemplate = templateActor;
    console.log(dataTemplate);
}



/**
 * 
 * READ THE INPUT AND SPLIT IT INTO MANAGEABLE BLOCKS
 *
 **/

// Start Converting the statBlock
function convertStatBlock(input) {
    
    init();
    
    // Remove empty lines with replace(/^\s*[\r\n]/gm,"")
    // Replace weird minus signs with .replace(/–/,"-")
    dataInput = input.value.replace(/^\s*[\r\n]/gm,"").replace(/–/gm,"-");
    
    // console.log("dataInput: " + dataInput);
        
    /* Separate into Blocks
     * 
     * stringGeneralData: Name, CR, XP, Alignment, Type, Subtype, Init, Senses, Aura
     * stringDefenseData: AC, Touch, Flat-Footed, AC-Bonus-Types, HP, Hit Dice, Saves, Immunities, Resistances, Weaknesses, SR
     */
    
    let splitInput = "";
    
    let stringGeneralData = "";
    let stringDefenseData = "";
    let stringOffenseData = "";
    let stringTacticsData = "";
    let stringStatisticsData = "";
    let stringSpecialAbilitiesData = "";
    let stringGearData = "";
    let stringEcologyData = "";
    
    // Set some flags for (optional) data blocks found in the input
    
    let foundDefenseData = true;
    let foundOffenseData = true;
    let foundTacticsData = false;
    let foundStatisticsData = true;
    let foundSpecialAbilitiesData = false;
    let foundEcologyData = false;
    
    if(dataInput.search(/(\nDEFENSE\n)|(\nDEFENSES\n)/gmi) == -1) { foundDefenseData = false; }
    if(dataInput.search(/\nOFFENSE\n/gmi) == -1) { foundOffenseData = false; }
    if(dataInput.search(/\nTACTICS\n/gmi) !== -1) { foundTacticsData = true; }
    if(dataInput.search(/\nSTATISTICS\n/gmi) == -1) { foundStatisticsData = false; }
    if(dataInput.search(/\nSPECIAL ABILITIES\n/gmi) !== -1) { foundSpecialAbilitiesData = true; }
    if(dataInput.search(/\nECOLOGY\n/gmi) !== -1) { foundEcologyData = true; }
    
    if(foundDefenseData == false || foundOffenseData == false || foundStatisticsData == false) {
        console.log("Not enough Data, check if at least a block marked with defense, offense and statistics is included in the input");
        statusOutput.innerHTML += "<p class='criticalErrorMsg'>Not enough Data, check if at least a block marked with defense, offense and statistics is included in the input</p>";
        return;
    }
    
    let tempInputRest = "";

    // Split stringGeneralData, e.g. everything between the Start of the Input and "AC", removing "DEFENSE"
    splitInput = dataInput.split(/^AC/m);
    tempInputRest = "AC".concat(splitInput[1]);
    stringGeneralData = splitInput[0].replace(/(DEFENSE)/,"");
    splitInput = "";
        
    // Split stringDefenseData, everything between AC and Speed
    splitInput = tempInputRest.split(/(Speed)|(speed)/);
    tempInputRest = "Speed".concat(splitInput[3]);
    stringDefenseData = splitInput[0].replace(/(OFFENSE)/,"");
    splitInput = "";
            
    // Split stringOffenseData, everything between Speed and Tactics or Statistics
    // If there is a tactics block, split there, parse Offense and tactics next
    if(foundOffenseData && foundTacticsData == true)  {
        console.log("tactics found");
        splitInput = tempInputRest.split(/\nTACTICS\n/gmi);
        tempInputRest = splitInput[1];
        stringOffenseData = splitInput[0].replace(/\nTACTICS\n/gmi,"");
        splitInput = "";
    }  
    // If there is no tactics block, split and parse Offense and Statistics next 
    else if (foundOffenseData == true) {
        splitInput = tempInputRest.split(/\nStr/);
        console.log("splitInput No TACTICS: " + splitInput[0]);
        tempInputRest = "Str".concat(splitInput[1]);
        stringOffenseData = splitInput[0].replace(/(OFFENSE)/gmi,"").replace(/(STATISTICS)/gmi,"");
        splitInput = "";
    }
    
    // Split Tactics Data if available (mainly NPCs)
    if(foundTacticsData == true) {
        console.log("splitting tactics");
        splitInput = tempInputRest.split(/\nStr/);
        tempInputRest = "Str" + splitInput[1];
        stringTacticsData = splitInput[0].replace(/(STATISTICS)/gmi,"");
        splitInput = "";
    }
    
    // Split Statistics
    if(foundStatisticsData == true) {
        console.log("splitting statistics");
        // Check if there are Special Abilities or Ecology Data following the Statistics
        let splitInput = "";
        let tempSplit = "";
        
        if(foundSpecialAbilitiesData == true) {
            console.log("found Special Abilities");
            tempSplit = tempInputRest.split(/SPECIAL ABILITIES/gmi)
            splitInput = tempSplit[0];
            tempInputRest = tempSplit[1];
        } else if (foundEcologyData == true) {
            console.log("found Ecology");
            tempSplit = tempInputRest.split(/ECOLOGY/gmi)
            splitInput = tempSplit[0];
            tempInputRest = tempSplit[1];
        } else {
            console.log("found not further data blocks");
            splitInput = tempInputRest;
        }
        stringStatisticsData = splitInput;
        
    }
    
    /*
    if(dataInput.indexOf("SPECIAL ABILITIES") !== -1) {
        splitInput = tempInputRest.split("SPECIAL ABILITIES");
        tempInputRest = splitInput[1];
        stringStatisticsData = splitInput[0];
        splitInput = "";
    }
    
    if(dataInput.indexOf("GEAR") !== -1) {
        splitInput = tempInputRest.split("GEAR");
        tempInputRest = splitInput[1];
        stringSpecialAbilitiesData = splitInput[0];
        splitInput = "";
    }
    
    if(dataInput.indexOf("ECOLOGY") !== -1) {
        splitInput = tempInputRest.split("ECOLOGY");
        stringGearData = splitInput[0];
        stringEcologyData = splitInput[1];
        splitInput = "";
    }*/
    
    /*
    console.log("stringGeneralData: " + stringGeneralData);
    console.log("stringDefenseData: " + stringDefenseData);
    console.log("stringOffenseData: " + stringOffenseData);
    console.log("stringTacticsData: " + stringTacticsData);
    console.log("stringStatisticsData: " + stringStatisticsData);
    console.log("stringSpecialAbilitiesData: " + stringSpecialAbilitiesData);
    console.log("stringGearData: " + stringGearData);
    console.log("stringEcologyData: " + stringEcologyData);
    */
    
    
    /*
     * Extract Values from the Blocks
     * and save that in a temporaryData Object
     * to be mapped onto the dataTemplate later
     */
    
    formattedInput = templateData;
    
    // Take General Data and extract Name, CR, XP and Stuff
    splitGeneralData(stringGeneralData);
    
    // Take Defense Data and extract AC, HP, Immunities and Stuff
    splitDefenseData(stringDefenseData);
    
    // Take Offense Data and extract 
    //splitOffenseeData(stringOffenseData);
    
    // Take Tactics Data and extract Stuff
    if(foundTacticsData == true) {
        splitTacticsData(stringTacticsData);
    }
    
    // Take Statistics Data and extract Attribute, BAB, CMB, CMD, Feats, Skills, Languages, SQs and Gear
    splitStatisticsData(stringStatisticsData);
    
    
    

    
    // Map SchemaData to TemplateData
    mapInputToTemplateFoundryVTT(formattedInput);
}

/**
 * 
 * READ AND FORMAT THE SEPARATE BLOCKS ONTO A PLACEHOLDER DATA SCHEME
 *
 **/

// Split General Data and extract Name, CR, XP and Stuff
function splitGeneralData(stringGeneralData) {
    console.log("parsing General Data");
    // Separate Name and Challenge Rating
    
    let splitGeneralData = stringGeneralData.replace(/\n/gm,"");
        
    // Name (every char until "CR" is found)
    let splitName = splitGeneralData.match(/.+?(?=CR)/)[0];
    
    // CR
    let splitCR = splitGeneralData.match(/(?!CR )(\d+)/)[0];
    
    // XP
    let splitXP = splitGeneralData.match(/(?:XP )([\d,.]+)/)[0].replace(/([\D]|[,?]|[\.?])/g,"");
    
    //Alignment
    let splitAlignment = splitGeneralData.match(/(LG|LN|LE|NG|N|NE|CG|CN|CE) /)[0].replace(/\s+?/,"");
    
    // Size, Space and Reach
    let splitSize = splitGeneralData.match(new RegExp(enumSizes.join("|"), "i"))[0].replace(/\s+?/,"");
    
    let splitSpace = "";
    let splitReach = "";

    switch(splitSize) {
        case "Fine": splitSpace = "0.5 ft."; splitReach = "0 ft."; break;
        case "Diminutive": splitSpace = "1 ft."; splitReach = "0 ft."; break;
        case "Tiny": splitSpace = "2.5 ft."; splitReach = "0 ft."; break;
        case "Small": splitSpace = "5 ft."; splitReach = "5 ft."; break;
        case "Medium": splitSpace = "5 ft."; splitReach = "5 ft."; break;
        case "Large": splitSpace = "10 ft."; splitReach = "5-10 ft."; break;
        case "Huge": splitSpace = "15 ft."; splitReach = "10-15 ft."; break;
        case "Gargantuan": splitSpace = "20 ft."; splitReach = "15-20 ft."; break;
        case "Colossal": splitSpace = "30 ft."; splitReach = "20-30 ft."; break;
        default: break;
    }
    
    // Split Classes
    let regExClasses = new RegExp(enumClassAndLevel.join("|"), "ig");
    let splitClasses = splitGeneralData.match(regExClasses);
    if (splitClasses !== null) {
        dataInputHasClasses = "true";
        splitClasses.forEach( function(item, index) {
            // Check for className (first for classes with two words e.g. vampire hunter)
            let className = "";
            let classLevel = "";
            if (item.match(/\b([a-zA-Z]+?)\b \b([a-zA-Z]+?)\b/)) {
                className = item.match(/\b([a-zA-Z]+?)\b \b([a-zA-Z]+?)\b/);
            } else {
                className = item.match(/(\b[a-zA-Z]+?\b)/);
            }
            classLevel = item.match(/\b[\d]+?\b/);

            formattedInput.classes[className[0]] = {
                "name" : className[0],
                "level" : classLevel[0]
            }
        });
    }
    
    // Get Race if available
    
    /*
     * !!!!!!!!!!!!!
     */
    
    
    // Type & Race
    let splitType = splitGeneralData.match(new RegExp(enumTypes.join("|"), "i"))[0];
    
    // Subtypes
    let splitSubtypes = "";
    let regExSubtypes = new RegExp(enumSubtypes.join("|"), "ig");

    // Test only on strings in parenthesis
    let splitGeneralDataInBrackets = splitGeneralData.match(/\(([^)]+)\)/g);
    
    if (splitGeneralDataInBrackets !== null) {

        // Check each match for valid Subtypes
        // !!! Potential Error Point: Takes only the last match found
        splitGeneralDataInBrackets.forEach( function (item,index) {
            let foundSubtypes = item.match(regExSubtypes);
            if(foundSubtypes !== null) {
                splitSubtypes = foundSubtypes;
            }
        }, splitGeneralDataInBrackets);
        
    }
    
    // Initiative (positive and negative)
    let splitInit = splitGeneralData.match(/(?:Init )(\+\d+|-\d+)/)[1];
    
    // Senses
    let splitSenses = splitGeneralData.match(/(?:Senses )(.*?)(?:;|\n|$)/igm)[0].replace("Senses ","");
    
    // Aura
    let splitAura = "";
    if (splitGeneralData.search(/Aura/igm) !== -1) {
        splitAura = splitGeneralData.match(/(?:Aura )(.*?)(?:;|\n|$)/igm)[0].replace("Aura ","");
    }
    
    // Save the found entries into formattedInput
    formattedInput.name = splitName;
    formattedInput.cr = splitCR;
    
    if(dataInputHasClasses == "true") {
        // What should happen, if input has class levels?
        
        // What, if it has class levels as well as racialHD?
        
        // For now, use cr as level
        formattedInput.level = formattedInput.cr;
    } else {
        formattedInput.level = formattedInput.cr;
    }
    
    console.log("type found: " + splitType);
    
    formattedInput.xp = splitXP;
    formattedInput.alignment = splitAlignment;
    formattedInput.size = splitSize;
    formattedInput.space = splitSpace;
    formattedInput.reach = splitReach;
    formattedInput.creature_type = splitType;
    formattedInput.creature_subtype = splitSubtypes;
    formattedInput.initiative = splitInit;
    formattedInput.senses = splitSenses;
    formattedInput.aura = splitAura;
    
    console.log("done");
}

// Split Defense Data and extract AC, HP, Immunities and Stuff
function splitDefenseData(stringDefenseData) {
    console.log("parsing Defense Data");
    
    stringDefenseData = stringDefenseData.replace(/^ | $|^\n*/,"");
        
    let splitDefenseData = stringDefenseData.split(/\n/);
    
    // Extract Bonus Type from Parentheses
    
    
    /*
     * Add other bonus types
     */
    
   
    
    
    // Get all AC Boni included in Input (everything in parenthesis in splitDefenseData[0]) and split them into separate strings
    let splitACBonusTypes = JSON.stringify(splitDefenseData[0].match(/\([\s\S]*?\)/)).split(/,/);
    console.log("splitACBonusTypes: " + splitACBonusTypes);
    
    // Loop through the found AC Boni and set changes accordingly
    
    splitACBonusTypes.forEach( function ( item, index) {
        console.log("found Boni: " + item);
        
        // get the bonus type
        let foundBonusType = item.match(/([a-zA-Z]+)/i)[0];
        let foundBonusValue = item.match(/(\+[\d]*)|(-[\d]*)/i)[0].replace(/\+/,"");
        console.log("foundBonusType: " + foundBonusType);
        
        formattedInput.ac_bonus_types[foundBonusType] = +foundBonusValue;
        
    });
    
    formattedInput.acNotes = JSON.parse(splitACBonusTypes)[0];
    
    console.log("formattedInput.ac_bonus_types: " + JSON.stringify(formattedInput.ac_bonus_types));
    /*
    splitACBonusTypes.forEach( function ( item, index) {
        if (this[index].match(/(dex)/i)) {
            let splitACBonusTypeDex = item.match(/(\+\d+|-\d+)/g)[0];
            formattedInput.ac_bonus_types.dex = +splitACBonusTypeDex;
        } else if (this[index].match(/(natural)/i)) {
            let splitACBonusTypeNatural = item.match(/(\+\d+|-\d+)/g)[0];
            formattedInput.ac_bonus_types.natural = splitACBonusTypeNatural;
        } else if (this[index].match(/(size)/i)) {
            let splitACBonusTypeSize = item.match(/(\+\d+|-\d+)/g)[0];
            formattedInput.ac_bonus_types.size = splitACBonusTypeSize;
        } else if (this[index].match(/(insight)/i)) {
            let splitACBonusTypeInsight = item.match(/(\+\d+|-\d+)/g)[0];
            formattedInput.ac_bonus_types.insight = splitACBonusTypeInsight;
        } else if (this[index].match(/(profane)/i)) {
            let splitACBonusTypeProfane = item.match(/(\+\d+|-\d+)/g)[0];
            formattedInput.ac_bonus_types.profane = splitACBonusTypeProfane;
        } else {
            
        }
    }, splitACBonusTypes);
    */

    // Extract AC, Touch AC and Flat-Footed AC
    splitDefenseData[0] = splitDefenseData[0].replace(/\([\s\S]*?\)/,"");
    let splitArmorClasses = splitDefenseData[0].split(/[,;]/g);
    
    splitArmorClasses.forEach( function (item, index) {
        if (this[index].match(/(AC)/gmi)) {
            let splitAC = this[index].replace(/(AC)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            console.log("splitAC: " + splitAC);
            formattedInput.ac = splitAC;
        } else if (this[index].match(/(Touch)/gmi)) {
            let splitTouch = this[index].replace(/(touch)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            formattedInput.touch = splitTouch;
        } else if (this[index].match(/(flat-footed)/gmi)) {
            let splitFlatFooted = this[index].replace(/(flat-footed)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            formattedInput.flat_footed = splitFlatFooted;
        }
    }, splitArmorClasses);
    
    // Extract Number and Size of Hit Dies as well as HP
    // Hit dice
    console.log("splitDefenseData[1]: " + splitDefenseData[1]);
    let splitHP = splitDefenseData[1].split(/(?:hp )([\d]*)/)[1];
    let splitHitDice = JSON.stringify(splitDefenseData[1].match(/\([\s\S]*?\)/));
    console.log("splitHitDice: " + splitHitDice);
    let splitHD = splitHitDice.match(/([\d]*)d/)[1];
    let splitHDSize = splitHitDice.match(/d([\d]*)/)[1];
    let splitHDBonus = "";
    
    if (splitHitDice.indexOf("+") !== -1) {
        splitHDBonus = splitHitDice.match(/\+([\d]*)/)[1];
    }

    formattedInput.hp = splitHP;
    formattedInput.hit_dice.hd = splitHD;
    formattedInput.hit_dice.hd_diceSize = splitHDSize;
    formattedInput.hit_dice.hd_bonus = splitHDBonus;
    
    
    // Extract Saves
    let splitSaves = splitDefenseData[2].split(/,/);
    splitSaves.forEach( function (item, index) {
        if (this[index].match(/(Fort)|(fort)/)) {
            let splitFort = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.fort_save = splitFort.replace(/\+/,"");
        } else if (this[index].match(/(Ref)|(ref)/)) {
            let splitRef = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.ref_save = splitRef.replace(/\+/,"");
        } else if (this[index].match(/(Will)|(will)/)) {
            let splitWill = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.will_save = splitWill.replace(/\+/,"");
        }
    }, splitSaves);
    
    // Check if there is a forth line
    /// then extract Damage Reduction, Resistances, Immunities, Weaknesses and Spell Resistance
    if(splitDefenseData[3]) {
        let splitResistances = splitDefenseData[3].split(/;/g);

        splitResistances.forEach( function (item, index) {
            if (this[index].match(/(DR)/gmi)) {
                let splitDRValue = item.match(/\d+/)[0];
                let splitDRType = item.match(/(?:\/)([\w\s]*)/)[1];
                formattedInput.damage_reduction.dr_value = splitDRValue;
                formattedInput.damage_reduction.dr_type = splitDRType;
            } else if (this[index].match(/(Immune)|(Immunities)/gmi)) {
                let splitImmunities = item.replace(/(Immune)|(Immunities)/gmi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.immunities = splitImmunities;
            } else if (this[index].match(/(Resist)|(Resistances)/gmi)) {
                let splitResistances = item.replace(/(Resist)|(Resistances)/gmi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.resistances = splitResistances;
            } else if (this[index].match(/(Weaknesses)|(weaknesses)|(Weakness)|(weakness)/gmi)) {
                let splitWeaknesses = item.replace(/(Weaknesses)|(weaknesses)|(Weakness)|(weakness)/gmi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.weaknesses = splitWeaknesses;
            } else if (this[index].match(/(SR)/gmi)) {
                let splitSR = item.replace(/(SR)/gmi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.spell_resistance = splitSR;
            }
        }, splitResistances);
    }
    
    console.log("done");
}

// NEW FUNCTION FOR THE OFFENSE BLOCK

// Split Tactics Data and extract Tactics
function splitTacticsData(stringTacticsData) {
    console.log("parsing Tactics Data");
    
    let splitTacticsData = stringTacticsData.replace(/^ | $|^\n*/,"");
    
    splitTacticsData = splitTacticsData.replace(/\n/gm," ");
    
    // Check for Keywords "During Combat, Before Combat and Morale"
    if(splitTacticsData.search(/Before Combat/m) !== -1) {
        let splitTacticsBeforeCombat = splitTacticsData.match(/Before Combat .+?(?=Morale|During|Base Statistics)/);
        formattedInput.tactics.before_combat = splitTacticsBeforeCombat;
    }
    
    if(splitTacticsData.search(/During Combat/m) !== -1) {
        let splitTacticsDuringCombat = splitTacticsData.match(/During Combat .+?(?=Morale|Before|Base Statistics)/)[0].replace(/During Combat /,"");
        formattedInput.tactics.during_combat = splitTacticsDuringCombat;
    }
        
    if(splitTacticsData.search(/Morale/m) !== -1) {
        let splitTacticsMorale = splitTacticsData.match(/Morale .+?(?=(Base Statistics)|$)/)[0].replace(/Morale /,"");
        formattedInput.tactics.morale = splitTacticsMorale;
    }
    
    if(splitTacticsData.search(/Base Statistics/m) !== -1) {
        let splitTacticsBaseStatistics = splitTacticsData.match(/Base Statistics .+?(?=$)/)[0].replace(/Base Statistics /,"");
        formattedInput.tactics.base_statistics = splitTacticsBaseStatistics;
    }
    
    if(splitTacticsData.search(/Before Combat|During Combat|Morale/m) == -1) {
        formattedInput.tactics.default = splitTacticsData.replace(/\n/,"");
    }
    
    console.log("done");
}

// NEW FUNCTION FOR THE STATISTICS
function splitStatisticsData(stringStatisticsData) {
    console.log("parsing Statistics Data");
    
    
    /*
     * LOOP OVER THE ATTRIBUTES
     * !!! ERROR WHEN ATTRIBUTE IS —
     */
    
    // Attributes
    formattedInput.str = stringStatisticsData.match(/(?:Str )(\d+)|(?:Str )(—)/)[1];
    formattedInput.dex = stringStatisticsData.match(/(?:Dex )(\d+)|(?:Dex )(—)/)[1];
    formattedInput.con = stringStatisticsData.match(/(?:Con )(\d+)|(?:Con )(—)/)[1];
    formattedInput.int = stringStatisticsData.match(/(?:Int )(\d+)|(?:Int )(—)/)[1];
    formattedInput.wis = stringStatisticsData.match(/(?:Wis )(\d+)|(?:Wis )(—)/)[1];
    formattedInput.cha = stringStatisticsData.match(/(?:Cha )(\d+)|(?:Cha )(—)/)[1];
    // Attack Modifier
    formattedInput.bab = stringStatisticsData.match(/(?:Base Atk[\s+-]*)([\d]*)/i)[1];
    formattedInput.cmb = stringStatisticsData.match(/(?:Cmb[\s+-]*)([\d]*)/i)[1];
    formattedInput.cmd = stringStatisticsData.match(/(?:CMD )(.*)/i)[1];
    // Feats
    
    // Skills
    
    // Racial Skill Modifiers
    
    // Languages
    
    // Special Qualities
    
    // Gear
    
 
    
    console.log("done");
}

// NEW FUNCTION FOR SPECIAL ABILITIES

// NEW FUNCTION FOR GEAR

// NEW FUNCTION FOR ECOLOGY

// NEW FUNCTION FOR DESCRIPTION

/**
 * 
 * MAPPING TO FOUNDRY TEMPLATE
 *
 **/

function mapInputToTemplateFoundryVTT(formattedInput) {
    
    // Generate a temporary dataOutput from the template
    dataOutput = dataTemplate;
    
    // Map generalData
    mapGeneralData(formattedInput);

    if(dataInputHasClasses == "true") {
        // Create classes.class Data
        setClassData(formattedInput.classes);

        // Create a Feature/Class Item for Class and Race Entries
        setClassItem(formattedInput.classes);
    }
    
    // Create a Item for the Creature Type
    setCreatureTypeItem(formattedInput);
    
    // Create a custom Item for Conversion Stuff (e.g. Changes to AC, Saves)
    setConversionItem(formattedInput);
    
    // Map defenseData
    mapDefenseData(formattedInput);
    
    // Map statisticData
    mapStatisticData(formattedInput);

    // Size and Size-Related Stuff
    switch(formattedInput.size) {
        case "Fine": dataOutput.data.traits.size = "fine"; break;
        case "Diminutive": dataOutput.data.traits.size = "dim"; break;
        case "Tiny": dataOutput.data.traits.size = "tiny"; break;
        case "Small": dataOutput.data.traits.size = "sm"; break;
        case "Medium": dataOutput.data.traits.size = "med"; break;
        case "Large": dataOutput.data.traits.size = "lg"; break;
        case "Huge": dataOutput.data.traits.size = "huge"; break;
        case "Gargantuan": dataOutput.data.traits.size = "grg"; break;
        case "Colossal": dataOutput.data.traits.size = "col"; break;
        default: dataOutput.data.traits.size = "med"; break;
    }
    
    // Race and Types
    
    
    // If there are multiple subtypes, join them
    if (formattedInput.creature_subtype.length > 1) {
        dataOutput.data.attributes.creatureType =
        dataOutput.data.details.raceType =
            formattedInput.creature_type.concat(" (").concat(formattedInput.creature_subtype.join(", ")).concat(")");
    } else if (formattedInput.creature_subtype.length == 1) {
        // If not, just use the one
        dataOutput.data.attributes.creatureType =
        dataOutput.data.details.raceType =
            formattedInput.creature_type.concat(" (").concat(formattedInput.creature_subtype[0].concat(")"));
    } else {
        // If there is no subtype, lose the parentheses
        dataOutput.data.attributes.creatureType =
        dataOutput.data.details.raceType =
            formattedInput.creature_type
    }
    
    dataOutput.data.details.race = "";
     
    // Initiative
    dataOutput.data.attributes.init.total = formattedInput.initiative;

    
    
    // Map Attributes
    
    
    
    //returnJSON(JSON.stringify(formattedInput, null, 4));
    returnJSON(JSON.stringify(dataOutput, null, 4));
}

// Map General Data
function mapGeneralData(formattedInput) {
    // Top of the Character Sheet
    dataOutput.name = dataOutput.token.name = formattedInput.name;
    
    // Creature Type (and Subtype)
    dataOutput.data.attributes.creatureType = formattedInput.creature_type;
    if (formattedInput.creature_type) {
        dataOutput.data.details.type = formattedInput.creature_type + " " + formattedInput.creature_subtype;
    } else {
        dataOutput.data.details.type = formattedInput.creature_type;
    }
    
    
    // Token Data
    dataOutput.token.name = dataOutput.token.name = formattedInput.name;
    dataOutput.token.width = dataOutput.token.height = enumTokenSize[formattedInput.size].w;
    dataOutput.token.scale = enumTokenSize[formattedInput.size].scale;
    dataOutput.token.bar1 = { "attribute": "attributes.hp" };
    
    
    dataOutput.data.details.level.value = formattedInput.level;
    dataOutput.data.attributes.hd.total = formattedInput.hit_dice.hd;
    
    
    
    dataOutput.data.details.cr = formattedInput.cr;
    dataOutput.data.details.xp.value = formattedInput.xp;
    dataOutput.data.details.alignment = formattedInput.alignment;
    dataOutput.data.attributes.init.value = formattedInput.initiative - getModifier(formattedInput.dex);
}

// Map data.classes.class
function setClassData (classInput) {

    let classKey = Object.keys(classInput);

    let classEntries = {};
    
    for (var i=0; i < classKey.length; i++) {
        
        // Split Classes
        let classEntry = enumClassData[classKey[i].toLowerCase()];
        
        let tempClassName = classKey[i];

        delete Object.assign(classEntry, {[tempClassName] : classEntry.classOrRacialHD }).classOrRacialHD;
        classEntry.level = classInput[tempClassName].level;
        classEntry.name = classInput[tempClassName].name;
        classEntries[tempClassName] = classEntry;
    }
    
    // Add classEntries to dataOutput.data.classes
    dataOutput.data.classes = classEntries;
    
}

// Create Class and Race Item
function setClassItem (classInput) {

    let classKey = Object.keys(classInput);
    
    for (var i=0; i < classKey.length; i++) {
        // Create Item for the Class starting from the template
        let itemEntry = templateClassItem[classKey[i].toLowerCase()];
        itemEntry.data.levels = classInput[classKey[i]].level;
        itemEntry.data.savingThrows.fort.value = "";
        itemEntry.data.savingThrows.ref.value = "";
        itemEntry.data.savingThrows.will.value = "";
        //itemEntry.data.hd = "";
        
        // !!! CHANGE FROM HD TO CLASS LEVEL
        // !!! Without the Bonus HP, as they are set in creatureTypeItem
        
        //itemEntry.data.hp = Math.floor(+getDiceAverage(formattedInput.hit_dice.hd_diceSize) * +formattedInput.hit_dice.hd);
        //itemEntry.data.bab = "";
        //itemEntry.data.skillsPerLevel = "";

        dataOutput.items.push(itemEntry);
    }
}

// Create Item for Creature Type
function setCreatureTypeItem (formattedInput) {

    // Create Item for the Class starting from the template
    let itemEntry = templateClassItem[formattedInput.creature_type.toLowerCase()];
    itemEntry.data.savingThrows.fort.value = "";
    itemEntry.data.savingThrows.ref.value = "";
    itemEntry.data.savingThrows.will.value = "";
    //itemEntry.data.hd = "";
    
    itemEntry.data.levels = +formattedInput.hit_dice.hd;
        
    itemEntry.data.hp = Math.floor(+getDiceAverage(formattedInput.hit_dice.hd_diceSize) * +formattedInput.hit_dice.hd);

    //itemEntry.data.bab = "";
    //itemEntry.data.skillsPerLevel = "";

    dataOutput.items.push(itemEntry);
}

// Create Custom Item for Conversion Buff Item
function setConversionItem (formattedInput) {

    // Create Item for the Class starting from the template
    let itemEntry = templateConversionItem;
    
    // Add Changes to AC
    // !!! Check to only use the ones availablee
    for (var key in formattedInput.ac_bonus_types) {
        console.log("key in bonus types: " + key);
        // Exclude dex, size and natural, as these are included elsewhere in the sheet
        if ( (key.toLowerCase() !== "dex") && (key.toLowerCase() !== "size") && (key.toLowerCase() !== "natural") ) {
            
            let acChange = [];
            
            // Special Treatment for Armor and Shield Boni
            if ( ( key.toLowerCase() == "armor" ) || ( key.toLowerCase() == "shield" ) ) {
                acChange.push(+formattedInput.ac_bonus_types[key]);
                acChange.push("ac");
                if ( key == "armor") {
                    acChange.push("aac");
                } else {
                    acChange.push("sac");
                }
                acChange.push("base");
            } else {
                acChange.push(+formattedInput.ac_bonus_types[key]);
                acChange.push("ac");
                acChange.push("ac");
                acChange.push(key);
            }

            itemEntry.data.changes.push(acChange);  
        }
    }
    
    // Add SavingThrow Values in Changes, decreased by the corresponding attribute modifiers    
    enumSaves.forEach( function (item, index) {
        let saveChange = [];
        let tempSaveString = item + "_save";
        
        let attrModifier = getModifier(formattedInput[enumSaveModifier[index]]);
        
        saveChange.push(+formattedInput[tempSaveString]-attrModifier);
        saveChange.push("savingThrows");
        saveChange.push(item);
        saveChange.push("untyped");

        itemEntry.data.changes.push(saveChange);  
    });
    
    // Add Attribute Values in Changes
    // WHY???
    /*
    enumAttributes.forEach( function (item, index) {
        let attrChange = [];
        attrChange.push(+formattedInput[item]-10);
        attrChange.push("ability");
        attrChange.push(item);
        attrChange.push("untyped");
        
        itemEntry.data.changes.push(attrChange);  
    });
    */
    
    itemEntry.data.active = true;
    
    dataOutput.items.push(itemEntry);
}

function mapDefenseData (formattedInput) {

    // Attributes
    dataOutput.data.attributes.hp.value = +formattedInput.hp;
    dataOutput.data.attributes.hp.max = +formattedInput.hp;
    

    dataOutput.data.attributes.ac.normal.total = +formattedInput.ac;
    dataOutput.data.attributes.ac.touch.total = +formattedInput.touch;
    dataOutput.data.attributes.ac.flatFooted.total = +formattedInput.flat_footed;
    
    dataOutput.data.attributes.acNotes = formattedInput.acNotes;
    
    dataOutput.data.attributes.savingThrows.fort.total = +formattedInput.fort_save;
    dataOutput.data.attributes.savingThrows.ref.total = +formattedInput.ref_save;
    dataOutput.data.attributes.savingThrows.will.total = +formattedInput.will_save;
    dataOutput.data.attributes.sr.total = +formattedInput.spell_resistance;
    
    if (formattedInput.damage_reduction.dr_value) {
        dataOutput.data.traits.dr = +formattedInput.damage_reduction.dr_value + "/" + formattedInput.damage_reduction.dr_type;
    }
    
    dataOutput.data.attributes.naturalAC = +formattedInput.ac_bonus_types.natural;
    
    // Reset Max Dex Bonus
    dataOutput.data.attributes.maxDexBonus = 0;
}

// Map Statistics to data.attributes
function mapStatisticData (formattedInput) {
    
    // Abilities
    dataOutput.data.abilities.str.total = +formattedInput.str;
    dataOutput.data.abilities.str.value = +formattedInput.str;
    dataOutput.data.abilities.str.mod =getModifier(formattedInput.str);
    dataOutput.data.abilities.str.carryMultiplier = carrySizeModificators[formattedInput.size];
    dataOutput.data.abilities.str.carryBonus = 0;
    
    dataOutput.data.abilities.dex.total = +formattedInput.dex;
    dataOutput.data.abilities.dex.value = +formattedInput.dex;
    dataOutput.data.abilities.dex.mod = getModifier(formattedInput.dex);
    
    
    dataOutput.data.abilities.con.total = +formattedInput.con;
    dataOutput.data.abilities.con.value = +formattedInput.con;
    dataOutput.data.abilities.con.mod = getModifier(formattedInput.con);
    
    dataOutput.data.abilities.int.total = +formattedInput.int;
    dataOutput.data.abilities.int.value = +formattedInput.int;
    dataOutput.data.abilities.int.mod = getModifier(formattedInput.int);
    
    dataOutput.data.abilities.wis.total = +formattedInput.wis;
    dataOutput.data.abilities.wis.value = +formattedInput.wis;
    dataOutput.data.abilities.wis.mod = getModifier(formattedInput.wis);
    
    dataOutput.data.abilities.cha.total = +formattedInput.cha;
    dataOutput.data.abilities.cha.value = +formattedInput.cha;
    dataOutput.data.abilities.cha.mod = getModifier(formattedInput.cha);
    
    // Attributes
    let carryCapacity = getEncumbrance(formattedInput.str) * carrySizeModificators[formattedInput.size];
    dataOutput.data.attributes.encumbrance.levels.light = Math.floor(1/3 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.medium = Math.floor(2/3 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.heavy = Math.floor(carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.carry = Math.floor(2 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.drag = Math.floor(5 * carryCapacity);
    
    dataOutput.data.attributes.bab.total = "+" + +formattedInput.bab;
    dataOutput.data.attributes.cmb.total = "+" + +formattedInput.cmb;
    dataOutput.data.attributes.cmd.total = formattedInput.cmd;
    
    
}

// Return RawJSON to the Output TextArea
function returnJSON(output) {

    outputTextArea.value = output;
    outputTextArea.disabled = false;
    inputTextArea.disabled = true;
}

// Save Output to JSON
async function saveJSON(output) {
    
    var blob = new Blob([output.value], {type: "text/plain;charset=utf-8"});
    
    //await writeToDisk(JSON.stringify(output.value), output.name + ".json");
    await writeToDisk(blob, formattedInput.name + ".json");
    
    outputTextArea.value = "";
    inputTextArea.value = "";
    
    outputTextArea.disabled = true;
    inputTextArea.disabled = false;
}

function writeToDisk(content, filename) {
    saveAs(content, filename);
}

/*
 * Pathfinder Math
 */

function getModifier(attr) {
    return Math.floor(((attr-10)/2));
}

function getEncumbrance (str) {
    // If(Str <= 10) MaxCarryingCapacity = 10*Str
    // If(Str > 10) MaxCarryingCapacity = 5/4 * 2^Floor(Str/5)* Round[20 * 2^(Mod(Str,5)/5)]
    
    if(str <= 10) {
        return str*10;
    } else {
        return 5/4 * (2 ** Math.floor(str/5)) * Math.round(20 * ( 2 ** ( (str % 5) / 5 ) ) );
    }
}

function getDiceAverage (diceSize) {
    let sum = 0;
    for (let i=1; i<=diceSize; i++) {
        sum += i;
    }
        
    return sum/diceSize;
}
