

export const uploadFileToIPFS = async (file) => {
  // SECURITY NOTE: We know storing the JWT in a client-side environment variable exposes it.
  // For a production app, our plan is that  API call should be routed through a trusted backend service
  // to keep the JWT secure. For a hackathon, this is our  practical approach.
  // ----- tech team 
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  if (!pinataJwt) {
    throw new Error("Pinata JWT not found. Please add VITE_PINATA_JWT to your .env file.");
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`https://api.pinata.cloud/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${pinataJwt}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Pinata API Error: ${errorData.error || res.statusText}`);
  }

  const { IpfsHash } = await res.json();
  if(IpfsHash){
    console.log("successfull upload to ipfs:", IpfsHash)
  }
  return IpfsHash; // This is the CID
};


// New function to unpin a file if the canister call fails (Rollback)
export const unpinFileFromIPFS = async (cid) => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  if (!pinataJwt) {
    console.error("Pinata JWT not found. Cannot unpin file.");
    return;
  }

  try {
    const res = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${pinataJwt}`,
      },
    });

    if (res.ok) {
      console.log(`Successfully unpinned file with CID: ${cid}`);
    } else {
      console.error(`Failed to unpin file with CID: ${cid}. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Error during IPFS unpinning:", error);
  }
};

// Placeholder function to demonstrate fetching a file using the custom gateway
export const getIPFSFile = (cid) => {
  // This is where you would use your custom gateway to retrieve the file.
  // The gateway URL is for retrieving content, not for API calls.
  const customGateway = 'https://rose-chemical-goldfish-436.mypinata.cloud';
  return `${customGateway}/ipfs/${cid}`;
};
