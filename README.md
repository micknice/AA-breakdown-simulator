# AA_breakdown_simulator
Inspired by the year I worked at the AA as a call handler. Simulating breakdowns and patrol allocation across the road network


if you want to run this yourself:

clone and npm install.

get a bing maps api key.

create a .env.dev file
and paste this in there:

PGDATABASE=breakdown_service
BING_MAPS_API_KEY={YOUR BING MAPS API KEY}

YOU WILL NEED POSTGRES INSTALLED!!!!

then:

npm run createDb

npm run seedDb

npm run sim

this will get the sim running and you can just have a look whats going on in the terminal.

If you want the GUI then get that here: https://github.com/micknice/Breakdown_GUI
clone and npm install then run npm start before running the sim.

there are currently still some bugs so you may occasionally see a patrol teleport across the map.




