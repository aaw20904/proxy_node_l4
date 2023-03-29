const tls = require('node:tls');
const fs = require('node:fs');
const net = require('node:net');
const { clearTimeout } = require('node:timers');
const dns = require('node:dns');
let remoteIp;


  /**get Certificate somewhere */
let secureOpts = {
        key: fs.readFileSync('privkey.pem'),
        cert: fs.readFileSync('fullchain.pem'),
    }
    /**get remote IP */
dns.resolve4( 'itsapr.com', (err, addresses) => {
                                    if (err) throw err;
                                
                                    remoteIp = addresses[0];
})

    /***********creating a TLS server************ */
const server = tls.createServer(secureOpts, async(incomeS) => {
         
        console.log('client connected');

        
        /**********get a remody IPv4 by a domain name  (optional)  */
        let ipAddress =  remoteIp;

         /********create a new socket*********** */
        let remoteConnection = new net.Socket();

        try {
            /********************try to connect************ */
                await new Promise((resolve, reject) => {
                        /***when a remote unreachable - kill the connection */
                        let timeoout = setTimeout(()=>{
                                        remoteConnection.destroy();
                                        reject('unavaliable!');
                                    }, 1500);

                        //establish a new connection
                        remoteConnection = net.connect(80, ipAddress, ()=>{
                                        clearTimeout(timeoout);
                                        resolve();
                                    })

                });

        } catch(e) {
            /***********respond to a client that a remote server is dead*** */
            let msgUnavaliable = `<!DOCTYPE html> <body><h2>Service unavaliable.</h2><h5> ${new Date().toLocaleTimeString()}</h5></body></html>`
            incomeS.write('HTTP/1.1 503 Service Unavailable\r\n content-type: text/html\r\n content-length: ${msgUnavaliable.length}\r\n\r\n');
            incomeS.end(msgUnavaliable);
             return;
        }
        /***when a new connection ghas been established - pipe both sockets */
        incomeS.pipe(remoteConnection);
        remoteConnection.pipe(incomeS);
    
        /****error and several events handlers of both sockets  */
        incomeS.on('end', () => {
            console.log('client disconnected');
         });
    
        incomeS.on('error',(e)=>{
            remoteConnection.end();
        })

        remoteConnection.on('error',(e)=>{
            incomeS.end();
        })
         
        incomeS.on('close',(err)=>{
            remoteConnection.end();
        })
    
       remoteConnection.on('close',(err)=>{
            incomeS.end();
        }) 

  });

  /***a server errorr handler */
  server.on('error', (err) => {
    throw err;
  });

  /**********start listening.... */
  server.listen(443, () => {
    console.log('server listen..');
  });
