import https, {
    Server as HttpsServer
} from "https";
import http, {
    Server as HttpServer
} from "http";
import {
    AddressInfo
} from "net";
import {
    ProxyServer
} from '../src/index';
import fs from 'fs';
import {
    getProxyHttpAgent
} from 'proxy-http-agent';
import url from 'url';

let localApiServer: HttpServer;
let localApiServerPort: number;

let localApiHttpsServer: HttpsServer;
let localApiHttpsServerPort: number;

beforeAll((done) => {
    // _____________ setup the local api http server
    let closeCounter: number = 0;

    function handleDone() {
        closeCounter++;
        if (closeCounter === 2) {
            done();
        }
    }

    localApiServer = http.createServer();

    localApiServer.listen(() => {
        localApiServerPort = (localApiServer.address() as AddressInfo).port;
        handleDone();
    });

    localApiServer.on('data', (data: any) => {});

    localApiServer.on('connection', (socket: any) => {
        socket.on('data', (data: any) => {})
    });


    // ____________ setup local api HTTPS server

    const options = {
        key: fs.readFileSync(`${__dirname}/server.key`),
        cert: fs.readFileSync(`${__dirname}/server.cert`)
    };
    localApiHttpsServer = https.createServer(options);

    localApiHttpsServer.listen(() => {
        localApiHttpsServerPort = (localApiHttpsServer.address() as AddressInfo).port;
        handleDone();
    });
});

// exit after test finish and release resources

afterAll((done) => {
    setTimeout(() => {
        process.exit(0);
    }, 100);
    done();
});


// ______________ starting testing

describe('Proxy class options', () => {
    test('Proxy port precised', (done) => {
        // ____________ setup proxy
        const proxy = new ProxyServer({
            port: 8123
        });

        proxy.awaitStartedListening()
            .then(() => {
                expect(proxy.port).toBe(8123);
                done();
            })
            .catch(() => {
                fail('Failed to launch server on port !');
                done();
            });
    });

    test('Proxy port not precised (automatic generation)', (done) => {
        const proxy = new ProxyServer();
        proxy.awaitStartedListening()
            .then(() => {
                expect(proxy.port).toBeTruthy();
                done();
            })
            .catch(() => {
                fail('Failed to launch server on port !');
                done();
            });
    });
});

// _______ http local test server
describe('Http requests checks', () => {
    describe('http local test server', () => {
        test('Test if it works with http (consuming a local server api)', (done) => {
            const proxy = new ProxyServer();

            proxy.awaitStartedListening()
                .then(() => {
                    localApiServer.once('request', function (req, res) {
                        res.end(JSON.stringify(req.headers));
                    });

                    let proxyUrl =
                        process.env.HTTP_PROXY ||
                        process.env.http_proxy ||
                        `http://localhost:${proxy.port}`;

                    let agent = getProxyHttpAgent({
                        proxy: proxyUrl,
                        endServerProtocol: 'http:'
                    });
                    const opts: any = url.parse(`http://localhost:${localApiServerPort}`);

                    opts.agent = agent;

                    let req = http.get(opts, function (res) {
                        let data: any = '';
                        res.setEncoding('utf8');
                        res.on('data', function (b) {
                            data += b;
                        });
                        res.on('end', function () {
                            data = JSON.parse(data);
                            expect(`localhost:${localApiServerPort}`).toEqual(data.host);
                            done();
                        });
                    });
                    req.once('error', done);
                })
                .catch(() => {
                    fail('Failed to launch server on port !');
                    done();
                });
        });
    });
    // ______ Https local test server

    describe('Https local test server', () => {
        test('Test if it works with http (consuming a local https server api)', (done) => {
            const proxy = new ProxyServer();

            proxy.awaitStartedListening()
                .then(() => {
                    localApiHttpsServer.once('request', function (req, res) {
                        res.end(JSON.stringify(req.headers));
                    });

                    let proxyUrl =
                        process.env.HTTP_PROXY ||
                        process.env.http_proxy ||
                        `http://localhost:${proxy.port}`;

                    let agent = getProxyHttpAgent({
                        proxy: proxyUrl,
                        rejectUnauthorized: false
                    });

                    const opts: any = url.parse(`https://localhost:${localApiHttpsServerPort}`);
                    // opts.rejectUnauthorized = false;
                    opts.agent = agent;


                    let req = https.get(opts, function (res) {
                        let data: any = '';
                        res.setEncoding('utf8');
                        res.on('data', function (b) {
                            data += b;
                        });
                        res.on('end', function () {
                            data = JSON.parse(data);
                            expect(data.host).toEqual(`localhost:${localApiHttpsServerPort}`);
                            done();
                        });
                    });
                    req.once('error', done);
                })
                .catch(() => {
                    fail('Failed to launch server on port !');
                    done();
                })
        });
    });

    describe('Binance api (https)', () => {
        test('Test if it works with http.request (Binance api)', (done) => {
            const proxy = new ProxyServer();

            proxy.awaitStartedListening()
                .then(() => {
                    let proxyUrl = `http://localhost:${proxy.port}`;

                    let agent = getProxyHttpAgent({
                        proxy: proxyUrl
                    });

                    const opts: any = url.parse(`https://api.binance.com/api/v3/ping`);
                    delete opts.port;
                    opts.agent = agent;

                    let req = https.get(opts, function (res) {
                        let data: any = '';
                        res.setEncoding('utf8');
                        res.on('data', function (b) {
                            data += b;
                        });
                        res.on('end', function () {
                            data = JSON.parse(data);


                            expect(data).toEqual({});
                            done();
                        });
                    });
                    req.once('error', done);
                })
                .catch(() => {
                    fail('Failed to launch server on port !');
                    done();
                });
        });
    });
});