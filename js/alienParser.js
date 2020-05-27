// Alien Converter 1.1

// Declare global variables
var inputLoaded = false;
var templateLoaded = false;
var dataInput;
var dataOutput;
var dataTemplate;
var skillsInput;
var meleeInput;
var rangedInput;
var multiAttackInput;
var specialAttackInput;
var spellLikeAbilityInput;
var auraInput;
var backupAttackName = [];
var tempStorage = [];
var zip = new JSZip();

// Initilization
function init() {

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    // Call
    main();
}

// main converter
function main() {

    readJSON();
    readTemplate();

}

// Read a JSON File
function readJSON() {
    var reader = new FileReader();

    function errorHandler(evt) {
        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case evt.target.error.NOT_READABLE_ERR:
                alert('File is not readable');
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                alert('An error occurred reading this file.');
        };
    }

    function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                        f.size, ' bytes, last modified: ',
                        f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                        '</li>');
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';


        // Read JSON
        reader.readAsText(evt.target.files[0]);
        reader.onloadend = function () {
            var jsonData = JSON.parse(reader.result);
            inputLoaded = true;
            dataInput = jsonData;
        };

    }

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

// create a new JSON File from Monster Template
function readTemplate() {
    var readerTemplate = new FileReader();

    function errorHandler(evt) {
        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case evt.target.error.NOT_READABLE_ERR:
                alert('File is not readable');
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                alert('An error occurred reading this file.');
        };
    }

    function handleFileSelect(evt) {
        var template = evt.target.templates; // FileList object

        // Read Template
        readerTemplate.readAsText(evt.target.files[0]);
        readerTemplate.onloadend = function () {
            var jsonTemplate = JSON.parse(readerTemplate.result);
            templateLoaded = true;
            dataTemplate = jsonTemplate;
        };
    }

    document.getElementById('templates').addEventListener('change', handleFileSelect, false);
}


// Creating a Monster
async function createMonster() {

    var statusOutput = [];

    // WORK IF FILES ARE LOADED
    if (inputLoaded == true && templateLoaded == true) {
        // files loaded
        statusOutput.push("files loaded");
        document.getElementById('statusOutput').innerHTML = statusOutput;

        // for production, use all entries
        for (let i = 0; i < dataInput.aliens.length; i++) {

            // For Testing: Use just the first entry
            //for (i = 0; i < 1; i++) {
            // send each of the results to be mapped onto the template
            mapInputToTemplate(dataInput.aliens[i]);
        }

        //console.log("tempStorage.length: " + tempStorage.length);

        for (let i = 0; i < tempStorage.length; i = i +2) {
            //console.log("currentIndex: " + i);
            //console.log("writing file: " + tempStorage[i]);
            zip.file(tempStorage[i], tempStorage[i+1]);
        }

        // Write the Zip
        writeToDisk();


    } else if (inputLoaded == true && templateLoaded == false) {
        // no template loaded
        statusOutput.push("no template loaded");
        document.getElementById('statusOutput').innerHTML = statusOutput;
    } else if (templateLoaded == true && inputLoaded == false) {
        // no input loaded
        statusOutput.push("no input loaded");
        document.getElementById('statusOutput').innerHTML = statusOutput;
    } else {
        // no files loaded
        statusOutput.push("no files loaded");
        document.getElementById('statusOutput').innerHTML = statusOutput;
    }
}

