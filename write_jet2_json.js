
var fs = require('fs');
fs.writeFile("temp/jet2.json", JSON.stringify(targets),
    function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved.");
        }
}); 