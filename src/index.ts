import net, { Server, Socket, AddressInfo } from 'net';

interface IPromiseFiber {
    promise: Promise<any>, resolve: Function, reject: Function
}

interface IOptions {
    port?: number
}

let log = console.log.bind(console);
let clog = console.log.bind(console);

if (!process.env.ACTIVATE_LOGGING) {
    log = () => {};
}

// ____________________ Class constructor
export class ProxyServer {
    public port?: number;
    public serverListeningPromiseFiber: IPromiseFiber;
    public server: Server

    constructor(options?: IOptions) {
        options = options || {};

        this.port = options.port;
    
        this.serverListeningPromiseFiber = {} as any;
        this.serverListeningPromiseFiber.promise = new Promise((resolve, reject) => {
            this.serverListeningPromiseFiber.resolve = resolve;
            this.serverListeningPromiseFiber.reject = reject;
        });
    
        this.server = createProxyServer.call(this, { port: options.port });
    }

    public awaitStartedListening() {
        return this.serverListeningPromiseFiber.promise;
    } 
}

function createProxyServer(this: ProxyServer, {
    port
}: IOptions): Server {
    try {
        const server = net.createServer();
        
        server.on ('connection', onConnection.bind(this));
    
        server.on('error', (err) => {
            log('SERVER ERROR');
            log(err);
        });
        
        server.on('close', () => {
            log('Client Disconnected');
        });
        
        if (port) {
            server.listen(port, () => {
                if (this.serverListeningPromiseFiber) {
                    this.serverListeningPromiseFiber.resolve();
                }
                clog(`Server running at http://localhost:${port}`);
            });
        } else {
            log("NO PORT ::::::////>")
            server.listen(() => {
                log('server listen :::://>')
                port = (server.address() as AddressInfo).port;
                this.port = port;

                if (this.serverListeningPromiseFiber) {
                    this.serverListeningPromiseFiber.resolve();
                }
                clog(`Server running at http://localhost:${port}`);
            });
        }

        return server;
    } catch(err) {
        log('ERROR ON CREATE: ::::: CATCH');
        log(err);
        throw err;
    }
}

function onConnection(clientToProxySocket: Socket) {
    log('Client Connected To Proxy');
    // We need only the data once, the starting packet
    clientToProxySocket.once ('data', (data) => {
        log('data ::::>');
        log(data.toString());
        const isConnectMethod = data.toString().indexOf('CONNECT') !== -1;
    
        // Considering Port as 80 by default 
        let serverPort = 80;
        let serverAddress;

        if (isConnectMethod) {
            log('CONNECT METHOD :::>');
            // Port changed to 443, parsing the host from CONNECT 
    
            const d = data.toString()
                .split('CONNECT ')[1]
                .split(' ')[0]
                .split(':');

            serverAddress = d[0];
            serverPort = parseInt(d[1]) || 443;

            log({
                serverPort,
                serverAddress
            });
        } else {
            log("http !!!!>");

            try {
                // Parsing HOST from HTTP
                serverAddress = data.toString().toLowerCase()
                    .split('host: ')[1]
                
                log(serverAddress);
                serverAddress = serverAddress    
                    .split('\r\n')[0];
    
                log(serverAddress);
    
                const serverAddressSplit = serverAddress.split(':');
    
                serverAddress = serverAddressSplit[0];
    
                serverPort = parseInt(serverAddressSplit[1] || '80');
    
                log({
                    serverAddress,
                    serverPort
                });
            } catch(err) {
                log(err);
            }
        }

        log('Create proxy to server connection ...');
        const proxyToServerSocket = net.createConnection (
            {
                host: serverAddress,
                port: serverPort || 80
            },
            () => {
                log('PROXY TO SERVER SET UP');
            

                if (isConnectMethod) {
                    // Send Back OK to HTTPS CONNECT Request
                    log("ok >>>>")
                    clientToProxySocket.write('HTTP/1.1 200 OK\r\n\n');
                } else {
                    log("data :::>")
                    log(data.toString())
                    proxyToServerSocket.write(data);
                }

                // Piping the sockets
                clientToProxySocket.pipe(proxyToServerSocket);  
                proxyToServerSocket.pipe(clientToProxySocket);
            }
        )
        .on('error', (err) => {
            log('PROXY TO SERVER ERROR');
            log(err);
        });
            
        clientToProxySocket.on('error', (err) => {
            log("clientToProxy socket error: :::::::");
            log(err);
        });
        
        // _____________ logging
        clientToProxySocket.on('data', (data) => {
            log('Data ;;CTPS;;>');
            log(data.toString());
        });

        proxyToServerSocket.on('data', (data) => {
            log('Data ::PTSS::>');
            log(data.toString());
        });
    });
}
