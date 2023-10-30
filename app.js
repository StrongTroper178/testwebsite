//adds required without dependencies
var http = require('http');
var fs = require('fs');

//adds required with dependencies


//starts http server at port 8080 (localhost)
http.createServer(function(req, res){
    fs.readFile('index.html', function(err, html){
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(html);
        return res.end();
    })
}).listen(8080);