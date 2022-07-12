/// How to get a Balance of a particular project ?

// Contract Name  JBSingleTokenPaymentTerminalStore  https://rinkeby.etherscan.io/address/0x5d4eb71749dd9984118ebdf96aaf3cf6eae1a745#code
// function Name balanceOf(address , uint )
// address:  Pass the address of the JBETH payment terminal contract 0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8
// uint:  pass the project id
// Ex  balancOf(0x765A8b9a23F58Db6c8849315C04ACf32b2D55cF8 , 4266);

/// How to get Project name, description and twitter , discord url etc
// Contract name JBProjects https://rinkeby.etherscan.io/address/0x2d8e361f8F1B5daF33fDb2C99971b33503E60EEE
// function name metadataContentOf(uint project id , uint domain);
// uint project id:  pass the project id
// uint domain:  same as above , pass the project id
// Ex  metadataContentOf(4266 , 4266);
// if in the input domain , passing the project id does not return anything, then pass 0 as param in domain
// This function returns the ipfs hash
// Ex : Return QmQHGuXv7nDh1rxj48HnzFtwvVxwF1KU9AfB6HbfG8fmJF
// Call this using https://ipfs.io/ipfs/QmQHGuXv7nDh1rxj48HnzFtwvVxwF1KU9AfB6HbfG8fmJF
// This returns a object
// {
//     "name": "JuiceboxDAO",
//     "description": "Supports projects built using the Juicebox protocol, and the development of the protocol itself. All projects withdrawing funds from their treasury pay a 2.5% membership fee and receive JBX at the current issuance rate. JBX members govern the NFT that represents ownership over this treasury.",
//     "logoUri": "https://jbx.mypinata.cloud/ipfs/QmWXCt1zYAJBkNb7cLXTNRNisuWu9mRAmXTaW9CLFYkWVS",
//     "infoUri": "https://snapshot.org/#/jbdao.eth",
//     "twitter": "juiceboxETH",
//     "discord": "https://discord.gg/W9mTVG4QhD",
//     "payButton": "Add juice",
//     "tokens": [

//     ],
//     "version": 4
