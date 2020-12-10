const http = require('http');
const path = require('path');
const express = require('express');
const os = require('os');
const SERVER_CONFIG = require('./config.json');

const BASE_PATH = path.normalize(
    path.join(__dirname, '..')
);

const app = express().use(
    express.static(path.join(BASE_PATH, 'repo'))
);
const server = http.createServer(app);

server.on('listening', ()=>{
    process.on('SIGINT', function(){
        console.log("\n=============================");
        console.log('Closing Server');
        console.log("=============================");
        server.close();
    });
    

    console.log('Server started:');
    console.log("[Available on]");
      
  	const interfaces = os.networkInterfaces();
  	Object.keys(interfaces).forEach((interface)=>
  	{
  		console.log("\n" + interface.toUpperCase() + ":");
  		interfaces[interface].forEach((ip)=>
  		{
  			if(ip.family == "IPv4") console.log(ip.address + `:${SERVER_CONFIG.port}`);
  		})
    });
      

    console.log('\nPress Ctrl+C to close!');
    
});

server.on('error', (error)=>{
    if(error.code == 'EADDRINUSE' && error.syscall == 'listen')
  	{
		console.log(`The Server couldn't start,\na server is running on ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}\nThis could be the server for the repository....`);
  	}
});


server.listen(SERVER_CONFIG);
