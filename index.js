import { createCategory } from "./src/woo/WooCategory.js";
import { saveSecondBingThumbnail } from "./src/BinGetImage.js";
import { getCloverProducts,getAllCategories } from "./src/Clover/GetObjs.js";
import {addOrUpdateWooCommerceProduct} from "./src/woo/WooSaveProduct.js";
import WooProductObj from "./src/woo/WooProductObj.js";
import {uploadImageToWoo} from "./src/woo/WooUploadImg.js";

(async () => {
    try {
      //const products = await getAllCloverProducts();
      let offset = 0;
      let limit = 100;
      let hasMore = true;
      const categoryMap = new Map
      //saveSecondBingThumbnail("Aji – Milk Cake", 4894375033017);

      // 1. Fetch all categories from both platforms (you must implement these)
      // const allCloverCategories = await getAllCategories();
      // const allWooCategories = await getAllCWooCategories(); 

      // 2. Generate the map automatically
      // const cloverToWooCategoryMap = createCategoryMapByName(allCloverCategories, allWooCategories);

      // 3. Now, you can use this map when you call convertCloverToWoo
      //const wooProduct = convertCloverToWoo(cloverProduct, cloverToWooCategoryMap);

      while (hasMore) {
        let productsObj = await getCloverProducts(offset, limit);
        hasMore = productsObj.hasMore;
        offset += limit;
        let products = productsObj.products;

        for (const product of products) {
          try {
          // convert clover product to wooComerce product
          const wooProduct = WooProductObj.convertCloverToWoo(product, cloverToWooCategoryMap);
          // get images, upload, call saveSecondBingThumbnail
          const imgPath = await saveSecondBingThumbnail(product.name, product.code);
          const imgInfo = await uploadImageToWoo(imgPath, product.code, process.env.WOO_CK, process.env.WOO_CS, process.env.WOO_SITE_URL);
          
          wooProduct.images = [{
            src: imgInfo.src,
            id: imgInfo.id
          }];

          const cat = await createCategory(product.categories.elements[0]?.name, product.categories.elements[0]?.id, product.categories.elements[0]?.sortOrder, categoryMap)
          wooProduct.categories = [cat];
          
          // save woo product to woocommerce
          addOrUpdateWooCommerceProduct(wooProduct);
        } catch (error) {
          console.error(`Error processing product: ${product.code}`, error.message);
        }
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