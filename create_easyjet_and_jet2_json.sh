cp downloads/easyjet.js temp/easyjet.js
sed 's/new Array../{}/g' temp/easyjet.js > temp/easyjet_to_json.js
cat write_easyjet_json.js >> temp/easyjet_to_json.js
node temp/easyjet_to_json.js

cp downloads/jet2.js temp/jet2_to_json.js
sed -i "" 's/BELFAST INTL/BELFAST INTL BFS/g' temp/jet2_to_json.js
sed -i "" 's/BLACKPOOL/BLACKPOOL BLK/g' temp/jet2_to_json.js
sed -i "" 's/EAST MIDLANDS/EAST MIDLANDS EMA/g' temp/jet2_to_json.js
sed -i "" 's/EDINBURGH/EDINBURGH EDI/g' temp/jet2_to_json.js
sed -i "" 's/GLASGOW/GLASGOW GLA/g' temp/jet2_to_json.js
sed -i "" 's/LEEDS BRADFORD/LEEDS BRADFORD LBA/g' temp/jet2_to_json.js
sed -i "" 's/MANCHESTER TERMINAL 1/MANCHESTER TERMINAL 1 MAN/g' temp/jet2_to_json.js
sed -i "" 's/NEWCASTLE/NEWCASTLE NCL/g' temp/jet2_to_json.js
cat write_jet2_json.js >> temp/jet2_to_json.js
node temp/jet2_to_json.js

grep 'wizzAutocomplete.MARKETINFO' downloads/wizz.html > temp/wizz.json
sed -i "" "s/^.*wizzAutocomplete.MARKETINFO.=..\([^']*\).*$/\1/g" temp/wizz.json

