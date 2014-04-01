import json
import csv

airports = {}
codes_of_missing_airports = []

with open("downloads/airports.dat") as f:
    reader = csv.reader(f, delimiter=',')
    for line in reader:
        airport_code = line[4]
        airports[airport_code] = {
                               "name": line[1],
                               "city": line[2],
                               "country": line[3],
                               "long_lat": [line[7], line[6]]
                              }

def add_route(origin_code, dest_code, airline):
    if airports.has_key(origin_code) and airports.has_key(dest_code):
        if airports[origin_code].has_key("routes"):
            airports[origin_code]["routes"].append({"code":dest_code, "airline":airline})
        else:
            airports[origin_code]["routes"] = [{"code":dest_code, "airline":airline}]
    else:
        print "Warning: flight from %s to %s has been excluded." % (origin_code, dest_code)
        if not airports.has_key(origin_code):
            codes_of_missing_airports.append(origin_code)
        if not airports.has_key(dest_code):
            codes_of_missing_airports.append(dest_code)

with open("downloads/ryanair.json") as f:
    ryan = json.load(f)
    for country, airports_in_country in ryan["airports"].items():
        for airport_code, airport_name in airports_in_country.items():
            for dest_code in ryan["routes"][airport_code]:
                add_route(airport_code, dest_code, "Ryanair")
               

with open("temp/easyjet.json") as f:
    easy = json.load(f)["ac_la"]
    for route in easy:
        tokens = route.split("|")
        origin = tokens[0]
        destination = tokens[1]
        if origin[0] != "*" and destination[0] != "*": # exclude "London: all airports"
            add_route(origin, destination, "easyJet")


with open("temp/jet2.json") as f:
    jet2 = json.load(f)
    # Get arrays. Include only origin airports, not regions
    origin_to_dest_arrays = [arr for arr in jet2 if len(arr[0][0]) < 3]
    for x in origin_to_dest_arrays:
        origin_code = x[0][1][-3:]
        destinations = x[1:]
        for destination in destinations:
            if len(destination[0]) <= 2:
                add_route(origin_code, destination[1][-3:], "Jet2")
    
with open("temp/wizz.json") as f:
    wizz = json.load(f)
    for airport_data in wizz:
        origin_code = airport_data["DS"]
        for destination in airport_data["ASL"]:
            add_route(origin_code, destination["SC"], "Wizz")
    
        
airports_with_flights = {a:airports[a] for a in airports if airports[a].has_key("routes")}

# Exclude routes that fly to airports for which we don't have latitude and longitude
for a in airports_with_flights:
    airports_with_flights[a]["routes"] = [r for r in airports_with_flights[a]["routes"]
                                          if not r["code"] in codes_of_missing_airports]


with open('web/airports.json', 'w') as f:            
    json.dump(airports_with_flights, f, sort_keys=True, indent=4, separators=(',', ': '))
