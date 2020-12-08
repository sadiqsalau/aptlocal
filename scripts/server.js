const SERVER_ROOT = "/usr/local/aptlocal/repo";
const {createServer} = require('http');
const {networkInterfaces} = require('os');
const {parse} = require('url');
const fs = require('fs');
const SERVER_CONFIG = {
	host: "0.0.0.0",
	port: "55365"
};
  const server = createServer((request, response)=>
  {
      const requested = parse(request.url);
      const file = SERVER_ROOT + `${decodeURIComponent(requested.pathname)}`;

      if(!fs.existsSync(file))
      {
        response.statusCode = 404;
        response.end();
        return;
      }

    	const stat = fs.statSync(file);
    	if(!stat.isFile())
    	{
    		response.statusCode = 401;
    		response.end();
    		return;
    	}


    	response.setHeader('Accept-Ranges', 'bytes');
    	response.setHeader('Last-Modified', new Date(stat.atime).toGMTString());
    	const requestHeaders = request.headers;

    	const streamOption =
    	{
    		start: 0,
    		end: stat.size
    	}

    	if('range' in requestHeaders)
    	{
    		try
    		{
          		let start, end;
    			const range = requestHeaders.range.match(/bytes=(?<start>\d+)-(?<end>\d+)*/);

    			if(!Number.isNaN(start = parseInt(range.groups.start))) streamOption.start = start;
    			if(!Number.isNaN(end = parseInt(range.groups.end))) streamOption.end = end;
    		}
    		catch(err){}

    		if(streamOption.start == streamOption.end)
	    	{
	    		response.statusCode = 200;
	    		response.end();
	    		return;
	    	}
    		response.statusCode = 206;
    		response.setHeader('Content-Range', `bytes ${streamOption.start}-${stat.size-1}/${stat.size}`);
    		response.setHeader('Content-Length', streamOption.end - streamOption.start);

    	}

    	else
    	{
    	    response.statusCode = 200;
    	    response.setHeader('Content-Length', stat.size);
    	}

    	

    	const stream = fs.createReadStream(file, streamOption);
    	const close = ()=>
    	{
    		stream.unpipe(response);
    		stream.destroy();
    		response.end();
    	}

    	request.on('close', close);
    	stream.pipe(response);
  });





  const printInfo = () =>
  {
  	console.log("[Available on]");
  	const interfaces = networkInterfaces();
  	Object.keys(interfaces).forEach((interface)=>
  	{
  		console.log("\n" + interface.toUpperCase() + ":");
  		interfaces[interface].forEach((ip)=>
  		{
  			if(ip.family == "IPv4") console.log(ip.address + `:${SERVER_CONFIG.port}`);
  		})
  	});
  }

  server.on('error', (error)=>
  {
  	if(error.code == 'EADDRINUSE' && error.syscall == 'listen')
  	{
		  console.log(`The Server couldn't start,\na server is running on ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}\nThis could be the server for the repository....`);
  	}
  });


  server.on('listening', ()=>
  {	
  	console.log('Server started:');
  	printInfo();
	console.log('\nPress Ctrl+C to close!');


	process.on('SIGTERM', function(){
		if(server.listening)
		{
			server.close();
		}
	});
  });

  server.listen(SERVER_CONFIG);

