const defaultProducts = [
  { id: 1, name: "Sizzling Sisig", price: 185, category: "Main Course", stock: 100, image: "/images/products/sisig.jpg", inventoryLinkId: null, status: 'Available' },
  { id: 2, name: "Signature Wings", price: 165, category: "Appetizer", stock: 100, image: "/images/products/wings.jpg", inventoryLinkId: 'inv_1', status: 'Available' },
  { id: 3, name: "Premium Dried Pusit", price: 150, category: "Seafood", stock: 20, image: "/images/products/pusit.jpg", inventoryLinkId: 'inv_2', status: 'Available' },
  { id: 4, name: "DXN Lingzhi Coffee", price: 550, category: "Beverage", stock: 15, image: "/images/products/coffee.jpg", inventoryLinkId: 'inv_3', status: 'Available' },
  { id: 5, name: "DXN Spirulina", price: 850, category: "Supplement", stock: 25, image: "/images/products/spirulina.jpg", inventoryLinkId: null, status: 'Available' },
  { id: 6, name: "CupEat Milktea", price: 85, category: "Beverage", stock: 50, image: "/images/products/milktea.jpg", inventoryLinkId: 'inv_4', status: 'Available' },
  { id: 7, name: "Grilled Platter", price: 450, category: "Main Course", stock: 30, image: "/images/products/platter.jpg", inventoryLinkId: null, status: 'Available' },
  { id: 8, name: "Bucket Deal (Beer)", price: 350, category: "Beverage", stock: 20, image: "/images/products/beer.jpg", inventoryLinkId: null, status: 'Available' }
];

export const getProducts = () => {
  const storedProducts = localStorage.getItem('shop_products');
  if (storedProducts) {
    return JSON.parse(storedProducts);
  }
  localStorage.setItem('shop_products', JSON.stringify(defaultProducts));
  return defaultProducts;
};

export const saveProducts = (products: any[]) => {
  localStorage.setItem('shop_products', JSON.stringify(products));
};

export const addProduct = (newProduct) => {
  const currentProducts = getProducts();
  const productWithId = { ...newProduct, id: Date.now() }; 
  currentProducts.push(productWithId);
  saveProducts(currentProducts);
  return productWithId;
};

export const updateProduct = (updatedProduct: any) => {
  const currentProducts = getProducts();
  const updated = currentProducts.map((p: any) => p.id === updatedProduct.id ? updatedProduct : p);
  saveProducts(updated);
};

export const deleteProduct = (productId: number) => {
  const currentProducts = getProducts();
  const updated = currentProducts.filter((p: any) => p.id !== productId);
  saveProducts(updated);
};
