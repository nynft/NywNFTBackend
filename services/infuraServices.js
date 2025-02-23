// ipfs.js
const ipfsClient = require('ipfs-http-client');

const ipfs = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: `Basic ${Buffer.from(
            `${process.env.INFURA_API_KEY}:${process.env.INFURA_API_SECRET}`
        ).toString('base64')}`
    }
});

module.exports = ipfs;