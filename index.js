import { getAllCWooCategories } from "./src/woo/WooCategory.js";
import { saveSecondBingThumbnail } from "./src/BinGetImage.js";
import { getCloverProducts,getAllCategories } from "./src/Clover/GetObjs.js";

(async () => {
    try {
      //const products = await getAllCloverProducts();
      let offset = 0;
      let limit = 100;
      let hasMore = true;
      //saveSecondBingThumbnail("Aji – Milk Cake", 4894375033017);

            // 1. Fetch all categories from both platforms (you must implement these)
      //const allCloverCategories = await getAllCategories();
      const allWooCategories = await getAllCWooCategories(); 

      // 2. Generate the map automatically
      const cloverToWooCategoryMap = createCategoryMapByName(allCloverCategories, allWooCategories);

      // 3. Now, you can use this map when you call convertCloverToWoo
      //const wooProduct = convertCloverToWoo(cloverProduct, cloverToWooCategoryMap);

      while (hasMore) {
        let productsObj = await getCloverProducts(offset, limit);
        hasMore = productsObj.hasMore;
        offset += limit;
        let products = productsObj.products;

        for (const product of products) {
          
          // Convert Clover product to WooCommerce format
          // const wooProduct = convertCloverToWoo(product, cloverToWooCategoryMap);

      }
    }
      


      

      
      // Now you have an array of all products and categories
      console.log('Fetched a total of:', categories.length, 'categories');
      if (categories.length > 0) console.log('First category:', categories[0]);
      // You can uncomment the line below to log the first product for inspection
      // if (products.length > 0) console.log('First product:', products[0]);
    } catch (error) {
      console.error('Error fetching all Clover products:', error.message);
    }
  })();