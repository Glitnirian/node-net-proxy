# node-net-proxy

A simple net http https forwarding proxy! Like smartProxy and vpn's! You can use it with your browser or your system to go out!

So if set in an external server! You can change your IP using it!

You can learn and understand some of the basics of a forwarding proxy! As this use the net module! And so all play at the TCP level!

You can build upon it too! And take it as a base!

Research things like http tunneling! And CONNECT http Method! And BOSH!

- https://en.wikipedia.org/wiki/HTTP_tunnel
- https://en.wikipedia.org/wiki/BOSH_(protocol)
- [CONNECT METHOD](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT#:~:text=The%20HTTP%20CONNECT%20method%20starts,connection%20to%20the%20desired%20destination).
- [CONNECT METHOD (StackOverflow)](https://stackoverflow.com/questions/11697943/when-should-one-use-connect-and-get-http-methods-at-http-proxy-server/40329026)

And this module is a great piece to create proxies for testing! That was our usage at our company!

And we use it as simple forwarding proxy too!

This proxy use the http CONNECT method for https (end to end tunnel and encryption).
And simple forwarding for http.


# Typescript
Build using typescript! And fully support typing!

# Install

```sh
npm install net-proxy --save
```

# How to use

We use the class **ProxyServer**

Class Signature:

```ts
class ProxyServer {
    public port: number;
    public server: net.Server;
    
    constructor(options: IOptions);
    public awaitStartedListening();
}

interface IOptions {
    port: number
}
```


## import
```ts
import { ProxyServer } from 'net-proxy';
```

## Init

```ts
// init
const proxy = new ProxyServer({
    port: proxyPort
});

// waiting for the server to start
proxy.awaitStartedListening()
    .then(() => {
        handleDone();
    })
    .catch(() => {
        handleDone();
    });
```

## Another example 

```ts
const proxy = new ProxyServer({
    port: proxyPort
});

proxy.server.on('data', (data: any) => { // accessing the server instance
    console.log(data);
});

await proxy.awaitStartedListening(); // await server to start

// After server started

let proxyUrl = `http://localhost:${proxyPort}`;

let agent = getProxyHttpAgent({
    proxy: proxyUrl,
    endServerProtocol: 'http:'
});

const response = await fetch(`http://localhost:${localApiServerPort}`, {
    method: 'GET',
    agent
}); // this call will pass through the proxy
```
