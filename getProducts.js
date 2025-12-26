const fetch = require('node-fetch'); // Or 'axios', or just use native fetch in browser environments

const cfg = {
    // Clover
    'clover': {
        'env'        : 'prod', // 'sandbox' | 'prod'
        'merchantId' : 'F4CTCX5TMR9Y1',
        'token'      : 'c13bc3c0-4373-66a8-a154-9e3f4d9feab1',
        'page_limit' : 500,       // 100–1000 typically supported
        'total_number' : 5000
    },
    // Woo
    'woo' : {
        'site'         : 'https://lavenderblush-antelope-892993.hostingersite.com', // no trailing slash
        'ck'           : 'ck_dcb463fb30531a72a8313bb8a0c098b150f97ba7',
        'cs'           : 'cs_334f50065369fb33811ceea838ccb9773529d16c',
    },
};

// Use credentials from the cfg object
const CLOVER_API_BASE_URL = 'https://api.clover.com/v3/merchants';
const MERCHANT_ID = cfg.clover.merchantId;
const ACCESS_TOKEN = cfg.clover.token;

/**
 * Fetches all available products from the Clover API, handling pagination.
 * It repeatedly calls the API to get products in chunks until all products are fetched.
 * @returns {Promise<Array>} A promise that resolves to an array of all product items.
 */
async function getAllCloverProducts() {
  let allProducts = [];
  let offset = 0;
  let hasMore = true;
  const limit = cfg.clover.page_limit;

  while (hasMore) {
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
      const products = data.elements || [];
      
      if (products.length > 0) {
        allProducts = allProducts.concat(products);
      }
      
      // If the number of products returned is less than the limit, we've reached the last page.
      if (products.length < limit) {
        hasMore = false;
      } else {
        // Otherwise, prepare to fetch the next page by increasing the offset.
        offset += limit;
      }
    } catch (error) {
      console.error(`Failed to fetch page of Clover products at offset ${offset}:`, error);
      hasMore = false; // Stop the loop on error to avoid returning incomplete data.
      throw error; // Re-throw to allow the caller to handle the error.
    }
  }
  
  return allProducts;
}

// Example usage:
(async () => {
  try {
    const products = await getAllCloverProducts();
    console.log('Fetched a total of:', products.length, 'products');
    // You can uncomment the line below to log the first product for inspection
    // if (products.length > 0) console.log('First product:', products[0]);
  } catch (error) {
    console.error('Error fetching all Clover products:', error.message);
  }
})();