// Map Input to Template
async function mapInputToTemplate(input) {

    // clear and set the output object
    dataOutput = JSON.parse(JSON.stringify(dataTemplate));

    /* ***************
     * CONTENT MAPPING
     * *************** */

    // name
    dataOutput.name = capitalize(input.title.toLowerCase());

    // gmnotes
    if(input.description) {
        dataOutput.gmnotes = input.description.replace(/\s\#newline\s/g,"<br/><br/>");
    }

    // tags
    // [\"monster\"]
    dataOutput.tags = "[\"monster\"";
    dataOutput.tags = dataOutput.tags.concat(",\""+input.alignment.trim()+"\"");
    dataOutput.tags = dataOutput.tags.concat(",\"CR"+input.cr+"\"");
    dataOutput.tags = dataOutput.tags.concat(",\""+input.creature_type+"\"");
    if (input.creature_subtype != "") {
        dataOutput.tags = dataOutput.tags.concat(",\""+input.creature_subtype+"\"");
    }
    dataOutput.tags = dataOutput.tags.concat("]");

    // ATTRIBUTES

    // graft
    var graft = input.size + " " + input.alignment + " " + input.creature_type + "(" + input.creature_subtype + ")";
    setJSONAttribute("attribs", "Graft", graft);

    // speed
    var speed = input.speed;
    setJSONAttribute("attribs", "Speed", speed);

    // HP
    var hp = input.hp;
    setJSONAttribute("attribs", "HP", hp);

    // RP
    if(input.rp) {
        var rp = input.rp;
        setJSONAttribute("attribs", "RP", rp);
    }

    // KAC
    var kac = input.kac;
    setJSONAttribute("attribs", "KAC", kac);

    // EAC
    var eac = input.eac;
    setJSONAttribute("attribs", "EAC", eac);

    // DR
    if(input.damage_reduction) {
        var dr = input.damage_reduction;
        setJSONAttribute("attribs", "DR", dr);
    }

    // Weaknesses
    if(input.weaknesses) {
        var weaknesses = input.weaknesses;
        setJSONAttribute("attribs", "Weaknesses", weaknesses);
    }

    // Resistances
    if(input.resistances) {
        var resistances = input.resistances;
        setJSONAttribute("attribs", "Resistances", resistances);
    }

    // Immunities
    if(input.immunities) {
        var immunities = input.immunities;
        setJSONAttribute("attribs", "Immunities", immunities);
    }

    // Defensive Abilities
    if(input.defensive_abilities) {
        var defAbilities = input.defensive_abilities;
        setJSONAttribute("attribs", "Defensive Abilities", defAbilities);
    }

    // Senses
    if(input.senses) {
        var senses = input.senses;
        setJSONAttribute("attribs", "Senses", senses);
    }

    // Size, Space and Reach
    if(input.size) {
        let space = "";
        let reach = "";

        switch(input.size) {
            case "Fine":
                space = "0.5 ft.";
                reach = "0 ft.";
                break;

            case "Diminutive":
                space = "1 ft.";
                reach = "0 ft.";
                break;

            case "Tiny":
                space = "2.5 ft.";
                reach = "0 ft.";
                break;

            case "Small":
                space = "5 ft.";
                reach = "5 ft.";
                break;

            case "Medium":
                space = "5 ft.";
                reach = "5 ft.";
                break;

            case "Large":
                space = "10 ft.";
                reach = "5-10 ft.";
                break;

            case "Huge":
                space = "15 ft.";
                reach = "10-15 ft.";
                break;

            case "Gargantuan":
                space = "20 ft.";
                reach = "15-20 ft.";
                break;

            case "Colossal":
                space = "30 ft.";
                reach = "20-30 ft.";
                break;

            default:
                break;
        }

        setJSONAttribute("attribs", "Space", space);
        setJSONAttribute("attribs", "Reach", reach);
    }

    // Fortitude
    if(input.fort_save) {
        var fort = input.fort_save;
        setJSONAttribute("attribs", "Fortitude", fort);
    }

    // Reflex
    if(input.ref_save) {
        var ref = input.ref_save;
        setJSONAttribute("attribs", "Reflex", ref);
    }

    // Will
    if(input.will_save) {
        var will = input.will_save;
        setJSONAttribute("attribs", "Will", will);
    }

    // INI
    var ini = input.initiative;
    setJSONAttribute("attribs", "INI", ini);

    // STR
    var str = input.str;
    setJSONAttribute("attribs", "STR", str);

    // DEX
    var dex = input.dex;
    setJSONAttribute("attribs", "DEX", dex);

    // CON
    var con = input.con;
    setJSONAttribute("attribs", "CON", con);

    // INT
    var int = input.int;
    setJSONAttribute("attribs", "INT", int);

    // WIS
    var wis = input.wis;
    setJSONAttribute("attribs", "WIS", wis);

    // CHA
    var cha = input.cha;
    setJSONAttribute("attribs", "CHA", cha);

    // Perception
    var perception = input.perception;
    setJSONAttribute("attribs", "Perception", perception);

    // Level
    var lvl = input.cr;
    setJSONAttribute("attribs", "lvl", lvl);

    // Languages
    if(input.languages) {
        var languages = input.languages;
        setJSONAttribute("attribs", "Languages", languages);
    }

    // Environment
    var environment = input.environment;
    setJSONAttribute("attribs", "Environment", environment);

    // Organization
    var organization = input.organization;
    setJSONAttribute("attribs", "Organization", organization);

    // Special Abilities
    if(input.special_abilities) {
        var specialAbilities = input.special_abilities;
        setJSONAttribute("attribs", "Special Abilities", specialAbilities);
    }
    
    // Offensive Abilities
    if(input.offensive_abilities) {
        var offensiveAbilities = input.offensive_abilities;
        setJSONAttribute("attribs", "Offensive Abilities", offensiveAbilities);
    }

    // XP
    var xp = input.xp;
    setJSONAttribute("attribs", "XP", xp);

    // Parse Skills
    if(input.skills) {
        skillsInput = separateSkills(input.skills);
        var skillsSummary = "";
        Object.keys(skillsInput).forEach((key) => {
            setJSONAttribute("attribs", key, skillsInput[key])
            skillsSummary = skillsSummary.concat(key + " +@{" + key + "} ([[1d20+@{" + key + "}]]) | ");

        })

        setJSONAttribute("attribs", "≡≡≡≡≡ Skill Selection", skillsSummary);
    }

    // Parse Melee Attacks
    if(input.melee) {
        meleeInput = separateAttacks(input.melee);
        let meleeAttackString = "";
        Object.entries(meleeInput).forEach((attack, index) => {
            meleeStringComplete = formatAttack(attack, index);
            let attackName = attack.toString().split(",")[0];
            setAndChangeJSONAttribute("abilities", "Melee-" + index, meleeStringComplete, attackName);
            meleeAttackString = meleeAttackString.concat("[" + attackName + "](~" + attackName + ") | ");
        })

        setJSONAttribute("attribs", "Melee", meleeAttackString);
    }

    // Parse Ranged Attacks
    if(input.ranged) {
        rangedInput = separateAttacks(input.ranged);
        let rangedAttackString = "";
        Object.entries(rangedInput).forEach((attack, index) => {
            rangedStringComplete = formatAttack(attack, index);
            let attackName = attack.toString().split(",")[0];
            setAndChangeJSONAttribute("abilities", "Ranged-" + index, rangedStringComplete, attackName);
            rangedAttackString = rangedAttackString.concat("[" + attackName + "](~" + attackName + ") | ");
        })

        setJSONAttribute("attribs", "Ranged", rangedAttackString);
    }

    // Parse Multiattacks
    multiAttackInput = separateMultiAttacks(input.multiattack);
    if(input.multiattack) {
        let multiAttackString = "";
        let multiAttackPart = "";

        multiAttackStringComplete = " &{template:default} {{name=@{selected|token_name}'s Multiattack}} ";
        Object.entries(multiAttackInput).forEach((attack, index) => {
            multiAttackPart = formatMultiAttack(attack, index);
            multiAttackStringComplete = multiAttackStringComplete.concat(multiAttackPart);
        })

        setJSONAttribute("abilities", "Multi-Attack", multiAttackStringComplete);
        multiAttackString = "[Multiattack](~Multiattack)";

        setJSONAttribute("attribs", "Multiattack", multiAttackString);
    }

    // Parse Special Attacks
    if(input.special_attacks) {
        specialAttackInput = input.special_attacks;
        setJSONAttribute("attribs", "Special Attacks", specialAttackInput);
    }

    // Parse Spell-Like Abilities
    if(input.spell_like_abilities) {
        // Create the Ability Macro
        let spellLikeAbilitiesAbilityString = formatSpellLikeAbilities(input.spell_like_abilities, "Spell-Like Abilities");
        setJSONAttribute("abilities", "Spell-Like-Abilities", spellLikeAbilitiesAbilityString);

        // Create the String for the Attribute
        let spellLikeAbilitiesAttributeString = "[Spell-Like Abilities](~Spell-Like-Abilities)";
        setJSONAttribute("attribs", "Spell-Like Abilities", spellLikeAbilitiesAttributeString);
    }

    // Parse Mystic Spell-Like Abilities
    if(input.mystic_spell_like_abilities) {
        // Create the Ability Macro
        let spellLikeAbilitiesAbilityString = formatSpellLikeAbilities(input.mystic_spell_like_abilities, "Mystic Spell-Like-Abilities");
        setJSONAttribute("abilities", "Mystic Spell-Like-Abilities", spellLikeAbilitiesAbilityString);

        // Create the String for the Attribute
        let spellLikeAbilitiesAttributeString = "[Mystic Spell-Like Abilities](~Mystic Spell-Like-Abilities)";
        setJSONAttribute("attribs", "Mystic Spell-Like Abilities", spellLikeAbilitiesAttributeString);
    }

    // Parse Technomancer Spell-Like Abilities
    if(input.technomancer_spell_like_abilities) {
        // Create the Ability Macro
        let spellLikeAbilitiesAbilityString = formatSpellLikeAbilities(input.technomancer_spell_like_abilities, "Technomancer Spell-Like-Abilities");
        setJSONAttribute("abilities", "Technomancer Spell-Like-Abilities", spellLikeAbilitiesAbilityString);

        // Create the String for the Attribute
        let spellLikeAbilitiesAttributeString = "[Technomancer Spell-Like Abilities](~Technomancer Spell-Like-Abilities)";
        setJSONAttribute("attribs", "Technomancer Spell-Like Abilities", spellLikeAbilitiesAttributeString);
    }

    // Parse Race/Class/Special Spell-Like Abilities
    let searchString = JSON.stringify(input).toString().match(/([\w-]*)_spell_like_abilities/g);

    // if there is a special spell like ability, do stuff
    if (searchString) {

        searchString = searchString.toString().replace(/mystic_spell_like_abilities/, "");
        searchString = searchString.toString().replace(/technomancer_spell_like_abilities/, "");
        searchString = searchString.replace(/,+/, "");

        if(input[searchString]) {

            // Create the Ability Macro
            let spellLikeAbilitiesAbilityString = formatSpellLikeAbilities(input[searchString], "Special Spell-Like-Abilities");
            setJSONAttribute("abilities", "Special Spell-Like-Abilities", spellLikeAbilitiesAbilityString);

            // Create the String for the Attribute
            let spellLikeAbilitiesAttributeString = "[Special Spell-Like Abilities](~Special Spell-Like-Abilities)";
            setJSONAttribute("attribs", "Special Spell-Like Abilities", spellLikeAbilitiesAttributeString);
        }

    }

    // Parse Spells Known
    if(input.spells_known) {
        // Create the Ability Macro
        let spellsKnownAbilityString = formatSpellLikeAbilities(input.spells_known, "Spells-Known");
        setJSONAttribute("abilities", "Spells-Known", spellsKnownAbilityString);

        // Create the String for the Attribute
        let spellsKnownAttributeString = "[Spells Known](~Spells-Known)";
        setJSONAttribute("attribs", "Spells Known", spellsKnownAttributeString);
    }

    // Parse Mystic Spells Known
    if(input.mystic_spells_known) {
        // Create the Ability Macro
        let spellsKnownAbilityString = formatSpellLikeAbilities(input.mystic_spells_known, "Mystic Spells-Known");
        setJSONAttribute("abilities", "Mystic Spells-Known", spellsKnownAbilityString);

        // Create the String for the Attribute
        let spellsKnownAttributeString = "[Mystic Spells Known](~Mystic Spells-Known)";
        setJSONAttribute("attribs", "Mystic Spells Known", spellsKnownAttributeString);
    }

    // Parse Technomancer Spells Known
    if(input.technomancer_spells_known) {
        // Create the Ability Macro
        let spellsKnownAbilityString = formatSpellLikeAbilities(input.technomancer_spells_known, "Technomancer Spells-Known");
        setJSONAttribute("abilities", "Technomancer Spells-Known", spellsKnownAbilityString);

        // Create the String for the Attribute
        let spellsKnownAttributeString = "[Technomancer Spells Known](~Technomancer Spells-Known)";
        setJSONAttribute("attribs", "Technomancer Spells Known", spellsKnownAttributeString);
    }

    // Loot and Gear
    var loot;
    if (input.gear) {
        var lootStart = " &{template:default} {{name=@{selected|token_name}'s Loot}} {{**Patch on Gear:** [[[[1d2-1]]t[D100-Patches]]]\n**Trinket:** [[[[1d2-1]]t[D100-Trinkets]]] }} {{";
        var lootContent = makeValueRollable(input.gear);
        var lootEnd = "}} ";
        loot = lootStart.concat(lootContent).concat(lootEnd);

    } else {
        loot = " &{template:default} {{name=@{selected|token_name}'s Loot}} {{**No Loot!**}} ";
    }
    setJSONAttribute("abilities", "LOOT", loot);

    // Parse Tactics Information
    /*
    if (input.before_combat) {
        let beforeCombatString = formatTactics(input.before_combat, "Tactics: Before Combat");
        console.log("beforeCombatString: " + beforeCombatString);
        createJSONAttribute("abilities", "Before-Combat", beforeCombatString, false);
    }

    if (input.during_combat) {
        let duringCombatString = formatTactics(input.during_combat, "Tactics: During Combat");
        console.log("duringCombatString: " + duringCombatString);
        createJSONAttribute("abilities", "During-Combat", duringCombatString, false);
    }

    if (input.after_combat) {
        let afterCombatString = formatTactics(input.after_combat, "Tactics: After Combat");
        console.log("afterCombatString: " + afterCombatString);
        createJSONAttribute("abilities", "After-Combat", afterCombatString, false);
    }
    */

    if (input.before_combat || input.during_combat || input.after_combat) {
        let tacticsString = "/w GM &{template:default} {{name=@{selected|token_name} TACTICS}} ";

        if (input.before_combat) {
            tacticsString = tacticsString.concat(formatTactics(input.before_combat, "Before Combat"))
        }

        if (input.during_combat) {
            tacticsString = tacticsString.concat(formatTactics(input.during_combat, "During Combat"))
        }

        if (input.after_combat) {
            tacticsString = tacticsString.concat(formatTactics(input.after_combat, "After Combat"))
        }

        createJSONAttribute("abilities", "TACTICS", tacticsString, false);
    }


    /* ***************
     * END OF MAPPING
     * *************** */

    removeEmptyAbilities();

    // write the file to disk
    await writeToTemp(JSON.stringify(dataOutput), dataOutput.name + ".json");

    //console.log(JSON.stringify(dataOutput));

}


/*
// Save JSON File to Disk
function writeToDisk(text, filename) {
    console.log("text: " + text);
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-u,' + encodeURIComponent(text));
    a.setAttribute('download', filename);
    a.click()
}
*/

// Save JSON Files to tempStorage
function writeToTemp(text, filename) {
    //tempStorage.push(filename, 'data:text/plain;charset=utf-u,' + encodeURIComponent(text));
    tempStorage.push(filename, text);
}

function writeToDisk() {
    zip.generateAsync({type:"blob"})
        .then(function(content) {
        saveAs(content, "Aliens.zip");
    });
}

// CREATE JSON ATTRIBUTE
function createJSONAttribute(subItem, item, value, boolTokenAction) {
    dataOutput[subItem].push({
        name: item,
        description: "",
        istokenaction: boolTokenAction,
        action: value,
        order: -1
    });
}

// FIND AND SET
function setJSONAttribute(subItem, item, value) {

    for (key in dataOutput) {

        if (subItem == "attribs") {
            for (i in dataOutput[key]) {

                if (dataOutput[key][i].name == item) {
                    if (value != null) {
                        dataOutput[key][i].current = value;
                        // additionally set the max value of HP, SP and RP
                        if (dataOutput[key][i].name == "HP" || dataOutput[key][i].name == "SP" || dataOutput[key][i].name == "RP") {
                            dataOutput[key][i].max = value;
                        }
                    }
                }
            }
        } else if (subItem == "abilities") {

            for (i in dataOutput[key]) {

                if (dataOutput[key][i].name == item) {
                    dataOutput[key][i].action = value.substring(1, value.length - 1);
                }
            }
        } else {

        }

    }
    // Nothing found yet? return null.
    return null;
}

// FIND, CHANGE AND SET
function setAndChangeJSONAttribute(subItem, item, value, attackName) {

    for (key in dataOutput) {

        if (subItem == "attribs") {
            for (i in dataOutput[key]) {

                if (dataOutput[key][i].name == item) {
                    dataOutput[key][i].current = value;
                    // additionally set the max value of HP, SP and RP
                    if (dataOutput[key][i].name == "HP" || dataOutput[key][i].name == "SP" || dataOutput[key][i].name == "RP") {
                        dataOutput[key][i].max = value;
                    }

                }
            }
        } else if (subItem == "abilities") {

            for (i in dataOutput[key]) {

                if (dataOutput[key][i].name == item) {
                    dataOutput[key][i].name = attackName;
                    dataOutput[key][i].action = value.substring(1, value.length - 1);
                }
            }
        } else {

        }

    }
    // Nothing found yet? return null.
    return null;
}

// Make Value Rollable in Roll20
function makeValueRollable(inputText) {

    var output = [];
    var json = inputText.split('/(\d+)/');
    json.forEach(function (item) {
        var itemReplace = item.replace(/\'/g, '');
        var itemSplit = itemReplace.split(/(\d+)/);

        var subItemCount = 0;
        itemSplit.forEach(function (subItem, index) {

            if (subItemCount % 2 == 1) {
                var leftBrackets = "[[1d";
                var rightBrackets = "]]";

                subItem = leftBrackets.concat(subItem).concat(rightBrackets);

            }
            subItemCount += 1;
            itemSplit[index] = subItem;
        });

        var itemFilter = itemSplit.filter(Boolean);
        itemFilter = itemFilter.join("");

        output.push(itemFilter);
    });

    var outputLength = output.toString().length;
    var outputString = output.toString().substring(0, outputLength);

    return outputString;
}

// Make critString Rollable in Roll20
function makeCritStringRollable(inputText) {

    //console.log("inputText: " + inputText);
    var output = inputText.replace(/(\d+d\d+)/, "[[$1]]");

    return output;
}

// Format Combat Tactics
function formatTactics(input, tacticsType) {

    let tacticsStringComplete =
        " {{" + tacticsType + "=" + input + "}}";

    return tacticsStringComplete;

}

// Format Spell-Like Abilities and Spells
function formatSpellLikeAbilities(input, spellType) {

    //console.log("input: " + input);
    //console.log("spellType: " + spellType);

    let stringComplete = " &{template:default} {{name=@{selected|token_name} " + spellType + " }} ";

    // Split input at newlines
    //let singleLines = input.split(/\r\n/);
    let singleLines = input.split(/ #newline /);

    // Work your way through all items
    singleLines.forEach(function(item, index) {

        // The first item always contains the CL and sometimes an attackModifier
        if(index == 0) {
            // Caster Level Check
            let stringCL = "";
            let stringCLComplete = "{{CL Check:=[CL Check](~" + spellType + " CL-Check) }} ";
            let stringAttackModifier = "";
            let stringAttackComplete = "";
            let spellAttackString = "";

            // Set CL and AttackModifier
            if (item.toString().indexOf(";") != -1) {
                stringCL = item.toString().split(/;\s/)[0].match(/\d+/);

                let stringAttack = item.toString().split(/;\s/)[1];
                let stringAttackType = "";

                // check if theres more than one attack type
                if (stringAttack.toString().indexOf(",") != -1) {

                    let separateAttacks = stringAttack.split(/,/);

                    let tempStringAttack = "";

                    separateAttacks.forEach(function(item, index) {
                        let cleanedItem = item.trim().replace(/\)/, "");

                        stringAttackType = capitalize(cleanedItem.toString().trim().split(/\s/)[0]);

                        stringAttackModifier = cleanedItem.toString().split(/\s/)[1];
                        tempStringAttack = tempStringAttack.concat("{{" + stringAttackType + ":=[Roll Attack](~" + stringAttackType + " " + spellType + " Attack) }} ");

                        spellAttackString =
                            " &{template:default} {{name=@{selected|token_name}: Spell Attack}} " +
                            "{{" + stringAttackType + ":=[[1d20" + stringAttackModifier + "]] }} ";

                        setJSONAttribute("abilities", stringAttackType + " " + spellType + " Attack", spellAttackString);
                    });

                    stringComplete = stringComplete.concat(stringCLComplete + tempStringAttack);

                } else {

                    stringAttackType = capitalize(stringAttack.toString().split(/\s/)[0]);

                    stringAttackModifier = stringAttack.toString().split(/\s/)[1];
                    stringAttackComplete = "{{" + stringAttackType + ":=[Roll Attack](~" + stringAttackType + " " + spellType + " Attack) }} ";

                    stringComplete = stringComplete.concat(stringCLComplete + stringAttackComplete);

                    spellAttackString =
                        " &{template:default} {{name=@{selected|token_name}: Spell Attack}} " +
                        "{{" + stringAttackType + ":=[[1d20" + stringAttackModifier + "]] }} ";

                    setJSONAttribute("abilities", stringAttackType + " " + spellType + " Attack", spellAttackString);
                }


            }
            // if theres no AttackModifier, just set the CL
            else {
                stringCL = item.toString().match(/\d+/);

                // Add to the complete String
                stringComplete = stringComplete.concat(stringCLComplete);

            }

            let casterLevelCheckString = " &{template:default} {{name=@{selected|token_name}: Caster Level}} {{Check:=[[1d20+" + stringCL + "]] vs. **SR** }} ";
            setJSONAttribute("abilities", spellType + " CL-Check", casterLevelCheckString);
        }
        // The other items contain availabilityInfo and spellLikeAbilities
        else {
            // Check if there's an wide dash
            if(item.indexOf("—") != -1) {
                // Separate availabilityInfo at the first wide dash"—"
                let lineContent = item.split(/—/);

                let availabilityInfo = lineContent[0];

                let abilityArray = lineContent[1].split(/,/);

                let abilitySingle = "";
                let abilityString = "{{ " + availabilityInfo + ":=";

                if(abilityArray.toString().match(/,/)) {

                    let tempString = "";

                    abilityArray.forEach(function(item, index) {
                        abilitySingle = item.trim();

                        let trimmedAbilitySingle = abilitySingle
                        // Remove everything in brackets
                        .replace(/\([\s\S]*?\)/, "")
                        // Replace spaces with normal dashes
                        .replace(/\s/,"-").toString()
                        // remove whitespace
                        .trim();

                        tempString = tempString.concat("[" + abilitySingle + "](~Spells-DB|" + trimmedAbilitySingle + ")");

                        // Add a | if its not the last item
                        if (index < abilityArray.length-1) {
                            tempString = tempString.concat(" | ");
                        }

                    }); // End forEach

                    abilityString = abilityString.concat(tempString + " }}");

                } else {
                    abilitySingle = abilityArray.toString().trim();

                    let trimmedAbilitySingle = abilitySingle
                    // Remove everything in brackets
                    .replace(/\([\s\S]*?\)/, "")
                    // Replace spaces with normal dashes
                    .replace(/\s/,"-")
                    // remove whitespace
                    .trim();

                    let tempString = "[" + abilitySingle + "](~Spells-DB|" + trimmedAbilitySingle + ")";
                    abilityString = abilityString.concat(tempString + " }}");
                }

                stringComplete = stringComplete.concat(" " + abilityString + " ");
            } else {
                // if there is no wide dash, the line contains the connection (e.g. of mystics)
                let connection = item.split(/\s/)[1];
                let connectionString = "{{ Connection:=" + capitalize(connection) + " }} ";

                stringComplete = stringComplete.concat(" " + connectionString + " ");
            }
        }

    });

    console.log("stringComplete: " + stringComplete);
    return stringComplete;
}

// Separate Skills
function separateSkills(inputSkills) {
    // GENERATE A JSON OBJECT OF ALL SKILLS THE MONSTER HAS
    var skills = [];
    //console.log("inputSkills: " + inputSkills);
    skills = inputSkills.split(",");

    //skills = skills.map(el => el.trim());
    skills = skills.toString().replace(/\s\+/g, "\":\"");

    // split at every "," thats not inside ( ... )
    skills = skills.split(/,(?![^(]*\))/g);
    skills = skills.map(el => el.trim());

    // remove content in parenthesis, e.g. "profession (soldier)" to "profession"
    if (skills.toString().indexOf("(")) {
        skills = skills.map(el => el.replace(/\s\(.*\)/g, ""));
    }

    skills = JSON.stringify(skills).replace(/\\/g, "");

    var skillsString = skills.toString();
    skillsString = skillsString.substring(1, skillsString.length - 1);

    skillsString = "{".concat(skillsString).concat("}");

    return JSON.parse(skillsString);
}

// Separate Attacks
function separateAttacks(inputAttack) {
    // GENERATE A JSON OBJECT OF ALL SKILLS THE MONSTER HAS
    var attacks = [];

    // split into separate attacks
    if (inputAttack != null && inputAttack != "") {
        //console.log("inputAttack: " + inputAttack);
        // split when "or" is found, but only if not in parenthesis
        attacks = inputAttack.split(/\bor\b(?![^(]*\))/g);

        //console.log("attacks after split: " + attacks);

        // trim whitespace
        attacks = attacks.map(el => el.trim());

        attacks.forEach(function (item, index) {

            // separate attackName from attackModifier (if available, e.g. swarm attacks)
            if (item.indexOf(" +") == -1) {

                item = item.split(/\s\(/);

                item.forEach(function (subItem, index) {
                    if (subItem.indexOf("(") == -1 && subItem.indexOf(")") != -1) {

                        subItem = "(".concat(subItem);
                        item[index] = subItem;
                    }
                });


                attacks[index] = item.toString().replace(",", "\":\"");
                attacks[index] = attacks[index].split(/,/);

            } else {

                // separate attackName from attackModifier with ":"
                attacks[index] = attacks[index].toString().replace(/\s\+/g, "\":\"");
                // separate into key-value pairs of attackName:attackModifier
                attacks[index] = attacks[index].split(/\),/);
            }

            // re-add right parenthesis
            if (attacks[index].toString().indexOf("(") != -1 && attacks[index].toString().indexOf(")") == -1) {
                attacks[index][1] = item.concat(")");
            }

            attacks[index] = attacks[index].toString().replace(/^\[/, "");
            attacks[index] = attacks[index].toString().replace(/^\]/, "");

        });

        attacks = JSON.stringify(attacks).replace(/\\/g, "");
    }

    else {

    }

    var attacksString = attacks.toString();
    attacksString = attacksString.substring(1, attacksString.length - 1);
    attacksString = "{".concat(attacksString).concat("}");

    return JSON.parse(attacksString);
}

// Format Attacks
function formatAttack(attack, index) {

    let attackStringComplete = "";

    if (attack.toString().indexOf("explode") != -1) {
        attackStringComplete = formatExplosionAttack(attack, index);
    }
    else {
        //console.log("attackString: " + attack);
        attackStringComplete = formatNormalAttack(attack, index);
    }

    return attackStringComplete;

}

// Separate MultiAttacks
function separateMultiAttacks(inputAttack) {
    // GENERATE A JSON OBJECT OF ALL SKILLS THE MONSTER HAS
    var attacks = [];

    // split into separate attacks
    if (inputAttack != null && inputAttack != "") {
        // split when "," is found, but only if not in parenthesis
        attacks = inputAttack.split(/,(?![A-Z\s]*\))/g);

        // trim whitespace
        attacks = attacks.map(el => el.trim());

        attacks.forEach(function (item, index) {

            // separate attackName from attackModifier (if available, e.g. swarm attacks)
            if (item.indexOf(" +") == -1) {

                item = item.split(/\s\(/);

                item.forEach(function (subItem, index) {
                    if (subItem.indexOf("(") == -1 && subItem.indexOf(")") != -1) {

                        subItem = "(".concat(subItem);
                        item[index] = subItem;
                    }
                });

                attacks[index] = item.toString().replace(",", "\":\"");
                attacks[index] = attacks[index].split(/,/);

            } else {

                // separate attackName from attackModifier with ":"
                attacks[index] = attacks[index].toString().replace(/\s\+/g, "\":\"");
                // separate into key-value pairs of attackName:attackModifier
                attacks[index] = attacks[index].split(/\),/);
            }

            // re-add right parenthesis
            if (attacks[index].toString().indexOf("(") != -1 && attacks[index].toString().indexOf(")") == -1) {
                attacks[index][1] = item.concat(")");
            }

            attacks[index] = attacks[index].toString().replace(/^\[/, "");
            attacks[index] = attacks[index].toString().replace(/^\]/, "");

        });

        attacks = JSON.stringify(attacks).replace(/\\/g, "");
    }

    else {

    }

    var attacksString = attacks.toString();
    attacksString = attacksString.substring(1, attacksString.length - 1);
    attacksString = "{".concat(attacksString).concat("}");

    return JSON.parse(attacksString);
}

// Format MultiAttacks
function formatMultiAttack(attack, index) {

    // Split at Comma, but only if not in parenthesis
    let splitAttackEntry = attack.toString().split(/,(?![^(]*\))/);

    let iterationNumber = "";
    // Get the number of iterations of a single attack
    if(splitAttackEntry.toString().match(/^[1-9]/)) {
        iterationNumber = splitAttackEntry.toString().split(/\s/)[0];
        splitAttackEntry = splitAttackEntry.toString().substring(2, splitAttackEntry.toString().length);
        splitAttackEntry = splitAttackEntry.split(/,(?![^(]*\))/);
    }

    // attackname
    let attackName = splitAttackEntry[0];
    let splitAttackFromDamage = splitAttackEntry[1].split(/\s/);
    let splitDamageFromAttack = splitAttackEntry[1].split(/^\S+(\s)/);
    let attackModifier = splitAttackFromDamage[0];
    //let damageString = splitDamageFromAttack[2].toString().substring(1, splitDamageFromAttack[2].length - 1);

    let damageString = splitAttackEntry[1].match(/\(([^)]+)\)/);

    let damageDiceAndBonus = damageString[1].split(/\s/)[0].toString().split("+");
    let damageDice = damageDiceAndBonus[0];
    let damageBonus = damageDiceAndBonus[1];

    let damageTypeAndCrit = "";
    let splitDamageTypeFromCrit = "";
    let damageType = "";
    let critString = "";
    let crit = "";

    // check, if theres a damageType and/or crit
    if (damageString.toString().match(/(?=\s).*(?![^;])/) != null) {
        // check, if theres a crit marked by a semi-colon
        if (damageString.toString().match(/;/) != null) {
            damageType = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[0].trim();
            critString = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[1]
        }
        // if no crit available, set just the damageType
        else {
            damageType = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].trim();
        }
    }

    // set targetAC to KAC for damageType {P, S, B} and to EAC for damageType {C, F, E, So, etc.}
    let armorClassType = "";
    if (damageType.search(/^(P|B|S[^o])/) != -1) {
        armorClassType = "KAC";
    } else {
        armorClassType = "EAC";
    }

    let attackStringPart  ="";
    let attackStringComplete = "";

    let s1 = "{{" + attackName + ":\r\nDamage:\r\nCrit\:=[[1d20+";
    let s2 = "]] vs @{target|" + armorClassType + "} " + armorClassType + "\r\n[[";
    let s3 = "]] ";
    let s4 = "\r\n[[";
    let s5 = "]] ";
    let s6 = "}} "
    let s15 = "{{Crit-Effect:=";
    let s16 = "}}";

    attackStringPart =
        s1 + attackModifier +
        s2 + damageDice + "+" + damageBonus +
        s3 + damageType +
        s4 + damageDice + "+" + damageBonus +
        s5 + damageType +
        s6;

    // if theres a critString, make rolls rollable and add it to the string
    if (critString != "") {
        crit = makeCritStringRollable(critString);
        attackStringPart = attackStringPart + s15 + crit + s16;
    }

    let numberEnum = ["st", "nd", "rd", "th", "th", "th", "th", "th", "th"];

    if(iterationNumber > 1) {
        for (let i = 0; i < iterationNumber; i++) {
            let attackStringNewPart = attackStringPart.replace(attackName, (i+1)+ numberEnum[i] + " " + attackName.substring(0,attackName.length-1));
            attackStringNewPart = attackStringNewPart.replace("Crit-Effect", (i+1)+ numberEnum[i] + " " + "Crit-Effect");
            attackStringComplete = attackStringComplete.concat(attackStringNewPart);
        }
    } else {
        attackStringComplete = attackStringPart;
    }

    return attackStringComplete;

}

