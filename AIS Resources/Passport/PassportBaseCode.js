//Textract Passport Base Code
var doc = document;
var blocks = [];
var key_map = [];
var value_map = [];
var getReadyToFetchMemberNameFlag = false;
var pattern = "^\\d{9}$";

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
    for (var i = 0;(_rendition == undefined || _rendition == null); i++)
	{
		if(i < 1000)
		{
			_rendition = getAISRendition(renditionName);
			logger.info("COUNTER - " + i + " - IS RENDITION UNDEFINED ???  - " + (_rendition == undefined || _rendition == null));
		}else
		{
			_rendition = getAISRendition(renditionName);
			logger.info("Last Try - IS RENDITION UNDEFINED ???  - " + (_rendition == undefined || _rendition == null));
			break;
		}
	}

	return _rendition;
}

function getAISRendition(renditionName) {
    return renditionService.getRenditionByName(doc, renditionName);
}



function performDataExtraction() {


	//var aisRendition = renditionService.getRenditionByName(doc, "cm:aiTextract");
	var aisRendition = invokeUntilAvailable("cm:aiTextract");
		var listofRen = renditionService.getRenditions(doc);
		for(var ren in listofRen)
		{
			logger.log(ren);
//			if(ren.properties["cm:name"] == "aiTextract")
		}
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
                    for (var r in kblock.relationships) {
                        if (kblock.relationships[r].type == "VALUE") {
                            for (var i in kblock.relationships[r].ids) {
                                value += getValue(kblock.relationships[r].ids[i], value_map, "CHILD") + " ";
                            }
                        }
                    }
                }

                logger.info("\nKey: " + ktext + "\nValue: " + value + "\n");

                if ((ktext.match(/^Surname/i)) || (ktext.match(/^Nam/i))) {
                    doc.properties["HRD:Surname"] = value;
				   	            logger.log("\nUpdated Surname");
				        }

				        if ((ktext.match(/^Given Names/gi)) || (ktext.match(/^Given numes/gi))) {
                    doc.properties["HRD:GivenName"] = value;
				   	            logger.log("\nUpdated Given Name");
                }

				        if ((ktext.match(/^Place of Birth/gi)) || (ktext.match(/^of bith/gi))) {
                    doc.properties["HRD:BirthPlace"] = value;
				   	            logger.log("\nUpdated Birthplace");
                }

               if ((ktext.match(/^Date of Birth/gi))) {
                    doc.properties["HRD:DOB"] = new Date(value);
				   	            logger.log("\nUpdated DOB");
			          }

               if ((ktext.match(/^Expiration/gi)) || (ktext.match(/^Date of Expiration/gi)) || (ktext.match(/^Expliation/gi))) {
                    doc.properties["HRD:DOE"] = new Date(value);
				   	            logger.log("\nUpdated DOE");
			          }

               if ((ktext.match(/^Sex/gi)) || (ktext.match(/^Sexio/gi))) {
                    doc.properties["HRD:Sex"] = value;
				   	            logger.log("\nUpdated Sex");
			          }

	             if ((ktext.match(/^Nationality/gi))) {
                    doc.properties["HRD:Nationality"] = value;
				   	            logger.log("\nUpdated Nationality");
               }

	            if ((ktext.match(/^Passport No/gi)) || (ktext.match('d{9}')) || (ktext.match(/^Passport/gi))) {
                    doc.properties["HRD:PassportNum"] = value;
				   	            logger.log("\nUpdated Passport");

                }


                doc.save();
            }
			         logger.log("\nUpdated Document \n");
               logger.log("\n--- **** **** **** ---\n");
        }

    } else {
        logger.info("**** RENDITION IS NOT YET AVAILABLE. AIS IS WORKING ON THE DOCUMENT ****");
    }

}
