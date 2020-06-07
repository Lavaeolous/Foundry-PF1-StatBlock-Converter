import templateData from "./templateData.js"
import templateActor from "./templateActor.js"
import templateClassData from "./templateClassData.js"
import templateClassItem from "./templateClassItem.js"
import templateRaceItem from "./templateRaceItem.js"
import templateRacialHDItem from "./templateRacialHDItem.js"
import templateConversionItem from "./templateConversionItem.js"
import templateFeatItem from "./templateFeatItem.js"
import templateSkills from "./templateSkills.js"
import enumRaces from "./enumRaces.js"
import enumTypes from "./enumTypes.js"
import enumSubtypes from "./enumSubtypes.js"
import enumClasses from "./enumClasses.js"
import enumClassData from "./enumClassData.js"
import enumBonusTypes from "./enumBonusTypes.js"
import enumConditions from "./enumConditions.js"
import enumDamageTypes from "./enumDamageTypes.js"
import enumSkills from "./enumSkills.js"
import enumLanguages from "./enumLanguages.js"


/*
 * Statblock Parser
 */

// Global Variables

var dataInput;
var dataInputHasClasses = false;
var inputHDTotal = 0;
var inputClassHD = 0;
var dataInputHasNonPlayableRace = false;
var dataInputHasPlayableRace = false;
var dataInputHasRacialHD = true;
var dataInputHasTactics = false;
var dataInputHasSpecialAbilities = false;
var dataInputHasEcology = false;
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

