const { PinataSDK } = require('pinata-web3')



const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});

// console.log(pinata, "pinata");


module.exports = { pinata }