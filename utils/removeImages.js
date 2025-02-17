const path = require('path');
const fs = require('fs');


const removeUnwantedCollectionImg = async (files) => {
  const imagePath = path.join(`/storage/assets/collection/${files}`);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};

module.exports = { removeUnwantedCollectionImg }