var enumGender = [
    "Male or Female",
    "Female or Male",
    "Male",
    "Female"
]

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

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    // Load FoundryVTT Actor Template
    
    dataTemplate = JSON.parse(JSON.stringify(templateActor));
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
    // mandatory
    let foundDefenseData = false;
    let foundOffenseData = false;
    let foundStatisticsData = false;
    // optional
    let foundTacticsData = false;
    let foundSpecialAbilitiesData = false;
    let foundEcologyData = false;
    
    // Check if enough Data to start conversion is available
    if(dataInput.search(/(\n\bAC\b(?:[\s\S]*)\nhp)/gmi) !== -1) { foundDefenseData = true; }
    if(dataInput.search(/(\n\bSpeed\b)/mi) !== -1) { foundOffenseData = true; }
    if(dataInput.search(/(\n\bSTR\b)/gmi) !== -1) { foundStatisticsData = true; }
    // Check for optional Datablocks marked by keywords for now
    if(dataInput.search(/\nTACTICS\n/gmi) !== -1) { foundTacticsData = true; dataInputHasTactics = true; }
    if(dataInput.search(/\nSPECIAL ABILITIES\n/gmi) !== -1) { foundSpecialAbilitiesData = true; dataInputHasSpecialAbilities = true; }
    if(dataInput.search(/\nECOLOGY\n/gmi) !== -1) { foundEcologyData = true; dataInputHasEcology = true; }
    
    // 
    if( (foundDefenseData == false) || (foundOffenseData == false) || (foundStatisticsData == false) ) {
        console.log("Not enough Data, check if at least a block marked with defense, offense and statistics is included in the input");
        statusOutput.innerHTML += "<p class='criticalErrorMsg'>Could not find enough Data or the Input is malformed.</p>";
        statusOutput.innerHTML += "Input-Analysis:<br/>Mandatory: <ul>";
        statusOutput.innerHTML += "<li>Offense-Data found: " + foundOffenseData + "</li>";
        statusOutput.innerHTML += "<li>Defense-Data found: " + foundDefenseData + "</li>";
        statusOutput.innerHTML += "<li>Statistic-Data found: " + foundStatisticsData + "</li></ul><br/>";
        statusOutput.innerHTML += "Optional: <ul>";
        statusOutput.innerHTML += "<li>Tactics-Data found: " + foundTacticsData + "</li>";
        statusOutput.innerHTML += "<li>Special Abilities-Data found: " + foundSpecialAbilitiesData + "</li>";
        statusOutput.innerHTML += "<li>Ecology-Data found: " + foundEcologyData + "</li></ul>";
        return;
    }
    
    // Output the prelimenary analysis of the input
    statusOutput.innerHTML += "Input-Analysis:<br/>Mandatory: <ul>";
    statusOutput.innerHTML += "<li>Offense-Data found: " + foundOffenseData + " (WIP, currently only read and not parsed)</li>";
    statusOutput.innerHTML += "<li>Defense-Data found: " + foundDefenseData + "</li>";
    statusOutput.innerHTML += "<li>Statistic-Data found: " + foundStatisticsData + "</li></ul><br/>";
    statusOutput.innerHTML += "Optional: <ul>";
    statusOutput.innerHTML += "<li>Tactics-Data found: " + foundTacticsData + "</li>";
    statusOutput.innerHTML += "<li>Special Abilities-Data found: " + foundSpecialAbilitiesData + "</li>";
    statusOutput.innerHTML += "<li>Ecology-Data found: " + foundEcologyData + "</li></ul>";
    
    let tempInputRest = "";

    // Split stringGeneralData, e.g. everything between the Start of the Input and "AC", removing "DEFENSE"
    splitInput = dataInput.split(/(?=(^AC))/m);
    tempInputRest = splitInput[2];
    stringGeneralData = splitInput[0].replace(/(DEFENSE)/gm,"");
    splitInput = "";
            
    // Split stringDefenseData, everything between AC and Speed
    splitInput = tempInputRest.split(/(?=(^Speed))/mi);
    tempInputRest = splitInput[2];
    stringDefenseData = splitInput[0].replace(/(OFFENSE)/,"");
    splitInput = "";
                
    // Split stringOffenseData, everything between Speed and Tactics or Statistics
    // If there is a tactics block, split there, parse Offense and tactics next
    if(foundOffenseData && foundTacticsData == true)  {
        splitInput = tempInputRest.split(/\nTACTICS\n/gmi);
        tempInputRest = splitInput[1];
        stringOffenseData = splitInput[0].replace(/\nTACTICS\n/gmi,"");
        splitInput = "";
    }  
    // If there is no tactics block, split and parse Offense and Statistics next 
    else if (foundOffenseData == true) {
        splitInput = tempInputRest.split(/\nStr/i);
        tempInputRest = "Str".concat(splitInput[1]);
        stringOffenseData = splitInput[0].replace(/(OFFENSE)/gmi,"").replace(/(STATISTICS)/gmi,"");
        splitInput = "";
    }
    
    // Split Tactics Data if available (mainly NPCs)
    if(foundTacticsData == true) {
        splitInput = tempInputRest.split(/\nStr/i);
        tempInputRest = "Str" + splitInput[1];
        stringTacticsData = splitInput[0].replace(/(STATISTICS)/gmi,"");
        splitInput = "";
    }
    
    // Split Statistics
    if(foundStatisticsData == true) {
        // Check if there are Special Abilities or Ecology Data following the Statistics
        let splitInput = "";
        let tempSplit = "";
        
        if(foundSpecialAbilitiesData == true) {
            tempSplit = tempInputRest.split(/SPECIAL ABILITIES/gmi)
            splitInput = tempSplit[0];
            tempInputRest = tempSplit[1];
        } else if (foundEcologyData == true) {
            tempSplit = tempInputRest.split(/ECOLOGY/gmi)
            splitInput = tempSplit[0];
            tempInputRest = tempSplit[1];
        } else {
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
     * and save that in a Object for formattedInput
     * to be mapped onto the dataTemplate later
     */
    
    formattedInput = JSON.parse(JSON.stringify(templateData));
    
    // Take General Data and extract Name, CR, XP and Stuff
    splitGeneralData(stringGeneralData);
    
    // Take Defense Data and extract AC, HP, Immunities and Stuff
    splitDefenseData(stringDefenseData);
        
    // Take Offense Data and extract 
    //splitOffenseeData(stringOffenseData);
    
    // Take Tactics Data and extract Stuff
    if(foundTacticsData === true) {
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
    let splitCR = splitGeneralData.match(/(1\/\d|\d+)/)[0];
    
    // XP
    let splitXP = splitGeneralData.match(/(?:XP )([\d,.]+)/)[0].replace(/([\D]|[,?]|[\.?])/g,"");    
    
    //Alignment
    let splitAlignment = "";
    if (splitGeneralData.search(/(LG|LN|LE|NG|N|NE|CG|CN|CE) /) !== -1) {
        splitAlignment = splitGeneralData.match(/(LG|LN|LE|NG|N|NE|CG|CN|CE) /)[0].replace(/\s+?/,"");
    }
    
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
    
    // Split Classes, if available
    // Special Case: (Medium)(?: \d+?) 
    let regExClasses = new RegExp(enumClasses.join("|"), "gi");
    let splitClasses = splitGeneralData.match(regExClasses);
    // If there are classes, get them, their level and the race / gender as well
    if ( (splitClasses !== null) && (splitClasses !== "") ) {
        dataInputHasClasses = true;
        // Get Class(es)
        splitClasses.forEach( function(item, index) {
            if (item.search(/Medium/i) !== -1) {
                item = "medium";
            }
                        
            if ( item !== undefined ) {
                // Check for className (first for classes with two words e.g. vampire hunter)
                let classNameAndLevel = "";
                let className = "";
                let classNameSuffix = "";
                let classLevel = "";

                // Get Classlevel and words in between class an level
                let regExClassAndLevel = new RegExp("(" + item + ")" + "(?:[\\s]*?)([\\w\\s]*?)(?:[\\s]*?)(\\d+)", "ig");

                classNameAndLevel = splitGeneralData.match(regExClassAndLevel);
                
                if (item.search(/Medium/i) !== -1) {
                    className = "Medium";
                } else {
                    className = classNameAndLevel[0].split(/[\s](?:\d)/)[0].match(regExClasses);
                    
                }
                classNameSuffix = classNameAndLevel[0].split(/[\s](?:\d)/)[0].replace(regExClasses, "").replace(/^ | $/, "");
                classLevel = classNameAndLevel[0].match(/(\d+?)/)[0];

                // If it's an NPC Class, add Npc to the Name
                // Because thats the notation used in the gameSystem
                if (className[0].search(/(adept)|(commoner)|(expert)|(warrior)|(aristocrat)/i) !== -1 ) {
                    className = className[0].concat("Npc");
                }

                formattedInput.classes[className] = {
                    "name" : className[0],
                    "nameSuffix" : classNameSuffix,
                    "level" : +classLevel
                }
            }

        });
        
        // Get Gender and Race if available
        let regExGenderAndRace = new RegExp("(?:[0-9]*?)([^0-9]*)(?:" + enumClasses.join("|") + ")", "ig");

        // Search if there is info before the class to evaluate
        if (splitGeneralData.split(regExGenderAndRace)[1]) {
        
            let stringGenderAndRace = splitGeneralData.split(regExGenderAndRace)[1];
            
            // Get Gender
            let regExGender = new RegExp("(" + enumGender.join("|") + ")", "i");
            let foundGender = "";
            
            if (stringGenderAndRace.search(regExGender) !== -1) {
                foundGender = stringGenderAndRace.match(regExGender)[0];
            }
            
            // Get Race, check first if there is a playable race
            let regExPlayableRace = new RegExp("(" + enumRaces.join("|") + ")", "i");
            let regExNonPlayableRace = new RegExp("(?:" + enumGender.join("|") + ")(?:[\\s]*?)([^0-9]*)", "gi");
            
            let foundRace = "";
            
            if (stringGenderAndRace.search(regExPlayableRace) !== -1) {
                // Test playable Races
                foundRace = stringGenderAndRace.match(regExPlayableRace)[0];
                dataInputHasPlayableRace = true;
                
                // FOR NOW JUST USE EVERYTHING AS NONPLAYABLE
                //foundRace = stringGenderAndRace.split(regExNonPlayableRace).join("").replace(/^ | $/, "");
                //dataInputHasNonPlayableRace = true;
            } else {
                // If no playable Race is found, simply remove the gender(s) and use the rest as race
                foundRace = stringGenderAndRace.split(regExNonPlayableRace).join("").replace(/^ | $/, "");
                dataInputHasNonPlayableRace = true;
            }
          
            formattedInput.gender = foundGender;
            formattedInput.race = foundRace;
        }        
        
    }
    
    // Creature Type and Subtype(s)
    let splitType = splitGeneralData.match(new RegExp(enumTypes.join("|"), "i"))[0];
        
    // Subtypes
    let splitSubtypes = "";
    let regExSubtypes = new RegExp(enumSubtypes.join("|"), "ig");

    // Test only on strings in parenthesis
    let splitGeneralDataInBrackets = splitGeneralData.match(/\(([^)]+)\)/g);
    
    if (splitGeneralDataInBrackets !== null) {

        // Check each match for valid Subtypes
        // !!! ??? Potential Error Point: Takes only the last match found
        splitGeneralDataInBrackets.forEach( function (item,index) {
            let foundSubtypes = item.match(regExSubtypes);
            if(foundSubtypes !== null) {
                splitSubtypes = foundSubtypes;
            }
        }, splitGeneralDataInBrackets);
        
    }
    
    // Initiative (positive and negative)
    let splitInit = splitGeneralData.match(/(?:Init )(\+\d+|-\d+)/)[1];
    
    let splitSenses = "";
    // Senses
    if (splitGeneralData.search(/\bSenses\b/gmi) !== -1) {
        splitSenses = splitGeneralData.match(/(?:Senses )(.*?)(?:;|\n|$)/igm)[0].replace("Senses ","");
    }
    
    // Aura
    let splitAura = "";
    if (splitGeneralData.search(/\bAura\b/igm) !== -1) {
        splitAura = splitGeneralData.match(/(?:Aura )(.*?)(?:;|\n|$)/igm)[0].replace("Aura ","");
    }
    
    // Save the found entries into formattedInput
    formattedInput.name = splitName;
    formattedInput.cr = splitCR;
    
    // For now, use cr as level
    formattedInput.level = formattedInput.cr;
            
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
        
    // Clean up the Input if there are extra linebreaks (often when copy and pasted from pdfs)
    // Remove linebreaks in parenthesis
    stringDefenseData = stringDefenseData.replace(/(\([^(.]+?)(?:\n)([^(.]+?\))+?/mi, "$1 $2");
    
    /*
    // Remove linebreaks in Melee Attacks
    stringDefenseData = stringDefenseData.replace(/(Melee.*)(?:\n)((\b.+?\b)|\+|\d)/mi, "$1 S2");
    // Remove linebreaks in Ranged Attacks
    stringDefenseData = stringDefenseData.replace(/(Ranged.*)(?:\n)((\b.+?\b)|\+|\d)/mi, "$1 S2");
    // Remove linebreaks in Multi Attacks
    stringDefenseData = stringDefenseData.replace(/(Multi.*)(?:\n)((\b.+?\b)|\+|\d)/mi, "$1 S2");
    */
    
    let splitDefenseData = stringDefenseData.split(/\n/);
    
    // Get all AC Boni included in Input (everything in parenthesis in splitDefenseData[0]) and split them into separate strings
    let splitACBonusTypes = JSON.stringify(splitDefenseData[0].match(/\([\s\S]*?\)/)).split(/,/);
    
    // Loop through the found AC Boni and set changes accordingly
    splitACBonusTypes.forEach( function ( item, index) {
        
        // get the bonus type
        let foundBonusType = item.match(/([a-zA-Z]+)/i)[0];
        let foundBonusValue = item.match(/(\+[\d]*)|(-[\d]*)/i)[0].replace(/\+/,"");
        
        formattedInput.ac_bonus_types[foundBonusType] = +foundBonusValue;
        
    });
    
    formattedInput.acNotes = JSON.parse(splitACBonusTypes)[0];
    
    // Extract AC, Touch AC and Flat-Footed AC
    splitDefenseData[0] = splitDefenseData[0].replace(/\([\s\S]*?\)/,"");
    let splitArmorClasses = splitDefenseData[0].split(/[,;]/g);
    
    splitArmorClasses.forEach( function (item, index) {
        if (this[index].match(/(\bAC\b)/gmi)) {
            let splitAC = this[index].replace(/(\bAC\b)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            formattedInput.ac = splitAC;
        } else if (this[index].match(/(\bTouch\b)/gmi)) {
            let splitTouch = this[index].replace(/(\btouch\b)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            formattedInput.touch = splitTouch;
        } else if (this[index].match(/(\bflat-footed\b)/gmi)) {
            let splitFlatFooted = this[index].replace(/(\bflat-footed\b)/gmi,"").replace(/^ *| *$|^\n*/g,"");
            formattedInput.flat_footed = splitFlatFooted;
        }
    }, splitArmorClasses);
    
    // Extract Number and Size of Hit Dies as well as HP
    // Hit dice
    let splitHPTotal = splitDefenseData[1].split(/(?:hp )([\d]*)/)[1];
    //let stringHitDice = JSON.stringify(splitDefenseData[1].match(/\([\s\S]*?\)/));
    let stringHitDice = JSON.parse(JSON.stringify(splitDefenseData[1].match(/\([\s\S]*?\)/)));

    // If available, extract Regeneration
    if (splitDefenseData[1].search(/Regeneration/i) !== -1) {
        let tempRegen = splitDefenseData[1].match(/(?:Regeneration )([\s\S]+?)(?:\n|$|;)/i);
        formattedInput.regeneration = tempRegen[1];
    }
    // If available, extract Fast Healing
    if (splitDefenseData[1].search(/Regeneration/i) !== -1) {
        let tempFastHealing = splitDefenseData[1].match(/(?:Fast Healing )([\s\S]+?)(?:\n|$|;)/i);
        formattedInput.fast_healing = tempFastHealing[1];
    }
    
    // Extract HitDie and separate DicePools containing number and size of the die as well as the bonus
    let splitHitDice = {};
    let splitHitDie = {
        "hd": 0,
        "hdSize": 0,
    }
    
    // Calculate HP for Class and Race Items
    
    // Get different DicePools, e.g. XdY combinations, mostly for combinations of racial and class hitDice
    let hitDicePool = JSON.stringify(stringHitDice).match(/(\d+?d\d+)/gi);
    
    // Find the Dicepool for class(es)
    if (dataInputHasClasses == true) {
        let classKey = Object.keys(formattedInput.classes);
        let hitDicePoolKey = Object.keys(hitDicePool);
        
        for (let i = 0; i < classKey.length; i++) {
        
            let tempLevel = formattedInput.classes[classKey[i]].level;
            
            for (let j = 0; j < hitDicePoolKey.length; j++) {
                let tempRegEx = new RegExp("(?:" + tempLevel + "d)(\\d+)", "i");
                if (hitDicePool[j].match(tempRegEx)) {
                    // Set HP for classItem
                    let tempDiceSize = hitDicePool[j].match(tempRegEx)[1];
                    formattedInput.hp.class = Math.floor(+tempLevel * +getDiceAverage(tempDiceSize));
                    formattedInput.hp.race = 0;
                    inputHDTotal += +tempLevel;
                } else {
                    // Set HP for RacialHDItem                    
                    let tempDiceSize = hitDicePool[j].match(/(?:d)(\d+)/)[1];
                    let tempRacialHD = hitDicePool[j].match(/(\d+)(?:d)/)[1];
                    
                    formattedInput.hp.race = Math.floor(tempRacialHD * getDiceAverage(tempDiceSize));
                    inputHDTotal += +tempRacialHD;
                }
            }
        }

    } else {
        // Set racialHD when no class is given
        let hitDicePoolKey = Object.keys(hitDicePool);
        for (let j = 0; j < hitDicePoolKey.length; j++) {
            
            // Set HP for RacialHDItem        
            let tempDiceSize = hitDicePool[j].match(/(?:d)(\d+)/)[1];
            let tempRacialHD = hitDicePool[j].match(/(\d+)(?:d)/)[1];
            
            formattedInput.hp.race = Math.floor(tempRacialHD * getDiceAverage(tempDiceSize));
            inputHDTotal += +tempRacialHD;
        }
    }
    
    formattedInput.hit_dice.hd = inputHDTotal;
        
    //let hitDiceBonusPool = JSON.stringify(stringHitDice).match(/[^d+\(](\d+)/gi);
    let hitDiceBonusPool = stringHitDice[0].replace(/(\d+d\d+)/gi,"").match(/\d+/g);
    
    let hitDiceBonus = 0;
        
    // Get the sum of all the additional bonus hp, denoted for example by "+XX" and / or "plus XX"
    if (hitDiceBonusPool !== null) {
        
        for (let i = 0; i < hitDiceBonusPool.length; i++) {
            hitDiceBonus += +hitDiceBonusPool[i];
        }
    
    }

    formattedInput.hp.total = splitHPTotal;
    
    // Extract Saves    
    let splitSaves;
    
    for (var i = 0; i < splitDefenseData.length; i++) {
        if (splitDefenseData[i].search(/Fort/i) !== -1) {
            splitSaves = splitDefenseData[i].split(/,|;/);
        }
    }
    
    //let splitSaves = splitDefenseData[2].split(/,/);    
    splitSaves.forEach( function (item, index) {
        if (this[index].match(/(fort)/i)) {
            let splitFort = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.fort_save.total = splitFort.replace(/\+/,"");
        } else if (this[index].match(/(ref)/i)) {
            let splitRef = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.ref_save.total = splitRef.replace(/\+/,"");
        } else if (this[index].match(/(will)/i)) {
            let splitWill = item.match(/(\+[\d]*)|(-[\d]*)/g)[0];
            formattedInput.will_save.total = splitWill.replace(/\+/,"");
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
            } else if (this[index].match(/\bImmune\b|\bImmunities\b/mi)) {
                let splitImmunities = item.replace(/\bImmune\b|(Immunities)/gmi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.immunities = splitImmunities;
            } else if (this[index].match(/\bResist\b|\bResistances\b/mi)) {
                let splitResistances = item.replace(/\bResist\b|\bResistances\b/mi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.resistances = splitResistances;
            } else if (this[index].match(/\bWeaknesses\b|\bWeakness\b/mi)) {
                let splitWeaknesses = item.replace(/\bWeaknesses\b|\bWeakness\b/mi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.weaknesses = splitWeaknesses;
            } else if (this[index].match(/\bSR\b/mi)) {
                let splitSR = item.replace(/\bSR\b/mi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.spell_resistance = splitSR;
            } else if (this[index].match(/\bDefensive Abilities\b/mi)) {
                let splitDefensiveAbilities = item.replace(/\bDefensive Abilities\b/mi,"").replace(/^ *| *$|^\n*/g,"");
                formattedInput.defensive_abilities = splitDefensiveAbilities;
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
        let splitTacticsBeforeCombat = splitTacticsData.match(/Before Combat .+?(?=Morale|During|Base Statistics|$)/);
        formattedInput.tactics.before_combat = splitTacticsBeforeCombat;
    }
    
    if(splitTacticsData.search(/During Combat/mi) !== -1) {
        let splitTacticsDuringCombat = splitTacticsData.match(/During Combat .+?(?=Morale|Before|Base Statistics|$)/)[0].replace(/During Combat /,"");
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
        
    console.log("stringStatisticsData: " + stringStatisticsData);
    
    // Attributes
    let splitAttributes = stringStatisticsData.match(/(\bStr\b)[\s\S]*(\bCha\b [0-9-—]{1,2})/gmi)[0].replace(/\n/,"").split(/,/);
        
    splitAttributes.forEach ( function (item, index) {
        let tempItem = item.replace(/^\s/,"").split(/\s/);
        let tempAttr = tempItem[0];
        let tempValue = tempItem[1];
        
        // Check if the Item is -, e.g. for Undead (Con) or Oozes (Int)
        if ( ( tempValue === "—" ) || ( tempValue === "-" ) ) {
            // Set the attribute to "-" to work with it later on
            formattedInput[tempAttr.toLowerCase()] = "-";
        } else {
            formattedInput[tempAttr.toLowerCase()] = +tempValue;
        }
            
    })
    
    // Attack Modifier
    formattedInput.bab = stringStatisticsData.match(/(?:Base Atk[\s+-]*)([\d]*)/i)[1];
    formattedInput.cmb = stringStatisticsData.match(/(?:Cmb[\s+-]*)([\d]*)/i)[1];
    formattedInput.cmd = stringStatisticsData.match(/(?:CMD )(.*)/i)[1];
    
    // Feats (String from "Feats" to next linebreak)
    if (stringStatisticsData.search(/(?:Feats )/) !== -1) {
        let splitFeats = stringStatisticsData.match(/(?:Feats )(.*)(?:\n+?)/gim)[0];
        splitFeats = splitFeats.replace(/Feats /i, "");
        splitFeats = splitFeats.replace(/,\s|;\s/g, ",");
        splitFeats = splitFeats.split(/,/);

        formattedInput.feats = splitFeats;
    }
    
    // Skills (String from "Skills" to next linebreak)
    if (stringStatisticsData.search(/(?:Skills )/) !== -1) {
        let splitSkills = stringStatisticsData.match(/(?:Skills\s*)(.*)(?:\n+?)/gim)[0];
        splitSkills = splitSkills.replace(/Skills\s*/i, "");
        splitSkills = splitSkills.replace(/,\s|;\s/g, ",");
        splitSkills = splitSkills.replace(/\n/, "");
        splitSkills = splitSkills.split(/,/);

        splitSkills.forEach (function (item, index) {

            let skillTotal = item.match(/(-\d+|\d+)/)[0];
            let skillName = item.replace(/(^\s*|\s*-.*|\s*\+.*)/g, "");

            // Cases with sublevels (Knowledge, Profession, Perform, Craft)
            if (skillName.search(/\bcraft\b|\bperform\b|\bprofession\b|\bknowledge\b/i) !== -1) {
                let skillSubtype = skillName.match(/\(([^)]+)\)/)[1];
                let tempSkillName = skillName.replace(/\s*\(([^)]+)\)/, "");
                formattedInput.skills[tempSkillName.toLowerCase()][skillSubtype.toLowerCase()] = +skillTotal;
            } else {
                formattedInput.skills[skillName.toLocaleLowerCase()] = +skillTotal;
            }

        });
    }
    
    // Racial Skill Modifiers
    
    // Languages
    if (stringStatisticsData.search(/(?:Languages )/) !== -1) {
        let splitLanguages = stringStatisticsData.match(/(?:Languages )(.*)(?:\n+?)/gim)[0].replace(/\n/gm,"");
        splitLanguages = splitLanguages.replace(/Languages /i, "");
        splitLanguages = splitLanguages.replace(/,\s|;\s/g, ",");
        splitLanguages = splitLanguages.split(/,/);

        console.log("splitLanguages: " + splitLanguages);
        formattedInput.languages = splitLanguages;
    }
    
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
    dataOutput = JSON.parse(JSON.stringify(dataTemplate));
    
    // Map generalData
    mapGeneralData(formattedInput);

    if(dataInputHasClasses == true) {
        // Create classes.class Data
        setClassData(formattedInput.classes);

        // Create a Feature/Class Item for Class and Race Entries
        setClassItem(formattedInput.classes);
    }
    
    if( (dataInputHasPlayableRace == true) || (dataInputHasNonPlayableRace == true) ) {
        setRaceItem(formattedInput.race);
    }
    
    // Create a Item for the Creature Type
    setRacialHDItem(formattedInput);
    
    // Create a custom Item for Conversion Stuff (e.g. Changes to AC, Saves)
    setConversionItem(formattedInput);
    
    // Map defenseData
    mapDefenseData(formattedInput);
    
    // Map statisticData
    mapStatisticData(formattedInput);

    
    
    
    // Map Notes
    mapNotesData();
    
    
    
    //returnJSON(JSON.stringify(formattedInput, null, 4));
    returnJSON(JSON.stringify(dataOutput, null, 4));
}

// Map General Data
function mapGeneralData(formattedInput) {
    // Top of the Character Sheet
    dataOutput.name = dataOutput.token.name = formattedInput.name.replace(/^ | $/, "");
    
    // Changes for Undead Creatures
    if (formattedInput.creature_type === "undead") {
        dataOutput.data.attributes.hpAbility = "cha";
        dataOutput.data.attributes.savingThrows.fort.ability = "cha";
    }
    
    // Token Data
    dataOutput.token.name = dataOutput.token.name = formattedInput.name;
    dataOutput.token.width = dataOutput.token.height = enumTokenSize[formattedInput.size].w;
    dataOutput.token.scale = enumTokenSize[formattedInput.size].scale;
    dataOutput.token.bar1 = { "attribute": "attributes.hp" };
    
    // Details
    dataOutput.data.details.level.value = formattedInput.level;
    dataOutput.data.details.cr = formattedInput.cr;
    dataOutput.data.details.xp.value = formattedInput.xp;
    dataOutput.data.details.alignment = formattedInput.alignment;
    
    // Attributes
    dataOutput.data.attributes.init.value = formattedInput.initiative - getModifier(formattedInput.dex);
    dataOutput.data.attributes.init.total = formattedInput.initiative;
    
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
    
    dataOutput.data.traits.senses = formattedInput.senses;
    
    // Senses and Vision
    if (formattedInput.senses.search(/low-light/i) !== -1) {
        dataOutput.data.attributes.vision.lowLight = true;
    }
    
    if (formattedInput.senses.search(/darkvision/i) !== -1) {
        let rangeDarkvision = formattedInput.senses.match(/(?:darkvision\s+?)(\d+)/)[1];
        dataOutput.data.attributes.vision.darkvision = rangeDarkvision;
    }
    
    dataOutput.token.vision = true;
    dataOutput.token.dimSight = 120;
    dataOutput.token.brightSight = 60;
    
}

// Map data.classes.class
function setClassData (classInput) {

    let classKey = Object.keys(classInput);

    let classEntries = {};
    
    for (var i=0; i < classKey.length; i++) {
        
        // Split Classes
        let classEntry = enumClassData[classKey[i].toLowerCase().replace(/npc/,"Npc")];
                
        let tempClassName = classKey[i];

        delete Object.assign(classEntry, {[tempClassName] : classEntry.classOrRacialHD }).classOrRacialHD;
        classEntry.level = classInput[tempClassName].level;
        classEntry.name = classInput[tempClassName].name;
        classEntries[tempClassName] = classEntry;
    }
    
    // Add classEntries to dataOutput.data.classes
    dataOutput.data.classes = classEntries;
    
}

// Create Class
function setClassItem (classInput) {

    let classKey = Object.keys(classInput);
    
    for (var i=0; i < classKey.length; i++) {
        // Create Item for the Class starting from the template
        let itemEntry = templateClassItem[classKey[i].toLowerCase().replace(/npc/,"Npc")];
        
        itemEntry.data.level = classInput[classKey[i]].level;
        inputClassHD = classInput[classKey[i]].level;
        itemEntry.data.hp = +formattedInput.hp.class;
        
        // "low"-progression: floor(@level / 3)
        // "high"-progression: 2 + floor(@level / 2)
        let saveKey = Object.keys(itemEntry.data.savingThrows);

        for (var i=0; i < saveKey.length; i++) {
            if (itemEntry.data.savingThrows[saveKey[i]].value == "low") {
                formattedInput[saveKey[i]+"_save"].class = Math.floor(itemEntry.data.level / 3);            
            } else if (itemEntry.data.savingThrows[saveKey[i]].value == "high") {
                formattedInput[saveKey[i]+"_save"].class = 2 + Math.floor(itemEntry.data.level / 2);
            } else {
                formattedInput[saveKey[i]+"_save"].class = 0;
            }
        }

        dataOutput.items.push(itemEntry);
    }
}

// Create Race Item
function setRaceItem (raceInput) {
    
    let itemEntry;
    
    // If it's a playable race
    if (dataInputHasNonPlayableRace == true) {
        itemEntry = templateRaceItem["default"];
        itemEntry.name = raceInput;
    } else if (dataInputHasPlayableRace == true) {
        itemEntry = templateRaceItem[raceInput.toLowerCase()];
    } else {
        console.log("something went wrong parsing the race");
    }
    dataOutput.items.push(itemEntry);
}

// Create Item for RacialHD
function setRacialHDItem (formattedInput) {

    // Create Item for the Class starting from the template
    let itemEntry = templateRacialHDItem[formattedInput.creature_type.toLowerCase()];
    
    itemEntry.data.level = +formattedInput.hit_dice.hd - inputClassHD;
    itemEntry.data.hp = +formattedInput.hp.race;
    
    // Update the name to include Subtypes
    if (formattedInput.creature_subtype !== "") {
        itemEntry.name = formattedInput.creature_type + " (" + formattedInput.creature_subtype + ")";
    }
    
    // Set Saves
    // "low"-progression: floor(@level / 3)
    // "high"-progression: 2 + floor(@level / 2)
    let saveKey = Object.keys(itemEntry.data.savingThrows);
    
    for (var i=0; i < saveKey.length; i++) {
        if (itemEntry.data.savingThrows[saveKey[i]].value == "low") {
            formattedInput[saveKey[i]+"_save"].racial = Math.floor(itemEntry.data.level / 3);            
        } else if (itemEntry.data.savingThrows[saveKey[i]].value == "high") {
            formattedInput[saveKey[i]+"_save"].racial = 2 + Math.floor(itemEntry.data.level / 2);
        } else {
            formattedInput[saveKey[i]+"_save"].racial = 0;
        }
    }

    dataOutput.items.push(itemEntry);
}

// Create Custom Item for Conversion Buff Item
function setConversionItem (formattedInput) {

    // Create Item for the Class starting from the template
    let itemEntry = templateConversionItem;
    
    // Add Changes to HP if needed
    // For that calculate the HP-Total from Classes, RacialHD and Con-Mod*Level
    // and compare that to the hp.total from the input
    let calculatedHPTotal = 0;
    if (formattedInput.con === "-") {
        calculatedHPTotal = +formattedInput.hp.race + +formattedInput.hp.class + (+formattedInput.hit_dice.hd * +getModifier(10));
    } else {
        calculatedHPTotal = +formattedInput.hp.race + +formattedInput.hp.class + (+formattedInput.hit_dice.hd * +getModifier(formattedInput.con));
    }
    
    if (+calculatedHPTotal !== +formattedInput.hp.total) {
        
        let tempHPDifference = formattedInput.hp.total - calculatedHPTotal;
        let hpChange = [
            tempHPDifference.toString(),
            "misc",
            "mhp",
            "untyped"
        ];
                
        itemEntry.data.changes.push(hpChange);
    }

    // Add Changes to AC
    for (var key in formattedInput.ac_bonus_types) {
        // Exclude dex, size and natural, as these are included elsewhere in the sheet
        if ( (key.toLowerCase() !== "dex") && (key.toLowerCase() !== "size") && (key.toLowerCase() !== "natural") ) {
            
            let acChange = [];
            
            // Special Treatment for Armor and Shield Boni
            if ( ( key.toLowerCase() == "armor" ) || ( key.toLowerCase() == "shield" ) ) {
                acChange.push(formattedInput.ac_bonus_types[key].toString());
                acChange.push("ac");
                if ( key == "armor") {
                    acChange.push("aac");
                } else {
                    acChange.push("sac");
                }
                acChange.push("base");
            } else {
                acChange.push(formattedInput.ac_bonus_types[key].toString());
                acChange.push("ac");
                acChange.push("ac");
                acChange.push(key);
            }

            itemEntry.data.changes.push(acChange);  
        }
    }
    
    // Add SavingThrow Values in Changes, decreased by the corresponding attribute modifiers
    // and the values derived from the saving throw progression of racialHD and class
    // "low"-progression: floor(@level / 3)
    // "high"-progression: 2 + floor(@level / 2)
    enumSaves.forEach( function (item, index) {
        let saveChange = [];
        let tempSaveString = item + "_save";
        
        if (item === "fort" && formattedInput.con == "-") {
            let tempSaveChange = +formattedInput[tempSaveString].total - +formattedInput[tempSaveString].racial - +formattedInput[tempSaveString].class;
            saveChange.push(tempSaveChange.toString());
        } else {
            let attrModifier = +getModifier(formattedInput[enumSaveModifier[index]]);
            
            let tempSaveChange = +formattedInput[tempSaveString].total - +formattedInput[tempSaveString].racial - +formattedInput[tempSaveString].class - +attrModifier;
            saveChange.push(tempSaveChange.toString());
        }
        
        saveChange.push("savingThrows");
        saveChange.push(item);
        saveChange.push("untyped");

        itemEntry.data.changes.push(saveChange);  
    });
    
    itemEntry.data.active = false;
    
    dataOutput.items.push(itemEntry);
}

// Create Items for Feats
function setFeatItem (featInput) {
    
    let itemEntry = JSON.parse(JSON.stringify(templateFeatItem));
    
    // For now, just set the name of the Feat
    itemEntry.name = featInput;
    
    dataOutput.items.push(itemEntry);
}

// Map defensive Data
function mapDefenseData (formattedInput) {

    // Attributes
    dataOutput.data.attributes.hp.value = +formattedInput.hp.total;
    dataOutput.data.attributes.hp.max = +formattedInput.hp.total;
    
    dataOutput.data.attributes.ac.normal.total = +formattedInput.ac;
    dataOutput.data.attributes.ac.touch.total = +formattedInput.touch;
    dataOutput.data.attributes.ac.flatFooted.total = +formattedInput.flat_footed;
    dataOutput.data.attributes.naturalAC = +formattedInput.ac_bonus_types.natural;
    dataOutput.data.attributes.acNotes = formattedInput.acNotes;
    
    dataOutput.data.attributes.savingThrows.fort.total = +formattedInput.fort_save.total;
    dataOutput.data.attributes.savingThrows.ref.total = +formattedInput.ref_save.total;
    dataOutput.data.attributes.savingThrows.will.total = +formattedInput.will_save.total;
    
    // SR
    dataOutput.data.attributes.sr.total = +formattedInput.spell_resistance;
    dataOutput.data.attributes.sr.formula = formattedInput.spell_resistance;
    // !!! SR Formula
    
    // DR
    if (formattedInput.damage_reduction.dr_value) {
        dataOutput.data.traits.dr = +formattedInput.damage_reduction.dr_value + "/" + formattedInput.damage_reduction.dr_type;
    }
    
    // Regeneration & Fast Healing
    dataOutput.data.traits.regen = formattedInput.regeneration;
    dataOutput.data.traits.fastHealing = formattedInput.fast_healing;
    
    // Defensive Abilities
    // The list is found in the Notes-Section, long-forms should be in the special abilities section
    
    // Immunities    
    // Set Condition Immunities
    let tempImmunities = formattedInput.immunities;
    enumConditions.forEach( function (item, index) {
        if (tempImmunities.search(item) !== -1) {
            dataOutput.data.traits.ci.value.push(item);
            tempImmunities = tempImmunities.replace(item, "");
        }
    });
    
    // Set Damage Immunities
    enumDamageTypes.forEach( function (item, index) {
        if (tempImmunities.search(item) !== -1) {
            dataOutput.data.traits.di.value.push(item);
            tempImmunities = tempImmunities.replace(item, "");
        }
    });
    
    // If there is anything left in tempImmunities, treat it as a custom immunity
    if (tempImmunities.search(/(\w+)/gi) !== -1) {
        let tempCustomImmunity = tempImmunities.match(/(\w+)/gi).join(", ");
        // Now way to find out if its damage or a condition, so set it to both
        dataOutput.data.traits.di.custom = tempCustomImmunity;
        dataOutput.data.traits.ci.custom = tempCustomImmunity;
    }
    
    // Resistances    
    let tempResistances = formattedInput.resistances;
    
    enumDamageTypes.forEach( function (item, index) {
        let tempResistanceRegEx = new RegExp("(\\b" + item + "\\b \\d+)", "ig");
        if (tempResistances.search(tempResistanceRegEx) !== -1) {
            let tempResistance = formattedInput.resistances.match(tempResistanceRegEx);
            dataOutput.data.traits.eres += tempResistance + ", ";
        }
    });
    
    dataOutput.data.traits.eres = dataOutput.data.traits.eres.replace(/, $/,"");
        
    // Weaknesses / Vulnerabilities    
    // Set DamageType Vulnerabilities
    let tempWeaknesses = formattedInput.weaknesses;
    enumDamageTypes.forEach( function (item, index) {
        if (tempWeaknesses.search(item) !== -1) {
            dataOutput.data.traits.dv.value.push(item);
            tempWeaknesses = tempWeaknesses.replace(item, "");
        }
    });
    
    // If there is anything left in tempWeaknesses, treat it as a custom weakness
    if (tempWeaknesses.search(/(\w+)/gi) !== -1) {
        let tempCustomWeakness = tempWeaknesses.match(/(\w+)/gi).join(", ");
        
        dataOutput.data.traits.dv.custom = tempCustomWeakness;
    }
    
    
    
    
    // Reset Max Dex Bonus for now
    // dataOutput.data.attributes.maxDexBonus = 0;
}

// Map Statistics to data.attributes
function mapStatisticData (formattedInput) {
    
    // Abilities
    let carryCapacity = 0;
    dataOutput.data.abilities.str.carryMultiplier = carrySizeModificators[formattedInput.size];
    dataOutput.data.abilities.str.carryBonus = 0;
    
    enumAttributes.forEach ( function (item, index) {
        if (formattedInput[item] !== "-") {
            dataOutput.data.abilities[item].total = +formattedInput[item];
            dataOutput.data.abilities[item].value = +formattedInput[item];
            dataOutput.data.abilities[item].mod = getModifier(formattedInput[item]);
            
            if (item.toLowerCase() === "str") {
                carryCapacity = getEncumbrance(formattedInput[item]) * dataOutput.data.abilities.str.carryMultiplier;
            }
            
        } else {
            // The sheet currently doesn't support - as input, so set everything to 0
            dataOutput.data.abilities[item].total = 0;
            dataOutput.data.abilities[item].value = 0;
            // And negate effects on the modificator in the conversion item
            dataOutput.data.abilities[item].mod = -5;
            
            // A Creature without Strength (e.g. incorporeal undead) can't carry stuff?!
            if (item.toLowerCase() === "str") {
                carryCapacity = 0;
            }
        }
    });
    
    // Finish Carry Capacity
    dataOutput.data.attributes.encumbrance.levels.light = Math.floor(1/3 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.medium = Math.floor(2/3 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.heavy = Math.floor(carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.carry = Math.floor(2 * carryCapacity);
    dataOutput.data.attributes.encumbrance.levels.drag = Math.floor(5 * carryCapacity);
    
    // BAB, CMB, CMD
    dataOutput.data.attributes.bab.total = "+" + +formattedInput.bab;
    dataOutput.data.attributes.cmb.total = "+" + +formattedInput.cmb;
    dataOutput.data.attributes.cmd.total = formattedInput.cmd;
    
    // Feats
    formattedInput.feats.forEach ( function (item, index) {
        setFeatItem(item);
    });
    
    // Skills
    let skillKeys = Object.keys(formattedInput.skills);
    
    for (let i = 0; i < skillKeys.length; i++) {
        
        let skillKey = skillKeys[i];
                
        // Skills with Sublevels
        if (skillKey.match(/\bcraft\b|\bperform\b|\bprofession\b|\bknowledge\b/i)) {
            
            let skillSubKeys = Object.keys(formattedInput.skills[skillKey]);
            
            // Get the Sublevel Keys
            for (let j = 0; j < skillSubKeys.length; j++) {
                let skillSubKey = skillSubKeys[j];
                
                // Set the skills
                let tempAttrShort = enumSkills[skillKey][skillSubKey];
                            
                // Check if the Skill is a classSkill in any of the items
                let searchString = '"' + tempAttrShort + '":true';
                let tempClassSkillModifier = 0;

                if (JSON.stringify(dataOutput.items).search(searchString) !== -1) {
                    console.log(skillSubKey + " is a classSkill");
                    tempClassSkillModifier = 3;
                }

                let tempAttr = templateSkills[tempAttrShort].ability;
                let tempAttrModifier = getModifier(formattedInput[tempAttr]);

                // Calculate the Rank (e.g. Total - Attribute-Modifier, maybe - ClassSkillBonus?)
                if (formattedInput.skills[skillKey] !== 0) {
                    dataOutput.data.skills[tempAttrShort].rank = +formattedInput.skills[skillKey][skillSubKey] - +tempAttrModifier - +tempClassSkillModifier;
                    dataOutput.data.skills[tempAttrShort].mod = formattedInput.skills[skillKey][skillSubKey];
                }
      
            }
            
        } else {
            // Skill without a sublevel
            let tempAttrShort = enumSkills[skillKey];
            
            // Check if the Skill is a classSkill in any of the items
            let searchString = '"' + tempAttrShort + '":true';
            let tempClassSkillModifier = 0;
            
            if (JSON.stringify(dataOutput.items).search(searchString) !== -1) {
                //console.log(skillKey + " is a classSkill");
                tempClassSkillModifier = 3;
            }
            
            let tempAttr = templateSkills[tempAttrShort].ability;
            let tempAttrModifier = getModifier(formattedInput[tempAttr]);
            
            // Calculate the Rank (e.g. Total - Attribute-Modifier, maybe - ClassSkillBonus?)
            if (formattedInput.skills[skillKey] !== 0) {
                dataOutput.data.skills[tempAttrShort].rank = +formattedInput.skills[skillKey] - +tempAttrModifier - +tempClassSkillModifier;
                dataOutput.data.skills[tempAttrShort].mod = formattedInput.skills[skillKey];
            }

        }
        
    }
    
    // Languages
    let tempKnownLanguages = [];
    let tempUnknownLanguages = "";
    
    formattedInput.languages.forEach ( function (item, index) {
        console.log("item: " + item.toLowerCase());
        console.log("JSON.stringify(enumLanguages): " + JSON.stringify(enumLanguages));
        

        if (JSON.stringify(enumLanguages).search(item.toLowerCase()) !== -1) {
            console.log("pushing " + item + " onto value");
            tempKnownLanguages.push(item.toLowerCase());
            console.log("tempKnownLanguages: " + tempKnownLanguages);
        } else {
            tempUnknownLanguages += item + ", ";
        }
        
        
    });
    
    dataOutput.data.traits.languages.value = tempKnownLanguages;
    dataOutput.data.traits.languages.custom = tempUnknownLanguages.replace(/, $/,"");
    
}

// Map Notes in HTML
function mapNotesData() {
    let tempNotes = "";
    
    // H2 - TACTICS
    if (dataInputHasTactics === true) {
        let tempTacticsSection = "<section id='tactics'><h2>TACTICS</h2>";
        if (formattedInput.tactics.before_combat !== "") {
            tempTacticsSection += "<p><span style='font-weight: 900'>Before Combat:</span> " + formattedInput.tactics.before_combat + "</p>";
        }
        if (formattedInput.tactics.during_combat !== "") {
            tempTacticsSection += "<p><span style='font-weight: 900'>During Combat:</span> " + formattedInput.tactics.during_combat + "</p>";
        }
        if (formattedInput.tactics.morale !== "") {
            tempTacticsSection += "<p><span style='font-weight: 900'>Morale:</span> " + formattedInput.tactics.morale + "</p>";
        }
        tempTacticsSection += "</section>";
        tempNotes += tempTacticsSection;
    }
    
    // H2 - DEFENSIVE ABILITIES
    if (formattedInput.defensive_abilities !== "") {
        let tempDefensiveAbilitiesSection = "<section id='defensiveAbilities'><h2>DEFENSIVE ABILITIES</h2>";
        tempDefensiveAbilitiesSection += "<p>" + formattedInput.defensive_abilities + "</p>";
        tempDefensiveAbilitiesSection += "</section>";
        
        tempNotes += tempDefensiveAbilitiesSection;
    }
    
    // H2 - RAW STATBLOCK
    let tempStatblockSection = "<section id='statblock'><h2>IMPORTED RAW DATA</h2>";
    tempStatblockSection += "<p>" + dataInput + "</p></section>";
    
    tempNotes += tempStatblockSection;
    
    // WRITE EVERYTHING TO THE NOTES
    dataOutput.data.details.notes.value = tempNotes;
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
