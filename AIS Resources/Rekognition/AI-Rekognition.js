//***Rekognition***

var doc = document;

performDataExtraction();

function invokeUntilAvailable(renditionName) {
    var _rendition = getAISRendition();

//retry getting ais reditiion else return rendition object
    for (var i = 0;(_rendition == undefined || _rendition == null); i++) {
		if(i < 1000)
		{
		_rendition = getAISRendition(renditionName);
			logger.info("COUNTER - " + i + " - IS RENDITION UNDEFINED ???  - " + (_rendition == undefined || _rendition == null));
		}
		else
		{
			sleep(60000);
			_rendition = getAISRendition(renditionName);
			logger.info("Last Try - IS RENDITION UNDEFINED ???  - " + (_rendition == undefined || _rendition == null));
			break;
		}

	}

    return _rendition;
}

//rendition name is cm:aiRekognition passed in performDataextracting
function getAISRendition(renditionName) {
    return renditionService.getRenditionByName(doc, renditionName);
}



function performDataExtraction() {

		logger.log("Performing Extraction");


//function to get rendition
	var aisRendition = invokeUntilAvailable("cm:aiLabels");


    if (aisRendition !== undefined && aisRendition !== null)
	{
        logger.info("**** RENDITION IS VERY MUCH AVAILABLE ****");

		//find rendition doc
        var rdoc = search.findNode(aisRendition.nodeRef);
        if (rdoc !== null && rdoc.content !== undefined)
		{

		//parse rendition JSON return
            var j = JSON.parse(rdoc.content);

			const obj = JSON.parse(rdoc.content);

			logger.log("Interating through redition json " + typeof j);

            // check if response node is null/undefined

            if (j !== undefined && j !== null)
			{
				//loop through parsed response object
				for (var x in j)
				{

					//print obejct and child
						logger.log(x + ":"+ j[x]);
						logger.log("Object Type: " + typeof x);

					//assign child object to variable
						var schemas = j[x];

					//loop through child object
						for (var t in schemas)
						{
							logger.log(t + ":"+ schemas[t]);
							if(t === "labels")
							{
								logger.log("interating through labels");
								var parsed = JSON.stringify(schemas[t]);

								logger.log("print: "  + parsed);

								for(var key in schemas[t])
								{
									logger.log("key " + key);
									logger.log("key " + schemas[t][key]);
									logger.log("key name " + schemas[t][key].name);
									if (!document.hasAspect("cm:taggable"))
									{
										document.addAspect("cm:taggable");
										logger.log("Adding Taggable Aspect")
									}
									if(schemas[t][key].name !== "undefined" && schemas[t][key].name !== "null")
									{
										document.addTag(schemas[t][key].name);
										logger.log("Added " + schemas[t][key].name + " Tag")
									}
								}
							}

						}

					}

                    doc.save();
		            logger.log("AWS Label Tagging Saved");

				}

            }

            logger.log("\n--- **** **** **** ---\n");

    } else {
        logger.info("**** RENDITION IS NOT YET AVAILABLE. AIS IS WORKING ON THE DOCUMENT ****");
    }

}

function sleep(milliseconds) {
  var start = new Date().getTime();
	logger.log("Sleep initiated");
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
