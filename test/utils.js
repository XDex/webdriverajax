'use strict';

var http = require('http');

var selenium = require('selenium-standalone');
var nodeStatic = require('node-static');

var grid, staticServer;

module.exports = {
    startStaticServer,
    stopStaticServer,
    startSelenium,
    stopSelenium
};

function startStaticServer () {
    return new Promise(function (resolve, reject) {
        var file = new nodeStatic.Server('./test/site');
        var server = http.createServer(function (request, response) {
            request.addListener('end', function () {
                file.serve(request, response, function (err, res) {
                    if (err && err.status === 404) {
                        if (request.url === '/interceptor_setup.js') {
                            file.serveFile('../../lib/interceptor_setup.js', 200, {}, request, response);
                        } else {
                            console.log(request.url, err.status, err.headers);
                            response.writeHead(err.status, err.headers);
                            response.end();
                        }
                    }
                });
            }).resume();
        }).listen(8080, function (err) {
            if (err) {
                return reject(err);
            }
            console.log('Started static server on port ' + 8080);
            staticServer = server;
            resolve(server);
        });
    });
}

function startSelenium () {
    return new Promise(function (resolve, reject) {
        selenium.start(function (err, sel) {
            if (err) {
                return reject(err);
            }
            console.log('Started Selenium server');
            grid = sel;
            resolve(sel);
        });
    });
}

function stopSelenium () {
    return new Promise(function (resolve, reject) {
        grid.on('exit', function () {
            resolve(true);
        });
        grid.kill();
    });
}

function stopStaticServer () {
    return new Promise(function (resolve, reject) {
        staticServer.close(function onClose () {
            resolve(true);
        });
    });
}