// format explosion attacks
function formatExplosionAttack(attack, index) {
    //console.log("formatExplosionAttack: " + attack);

    let attackString = attack.toString();
    let completeString = "";

    let grenadeType = attack[0];
    let attackModifier = attack[1].split(/\s\(/)[0];
    let blastRadius = attack[1].split(/,/)[0].toString().split(/\[/)[1].toString().match(/\d+/);
    let saveDC = attack[1].split(/,/)[2].toString().match(/\d+/);
    let saveType = "";
    let saveEffect = "";

    // grenades with explosionDamage (e.g. frag, ...)
    let explosionEffect = "";
    let explosionDamage = "";
    let explosionDamageType = "";
    let extraDamage = "";
    let extraDamageType = "";
    let allowMultipleTargets = false;

    // find the type of grenade used
    switch (true) {
        case (attackString.indexOf("smoke") != -1):
            explosionEffect = attack[1].split(/,/)[1];
            saveType = "fortitude";
            saveEffect = "\nFail: Choke and cough (can't take actions)\n(env. protection prevents)}} {{additionally:=if choking for 2 rounds, take [[1d6]] non-lethal damage";
            break;
        case (attackString.indexOf("frag") != -1 || attackString.indexOf("shock") != -1):
            allowMultipleTargets = true;
            explosionDamage = attack[1].split(/,/)[1].toString().split(/\s/)[1];
            explosionDamageType = attack[1].split(/,/)[1].toString().split(/\s/)[2];
            explosionEffect = "[[" + explosionDamage + "]] " + explosionDamageType;
            saveType = "reflex";
            saveEffect = " halfs Damage";
            break;
        case (attackString.indexOf("stickybomb") != -1):
            allowMultipleTargets = true;
            explosionEffect = makeCritStringRollable(attack[1].split(/,/)[1]);
            saveType = "reflex";
            saveEffect = "\nFail: You are entangled}} {{Entangled:=Escape with\nAcrobatics vs. DC[[" + saveDC + "]] or\nStrength vs. DC[[5+" + saveDC + "]]";
            break;
        case (attackString.indexOf("flash") != -1):
            allowMultipleTargets = true;
            explosionEffect = makeCritStringRollable(attack[1].split(/,/)[1]);
            saveType = "reflex";
            saveEffect = "\nFail: You are blinded";
            break;
        case (attackString.indexOf("incendiary") != -1):
            allowMultipleTargets = true;
            explosionDamage = attack[1].split(/,/)[1].toString().split(/\s/)[1];
            explosionDamageType = attack[1].split(/,/)[1].toString().split(/\s/)[2];
            extraDamage = attack[1].split(/,/)[1].toString().split(/\s/)[4];
            extraDamageType = attack[1].split(/,/)[1].toString().split(/\s/)[5];
            explosionEffect = "[[" + explosionDamage + "]] " + explosionDamageType + " plus [[" + extraDamage + "]] " + extraDamageType;
            saveType = "reflex";
            saveEffect = " halfs Damage";
            break;
        case (attackString.indexOf("screamer") != -1):
            allowMultipleTargets = true;
            explosionDamage = attack[1].split(/,/)[1].toString().split(/\s/)[1];
            explosionDamageType = attack[1].split(/,/)[1].toString().split(/\s/)[2];
            let deafEffect = makeCritStringRollable(attack[1].split(/,/)[1].toString().split(/.*\bplus \b/)[1]);
            explosionEffect = "[[" + explosionDamage + "]] " + explosionDamageType + " plus " + deafEffect;
            saveType = "reflex";
            saveEffect = " halfs Damage";
            break;
        default:
            return "no grenadeType found";
            break;
    }

    // create the ranged-attack for the grenade
    let s1 = " &{template:default} {{name=@{selected|token_name} ejects a ";
    let s2 = grenadeType;
    let s3 = "}} {{attack:=[[1d20+";
    let s4 = attackModifier;
    let s5 = "]] vs KAC [[5]], Blast [[";
    let s6 = blastRadius;
    let s7 = "]]ft.}} \n/w GM &{template:default} {{name=Blast Zone Picker}} {{Button:=[Blast Zone](~selected|Blast-Zone-";
    let s8 = index;
    let s9 = ") }} ";

    completeString =
        s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + s9;

    // create the blast-zone macro for the grenade, containing the main effects
    let blastZoneString = "";

    let b1 = " &{template:default} {{name=";
    let b2 = grenadeType;
    let b3 = " ► Blast Zone}} ";

    let numberOfTargets = 4;

    let targetString1 = "";
    let targetString2 = "";
    let targetString3 = "";
    let targetString4 = "";
    let targetString = "";

    let targetStrings = "";

    if (allowMultipleTargets == true) {
        for (let i = 0; i < numberOfTargets; i++) {
            targetString1 = "{{ @{target|target-" + i + "|token_name}:=";
            targetString2 = explosionEffect + "\n";
            targetString3 = saveType + " [[1d20+@{target|target-" + i + "|" + saveType +"}]]";
            targetString4 = " vs. DC[[" + saveDC + "]]" + saveEffect + " }} ";
            targetString = targetString1 + targetString2 + targetString3 + targetString4;

            targetStrings = targetStrings.concat(targetString);

        }
    }
    else {
        targetString1 = "{{ Ongoing Effect:=";
        targetString2 = explosionEffect + "\n";
        targetString3 = "}} {{Inhalation:=" + saveType + " vs. DC[[" + saveDC + "]]" + saveEffect + " }} ";
        targetStrings = targetString1 + targetString2 + targetString3;
    }

    blastZoneString = b1 + b2 + b3 + targetStrings;

    setJSONAttribute("abilities", "Blast-Zone-" + index, blastZoneString);


    // return the string for the ranged-attack of the grenade
    return completeString;

}

// format a normal melee or ranged attack
function formatNormalAttack(attack, index) {

    // Split at Comma, but only if not in parenthesis
    let splitAttackEntry = attack.toString().split(/,(?![^(]*\))/);

    // attackname
    let attackName = splitAttackEntry[0];
    let splitAttackFromDamage = splitAttackEntry[1].split(/\s/);
    let splitDamageFromAttack = splitAttackEntry[1].split(/^\S+(\s)/);
    let attackModifier = splitAttackFromDamage[0];

    let damageString = splitAttackEntry[1].match(/\(([^)]+)\)/);

    let damageDiceAndBonus = damageString[1].split(/\s/)[0].toString().split("+");
    let damageDice = damageDiceAndBonus[0];
    let damageBonus = damageDiceAndBonus[1];

    let damageTypeAndCrit = "";
    let splitDamageTypeFromCrit = "";
    let damageType = "";
    let critString = "";
    let crit = "";

    // check, if theres a damageType and/or crit
    if (damageString.toString().match(/(?=\s).*(?![^;])/) != null) {
        //console.log("damageString: " + damageString);
        // check, if theres a crit marked by a semi-colon
        if (damageString.toString().match(/;/) != null) {
            if(damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[1]){
                damageType = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[0].trim();
                //console.log("damageType: " + damageType);

                // Works only, if theres a damageType
                critString = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[1]

            } else {
                critString = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].toString().split(/;/)[0]
            }

        }
        // if no crit available, set the damageType
        else {
            damageType = damageString.toString().match(/(?=\s).*(?![^;])/).toString().split(/\),/)[0].trim();
        }
    }

    // set targetAC to KAC for damageType {P, S, B} and to EAC for damageType {C, F, E, So, etc.}
    let armorClassType = "";
    if (damageType.search(/^(P|B|S[^o])/) != -1) {
        armorClassType = "KAC";
    } else {
        armorClassType = "EAC";
    }

    let attackStringComplete = "";

    let s1 = " ?{Attack Mode| Full Attack, &{template:default&#125; {{name=@{selected|token_name} : **" + attackName + "** vs. @{target|token_name}&#125;&#125; {{attack:=[[1d20+";
    let s2 = "-4]]&#124;[[1d20+";
    let s3 = "-4]] vs @{target|"+armorClassType+"} "+armorClassType+"&#125;&#125; {{Damage:=[[";
    let s4 = "]]&#124;[[";
    let s5 = "]] ";
    let s6 = "&#125;&#125; {{Crit:=[[";
    let s7 = "]]&#124;[[";
    let s8 = "]] ";
    let s8a = "&#125;&#125; {{Crit-Effect:=";
    let s9 = "&#125;&#125;  |Normal Attack, &{template:default&#125; {{name=@{selected|token_name} : **" + attackName + "** vs. @{target|token_name}&#125;&#125; {{attack:=[[1d20+";
    let s10 = "]] vs @{target|"+armorClassType+"} "+armorClassType+"&#125;&#125; {{Damage:=[[";
    let s11 = "]] ";
    let s12 = "&#125;&#125; {{Crit:=[[";
    let s13 = "]] ";
    let s14 = "&#125;&#125; "
    let s15 = "{{Crit-Effect:=";
    let s16 = "&#125;&#125; } ";
    
    // if theres a critString, make rolls rollable and add it to the string
    if (critString != "") {
        //console.log("critString: " + critString);
        crit = makeCritStringRollable(critString);

    } else {

        //attackStringComplete = attackStringComplete + "} ";
    }

    attackStringComplete =
        s1 + attackModifier +
        s2 + attackModifier +
        s3 + damageDice + "+" + damageBonus +
        s4 + damageDice + "+" + damageBonus +
        s5 + damageType +
        s6 + damageDice + "+" + damageBonus +
        s7 + damageDice + "+" + damageBonus +
        s8 + damageType + s8a + crit +
        s9 + attackModifier +
        s10 + damageDice + "+" + damageBonus +
        s11 + damageType +
        s12 + damageDice + "+" + damageBonus +
        s13 + damageType +
        s14 + s15 + crit + s16 + "}";
    /*
    // if theres a critString, make rolls rollable and add it to the string
    if (critString != "") {
        //console.log("critString: " + critString);
        crit = makeCritStringRollable(critString);

        attackStringComplete = attackStringComplete + s15 + crit + s16;
    } else {

        attackStringComplete = attackStringComplete + "} ";
    }
    */

    return attackStringComplete;
}

// Remove Empty Abilities
function removeEmptyAbilities() {

    let itemsToDelete = [];

    for (key in dataOutput) {

        if (key == "abilities") {

            for (i in dataOutput[key]) {
                if (dataOutput[key][i].action == "") {
                    // USE .splice()
                    itemsToDelete.push(i);
                }
            }
        }
    }

    for (var index = itemsToDelete.length - 1; index >= 0; index--) {
        dataOutput["abilities"].splice(itemsToDelete[index], 1);
    }
}

// Capitalize Strings
/*
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}*/
const capitalize = (s) => {
    return s
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
