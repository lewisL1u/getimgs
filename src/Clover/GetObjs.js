import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const cfg = {
    // Clover
    'clover': {
        'env'        : 'prod', // 'sandbox' | 'prod'
        'merchantId' : process.env.CLOVER_MERCHANT_ID,
        'token'      : process.env.CLOVER_TOKEN,
        'page_limit' : 100,       // 100–1000 typically supported
        'total_number' : 5000
    },
    // Woo
    'woo' : {
        'site'         : process.env.WOO_SITE_URL,
        'ck'           : process.env.WOO_CK,
        'cs'           : process.env.WOO_CS,
        'page_limit'   : 100
    },
};

// Use credentials from the cfg object
const CLOVER_API_BASE_URL = 'https://api.clover.com/v3/merchants';
const MERCHANT_ID = cfg.clover.merchantId;
const ACCESS_TOKEN = cfg.clover.token;

/**
 * Fetches available products from the Clover API, handling pagination.
 * It repeatedly calls the API to get products in chunks until all products are fetched.
 * @returns {Promise<Array>} A promise that resolves to an array of all product items.
 */
async function getCloverProducts(offset = 0, limit = cfg.clover.page_limit) {
  console.log(`Fetching Clover products with offset ${offset} and limit ${limit}`);
  let products = [];
  // let offset = 0;
  let hasMore = true;
  // const limit = cfg.clover.page_limit;

  if (hasMore) {
    // Correctly construct the URL for the items endpoint with pagination parameters
    const url = `${CLOVER_API_BASE_URL}/${MERCHANT_ID}/items?filter=available=true&expand=categories&limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Clover API Error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      products = data.elements || [];
      
      // If the number of products returned is less than the limit, we've reached the last page.
      if (products.length < limit) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Failed to fetch page of Clover products at offset ${offset}:`, error);
      hasMore = false; // Stop the loop on error to avoid returning incomplete data.
      throw error; // Re-throw to allow the caller to handle the error.
    }
  }
  
  return {products, hasMore};
}

async function getAllCategories() {
  const url = `${CLOVER_API_BASE_URL}/${MERCHANT_ID}/categories`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Clover API Error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.elements;
}


export { getCloverProducts, getAllCategories};
