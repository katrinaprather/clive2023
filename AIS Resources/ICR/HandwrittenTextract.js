//Code for ICR Handwritten Text
var doc = document;
var blocks = [];
var key_map = [];
var value_map = [];
var getReadyToFetchMemberNameFlag = false;

performDataExtraction();

function getValue(id, map, type) {
    var result = "";
    var b = map[id];
    if (b.relationships !== null && b.relationships.length > 0) {
        for (var y in b.relationships) {
            if (b.relationships[y].type == type) {
                if (b.relationships[y].ids !== null && b.relationships[y].ids.length > 0) {
                    for (var i in b.relationships[y].ids) {
                        var id = b.relationships[y].ids[i];
                        result += blocks[id].text + " ";
                    }
                }
            }
        }
    }
    return result;

}


function invokeUntilAvailable(renditionName) {
    var _rendition = getAISRendition();

//    for (var i = 0;(_rendition == undefined || _rendition == null); i++) {
    for (var i = 0;(i < 2); i++) {
        _rendition = getAISRendition(renditionName);
        logger.info("COUNTER - " + i + " - IS RENDITION UNDEFINED ???  - " + (_rendition == undefined || _rendition == null));
    }

    return _rendition;
}

function getAISRendition(renditionName) {
	logger.info("renditionName --> "+doc.name);
    return renditionService.getRenditionByName(doc, renditionName);
}



function performDataExtraction() {


	//var aisRendition = renditionService.getRenditionByName(doc, "cm:aiTextract");
	var aisRendition = invokeUntilAvailable("cm:aiTextract");

    if (aisRendition !== undefined && aisRendition !== null) {
        logger.info("**** RENDITION IS VERY MUCH AVAILABLE ****");

        var rdoc = search.findNode(aisRendition.nodeRef);
        if (rdoc !== null && rdoc.content !== undefined) {


            var j = JSON.parse(rdoc.content);

            // Loop all blocks and construct an array of all blocks, one with all key blocks and one with all value blocks
            if (j !== undefined && j.blocks.length > 0) {
                for (var x in j.blocks) {
                    var block = j.blocks[x];
                    blocks[block.id] = block;


                    if (block.entityTypes !== null && block.entityTypes.length > 0) {
                        if (block.entityTypes[0] == "KEY") {
                            key_map[block.id] = block;
                        }
                        if (block.entityTypes[0] == "VALUE") {
                            value_map[block.id] = block;
                        }
                    }

                    if (block.blockType == "LINE") {
                        if ((block.text.match(/Name/gi)) && (doc.properties["tx:memberName"] == "")) {
                            getReadyToFetchMemberNameFlag = true;
                            continue;
                        }

                        if (getReadyToFetchMemberNameFlag) {
                            doc.properties["tx:memberName"] = block.text;
                            getReadyToFetchMemberNameFlag = false;
                        }
                    }




                    doc.save();


                }

            }


            // Loop all key blocks, lookup the value
            for (var k in key_map) {
                var kblock = key_map[k];
                var ktext = getValue(kblock.id, key_map, "CHILD");
                var value = "";
                if (kblock.relationships !== null && kblock.relationships.length > 0) {
                    for (r in kblock.relationships) {
                        if (kblock.relationships[r].type == "VALUE") {
                            for (i in kblock.relationships[r].ids) {
                                value += getValue(kblock.relationships[r].ids[i], value_map, "CHILD") + " ";
                            }
                        }
                    }
                }

                logger.info("\nKey: " + ktext + "\nValue: " + value + "\n");

                if (ktext.match(/^Today's quote/gi)) {
                    doc.properties["lm:quote"] = value;
                }

                if (ktext.match(/^Date/gi)) {
					doc.properties["lm:dateofshiftchange"] = "";
					doc.save();

					var n = 0, N = 2;
					var dateofshiftchange = value.replace(/\s+/g, match => n++ < N ? "-" : match);

					//logger.info('>>> '+dateofshiftchange);
                    doc.properties["lm:dateofshiftchange"] = dateofshiftchange;
                }

                if (ktext.match(/^Catches & Saves/gi)) {
                    doc.properties["lm:catchesnsaves"] = value;
                }

				if (ktext.match(/^What can we do better/gi)) {
                    doc.properties["lm:whattodobetter"] = value;
                }


				logger.info(doc.properties["schema:textLines"]);
				var textLines = doc.properties["schema:textLines"].toString();
				var itemList = textLines.split(',');

				for(var i=0; i<itemList.length; i++){
					if(itemList[i] == 'Charge Nurse')
					 doc.properties["lm:nurse"] = itemList[i+1];
					if(itemList[i] == 'Unit Clerk')
					 doc.properties["lm:unitclerk"] = itemList[i+1];
					if(itemList[i].indexOf('Pending Admissions') != -1)
					 doc.properties["lm:pendingadmissioncount"] = itemList[i+1];
					if(itemList[i].indexOf('Announcements') != -1)
					 doc.properties["lm:announcement"] = itemList[i+1];
					if(itemList[i] == 'AM'){
					 doc.properties["lm:ismorningshift"] = (itemList[i-1] == 'X')?'Yes':'No';
					}
					if(itemList[i] == 'PM'){
					 doc.properties["lm:iseveningshift"] = (itemList[i-1] == 'X')?'Yes':'No';
					}

					 //doc.properties["lm:ismorningshift"] = ((doc.properties["lm:ismorningshift"] != 'No') && (itemList[i] == 'AM') && (itemList[i-1] == 'X'))?'Yes':'No';
					 //doc.properties["lm:iseveningshift"] = ((doc.properties["lm:iseveningshift"] != 'No') && (itemList[i] == 'PM') && (itemList[i-1] == 'X'))?'Yes':'No';
				}


                doc.save();


            }

            logger.log("\n--- **** **** **** ---\n");
        }

    } else {
        logger.info("**** RENDITION IS NOT YET AVAILABLE. AIS IS WORKING ON THE DOCUMENT ****");
    }

}


/*
	Example-Code-Start
    if (ktext.match(/as shown on your income tax return/gi) || ktext.match(/as shown on your income/gi) || ktext.match(/as sahowe on your income tae retum/gi)) {
    	doc.properties["tx:name"] = value;
        logger.info("\nFound income tax returning: " + ktext + "\nValue: " + value);
    }

	if (block.text.match(/^W-9$/gi)) {
        logger.info("Found W-9 in: " + block.text);
        doc.properties["tx:docType"] = block.text;
    }

	Example-Code-End
*/
