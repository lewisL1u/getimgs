const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
import dotenv from 'dotenv';
dotenv.config();

const WooCommerce = new WooCommerceRestApi({
  url: process.env.WOO_SITE_URL, // Replace with your WordPress URL
  consumerKey: process.env.WOO_CK, // Replace with your Consumer Key
  consumerSecret: process.env.WOO_CS, // Replace with your Consumer Secret
  version: 'wc/v3'
});

const categoryMap = [];

const cfg = {
  // Woo
  'woo' : {
    'site'         : process.env.WOO_SITE_URL,
    'ck'           : process.env.WOO_CK,
    'cs'           : process.env.WOO_CS,
    'page_limit'   : 100
  }
}

async function createCategory(name, id, sortOrder) {
  if (!name) {
    name = 'misc';
  }

  let slug = extractAndFormatCategorySlug(name).toLowerCase();
  if (!await categorySlugExists(slug)) {
    const data = {
      name: name,
      description: JSON.stringify({id: id, sortOrder: sortOrder, name: name}),
      slug: slug
    };

    try {
      const response = await WooCommerce.post("products/categories", data);
      console.log("Category created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating category:", error.response ? error.response.data : error);
      throw error;
    }
  }

  if (!categoryMap[slug]) {
    categoryMap[slug] = await getCategoryBySlug(slug);
  }

  return categoryMap[slug];
}

async function categoryExistsByName(name) {
  try {
    const response = await WooCommerce.get("products/categories", {
      search: name
    });
    return response.data.some(category => category.name === name);
  } catch (error) {
    console.error("Error checking category existence:", error.response ? error.response.data : error);
    throw error;
  }
}

async function getCategoryBySlug(slug) {
  try {
    const response = await WooCommerce.get("products/categories", {
      slug: slug.toLowerCase(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching category by slug:", error.response ? error.response.data : error);
    throw error;
  }
}

async function categorySlugExists(slug) {
  try {
    const categories = await getCategoryBySlug(slug);
    return categories.length > 0;
  } catch (error) {
    console.error("Error checking if category slug exists:", error);
    throw error;
  }
}

function extractAndFormatCategorySlug(categoryName) {
  const parts = categoryName.split('|');
  if (parts.length > 1) {
    const slugPart = parts[1].trim();
    return slugPart.replace(/\s+/g, '_').toLowerCase();
  }
  return categoryName.replace(/\s+/g, '_').toLowerCase(); // Fallback if no '|' found
}

async function getAllCWooCategories() {
  let allCategories = {};
  let page = 1;
  let hasMore = true;
  const limit = cfg.woo.page_limit;

  while (hasMore) {
    const url = `${cfg.woo.site}/wp-json/wc/v3/products/categories?consumer_key=${cfg.woo.ck}&consumer_secret=${cfg.woo.cs}&per_page=${limit}&page=${page}`;

    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WooCommerce API Error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      const categories = await response.json();
      
      if (categories.length > 0) {
        for (const category of categories) {
          allCategories[category.slug] = category;
        }
      } else {
        // No more categories to fetch
        hasMore = false;
      }

      // If the number of categories returned is less than the limit, we've reached the last page.
      if (categories.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error(`Failed to fetch page ${page} of WooCommerce categories:`, error);
      hasMore = false; // Stop the loop on error
      throw error;
    }
  }
  
  return allCategories;
}

module.exports = { createCategory,  getAllCWooCategories};



// Example usage:
// createCategory('New Category Name', 'This is a description for the new category.');

// Example usage of getCategoryBySlug:
// (async () => {
//   try {
//     const categories = await getCategoryBySlug('new-category-slug');
//     if (categories.length > 0) {
//       console.log('Found category:', categories[0]);
//     } else {
//       console.log('Category not found.');
//     }
//   } catch (error) {
//     console.error('An error occurred.');
//   }
// })();

// Example usage of categorySlugExists:
// (async () => {
//   try {
//     const exists = await categorySlugExists('new-category-slug');
//     console.log('Does slug exist?', exists);
//   } catch (error) {
//     console.error('An error occurred while checking slug existence.');
//   }
// })();
