//Base logic - testing solo activity
var doc = document;


//schema:piiEntityTypes

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
  var aisRendition = invokeUntilAvailable("cm:aiPiiEntities");


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
            if(t === "entities")
            {
              logger.log("interating through entities");
              var parsed = JSON.stringify(schemas[t]);

              logger.log("print: "  + parsed);

              for(var key in schemas[t])
              {
                logger.log("key " + key);
                logger.log("key " + schemas[t][key]);
                logger.log("PII Type " + schemas[t][key].type);
                logger.log("PII Confidence " + schemas[t][key].score);

                if(schemas[t][key].type == "SSN")
                {
                  logger.log(schemas[t][key].type + " Identified ");
                  logger.log("parent id: " + document.getParent().id);


                  var requestBody = '{"id": "kPSdzevk","groupId": "a2333940-8c4f-4c67-9820-2b7746a88446","op": "ADD"}';

                  logger.log(requestBody);


                  http2.post('http://3.93.49.91/alfresco/api/-default-/public/gs/versions/1/secured-nodes/' + document.id + '/securing-marks', requestBody, "application/json;charset=UTF-8", "demo", "demo");
                  //logger.error(r);
                }
                if(schemas[t][key].type == "PHONE")
                {
                  logger.log(schemas[t][key].type + " Identified ");
                  logger.log("parent id: " + document.getParent().id);


                  var requestBody = '{"id": "Q6PgRj5m","groupId": "a2333940-8c4f-4c67-9820-2b7746a88446","op": "ADD"}';												logger.log(requestBody);


                  http2.post('http://3.93.49.91/alfresco/api/-default-/public/gs/versions/1/secured-nodes/' + document.id + '/securing-marks', requestBody, "application/json;charset=UTF-8", "demo", "demo");
                //  logger.error(r);

                }
                if(schemas[t][key].type == "PASSPORT_NUMBER")
                {
                  logger.log(schemas[t][key].type + " Identified ");
                  logger.log("parent id: " + document.id);


                  var requestBody = '{"id": "87GLwtMO","groupId": "a2333940-8c4f-4c67-9820-2b7746a88446","op": "ADD"}';												logger.log(requestBody);


                  http2.post('http://3.93.49.91/alfresco/api/-default-/public/gs/versions/1/secured-nodes/' + document.id + '/securing-marks', requestBody, "application/json;charset=UTF-8", "demo", "demo");
                //  logger.error(r);
                }
              }
            }

          }

        }
        logger.log("AWS PII Classification Updated for " + document.getParent().name + " : " + document.getParent().id);

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
