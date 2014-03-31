
var fs = require('fs');
fs.writeFile("temp/easyjet.json", JSON.stringify({ac_la: ac_la, ac_a: ac_a}),
    function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved.");
        }
}); 